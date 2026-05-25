import { KNOT_TABLE } from '@/lib/mira-state';
import { gauss, makePSet, mergePSets, mulberry32, type PSet, type Rng } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type KnotW, type Quality } from './knot-config';

type Vec3 = readonly [number, number, number];

interface HubRay {
  readonly dir: Vec3;
  readonly length: number;
  readonly noise: number;
  readonly width: number;
}

function hexToRgb(hex: string): Vec3 {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function hueFor(knot: KnotW): Vec3 {
  return hexToRgb(KNOT_TABLE.find((spec) => spec.lang === knot.lang)?.hue ?? '#ffffff');
}

function makeRay(rng: Rng, knot: KnotW): HubRay {
  const theta = rng() * Math.PI * 2;
  const z = (rng() - 0.5) * 0.22;
  const planar = Math.sqrt(Math.max(0, 1 - z * z));

  return {
    dir: [Math.cos(theta) * planar, Math.sin(theta) * planar, z],
    length: (0.55 + Math.abs(gauss(rng)) * 1.18) * knot.scale,
    noise: rng() * 1000,
    width: 0.012 + Math.abs(gauss(rng)) * 0.028,
  };
}

function writeCore(out: PSet, index: number, knot: KnotW, rng: Rng, rgb: Vec3): void {
  const idx = index * 3;
  const radius = Math.abs(gauss(rng)) * 0.055 * knot.scale;
  const theta = rng() * Math.PI * 2;

  out.pos[idx] = knot.pos[0] + Math.cos(theta) * radius;
  out.pos[idx + 1] = knot.pos[1] + Math.sin(theta) * radius;
  out.pos[idx + 2] = knot.pos[2] + (rng() - 0.5) * radius;
  out.color.set(rgb, idx);
  out.isCore[index] = 1;
  out.densityLevel[index] = 1.7;
}

function writeRay(out: PSet, index: number, knot: KnotW, rng: Rng, rgb: Vec3, ray: HubRay): void {
  const idx = index * 3;
  const travel = Math.pow(rng(), 1.34) * ray.length;
  const scatter = Math.abs(gauss(rng)) * ray.width * (0.8 + travel);
  const spin = rng() * Math.PI * 2;

  out.pos[idx] = knot.pos[0] + ray.dir[0] * travel + Math.cos(spin) * scatter;
  out.pos[idx + 1] = knot.pos[1] + ray.dir[1] * travel + Math.sin(spin) * scatter;
  out.pos[idx + 2] = knot.pos[2] + ray.dir[2] * travel + (rng() - 0.5) * scatter;
  out.color.set(rgb, idx);
  out.densityLevel[index] = Math.max(0.18, 1 - travel / (ray.length + 0.001));
  out.warpParams[idx] = ray.noise;
  out.warpParams[idx + 1] = 0.018 + travel * 0.012;
}

function generateHub(knot: KnotW, quality: Quality, index: number): PSet {
  const count = PARTICLE_BUDGET[quality][knot.lang];
  const out = makePSet(count);
  const rng = mulberry32(0x1000 + index * 43);
  const rgb = hueFor(knot);
  const rays = Array.from({ length: Math.max(96, Math.floor(count / 120)) }, () => (
    makeRay(rng, knot)
  ));

  for (let i = 0; i < count; i++) {
    if (rng() < 0.28) writeCore(out, i, knot, rng, rgb);
    else writeRay(out, i, knot, rng, rgb, rays[i % rays.length]);
  }

  return out;
}

export function generateHubs(quality: Quality): PSet {
  return mergePSets(KNOTS_W.map((knot, index) => generateHub(knot, quality, index)));
}
