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

const HOT_CORE: Vec3 = [1.0, 0.96, 0.82];

function coreColor(knot: KnotW, rng: Rng): Vec3 {
  return mixVec(knot.hue, HOT_CORE, 0.74 + rng() * 0.22);
}

function rayDirection(rng: Rng): Vec3 {
  const angle = rng() * Math.PI * 2;
  const z = gauss(rng) * 0.10;
  return [Math.cos(angle), Math.sin(angle), z];
}

function writeCore(out: PSet, index: number, knot: KnotW, rng: Rng): void {
  const ptr = index * 3;
  const angle = rng() * Math.PI * 2;
  const radius = Math.abs(gauss(rng)) * 0.055 * knot.scale;

  out.pos[ptr] = knot.pos[0] + Math.cos(angle) * radius;
  out.pos[ptr + 1] = knot.pos[1] + Math.sin(angle) * radius;
  out.pos[ptr + 2] = knot.pos[2] + gauss(rng) * radius * 0.32;
  out.color.set(coreColor(knot, rng), ptr);
  out.densityLevel[index] = 1.0;
  out.isCore[index] = 1;
  out.langIndex[index] = LANG_INDEX[knot.lang];
}

function writeRay(out: PSet, index: number, knot: KnotW, rng: Rng): void {
  const ptr = index * 3;
  const dir = rayDirection(rng);
  const travel = Math.pow(rng(), 1.8) * (0.38 + knot.scale * 0.62);
  const scatter = Math.abs(gauss(rng)) * 0.026 * (1 + travel);

  out.pos[ptr] = knot.pos[0] + dir[0] * travel + gauss(rng) * scatter;
  out.pos[ptr + 1] = knot.pos[1] + dir[1] * travel + gauss(rng) * scatter;
  out.pos[ptr + 2] = knot.pos[2] + dir[2] * travel + gauss(rng) * scatter;
  out.color.set(mixVec(knot.hue, HOT_CORE, Math.max(0, 1 - travel)), ptr);
  out.densityLevel[index] = 0.38 + Math.max(0, 1 - travel) * 0.62;
  out.langIndex[index] = LANG_INDEX[knot.lang];
  out.warpParams[ptr] = rng() * 1000;
  out.warpParams[ptr + 1] = 0.006 + travel * 0.016;
}

function writeHub(out: PSet, start: number, count: number, knot: KnotW, rng: Rng): void {
  for (let i = 0; i < count; i++) {
    const index = start + i;
    if (rng() < 0.42) writeCore(out, index, knot, rng);
    else writeRay(out, index, knot, rng);
  }
}

export function generateHubs(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].hubs;
  const out = makePSet(count);
  const rng = mulberry32(0xA11CE);
  let start = 0;

  KNOTS_W.forEach((knot, index) => {
    const last = index === KNOTS_W.length - 1;
    const share = last ? count - start : Math.floor(count / KNOTS_W.length);
    writeHub(out, start, share, knot, rng);
    start += share;
  });

  return out;
}
