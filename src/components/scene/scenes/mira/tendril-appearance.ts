import { mixVec, type Rng, type Vec3 } from './buffers';
import { getKnot } from './knot-config';
import { type Curve, type Layer } from './tendril-geometry';

const COOL_A: Vec3 = [0.03, 0.14, 0.72];
const COOL_B: Vec3 = [0.05, 0.50, 1.00];
const GOLD_A: Vec3 = [1.00, 0.37, 0.10];
const GOLD_B: Vec3 = [1.00, 0.78, 0.34];
const VIOLET_A: Vec3 = [0.34, 0.06, 0.95];
const VIOLET_B: Vec3 = [0.95, 0.12, 0.66];

export function webColor(curve: Curve, t: number, rng: Rng): Vec3 {
  if (curve.layer === 'gold') return goldColor(curve, t, rng);
  if (curve.layer === 'violet') return violetColor(curve, t, rng);
  return blueColor(curve, t, rng);
}

export function spreadFor(layer: Layer): number {
  if (layer === 'gold') return 0.34;
  if (layer === 'violet') return 0.48;
  return 0.92;
}

export function densityFor(curve: Curve, body: number): number {
  if (curve.layer === 'gold') return 0.30 + body * 0.30 + curve.energy * 0.10;
  if (curve.layer === 'violet') return 0.11 + body * 0.24 + curve.energy * 0.06;
  return 0.05 + body * 0.20 + curve.energy * 0.04;
}

function blueColor(curve: Curve, t: number, rng: Rng): Vec3 {
  const base = mixVec(COOL_A, COOL_B, rng() * 0.90);
  return mixVec(base, getKnot(curve.from).hue, endpointHeat(t) * 0.08);
}

function violetColor(curve: Curve, t: number, rng: Rng): Vec3 {
  const base = mixVec(VIOLET_A, VIOLET_B, 0.18 + rng() * 0.70);
  return mixVec(base, getKnot(curve.from).hue, endpointHeat(t) * 0.12);
}

function goldColor(curve: Curve, t: number, rng: Rng): Vec3 {
  const base = mixVec(GOLD_A, GOLD_B, 0.10 + rng() * 0.90);
  return mixVec(base, getKnot(curve.from).hue, endpointHeat(t) * 0.10);
}

function endpointHeat(t: number): number {
  return Math.max(0, Math.max(1 - t, t) - 0.58);
}
