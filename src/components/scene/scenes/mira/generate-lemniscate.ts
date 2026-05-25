import { KNOT_TABLE } from '@/lib/mira-state';
import { gauss, makePSet, mulberry32, type PSet, type Rng } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type Quality } from './knot-config';

type Vec3 = readonly [number, number, number];

interface LoopStrand {
  readonly noise: number;
  readonly offset: Vec3;
  readonly phase: number;
  readonly width: number;
}

function hexToRgb(hex: string): Vec3 {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function rotate2d(x: number, y: number, radians: number): readonly [number, number] {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [x * cos - y * sin, x * sin + y * cos];
}

function makeStrand(rng: Rng): LoopStrand {
  return {
    noise: rng() * 1000,
    offset: [gauss(rng) * 0.12, gauss(rng) * 0.10, gauss(rng) * 0.08],
    phase: rng() * Math.PI * 2,
    width: 0.060 + Math.abs(gauss(rng)) * 0.060,
  };
}

function sampleLoopT(rng: Rng): number {
  const t = rng() * Math.PI * 2;
  const gap = Math.sin(t * 2.0 + 0.8) + Math.sin(t * 5.0 - 1.3) * 0.45;
  if (gap < -0.86) return sampleLoopT(rng);
  return t;
}

function loopColor(t: number, rgb: Vec3, rng: Rng): Vec3 {
  const blue: Vec3 = [0.08, 0.28, 1.0];
  const hot: Vec3 = [1.0, 0.90, 0.64];
  const warmMix = 0.58 + Math.sin(t * 3.0) * 0.22 + rng() * 0.12;
  const warm = mix(rgb, hot, Math.max(0, Math.min(1, warmMix)));
  return mix(blue, warm, 0.62 + rng() * 0.24);
}

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function writeLoopPoint(out: PSet, index: number, center: Vec3, rgb: Vec3, strand: LoopStrand): void {
  const rng = mulberry32(0x6200 + index);
  const t = sampleLoopT(rng) + strand.phase * 0.035;
  const wobble = 1 + Math.sin(t * 4.0 + strand.phase) * 0.055;
  const [rx, ry] = rotate2d(Math.cos(t) * 2.18 * wobble, Math.sin(t) * 0.78, -0.12);
  const idx = index * 3;
  const spray = Math.abs(gauss(rng)) * strand.width;
  const spin = rng() * Math.PI * 2;

  out.pos[idx] = center[0] + rx + strand.offset[0] + Math.cos(spin) * spray;
  out.pos[idx + 1] = center[1] + ry + strand.offset[1] + Math.sin(spin) * spray;
  out.pos[idx + 2] = center[2] + strand.offset[2] + gauss(rng) * strand.width * 0.28;
  out.color.set(loopColor(t, rgb, rng), idx);
  out.isLoop[index] = 1;
  out.densityLevel[index] = 0.24 + rng() * 0.18;
  out.warpParams[idx] = strand.noise;
  out.warpParams[idx + 1] = 0.008 + strand.width * 0.05;
  out.warpParams[idx + 2] = strand.width;
}

export function generateLemniscate(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].HILoop;
  const out = makePSet(count);
  const rng = mulberry32(0x8888);
  const hiKnot = KNOTS_W.find((knot) => knot.lang === 'HI');
  if (!hiKnot) return out;

  const hiHue = KNOT_TABLE.find((knot) => knot.lang === 'HI')?.hue ?? '#ffb84d';
  const center: Vec3 = [hiKnot.pos[0] + 1.10, hiKnot.pos[1] + 0.08, hiKnot.pos[2] + 0.02];
  const rgb = hexToRgb(hiHue);
  const strands = Array.from({ length: Math.max(180, Math.floor(count / 90)) }, () => (
    makeStrand(rng)
  ));

  for (let i = 0; i < count; i++) {
    writeLoopPoint(out, i, center, rgb, strands[i % strands.length]);
  }

  return out;
}
