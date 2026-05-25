export const WORLD_SCALE = 2.35;
export const NO_LANGUAGE = -1;

export type Rng = () => number;
export type Vec3 = readonly [number, number, number];

export interface PSet {
  color: Float32Array;
  densityLevel: Float32Array;
  isCore: Float32Array;
  isHalo: Float32Array;
  langIndex: Float32Array;
  pos: Float32Array;
  warpParams: Float32Array;
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function gauss(rng: Rng): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function mixVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function makePSet(count: number): PSet {
  const langIndex = new Float32Array(count);
  langIndex.fill(NO_LANGUAGE);
  return {
    color: new Float32Array(count * 3),
    densityLevel: new Float32Array(count),
    isCore: new Float32Array(count),
    isHalo: new Float32Array(count),
    langIndex,
    pos: new Float32Array(count * 3),
    warpParams: new Float32Array(count * 3),
  };
}

export function mergePSets(sets: readonly PSet[]): PSet {
  const total = sets.reduce((sum, set) => sum + set.densityLevel.length, 0);
  const out = makePSet(total);
  let offset1 = 0;
  let offset3 = 0;

  for (const set of sets) {
    const count = set.densityLevel.length;
    out.color.set(set.color, offset3);
    out.densityLevel.set(set.densityLevel, offset1);
    out.isCore.set(set.isCore, offset1);
    out.isHalo.set(set.isHalo, offset1);
    out.langIndex.set(set.langIndex, offset1);
    out.pos.set(set.pos, offset3);
    out.warpParams.set(set.warpParams, offset3);
    offset1 += count;
    offset3 += count * 3;
  }

  return out;
}

export function hexToRgb(hex: string): Vec3 {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}
