import { gauss, mixVec, mulberry32, type Rng, type Vec3 } from './buffers';
import type {
  MiraArtifactBeat,
  MiraArtifactLane,
} from './mira-artifact-model';

export interface ArtifactBuffer {
  readonly color: Float32Array;
  readonly position: Float32Array;
}

export interface ArtifactVisualBuffers {
  readonly lines: ArtifactBuffer;
  readonly points: ArtifactBuffer;
}

interface Route {
  readonly active: boolean;
  readonly color: Vec3;
  readonly controls: readonly [Vec3, Vec3];
  readonly from: Vec3;
  readonly lane: MiraArtifactLane;
  readonly to: Vec3;
  readonly width: number;
}

interface BuildOptions {
  readonly lineCopies?: number;
  readonly pointCount?: number;
  readonly seed?: number;
}

const BLUE: Vec3 = [0.06, 0.18, 0.68];
const BLUE_HOT: Vec3 = [0.35, 0.67, 1];
const CREAM: Vec3 = [0.92, 0.86, 0.72];
const GOLD: Vec3 = [1, 0.62, 0.28];
const VIOLET: Vec3 = [0.34, 0.14, 0.72];

const ANCHORS = {
  lead: [-3.62, 0.72, -0.24],
  vad: [-2.25, 0.18, 0.16],
  asr: [-1.18, -0.28, -0.02],
  language: [-0.18, 0.52, 0.24],
  llm: [1.02, -0.04, 0.04],
  crm: [2.88, 0.68, -0.12],
  whatsapp: [3.24, -0.52, 0.12],
  deploy: [2.52, -1.14, 0.28],
} as const satisfies Record<MiraArtifactLane, Vec3>;

const ROUTE_LANES: readonly MiraArtifactLane[] = [
  'lead',
  'vad',
  'asr',
  'language',
  'llm',
  'crm',
  'whatsapp',
  'deploy',
];

const OUTPUTS: readonly MiraArtifactLane[] = ['crm', 'whatsapp', 'deploy'];

function beatSeed(id: string): number {
  return Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0) * 97, 0x71A9);
}

function laneActive(beat: MiraArtifactBeat, lane: MiraArtifactLane): boolean {
  return beat.activeLanes.includes(lane) || beat.outputs.includes(lane);
}

function laneColor(lane: MiraArtifactLane, active: boolean): Vec3 {
  if (!active) return mixVec(CREAM, BLUE, 0.24);
  if (OUTPUTS.includes(lane)) return GOLD;
  if (lane === 'language' || lane === 'llm') return mixVec(VIOLET, BLUE_HOT, 0.34);
  return BLUE_HOT;
}

function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scaleVec(a: Vec3, scale: number): Vec3 {
  return [a[0] * scale, a[1] * scale, a[2] * scale];
}

function cubic(route: Route, t: number): Vec3 {
  const u = 1 - t;
  const a = scaleVec(route.from, u * u * u);
  const b = scaleVec(route.controls[0], 3 * u * u * t);
  const c = scaleVec(route.controls[1], 3 * u * t * t);
  const d = scaleVec(route.to, t * t * t);
  return addVec(addVec(a, b), addVec(c, d));
}

function routePoint(route: Route, t: number, rng: Rng, spread: number): Vec3 {
  const point = cubic(route, t);
  const body = Math.sin(Math.PI * t);
  const sheet = (rng() - 0.5) * route.width * spread * (0.28 + body);
  const depth = gauss(rng) * route.width * spread * 0.36;
  return [
    point[0] + sheet * 0.35 + gauss(rng) * route.width * spread * 0.14,
    point[1] + sheet + gauss(rng) * route.width * spread * 0.12,
    point[2] + depth,
  ];
}

function corePoint(rng: Rng, intensity: number): Vec3 {
  const shell = rng() ** 0.58;
  const angle = rng() * Math.PI * 2;
  const radius = 0.54 + intensity * 0.34;
  return [
    ANCHORS.llm[0] + Math.cos(angle) * shell * radius + gauss(rng) * 0.04,
    ANCHORS.llm[1] + Math.sin(angle) * shell * radius * 0.72 + gauss(rng) * 0.04,
    ANCHORS.llm[2] + gauss(rng) * 0.18,
  ];
}

function routePointColor(route: Route, rng: Rng): Vec3 {
  const heat = route.active ? 0.74 + rng() * 0.26 : 0.16 + rng() * 0.18;
  return mixVec(BLUE, route.color, heat);
}

function writePoint(
  buffer: ArtifactBuffer,
  index: number,
  point: Vec3,
  color: Vec3,
): void {
  const offset = index * 3;
  buffer.position.set(point, offset);
  buffer.color.set(color, offset);
}

function routeControls(from: Vec3, to: Vec3, lane: MiraArtifactLane): readonly [Vec3, Vec3] {
  const lift = lane === 'language' ? 0.92 : OUTPUTS.includes(lane) ? 0.44 : 0.28;
  const skew = lane === 'whatsapp' || lane === 'deploy' ? -0.42 : 0.34;
  return [
    [from[0] + (to[0] - from[0]) * 0.38, from[1] + lift, from[2] + skew],
    [from[0] + (to[0] - from[0]) * 0.70, to[1] - lift * 0.52, to[2] - skew],
  ];
}

function routeEndpoints(lane: MiraArtifactLane): readonly [Vec3, Vec3] {
  if (lane === 'lead') return [ANCHORS.lead, ANCHORS.vad];
  if (lane === 'vad') return [ANCHORS.vad, ANCHORS.asr];
  if (lane === 'asr') return [ANCHORS.asr, ANCHORS.language];
  if (lane === 'language') return [ANCHORS.language, ANCHORS.llm];
  if (lane === 'llm') return [ANCHORS.asr, ANCHORS.llm];
  return [ANCHORS.llm, ANCHORS[lane]];
}

function makeRoute(beat: MiraArtifactBeat, lane: MiraArtifactLane): Route {
  const active = laneActive(beat, lane);
  const [from, to] = routeEndpoints(lane);
  return {
    active,
    color: laneColor(lane, active),
    controls: routeControls(from, to, lane),
    from,
    lane,
    to,
    width: active ? 0.22 : 0.13,
  };
}

function makeRoutes(beat: MiraArtifactBeat): readonly Route[] {
  return ROUTE_LANES.map((lane) => makeRoute(beat, lane));
}

function pickRoute(routes: readonly Route[], rng: Rng): Route {
  const activeRoutes = routes.filter((route) => route.active);
  const useActive = rng() < 0.84 && activeRoutes.length > 0;
  const pool = useActive ? activeRoutes : routes;
  return pool[Math.floor(rng() * pool.length)];
}

function writeRouteParticle(
  buffer: ArtifactBuffer,
  index: number,
  route: Route,
  rng: Rng,
): void {
  const t = rng();
  const point = routePoint(route, t, rng, route.active ? 1 : 0.72);
  writePoint(buffer, index, point, routePointColor(route, rng));
}

function writeCoreParticle(
  buffer: ArtifactBuffer,
  index: number,
  beat: MiraArtifactBeat,
  rng: Rng,
): void {
  const color = mixVec(CREAM, GOLD, 0.20 + beat.coreIntensity * 0.48 + rng() * 0.18);
  writePoint(buffer, index, corePoint(rng, beat.coreIntensity), color);
}

function buildPointBuffer(
  beat: MiraArtifactBeat,
  routes: readonly Route[],
  pointCount: number,
  rng: Rng,
): ArtifactBuffer {
  const buffer = {
    color: new Float32Array(pointCount * 3),
    position: new Float32Array(pointCount * 3),
  };
  for (let index = 0; index < pointCount; index++) {
    if (rng() < 0.22) writeCoreParticle(buffer, index, beat, rng);
    else writeRouteParticle(buffer, index, pickRoute(routes, rng), rng);
  }
  return buffer;
}

function pushSegment(
  positions: number[],
  colors: number[],
  a: Vec3,
  b: Vec3,
  color: Vec3,
): void {
  positions.push(...a, ...b);
  colors.push(...color, ...color);
}

function buildLineArrays(
  routes: readonly Route[],
  lineCopies: number,
  rng: Rng,
): { readonly colors: number[]; readonly positions: number[] } {
  const colors: number[] = [];
  const positions: number[] = [];
  const segments = 44;
  for (const route of routes) {
    const copies = route.active ? lineCopies : Math.max(1, Math.floor(lineCopies / 4));
    for (let copy = 0; copy < copies; copy++) {
      const color = routePointColor(route, rng);
      for (let index = 0; index < segments; index++) {
        const t = index / segments;
        const next = (index + 1) / segments;
        pushSegment(
          positions,
          colors,
          routePoint(route, t, rng, 0.20),
          routePoint(route, next, rng, 0.20),
          color,
        );
      }
    }
  }
  return { colors, positions };
}

function buildLineBuffer(
  routes: readonly Route[],
  lineCopies: number,
  rng: Rng,
): ArtifactBuffer {
  const arrays = buildLineArrays(routes, lineCopies, rng);
  return {
    color: Float32Array.from(arrays.colors),
    position: Float32Array.from(arrays.positions),
  };
}

export function buildMiraArtifactVisuals(
  beat: MiraArtifactBeat,
  options: BuildOptions = {},
): ArtifactVisualBuffers {
  const pointCount = options.pointCount ?? 24_000;
  const lineCopies = options.lineCopies ?? 10;
  const seed = options.seed ?? beatSeed(beat.id);
  const routes = makeRoutes(beat);
  const pointRng = mulberry32(seed);
  const lineRng = mulberry32(seed ^ 0xA17F3);
  return {
    lines: buildLineBuffer(routes, lineCopies, lineRng),
    points: buildPointBuffer(beat, routes, pointCount, pointRng),
  };
}
