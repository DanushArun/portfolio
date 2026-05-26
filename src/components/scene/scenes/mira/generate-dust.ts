import {
  gauss,
  makePSet,
  mixVec,
  mulberry32,
  type PSet,
  type Rng,
  type Vec3,
} from './buffers';
import { KNOTS_W, LANG_INDEX, PARTICLE_BUDGET, type KnotW, type Quality } from './knot-config';

const BLUE_HALO: Vec3 = [0.08, 0.34, 0.92];

function haloColor(knot: KnotW, rng: Rng): Vec3 {
  return mixVec(BLUE_HALO, knot.hue, 0.34 + rng() * 0.44);
}

function writeHalo(out: PSet, index: number, knot: KnotW, rng: Rng): void {
  const ptr = index * 3;
  const angle = rng() * Math.PI * 2;
  const radius = (0.42 + Math.abs(gauss(rng)) * 1.18) * knot.scale;
  const stretch = 0.86 + rng() * 0.92;

  out.pos[ptr] = knot.pos[0] + Math.cos(angle) * radius * stretch;
  out.pos[ptr + 1] = knot.pos[1] + Math.sin(angle) * radius;
  out.pos[ptr + 2] = knot.pos[2] + gauss(rng) * radius * 0.12;
  out.color.set(haloColor(knot, rng), ptr);
  out.densityLevel[index] = 0.22 + rng() * 0.34;
  out.isHalo[index] = 1;
  out.langIndex[index] = LANG_INDEX[knot.lang];
  out.warpParams[ptr] = rng() * 1000;
  out.warpParams[ptr + 1] = 0.008 + radius * 0.005;
  out.warpParams[ptr + 2] = radius;
}

export function generateHalos(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].halos;
  const out = makePSet(count);
  const rng = mulberry32(0x5EA7);

  for (let i = 0; i < count; i++) {
    writeHalo(out, i, KNOTS_W[i % KNOTS_W.length], rng);
  }

  return out;
}
