import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';
import { gauss, makePSet, mulberry32, type PSet, type Rng } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type KnotW, type Quality } from './knot-config';

type Vec3 = readonly [number, number, number];

const WARM_LANGS = new Set<MiraLang>(['EN', 'HI', 'TA', 'KN']);

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function hexToRgb(hex: string): Vec3 {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function hueFor(knot: KnotW): Vec3 {
  const hex = KNOT_TABLE.find((item) => item.lang === knot.lang)?.hue ?? '#ffffff';
  return hexToRgb(hex);
}

function fieldColor(rng: Rng): Vec3 {
  const blue = mix([0.03, 0.20, 1.0], [0.08, 0.70, 1.0], rng());
  const violet = mix([0.50, 0.12, 1.0], [1.0, 0.18, 0.72], rng());
  const gold = mix([1.0, 0.42, 0.08], [1.0, 0.78, 0.32], rng());
  return rng() < 0.82 ? mix(blue, violet, rng() * 0.42) : mix(violet, gold, 0.32);
}

function hubColor(knot: KnotW, rng: Rng): Vec3 {
  if (knot.lang === 'TE') return mix(hueFor(knot), [0.12, 0.88, 1.0], 0.58 + rng() * 0.20);
  const hot = WARM_LANGS.has(knot.lang) ? [1.0, 0.46, 0.08] as const : [1.0, 0.22, 0.72] as const;
  return mix(hueFor(knot), hot, 0.44 + rng() * 0.32);
}

function writeFieldDust(out: PSet, index: number, rng: Rng): void {
  const idx = index * 3;
  const edgeBias = rng() < 0.44 ? 1.0 : 0.72;
  out.pos[idx] = (-7.8 + rng() * 15.6) * edgeBias;
  out.pos[idx + 1] = (-4.9 + rng() * 9.8) * edgeBias;
  out.pos[idx + 2] = gauss(rng) * (0.65 + rng() * 1.45);
  out.color.set(fieldColor(rng), idx);
  out.densityLevel[index] = 0.04 + rng() * 0.20;
  out.warpParams[idx] = rng() * 1000;
  out.warpParams[idx + 1] = 0.004 + rng() * 0.020;
  out.warpParams[idx + 2] = 0.04 + rng() * 0.16;
}

function writeHubDust(out: PSet, index: number, knot: KnotW, rng: Rng): void {
  const idx = index * 3;
  const theta = rng() * Math.PI * 2;
  const radius = (0.28 + Math.abs(gauss(rng)) * 1.08) * knot.scale;
  const stretch = 0.70 + rng() * 0.90;
  out.pos[idx] = knot.pos[0] + Math.cos(theta) * radius * stretch;
  out.pos[idx + 1] = knot.pos[1] + Math.sin(theta) * radius;
  out.pos[idx + 2] = knot.pos[2] + gauss(rng) * radius * 0.24;
  out.color.set(hubColor(knot, rng), idx);
  out.densityLevel[index] = 0.14 + rng() * 0.34;
  out.warpParams[idx] = rng() * 1000;
  out.warpParams[idx + 1] = 0.006 + radius * 0.006;
  out.warpParams[idx + 2] = radius;
}

export function generateDust(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].Dust;
  const out = makePSet(count);
  const rng = mulberry32(0xD057);

  for (let i = 0; i < count; i++) {
    const knot = KNOTS_W[Math.floor(rng() * KNOTS_W.length)];
    if (rng() < 0.26) writeHubDust(out, i, knot, rng);
    else writeFieldDust(out, i, rng);
  }

  return out;
}
