import { MIRA_TENDRIL_EDGES } from '@/lib/mira-canonical';
import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';
import { gauss, makePSet, mulberry32, slicePSet, type PSet, type Rng } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type Quality } from './knot-config';

type Vec3 = readonly [number, number, number];

interface Anchor {
  readonly heat: number;
  readonly id: number;
  readonly lang: MiraLang;
  readonly pos: Vec3;
}

interface WebEdge {
  readonly a: Anchor;
  readonly b: Anchor;
  readonly c1: Vec3;
  readonly c2: Vec3;
  readonly energy: number;
  readonly noise: number;
  readonly width: number;
}

const GLOBAL_ANCHORS = 420;
const SATELLITES_PER_KNOT = 68;
const CORRIDOR_ANCHORS = 36;

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: Vec3, n: number): Vec3 {
  return [v[0] * n, v[1] * n, v[2] * n];
}

function between(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function bezier(t: number, p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): Vec3 {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2],
  ];
}

function hue(lang: MiraLang): Vec3 {
  const hex = KNOT_TABLE.find((spec) => spec.lang === lang)?.hue ?? '#ffffff';
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function nearestLanguage(pos: Vec3): Pick<Anchor, 'heat' | 'lang'> {
  let lang = KNOTS_W[0].lang;
  let best = Number.POSITIVE_INFINITY;

  for (const knot of KNOTS_W) {
    const d = distance(pos, knot.pos);
    if (d < best) {
      best = d;
      lang = knot.lang;
    }
  }

  return { heat: Math.max(0, 1 - best / 3.6), lang };
}

function makeAnchor(id: number, pos: Vec3): Anchor {
  return { id, pos, ...nearestLanguage(pos) };
}

function knotSatellite(knotIndex: number, rng: Rng): Vec3 {
  const knot = KNOTS_W[knotIndex];
  const angle = rng() * Math.PI * 2;
  const radius = 0.34 + Math.abs(gauss(rng)) * 1.18;
  const stretch = 0.70 + rng() * 1.35;
  return [
    knot.pos[0] + Math.cos(angle) * radius * stretch,
    knot.pos[1] + Math.sin(angle) * radius,
    knot.pos[2] + gauss(rng) * 0.42,
  ];
}

function randomFieldPoint(rng: Rng): Vec3 {
  const x = -6.5 + rng() * 13.0;
  const y = -4.7 + rng() * 9.1;
  const centerPull = rng() < 0.55 ? 0.42 : 0;
  return [x * (1 - centerPull), y * (1 - centerPull), gauss(rng) * 0.75];
}

function corridorPoint(edgeIndex: number, step: number, rng: Rng): Vec3 {
  const spec = MIRA_TENDRIL_EDGES[edgeIndex % MIRA_TENDRIL_EDGES.length];
  const from = KNOTS_W.find((knot) => knot.lang === spec.from);
  const to = KNOTS_W.find((knot) => knot.lang === spec.to);
  if (!from || !to) return randomFieldPoint(rng);
  const t = (step + 0.35 + rng() * 0.30) / (CORRIDOR_ANCHORS + 1);
  const curve = Math.sin(Math.PI * t) * (0.24 + rng() * 0.78);
  const jitter: Vec3 = [gauss(rng) * 0.42, gauss(rng) * 0.42, gauss(rng) * 0.18];
  return add(add(between(from.pos, to.pos, t), scale(spec.bow, curve)), jitter);
}

function generateAnchors(rng: Rng): Anchor[] {
  const anchors: Anchor[] = [];
  KNOTS_W.forEach((knot) => anchors.push(makeAnchor(anchors.length, knot.pos)));

  KNOTS_W.forEach((_, knotIndex) => {
    for (let i = 0; i < SATELLITES_PER_KNOT; i++) {
      anchors.push(makeAnchor(anchors.length, knotSatellite(knotIndex, rng)));
    }
  });

  for (let i = 0; i < GLOBAL_ANCHORS; i++) {
    anchors.push(makeAnchor(anchors.length, randomFieldPoint(rng)));
  }

  for (let i = 0; i < MIRA_TENDRIL_EDGES.length * CORRIDOR_ANCHORS; i++) {
    anchors.push(makeAnchor(
      anchors.length,
      corridorPoint(Math.floor(i / CORRIDOR_ANCHORS), i % CORRIDOR_ANCHORS, rng),
    ));
  }

  return anchors;
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function nearby(anchor: Anchor, anchors: readonly Anchor[]): Anchor[] {
  return anchors
    .filter((item) => item.id !== anchor.id)
    .map((item) => ({ item, d: distance(anchor.pos, item.pos) }))
    .filter((entry) => entry.d < 3.45)
    .sort((a, b) => a.d - b.d)
    .slice(0, 14)
    .map((entry) => entry.item);
}

function controlPoint(a: Anchor, b: Anchor, t: number, rng: Rng): Vec3 {
  const len = distance(a.pos, b.pos);
  const curl: Vec3 = [gauss(rng) * len * 0.18, gauss(rng) * len * 0.18, gauss(rng) * len * 0.08];
  return add(between(a.pos, b.pos, t), curl);
}

function makeEdge(a: Anchor, b: Anchor, rng: Rng): WebEdge {
  const len = distance(a.pos, b.pos);
  return {
    a,
    b,
    c1: controlPoint(a, b, 0.30 + rng() * 0.14, rng),
    c2: controlPoint(a, b, 0.58 + rng() * 0.18, rng),
    energy: Math.max(a.heat, b.heat) * 0.58 + rng() * 0.32,
    noise: rng() * 1000,
    width: 0.006 + len * 0.004 + rng() * 0.020,
  };
}

function generateEdges(anchors: readonly Anchor[], rng: Rng): WebEdge[] {
  const seen = new Set<string>();
  const edges: WebEdge[] = [];

  for (const anchor of anchors) {
    nearby(anchor, anchors).forEach((next, rank) => {
      const keep = rank < 6 || rng() < 0.68 - rank * 0.035;
      const key = edgeKey(anchor.id, next.id);
      if (!keep || seen.has(key)) return;
      seen.add(key);
      edges.push(makeEdge(anchor, next, rng));
    });
  }

  return edges;
}

function sampleT(rng: Rng): number {
  const t = rng();
  return t < 0.5 ? 0.5 * Math.pow(t * 2, 0.82) : 1 - 0.5 * Math.pow((1 - t) * 2, 0.82);
}

function webColor(edge: WebEdge, t: number, rng: Rng): Vec3 {
  const warm = between(hue(edge.a.lang), hue(edge.b.lang), t);
  const blue = between([0.04, 0.20, 1.0], [0.20, 0.66, 1.0], rng());
  const violet = between([0.42, 0.10, 0.95], [0.84, 0.24, 1.0], rng());
  const endpoint = Math.max(edge.a.heat * (1 - t), edge.b.heat * t);
  const cold = between(blue, violet, 0.12 + Math.sin(Math.PI * t) * 0.26);
  return between(cold, warm, Math.min(0.84, endpoint * 1.08 + edge.energy * 0.12));
}

function writeParticle(out: PSet, index: number, edge: WebEdge, rng: Rng): void {
  const t = sampleT(rng);
  const p = bezier(t, edge.a.pos, edge.c1, edge.c2, edge.b.pos);
  const idx = index * 3;
  const body = Math.sin(Math.PI * t);
  const spray = Math.abs(gauss(rng)) * edge.width * (0.08 + body * 0.48);
  const spin = rng() * Math.PI * 2;

  out.pos[idx] = p[0] + Math.cos(spin) * spray;
  out.pos[idx + 1] = p[1] + Math.sin(spin) * spray;
  out.pos[idx + 2] = p[2] + gauss(rng) * edge.width * 0.22;
  out.color.set(webColor(edge, t, rng), idx);
  out.densityLevel[index] = 0.24 + body * 0.46 + edge.energy * 0.22;
  out.warpParams[idx] = edge.noise;
  out.warpParams[idx + 1] = 0.002 + edge.width * 0.012;
  out.warpParams[idx + 2] = edge.width;
}

export function generateTendrils(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].Tendrils;
  const out = makePSet(count);
  const rng = mulberry32(0x9999);
  const edges = generateEdges(generateAnchors(rng), rng);
  const total = edges.reduce((sum, edge) => sum + distance(edge.a.pos, edge.b.pos), 0);
  let placed = 0;

  edges.forEach((edge, edgeIndex) => {
    const last = edgeIndex === edges.length - 1;
    const share = distance(edge.a.pos, edge.b.pos) / total;
    const edgeCount = last ? count - placed : Math.max(48, Math.floor(count * share));
    for (let i = 0; i < edgeCount && placed < count; i++) {
      writeParticle(out, placed, edge, rng);
      placed++;
    }
  });

  return slicePSet(out, placed);
}
