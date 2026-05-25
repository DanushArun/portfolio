import { type MiraLang } from '@/lib/mira-state';
import { gauss, mixVec, type Rng, type Vec3 } from './buffers';
import { KNOTS_W } from './knot-config';

export type Layer = 'blue' | 'violet' | 'gold';

export interface Anchor {
  readonly id: number;
  readonly lang: MiraLang;
  readonly pos: Vec3;
}

export interface Curve {
  readonly a: Vec3;
  readonly b: Vec3;
  readonly c1: Vec3;
  readonly c2: Vec3;
  readonly energy: number;
  readonly from: MiraLang;
  readonly layer: Layer;
  readonly noise: number;
  readonly width: number;
}

export const TAU = Math.PI * 2;

export const TENDRIL_CONFIG = {
  blue: {
    branchCount: 120,
    corridorBias: 0.72,
    satellites: 60,
    fieldAnchors: 220,
    neighbors: 6,
    maxDistance: 3.55,
  },
  violet: {
    branchCount: 0,
    corridorBias: 0.62,
    satellites: 48,
    fieldAnchors: 160,
    neighbors: 5,
    maxDistance: 3.0,
  },
  gold: {
    branchCount: 0,
    corridorBias: 0.50,
    satellites: 28,
    fieldAnchors: 80,
    neighbors: 4,
    maxDistance: 2.4,
  },
} as const satisfies Record<
  Layer,
  {
    branchCount: number;
    corridorBias: number;
    satellites: number;
    fieldAnchors: number;
    neighbors: number;
    maxDistance: number;
  }
>;

interface CurveInput {
  readonly a: Vec3;
  readonly b: Vec3;
  readonly c1: Vec3;
  readonly c2: Vec3;
  readonly energy: number;
  readonly lang: MiraLang;
  readonly layer: Layer;
  readonly rng: Rng;
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function scale(v: Vec3, amount: number): Vec3 {
  return [v[0] * amount, v[1] * amount, v[2] * amount];
}

export function distance(a: Vec3, b: Vec3): number {
  const x = a[0] - b[0];
  const y = a[1] - b[1];
  const z = a[2] - b[2];
  return Math.sqrt(x * x + y * y + z * z);
}

export function curvePoint(curve: Curve, t: number): Vec3 {
  const ab = mixVec(curve.a, curve.c1, t);
  const bc = mixVec(curve.c1, curve.c2, t);
  const cd = mixVec(curve.c2, curve.b, t);
  return mixVec(mixVec(ab, bc, t), mixVec(bc, cd, t), t);
}

export function controls(a: Vec3, b: Vec3, bow: Vec3, rng: Rng): readonly [Vec3, Vec3] {
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

export function nearestLang(pos: Vec3): MiraLang {
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

export function makeCurve(input: CurveInput): Curve {
  const len = distance(input.a, input.b);
  return {
    a: input.a,
    b: input.b,
    c1: input.c1,
    c2: input.c2,
    energy: input.energy,
    from: input.lang,
    layer: input.layer,
    noise: input.rng() * 1000,
    width: widthFor(input.layer, len, input.energy, input.rng),
  };
}

function widthFor(layer: Layer, len: number, energy: number, rng: Rng): number {
  if (layer === 'gold') return 0.010 + rng() * 0.008 + energy * 0.003;
  if (layer === 'violet') return 0.009 + rng() * 0.007 + len * 0.002;
  return 0.014 + len * 0.004 + rng() * 0.006;
}
