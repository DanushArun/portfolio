import { mixVec, type Rng, type Vec3 } from './buffers';
import { getKnot } from './knot-config';
import { type Curve, type Layer } from './tendril-geometry';

const COOL_A: Vec3 = [0.01, 0.04, 0.24];
const COOL_B: Vec3 = [0.02, 0.12, 0.45];
const BLUE_PATCH_A: Vec3 = [0.02, 0.22, 0.74];
const BLUE_PATCH_B: Vec3 = [0.05, 0.38, 0.92];
const GOLD_A: Vec3 = [1.00, 0.37, 0.10];
const GOLD_B: Vec3 = [1.00, 0.78, 0.34];
const RED_INFECTION_A: Vec3 = [0.70, 0.01, 0.03];
const RED_INFECTION_B: Vec3 = [1.00, 0.04, 0.08];
const VIOLET_A: Vec3 = [0.08, 0.01, 0.28];
const VIOLET_B: Vec3 = [0.24, 0.02, 0.42];

export const BLUE_PATCH_CHANCE = 0.12;
export const RED_INFECTION_CHANCE = 0.24;

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
  const base = rng() < BLUE_PATCH_CHANCE
    ? mixVec(BLUE_PATCH_A, BLUE_PATCH_B, rng() * 0.82)
    : mixVec(COOL_A, COOL_B, rng() * 0.90);
  return mixVec(base, getKnot(curve.from).hue, endpointHeat(t) * 0.05);
}

function violetColor(curve: Curve, t: number, rng: Rng): Vec3 {
  const base = rng() < RED_INFECTION_CHANCE
    ? mixVec(RED_INFECTION_A, RED_INFECTION_B, 0.16 + rng() * 0.72)
    : mixVec(VIOLET_A, VIOLET_B, 0.18 + rng() * 0.70);
  return mixVec(base, getKnot(curve.from).hue, endpointHeat(t) * 0.12);
}

function goldColor(curve: Curve, t: number, rng: Rng): Vec3 {
  const base = mixVec(GOLD_A, GOLD_B, 0.10 + rng() * 0.90);
  return mixVec(base, getKnot(curve.from).hue, endpointHeat(t) * 0.10);
}

function endpointHeat(t: number): number {
  return Math.max(0, Math.max(1 - t, t) - 0.58);
}
