export const WORLD_SCALE = 2.6; // Reverted for extreme packed density

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(rng: Rng): number {
  let u = 0; let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function hash3(x: number, y: number, z: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

export function fbm3(x: number, y: number, z: number): number {
  let v = 0; let a = 0.5;
  let cx = x; let cy = y; let cz = z;
  for (let i = 0; i < 4; i++) {
    const xi = Math.floor(cx); const yi = Math.floor(cy); const zi = Math.floor(cz);
    const xf = cx - xi; const yf = cy - yi; const zf = cz - zi;
    const c000 = hash3(xi,   yi,   zi);   const c100 = hash3(xi+1, yi,   zi);
    const c010 = hash3(xi,   yi+1, zi);   const c110 = hash3(xi+1, yi+1, zi);
    const c001 = hash3(xi,   yi,   zi+1); const c101 = hash3(xi+1, yi,   zi+1);
    const c011 = hash3(xi,   yi+1, zi+1); const c111 = hash3(xi+1, yi+1, zi+1);
    const ux = xf * xf * (3 - 2 * xf);
    const uy = yf * yf * (3 - 2 * yf);
    const uz = zf * zf * (3 - 2 * zf);
    const x0 = (c000*(1-ux)+c100*ux)*(1-uy) + (c010*(1-ux)+c110*ux)*uy;
    const x1 = (c001*(1-ux)+c101*ux)*(1-uy) + (c011*(1-ux)+c111*ux)*uy;
    v += a * (x0*(1-uz) + x1*uz);
    cx *= 2.7; cy *= 2.7; cz *= 2.7; a *= 0.45;
  }
  return v;
}

export function curlNoise3D_JS(
  x: number, y: number, z: number,
): [number, number, number] {
  const e = 0.08 * WORLD_SCALE;
  const ny0 = fbm3(x,   y+e, z);   const ny1 = fbm3(x,   y-e, z);
  const nz0 = fbm3(x,   y,   z+e); const nz1 = fbm3(x,   y,   z-e);
  const nx0 = fbm3(x+e, y,   z);   const nx1 = fbm3(x-e, y,   z);
  const inv2e = 1 / (2 * e);
  return [
    (ny0-ny1 - (nz0-nz1)) * inv2e,
    (nz0-nz1 - (nx0-nx1)) * inv2e,
    (nx0-nx1 - (ny0-ny1)) * inv2e,
  ];
}

export function fastTurbulence(x: number, y: number, z: number, offset: number, scale: number): [number, number, number] {
  const sx = x * scale; const sy = y * scale; const sz = z * scale;
  const s1 = Math.sin(sy + offset) * Math.cos(sz);
  const s2 = Math.sin(sz + offset) * Math.cos(sx);
  const s3 = Math.sin(sx + offset) * Math.cos(sy);
  return [s1, s2, s3];
}

export interface PSet {
  pos: Float32Array;
  color: Float32Array;
  isCore: Float32Array;
  isLoop: Float32Array;
  densityLevel: Float32Array;
  warpParams: Float32Array; // [offset, scale, thickness]
}

export function makePSet(n: number): PSet {
  return {
    pos: new Float32Array(n * 3),
    color: new Float32Array(n * 3),
    isCore: new Float32Array(n),
    isLoop: new Float32Array(n),
    densityLevel: new Float32Array(n),
    warpParams: new Float32Array(n * 3),
  };
}

export function slicePSet(s: PSet, count: number): PSet {
  return {
    pos: s.pos.slice(0, count * 3),
    color: s.color.slice(0, count * 3),
    isCore: s.isCore.slice(0, count),
    isLoop: s.isLoop.slice(0, count),
    densityLevel: s.densityLevel.slice(0, count),
    warpParams: s.warpParams.slice(0, count * 3),
  };
}

export function mergePSets(sets: PSet[]): PSet {
  const total = sets.reduce((a, s) => a + s.isCore.length, 0);
  const out = makePSet(total);
  let off1 = 0; let off3 = 0;
  for (const s of sets) {
    const n = s.isCore.length;
    out.pos.set(s.pos, off3);
    out.color.set(s.color, off3);
    out.isCore.set(s.isCore, off1);
    out.isLoop.set(s.isLoop, off1);
    out.densityLevel.set(s.densityLevel, off1);
    out.warpParams.set(s.warpParams, off3);
    off3 += n * 3; off1 += n;
  }
  return out;
}
