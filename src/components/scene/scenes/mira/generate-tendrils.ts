import { MIRA_TENDRIL_EDGES } from '@/lib/mira-canonical';
import { type MiraLang } from '@/lib/mira-state';
import {
  gauss,
  makePSet,
  mixVec,
  mulberry32,
  type PSet,
  type Rng,
  type Vec3,
} from './buffers';
import {
  KNOTS_W,
  LANG_INDEX,
  PARTICLE_BUDGET,
  getKnot,
  type Quality,
} from './knot-config';

interface WebCurve {
  readonly a: Vec3;
  readonly b: Vec3;
  readonly c1: Vec3;
  readonly c2: Vec3;
  readonly energy: number;
  readonly from: MiraLang;
  readonly noise: number;
  readonly width: number;
}

interface Anchor {
  readonly id: number;
  readonly lang: MiraLang;
  readonly pos: Vec3;
}

const BRANCH_COUNT = 120;
const FIELD_ANCHORS = 220;
const NEIGHBOR_COUNT = 6;
const SATELLITES_PER_KNOT = 60;
const COOL_A: Vec3 = [0.08, 0.26, 0.96];
const COOL_B: Vec3 = [0.32, 0.12, 0.88];
const ION: Vec3 = [0.22, 0.75, 1.0];

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: Vec3, amount: number): Vec3 {
  return [v[0] * amount, v[1] * amount, v[2] * amount];
}

function distance(a: Vec3, b: Vec3): number {
  const x = a[0] - b[0];
  const y = a[1] - b[1];
  const z = a[2] - b[2];
  return Math.sqrt(x * x + y * y + z * z);
}

function curvePoint(curve: WebCurve, t: number): Vec3 {
  const ab = mixVec(curve.a, curve.c1, t);
  const bc = mixVec(curve.c1, curve.c2, t);
  const cd = mixVec(curve.c2, curve.b, t);
  return mixVec(mixVec(ab, bc, t), mixVec(bc, cd, t), t);
}

function curveControls(a: Vec3, b: Vec3, bow: Vec3, rng: Rng): readonly [Vec3, Vec3] {
  const len = distance(a, b);
  const jitterA: Vec3 = [
    gauss(rng) * len * 0.10,
    gauss(rng) * len * 0.10,
    gauss(rng) * len * 0.04,
  ];
  const jitterB: Vec3 = [
    gauss(rng) * len * 0.10,
    gauss(rng) * len * 0.10,
    gauss(rng) * len * 0.04,
  ];
  return [
    add(add(mixVec(a, b, 0.33), scale(bow, 0.72)), jitterA),
    add(add(mixVec(a, b, 0.66), bow), jitterB),
  ];
}

function makeMainCurve(edgeIndex: number, rng: Rng): WebCurve {
  const edge = MIRA_TENDRIL_EDGES[edgeIndex % MIRA_TENDRIL_EDGES.length];
  const from = getKnot(edge.from);
  const to = getKnot(edge.to);
  const bow = scale(edge.bow, 0.88 + rng() * 0.34);
  const [c1, c2] = curveControls(from.pos, to.pos, bow, rng);

  return {
    a: from.pos,
    b: to.pos,
    c1,
    c2,
    energy: edge.weight,
    from: edge.from,
    noise: rng() * 1000,
    width: 0.028 + edge.weight * 0.010,
  };
}

function makeBranch(index: number, rng: Rng): WebCurve {
  const knot = KNOTS_W[index % KNOTS_W.length];
  const angle = rng() * Math.PI * 2;
  const length = 1.8 + rng() * 2.8;
  const end: Vec3 = [
    knot.pos[0] + Math.cos(angle) * length,
    knot.pos[1] + Math.sin(angle) * length * 0.72,
    knot.pos[2] + gauss(rng) * 0.78,
  ];
  const bow: Vec3 = [gauss(rng) * 0.92, gauss(rng) * 0.92, gauss(rng) * 0.20];
  const [c1, c2] = curveControls(knot.pos, end, bow, rng);

  return {
    a: knot.pos,
    b: end,
    c1,
    c2,
    energy: 0.42 + rng() * 0.48,
    from: knot.lang,
    noise: rng() * 1000,
    width: 0.018 + rng() * 0.018,
  };
}

function nearestLang(pos: Vec3): MiraLang {
  let lang = KNOTS_W[0].lang;
  let best = Number.POSITIVE_INFINITY;
  for (const knot of KNOTS_W) {
    const d = distance(pos, knot.pos);
    if (d >= best) continue;
    best = d;
    lang = knot.lang;
  }
  return lang;
}

function makeSatellite(knotIndex: number, id: number, rng: Rng): Anchor {
  const knot = KNOTS_W[knotIndex];
  const angle = rng() * Math.PI * 2;
  const radius = 0.62 + Math.abs(gauss(rng)) * 1.45;
  const pos: Vec3 = [
    knot.pos[0] + Math.cos(angle) * radius * (0.72 + rng() * 0.68),
    knot.pos[1] + Math.sin(angle) * radius,
    knot.pos[2] + gauss(rng) * 0.42,
  ];
  return { id, lang: knot.lang, pos };
}

function makeFieldAnchor(id: number, rng: Rng): Anchor {
  if (rng() < 0.72) return makeCorridorAnchor(id, rng);
  const pos: Vec3 = [
    -5.6 + rng() * 11.2,
    -3.9 + rng() * 7.8,
    gauss(rng) * 0.82,
  ];
  return { id, lang: nearestLang(pos), pos };
}

function makeCorridorAnchor(id: number, rng: Rng): Anchor {
  const edge = MIRA_TENDRIL_EDGES[Math.floor(rng() * MIRA_TENDRIL_EDGES.length)];
  const from = getKnot(edge.from);
  const to = getKnot(edge.to);
  const t = 0.08 + rng() * 0.84;
  const bow = scale(edge.bow, Math.sin(Math.PI * t) * (0.55 + rng() * 0.72));
  const pos = add(mixVec(from.pos, to.pos, t), [
    bow[0] + gauss(rng) * 0.54,
    bow[1] + gauss(rng) * 0.54,
    bow[2] + gauss(rng) * 0.30,
  ]);
  return { id, lang: nearestLang(pos), pos };
}

function makeAnchors(rng: Rng): Anchor[] {
  const anchors = KNOTS_W.map((knot, id) => ({
    id,
    lang: knot.lang,
    pos: knot.pos,
  }));
  KNOTS_W.forEach((_, knotIndex) => {
    for (let i = 0; i < SATELLITES_PER_KNOT; i++) {
      anchors.push(makeSatellite(knotIndex, anchors.length, rng));
    }
  });
  for (let i = 0; i < FIELD_ANCHORS; i++) {
    anchors.push(makeFieldAnchor(anchors.length, rng));
  }
  return anchors;
}

function meshCurve(a: Anchor, b: Anchor, rng: Rng): WebCurve {
  const len = distance(a.pos, b.pos);
  const bow: Vec3 = [
    gauss(rng) * len * 0.16,
    gauss(rng) * len * 0.16,
    gauss(rng) * len * 0.05,
  ];
  const [c1, c2] = curveControls(a.pos, b.pos, bow, rng);
  return {
    a: a.pos,
    b: b.pos,
    c1,
    c2,
    energy: 0.46 + Math.max(0, 1.0 - len / 4.0) * 0.62,
    from: a.lang,
    noise: rng() * 1000,
    width: 0.014 + len * 0.004,
  };
}

function makeMeshCurves(rng: Rng): WebCurve[] {
  const anchors = makeAnchors(rng);
  const curves: WebCurve[] = [];
  const seen = new Set<string>();
  for (const anchor of anchors) {
    const nearest = anchors
      .filter((item) => item.id !== anchor.id)
      .map((item) => ({ item, distance: distance(anchor.pos, item.pos) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEIGHBOR_COUNT);
    nearest.forEach(({ item, distance: d }) => {
      const key = anchor.id < item.id
        ? `${anchor.id}:${item.id}`
        : `${item.id}:${anchor.id}`;
      if (seen.has(key) || d > 3.55) return;
      seen.add(key);
      curves.push(meshCurve(anchor, item, rng));
    });
  }
  return curves;
}

function webColor(curve: WebCurve, t: number, rng: Rng): Vec3 {
  const endpointHeat = Math.max(1 - t, t);
  const filament = mixVec(COOL_A, COOL_B, rng() * 0.72);
  const ionized = mixVec(filament, ION, Math.sin(Math.PI * t) * 0.36);
  const warm = getKnot(curve.from).hue;
  return mixVec(ionized, warm, Math.max(0, endpointHeat - 0.62) * 0.72);
}

function writeParticle(out: PSet, index: number, curve: WebCurve, rng: Rng): void {
  const t = rng() < 0.5 ? Math.pow(rng(), 0.72) : 1 - Math.pow(rng(), 0.72);
  const body = Math.sin(Math.PI * t);
  const p = curvePoint(curve, t);
  const spin = rng() * Math.PI * 2;
  const strand = Math.round((rng() - 0.5) * 11) * curve.width * 0.22;
  const spray = Math.abs(gauss(rng)) * curve.width * (0.06 + body * 0.15);
  const offset = strand + spray;
  const ptr = index * 3;

  out.pos[ptr] = p[0] + Math.cos(spin) * offset;
  out.pos[ptr + 1] = p[1] + Math.sin(spin) * offset;
  out.pos[ptr + 2] = p[2] + gauss(rng) * curve.width * 0.24;
  out.color.set(webColor(curve, t, rng), ptr);
  out.densityLevel[index] = 0.18 + body * 0.54 + curve.energy * 0.08;
  out.langIndex[index] = LANG_INDEX[curve.from];
  out.warpParams[ptr] = curve.noise;
  out.warpParams[ptr + 1] = 0.004 + curve.width * 0.16;
  out.warpParams[ptr + 2] = body;
}

function makeCurves(rng: Rng): WebCurve[] {
  const main = MIRA_TENDRIL_EDGES.map((_, index) => makeMainCurve(index, rng));
  const branches = Array.from(
    { length: BRANCH_COUNT },
    (_, index) => makeBranch(index, rng),
  );
  return [...main, ...makeMeshCurves(rng), ...branches];
}

export function generateTendrils(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].web;
  const out = makePSet(count);
  const rng = mulberry32(0xC05C1C);
  const curves = makeCurves(rng);

  for (let i = 0; i < count; i++) {
    const curve = curves[i % curves.length];
    writeParticle(out, i, curve, rng);
  }

  return out;
}
