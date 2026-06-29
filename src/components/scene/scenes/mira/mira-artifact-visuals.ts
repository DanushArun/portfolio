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
  readonly from: Vec3;
  readonly lane: MiraArtifactLane;
  readonly lift: number;
  readonly to: Vec3;
}

interface BuildOptions {
  readonly lineCopies?: number;
  readonly pointCount?: number;
  readonly seed?: number;
}

const BLUE: Vec3 = [0.05, 0.24, 0.82];
const BLUE_HOT: Vec3 = [0.26, 0.56, 1];
const CREAM: Vec3 = [0.9, 0.84, 0.72];
const GOLD: Vec3 = [1, 0.62, 0.28];
const VIOLET: Vec3 = [0.28, 0.12, 0.68];

const LANE_Y: Record<MiraArtifactLane, number> = {
  lead: 1.62,
  vad: 1.08,
  asr: 0.54,
  language: 0,
  llm: -0.54,
  crm: -1.08,
  whatsapp: -1.62,
  deploy: -2.16,
};

const LANES = Object.keys(LANE_Y) as MiraArtifactLane[];
const OUTPUTS: readonly MiraArtifactLane[] = ['crm', 'whatsapp', 'deploy'];

function beatSeed(id: string): number {
  return Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0) * 97, 0x71A9);
}

function laneActive(beat: MiraArtifactBeat, lane: MiraArtifactLane): boolean {
  return beat.activeLanes.includes(lane) || beat.outputs.includes(lane);
}

function laneColor(lane: MiraArtifactLane, active: boolean): Vec3 {
  if (!active) return mixVec(CREAM, BLUE, 0.18);
  if (OUTPUTS.includes(lane)) return GOLD;
  if (lane === 'language' || lane === 'llm') return mixVec(VIOLET, BLUE_HOT, 0.28);
  return BLUE_HOT;
}

function routePoint(route: Route, t: number, jitter: Vec3): Vec3 {
  const bow = Math.sin(Math.PI * t);
  return [
    route.from[0] + (route.to[0] - route.from[0]) * t + jitter[0] * bow,
    route.from[1] + (route.to[1] - route.from[1]) * t + route.lift * bow + jitter[1],
    route.from[2] + (route.to[2] - route.from[2]) * t + jitter[2] * bow,
  ];
}

function corePoint(rng: Rng, intensity: number): Vec3 {
  const shell = rng() ** 0.64;
  const angle = rng() * Math.PI * 2;
  return [
    0.28 + Math.cos(angle) * shell * (0.82 + intensity * 0.18) + gauss(rng) * 0.05,
    Math.sin(angle) * shell * (1.24 + intensity * 0.3) + gauss(rng) * 0.05,
    gauss(rng) * 0.18,
  ];
}

function routePointColor(route: Route, rng: Rng): Vec3 {
  const heat = route.active ? 0.78 + rng() * 0.22 : 0.18 + rng() * 0.14;
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

function makeRoutes(beat: MiraArtifactBeat): readonly Route[] {
  const laneRoutes = LANES.map((lane, index): Route => {
    const active = laneActive(beat, lane);
    const y = LANE_Y[lane];
    return {
      active,
      color: laneColor(lane, active),
      from: [-4.36, y, -0.18],
      lane,
      lift: (index % 2 === 0 ? 0.14 : -0.1) * (active ? 1 : 0.35),
      to: [0.24, y * 0.18, 0.16],
    };
  });
  const outputRoutes = OUTPUTS.map((lane, index): Route => {
    const active = beat.outputs.includes(lane);
    return {
      active,
      color: laneColor(lane, active),
      from: [0.78, LANE_Y.llm * 0.12, 0.14],
      lane,
      lift: (index - 1) * 0.14,
      to: [3.62, (index - 1) * 0.76, -0.06],
    };
  });
  return [...laneRoutes, ...outputRoutes];
}

function pickRoute(routes: readonly Route[], rng: Rng): Route {
  const activeRoutes = routes.filter((route) => route.active);
  const pool = rng() < 0.78 && activeRoutes.length > 0 ? activeRoutes : routes;
  return pool[Math.floor(rng() * pool.length)];
}

function writeRouteParticle(
  buffer: ArtifactBuffer,
  index: number,
  route: Route,
  rng: Rng,
): void {
  const t = rng();
  const spread = route.active ? 0.035 : 0.06;
  const point = routePoint(route, t, [
    gauss(rng) * spread,
    gauss(rng) * spread,
    gauss(rng) * spread * 0.75,
  ]);
  writePoint(buffer, index, point, routePointColor(route, rng));
}

function writeCoreParticle(
  buffer: ArtifactBuffer,
  index: number,
  beat: MiraArtifactBeat,
  rng: Rng,
): void {
  const color = mixVec(CREAM, GOLD, 0.18 + beat.coreIntensity * 0.5 + rng() * 0.16);
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
    if (rng() < 0.28) writeCoreParticle(buffer, index, beat, rng);
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
  const segments = 32;
  for (const route of routes) {
    const copies = route.active ? lineCopies : Math.max(2, Math.floor(lineCopies / 3));
    for (let copy = 0; copy < copies; copy++) {
      const jitter: Vec3 = [gauss(rng) * 0.035, gauss(rng) * 0.035, gauss(rng) * 0.02];
      for (let index = 0; index < segments; index++) {
        const t = index / segments;
        const next = (index + 1) / segments;
        pushSegment(
          positions,
          colors,
          routePoint(route, t, jitter),
          routePoint(route, next, jitter),
          routePointColor(route, rng),
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
