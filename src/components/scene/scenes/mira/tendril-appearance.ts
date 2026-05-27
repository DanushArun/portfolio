import { mixVec, type Rng, type Vec3 } from './buffers';
import { getKnot } from './knot-config';
import { type Curve, type Layer } from './tendril-geometry';

const COOL_A: Vec3 = [0.005, 0.035, 0.26];
const COOL_B: Vec3 = [0.01, 0.13, 0.54];
const BLUE_PATCH_A: Vec3 = [0.015, 0.20, 0.78];
const BLUE_PATCH_B: Vec3 = [0.08, 0.34, 0.86];
const GOLD_A: Vec3 = [0.92, 0.34, 0.10];
const GOLD_B: Vec3 = [1.00, 0.66, 0.28];
const RED_INFECTION_A: Vec3 = [0.56, 0.08, 0.54];
const RED_INFECTION_B: Vec3 = [0.80, 0.18, 0.72];
const VIOLET_A: Vec3 = [0.10, 0.04, 0.44];
const VIOLET_B: Vec3 = [0.24, 0.10, 0.68];

export const BLUE_PATCH_CHANCE = 0.20;
export const RED_INFECTION_CHANCE = 0.04;

export function webColor(curve: Curve, t: number, rng: Rng): Vec3 {
  if (curve.layer === 'gold') return goldColor(curve, t, rng);
  if (curve.layer === 'violet') return violetColor(curve, t, rng);
  return blueColor(curve, t, rng);
}

export function spreadFor(layer: Layer): number {
  if (layer === 'gold') return 0.46;
  if (layer === 'violet') return 0.62;
  return 1.08;
}

export function densityFor(curve: Curve, body: number): number {
  if (curve.layer === 'gold') return 0.30 + body * 0.24 + curve.energy * 0.08;
  if (curve.layer === 'violet') return 0.13 + body * 0.20 + curve.energy * 0.05;
  return 0.09 + body * 0.18 + curve.energy * 0.04;
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
