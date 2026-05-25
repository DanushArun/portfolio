import { MIRA_TENDRIL_EDGES } from '@/lib/mira-canonical';
import { gauss, makePSet, mixVec, mulberry32, type PSet, type Rng, type Vec3 } from './buffers';
import {
  KNOTS_W,
  LANG_INDEX,
  PARTICLE_BUDGET,
  getKnot,
  type Quality,
} from './knot-config';
import { densityFor, spreadFor, webColor } from './tendril-appearance';
import {
  TAU,
  TENDRIL_CONFIG,
  add,
  controls,
  curvePoint,
  distance,
  makeCurve,
  nearestLang,
  scale,
  type Anchor,
  type Curve,
  type Layer,
} from './tendril-geometry';

function makeMain(edgeIndex: number, layer: Layer, rng: Rng): Curve {
  const edge = MIRA_TENDRIL_EDGES[edgeIndex % MIRA_TENDRIL_EDGES.length];
  const from = getKnot(edge.from);
  const to = getKnot(edge.to);
  const bowAmount = layer === 'gold' ? 0.92 + rng() * 0.44 : 0.52 + rng() * 0.82;
  const [c1, c2] = controls(from.pos, to.pos, scale(edge.bow, bowAmount), rng);
  const energy = edge.weight + (layer === 'gold' ? 0.26 : 0);
  return makeCurve({
    a: from.pos,
    b: to.pos,
    c1,
    c2,
    energy,
    lang: edge.from,
    layer,
    rng,
  });
}

function branchLength(layer: Layer, rng: Rng): number {
  if (layer === 'gold') return 0.72 + rng() * 1.70;
  if (layer === 'violet') return 1.55 + rng() * 2.30;
  return 2.80 + rng() * 3.70;
}

function makeBranch(index: number, layer: Layer, rng: Rng): Curve {
  const knot = KNOTS_W[index % KNOTS_W.length];
  const angle = rng() * TAU;
  const length = branchLength(layer, rng);
  const end: Vec3 = [
    knot.pos[0] + Math.cos(angle) * length,
    knot.pos[1] + Math.sin(angle) * length * (0.70 + rng() * 0.22),
    knot.pos[2] + gauss(rng) * 0.58,
  ];
  const bow: Vec3 = [gauss(rng) * 1.1, gauss(rng) * 1.1, gauss(rng) * 0.18];
  const [c1, c2] = controls(knot.pos, end, bow, rng);
  const energy = layer === 'gold' ? 0.92 + rng() * 0.42 : 0.42 + rng() * 0.46;
  return makeCurve({ a: knot.pos, b: end, c1, c2, energy, lang: knot.lang, layer, rng });
}

function satelliteRadius(layer: Layer, rng: Rng): number {
  if (layer === 'gold') return 0.18 + Math.abs(gauss(rng)) * 0.74;
  if (layer === 'violet') return 0.38 + Math.abs(gauss(rng)) * 1.18;
  return 0.72 + Math.abs(gauss(rng)) * 1.92;
}

function makeSatellite(id: number, knotIndex: number, layer: Layer, rng: Rng): Anchor {
  const knot = KNOTS_W[knotIndex];
  const angle = rng() * TAU;
  const radius = satelliteRadius(layer, rng);
  const xScale = layer === 'gold' ? 1.18 : 0.86 + rng() * 0.82;
  const pos: Vec3 = [
    knot.pos[0] + Math.cos(angle) * radius * xScale,
    knot.pos[1] + Math.sin(angle) * radius,
    knot.pos[2] + gauss(rng) * (layer === 'gold' ? 0.22 : 0.42),
  ];
  return { id, lang: knot.lang, pos };
}

function makeCorridorAnchor(id: number, layer: Layer, rng: Rng): Anchor {
  const edge = MIRA_TENDRIL_EDGES[Math.floor(rng() * MIRA_TENDRIL_EDGES.length)];
  const from = getKnot(edge.from);
  const to = getKnot(edge.to);
  const t = 0.04 + rng() * 0.92;
  const bow = scale(edge.bow, Math.sin(Math.PI * t) * (0.40 + rng() * 0.90));
  const jitter = layer === 'violet' ? 0.46 : 0.72;
  const pos = add(mixVec(from.pos, to.pos, t), [
    bow[0] + gauss(rng) * jitter,
    bow[1] + gauss(rng) * jitter,
    bow[2] + gauss(rng) * 0.26,
  ]);
  return { id, lang: nearestLang(pos), pos };
}

function makeFieldAnchor(id: number, layer: Layer, rng: Rng): Anchor {
  if (rng() < TENDRIL_CONFIG[layer].corridorBias) {
    return makeCorridorAnchor(id, layer, rng);
  }
  const pos: Vec3 = [-6.4 + rng() * 12.8, -4.35 + rng() * 8.70, gauss(rng) * 0.84];
  return { id, lang: nearestLang(pos), pos };
}

function makeAnchors(layer: Layer, rng: Rng): Anchor[] {
  const config = TENDRIL_CONFIG[layer];
  const anchors = KNOTS_W.map((knot, id) => ({ id, lang: knot.lang, pos: knot.pos }));
  KNOTS_W.forEach((_, knotIndex) => {
    for (let i = 0; i < config.satellites; i++) {
      anchors.push(makeSatellite(anchors.length, knotIndex, layer, rng));
    }
  });
  for (let i = 0; i < config.fieldAnchors; i++) {
    anchors.push(makeFieldAnchor(anchors.length, layer, rng));
  }
  return anchors;
}

function meshCurve(a: Anchor, b: Anchor, layer: Layer, rng: Rng): Curve {
  const length = distance(a.pos, b.pos);
  const bend = layer === 'gold' ? 0.10 : 0.16;
  const bow: Vec3 = [gauss(rng) * length * bend, gauss(rng) * length * bend, 0];
  const [c1, c2] = controls(a.pos, b.pos, bow, rng);
  const nodeEnergy = layer === 'gold' ? 0.44 : 0;
  const energy = 0.38 + Math.max(0, 1 - length / 4) * 0.66 + nodeEnergy;
  return makeCurve({ a: a.pos, b: b.pos, c1, c2, energy, lang: a.lang, layer, rng });
}

function nearestAnchors(
  anchor: Anchor,
  anchors: readonly Anchor[],
  layer: Layer,
): Array<{ item: Anchor; distance: number }> {
  return anchors
    .filter((item) => item.id !== anchor.id)
    .map((item) => ({ item, distance: distance(anchor.pos, item.pos) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, TENDRIL_CONFIG[layer].neighbors);
}

function makeMesh(layer: Layer, rng: Rng): Curve[] {
  const curves: Curve[] = [];
  const seen = new Set<string>();
  const anchors = makeAnchors(layer, rng);
  for (const anchor of anchors) {
    nearestAnchors(anchor, anchors, layer).forEach(({ item, distance: d }) => {
      const key = anchor.id < item.id ? `${anchor.id}:${item.id}` : `${item.id}:${anchor.id}`;
      if (seen.has(key) || d > TENDRIL_CONFIG[layer].maxDistance) return;
      seen.add(key);
      curves.push(meshCurve(anchor, item, layer, rng));
    });
  }
  return curves;
}

function makeBlueCurves(rng: Rng): Curve[] {
  const main = MIRA_TENDRIL_EDGES.map((_, index) => makeMain(index, 'blue', rng));
  const branches = Array.from({ length: TENDRIL_CONFIG.blue.branchCount }, (_, index) => (
    makeBranch(index, 'blue', rng)
  ));
  const structural = [...main, ...makeMesh('blue', rng), ...branches];
  const fibers = Array.from({ length: 2_200 }, (_, index) => {
    const base = structural[Math.floor(rng() * structural.length)];
    return makeBlueFiber(base, rng, index);
  });
  return [...structural, ...fibers];
}

function makeBlueFiber(base: Curve, rng: Rng, index: number): Curve {
  const t0 = rng() * 0.82;
  const t1 = Math.min(0.98, t0 + 0.06 + rng() * 0.18);
  const a = offsetPoint(curvePoint(base, t0), 0.055 + rng() * 0.18, rng);
  const b = offsetPoint(curvePoint(base, t1), 0.055 + rng() * 0.18, rng);
  const bow: Vec3 = [gauss(rng) * 0.10, gauss(rng) * 0.10, gauss(rng) * 0.035];
  const [c1, c2] = controls(a, b, bow, rng);
  const energy = Math.min(1.12, base.energy * 0.72 + 0.12 + (index % 7) * 0.012);
  return makeCurve({ a, b, c1, c2, energy, lang: base.from, layer: 'blue', rng });
}

function offsetPoint(point: Vec3, amount: number, rng: Rng): Vec3 {
  return [
    point[0] + gauss(rng) * amount,
    point[1] + gauss(rng) * amount,
    point[2] + gauss(rng) * amount * 0.36,
  ];
}

function makeInfectionCurve(base: Curve, index: number, rng: Rng): Curve {
  const t0 = rng() * 0.84;
  const t1 = Math.min(0.98, t0 + 0.045 + rng() * 0.13);
  const a = offsetPoint(curvePoint(base, t0), 0.035 + rng() * 0.14, rng);
  const b = offsetPoint(curvePoint(base, t1), 0.035 + rng() * 0.14, rng);
  const bow: Vec3 = [gauss(rng) * 0.13, gauss(rng) * 0.13, gauss(rng) * 0.04];
  const [c1, c2] = controls(a, b, bow, rng);
  const energy = Math.min(1.24, base.energy * 0.74 + 0.18 + (index % 5) * 0.018);
  return makeCurve({ a, b, c1, c2, energy, lang: base.from, layer: 'violet', rng });
}

function makeVioletCurves(blue: readonly Curve[], rng: Rng): Curve[] {
  return Array.from({ length: 2_600 }, (_, index) => {
    const cursor = Math.floor(rng() * blue.length);
    return makeInfectionCurve(blue[cursor], index, rng);
  });
}

function arcPoint(center: Vec3, radius: number, angle: number, rng: Rng): Vec3 {
  return [
    center[0] + Math.cos(angle) * radius * (1.18 + rng() * 0.20),
    center[1] + Math.sin(angle) * radius * (0.82 + rng() * 0.18),
    center[2] + gauss(rng) * 0.12,
  ];
}

function makeNodeArc(index: number, rng: Rng): Curve {
  const knot = KNOTS_W[index % KNOTS_W.length];
  const hiScale = knot.lang === 'HI' ? 1.78 : 1;
  const radius = (0.18 + rng() * 0.74) * hiScale;
  const start = rng() * TAU;
  const sweep = (0.55 + rng() * 1.75) * (rng() < 0.5 ? -1 : 1);
  const a = arcPoint(knot.pos, radius, start, rng);
  const b = arcPoint(knot.pos, radius, start + sweep, rng);
  const c1 = arcPoint(knot.pos, radius * (1.10 + rng() * 0.32), start + sweep * 0.34, rng);
  const c2 = arcPoint(knot.pos, radius * (1.10 + rng() * 0.32), start + sweep * 0.68, rng);
  const energy = 1.04 + rng() * 0.58;
  return makeCurve({ a, b, c1, c2, energy, lang: knot.lang, layer: 'gold', rng });
}

function makeGoldCurves(rng: Rng): Curve[] {
  const bridges = Array.from({ length: 5 }, (_, index) => makeMain(index, 'gold', rng));
  const arcs = Array.from({ length: 520 }, (_, index) => makeNodeArc(index, rng));
  return [...arcs, ...bridges, ...makeMesh('gold', rng)];
}

function writeParticle(out: PSet, index: number, curve: Curve, rng: Rng): void {
  const t = sampleT(rng);
  const body = Math.sin(Math.PI * t);
  const point = curvePoint(curve, t);
  const spin = rng() * TAU;
  const spread = spreadFor(curve.layer);
  const lanes = curve.layer === 'blue' ? 13 : curve.layer === 'violet' ? 7 : 5;
  const strand = Math.round((rng() - 0.5) * lanes) * curve.width * 0.10 * spread;
  const spray = Math.abs(gauss(rng)) * curve.width * (0.018 + body * 0.07) * spread;
  const offset = strand + spray;
  const ptr = index * 3;

  out.pos[ptr] = point[0] + Math.cos(spin) * offset;
  out.pos[ptr + 1] = point[1] + Math.sin(spin) * offset;
  out.pos[ptr + 2] = point[2] + gauss(rng) * curve.width * 0.16;
  out.color.set(webColor(curve, t, rng), ptr);
  out.densityLevel[index] = densityFor(curve, body);
  out.langIndex[index] = LANG_INDEX[curve.from];
  out.warpParams[ptr] = curve.noise;
  out.warpParams[ptr + 1] = 0.002 + curve.width * 0.10;
  out.warpParams[ptr + 2] = body;
}

function sampleT(rng: Rng): number {
  const t = rng();
  return t < 0.5 ? Math.pow(t * 2, 0.82) * 0.5 : 1 - Math.pow((1 - t) * 2, 0.82) * 0.5;
}

function layerFor(index: number, count: number): Layer {
  const ratio = index / count;
  if (ratio < 0.68) return 'blue';
  if (ratio < 0.90) return 'violet';
  return 'gold';
}

export function generateTendrils(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].web;
  const out = makePSet(count);
  const rng = mulberry32(0xC05C1C);
  const blue = makeBlueCurves(rng);
  const curves: Record<Layer, Curve[]> = {
    blue,
    violet: makeVioletCurves(blue, rng),
    gold: makeGoldCurves(rng),
  };

  for (let i = 0; i < count; i++) {
    const layer = layerFor(i, count);
    writeParticle(out, i, curves[layer][i % curves[layer].length], rng);
  }

  return out;
}
