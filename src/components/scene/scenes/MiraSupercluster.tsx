'use client';

/**
 * MiraSupercluster — Phase B: cosmic-web physics.
 *
 * ~280k particles forming a real-supercluster-shaped distribution:
 *   • NFW-profile cluster nodes (anisotropic ellipsoids, denser core)
 *   • Bezier filaments with 3D FBM turbulence + endpoint density bias
 *   • Tributary branches (2-3 per primary filament) perpendicular to spine
 *   • Wall/sheet particles (Zel'dovich pancakes between adjacent filaments)
 *   • Void carving — 7 explicit void centres suppress particle density
 *   • Background dust — sparse, void-suppressed
 *
 * Rendering:
 *   • Single <points> ShaderMaterial, additive blend
 *   • 3-stop chromatic filament palette: navy → cyan → magenta (per-particle
 *     jitter selects position in the ramp)
 *   • Cluster core HDR boost only on the densest 15% of cluster particles
 *   • Brightness discipline — base intensities tuned so additive accumulation
 *     in dense regions doesn't blow out before bloom catches it
 *
 * Spec: AC1, AC2.
 * Reference: .coo/jobs/004/refs/quality-bar-storyboard.png Panel 1.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  KNOT_TABLE,
  detectQualityProfile,
  useMiraState,
  type MiraLang,
} from '@/lib/mira-state';

const LANG_INDEX: Record<MiraLang, number> = { EN: 0, HI: 1, TA: 2, KN: 3, TE: 4 };
const WORLD_SCALE = 2.6;

type Quality = 'high' | 'low';
interface Budget {
  cluster: number;
  filament: number;
  tributary: number;
  wall: number;
  background: number;
}
function getBudget(q: Quality): Budget {
  // Cache means we only pay for generation once. Density bumped to read
  // as the burning-cosmic-web reference. Targets ≥ 50 FPS on M1 with
  // global Bloom at 1.75 DPR.
  return q === 'high'
    ? { cluster: 100_000, filament: 280_000, tributary: 75_000, wall: 28_000, background: 10_000 }
    : { cluster:  24_000, filament:  72_000, tributary: 20_000, wall:  8_000, background:  3_000 };
}

// ─── PRNG + utility math ────────────────────────────────────────────────

type Rng = () => number;
function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: Rng): number {
  let u = 0; let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function hash3(x: number, y: number, z: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function fbm3(x: number, y: number, z: number): number {
  let v = 0; let a = 0.5;
  for (let i = 0; i < 3; i++) {
    const xi = Math.floor(x); const yi = Math.floor(y); const zi = Math.floor(z);
    const xf = x - xi; const yf = y - yi; const zf = z - zi;
    const c000 = hash3(xi,   yi,   zi);
    const c100 = hash3(xi+1, yi,   zi);
    const c010 = hash3(xi,   yi+1, zi);
    const c110 = hash3(xi+1, yi+1, zi);
    const c001 = hash3(xi,   yi,   zi+1);
    const c101 = hash3(xi+1, yi,   zi+1);
    const c011 = hash3(xi,   yi+1, zi+1);
    const c111 = hash3(xi+1, yi+1, zi+1);
    const ux = xf * xf * (3 - 2 * xf);
    const uy = yf * yf * (3 - 2 * yf);
    const uz = zf * zf * (3 - 2 * zf);
    const x0 = (c000 * (1 - ux) + c100 * ux) * (1 - uy)
             + (c010 * (1 - ux) + c110 * ux) * uy;
    const x1 = (c001 * (1 - ux) + c101 * ux) * (1 - uy)
             + (c011 * (1 - ux) + c111 * ux) * uy;
    v += a * (x0 * (1 - uz) + x1 * uz);
    x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5;
  }
  return v;
}

// ─── Void anchors — bubbles between knots (rejection-sampled) ───────────

const VOID_RAW: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.40,  1.20,  0.20, 0.85],
  [ 1.00,  0.90, -0.80, 0.75],
  [-2.00, -0.20,  0.80, 0.70],
  [ 0.20, -1.40,  0.00, 0.80],
  [-0.80,  0.30, -1.50, 0.75],
  [ 2.20, -0.50,  0.90, 0.70],
  [ 0.80,  0.10,  1.30, 0.65],
];
const VOIDS = VOID_RAW.map(([x, y, z, r]) => [
  x * WORLD_SCALE, y * WORLD_SCALE, z * WORLD_SCALE, r * WORLD_SCALE,
] as const);

function voidSuppression(x: number, y: number, z: number): number {
  let s = 1.0;
  for (const [vx, vy, vz, vr] of VOIDS) {
    const dx = x - vx; const dy = y - vy; const dz = z - vz;
    const d2 = dx * dx + dy * dy + dz * dz;
    const r2 = vr * vr;
    if (d2 < r2) {
      const u = 1 - d2 / r2;
      s *= 1 - 0.95 * u * u;
    }
  }
  return s;
}

// ─── Knot positions in world space (KNOT_TABLE × WORLD_SCALE) ───────────

interface KnotW {
  lang: MiraLang;
  pos: readonly [number, number, number];
  scale: number;
}
const KNOTS_W: ReadonlyArray<KnotW> = KNOT_TABLE.map((k) => ({
  lang: k.lang,
  pos: [k.position[0] * WORLD_SCALE, k.position[1] * WORLD_SCALE, k.position[2] * WORLD_SCALE] as const,
  scale: k.relativeScale,
}));

// ─── Generators ─────────────────────────────────────────────────────────

interface PSet { pos: Float32Array; type: Float32Array; jitter: Float32Array }

/**
 * Build five galaxies — each knot becomes a real spiral galaxy with:
 *   • Bulge — dense central Gaussian (20% of galaxy's particles)
 *   • Disk — log-spiral arms (65%) — 2 arms, tight pitch, in-plane scatter
 *   • Halo — diffuse outer envelope (15%)
 *
 * Each galaxy gets its own random inclination + yaw rotation matrix so the
 * five read as 3D objects in space (some face-on, some edge-on-ish) instead
 * of all coplanar.
 */
function buildClusters(rng: Rng, count: number): PSet {
  const pos = new Float32Array(count * 3);
  const type = new Float32Array(count);
  const jitter = new Float32Array(count);
  const total = KNOTS_W.reduce((a, k) => a + k.scale, 0);
  let cursor = 0;

  for (let ki = 0; ki < KNOTS_W.length; ki++) {
    const k = KNOTS_W[ki];
    const slice = ki === KNOTS_W.length - 1
      ? count - cursor : Math.floor((k.scale / total) * count);

    // Galaxy size scales with relativeScale; max disk radius in world units.
    const galaxyR = (0.42 + k.scale * 0.22) * WORLD_SCALE;
    const bulgeR  = galaxyR * 0.20;
    const haloR   = galaxyR * 1.30;

    // Random galactic orientation — inclination 15–70° from face-on.
    const inc = (0.18 + rng() * 0.55) * Math.PI * 0.5;
    const yaw = rng() * Math.PI * 2;
    const roll = (rng() - 0.5) * 0.4;
    const ci = Math.cos(inc); const si = Math.sin(inc);
    const cy = Math.cos(yaw); const sy = Math.sin(yaw);
    const cr = Math.cos(roll); const sr = Math.sin(roll);

    // Apply rotation: yaw around Y, then inclination around X, then roll
    // around Z. Returns a function so we can reuse it cheaply per-particle.
    const rotate = (lx: number, ly: number, lz: number): [number, number, number] => {
      // Roll (Z)
      const rx = lx * cr - ly * sr;
      const ry = lx * sr + ly * cr;
      const rz = lz;
      // Inclination (X)
      const ix = rx;
      const iy = ry * ci - rz * si;
      const iz = ry * si + rz * ci;
      // Yaw (Y)
      const fx = ix * cy + iz * sy;
      const fy = iy;
      const fz = -ix * sy + iz * cy;
      return [fx, fy, fz];
    };

    // Spiral parameters — 2 logarithmic arms, tight pitch.
    const armCount = 2;
    const a = 0.06 * galaxyR;
    const b = 0.42;       // tightness (larger = looser)

    const bulgeCount = Math.floor(slice * 0.20);
    const diskCount  = Math.floor(slice * 0.65);
    const haloCount  = slice - bulgeCount - diskCount;

    // — Bulge: dense Gaussian, thin in z.
    for (let i = 0; i < bulgeCount; i++) {
      const lx = gauss(rng) * bulgeR * 0.80;
      const ly = gauss(rng) * bulgeR * 0.78;
      const lz = gauss(rng) * bulgeR * 0.55;
      const r01 = Math.min(1, Math.hypot(lx, ly, lz) / galaxyR);
      const [wx, wy, wz] = rotate(lx, ly, lz);
      const idx = (cursor + i) * 3;
      pos[idx + 0] = k.pos[0] + wx;
      pos[idx + 1] = k.pos[1] + wy;
      pos[idx + 2] = k.pos[2] + wz;
      type[cursor + i] = LANG_INDEX[k.lang] + 1;
      // Low r01 = core = bright; encoded for shader's "coreness".
      jitter[cursor + i] = r01 * 0.4;
    }
    cursor += bulgeCount;

    // — Disk: 2 logarithmic spiral arms with perpendicular scatter.
    for (let i = 0; i < diskCount; i++) {
      const arm = i % armCount;
      const rNorm = Math.pow(rng(), 0.55);             // bias inward
      const r = a + rNorm * (galaxyR - a);
      const baseTheta = Math.log(r / a) / b;
      const thetaJitter = gauss(rng) * 0.15;
      const theta = baseTheta + (2 * Math.PI * arm) / armCount + thetaJitter;
      // Perpendicular Gaussian scatter, wider at outer disk.
      const scatter = (0.04 + rNorm * 0.10) * galaxyR;
      const xL = r * Math.cos(theta) + gauss(rng) * scatter;
      const yL = r * Math.sin(theta) + gauss(rng) * scatter;
      const zL = gauss(rng) * 0.025 * galaxyR;          // very thin disk
      const [wx, wy, wz] = rotate(xL, yL, zL);
      const idx = (cursor + i) * 3;
      pos[idx + 0] = k.pos[0] + wx;
      pos[idx + 1] = k.pos[1] + wy;
      pos[idx + 2] = k.pos[2] + wz;
      type[cursor + i] = LANG_INDEX[k.lang] + 1;
      // Disk particles read as "mid-coreness" — bright at small r, dim outer.
      jitter[cursor + i] = 0.30 + (1 - rNorm) * 0.55;
    }
    cursor += diskCount;

    // — Halo: diffuse outer Gaussian envelope.
    for (let i = 0; i < haloCount; i++) {
      const lx = gauss(rng) * haloR;
      const ly = gauss(rng) * haloR * 0.75;
      const lz = gauss(rng) * haloR * 0.95;
      const [wx, wy, wz] = rotate(lx, ly, lz);
      const idx = (cursor + i) * 3;
      pos[idx + 0] = k.pos[0] + wx;
      pos[idx + 1] = k.pos[1] + wy;
      pos[idx + 2] = k.pos[2] + wz;
      type[cursor + i] = LANG_INDEX[k.lang] + 1;
      // Halo particles read as dimmest = highest jitter.
      jitter[cursor + i] = 0.85 + rng() * 0.15;
    }
    cursor += haloCount;
  }
  return { pos, type, jitter };
}

interface FSpec { a: number; b: number; ctrl: readonly [number, number, number] }
function makeFilamentSpecs(rng: Rng): FSpec[] {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < KNOTS_W.length; i++) {
    for (let j = i + 1; j < KNOTS_W.length; j++) pairs.push([i, j]);
  }
  // Sparse real connectivity: pick 7 of 10 pairs.
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.slice(0, 7).map(([a, b]) => {
    const A = KNOTS_W[a].pos; const B = KNOTS_W[b].pos;
    return {
      a, b,
      ctrl: [
        (A[0] + B[0]) / 2 + gauss(rng) * 1.3 * WORLD_SCALE * 0.5,
        (A[1] + B[1]) / 2 + gauss(rng) * 1.3 * WORLD_SCALE * 0.5,
        (A[2] + B[2]) / 2 + gauss(rng) * 1.3 * WORLD_SCALE * 0.5,
      ] as const,
    };
  });
}

function bezier(A: readonly number[], C: readonly number[], B: readonly number[], t: number): [number, number, number] {
  const omt = 1 - t;
  return [
    omt * omt * A[0] + 2 * omt * t * C[0] + t * t * B[0],
    omt * omt * A[1] + 2 * omt * t * C[1] + t * t * B[1],
    omt * omt * A[2] + 2 * omt * t * C[2] + t * t * B[2],
  ];
}

function buildFilaments(rng: Rng, count: number, specs: FSpec[]): PSet {
  const pos = new Float32Array(count * 3);
  const type = new Float32Array(count);
  const jitter = new Float32Array(count);
  const per = Math.floor(count / specs.length);
  let cursor = 0;
  for (let si = 0; si < specs.length; si++) {
    const sp = specs[si];
    const A = KNOTS_W[sp.a].pos; const B = KNOTS_W[sp.b].pos;
    const slice = si === specs.length - 1 ? count - cursor : per;
    let placed = 0; let attempts = 0;
    while (placed < slice && attempts < slice * 4) {
      attempts++;
      const u = rng();
      const t = u < 0.5
        ? 0.5 - Math.sqrt(Math.max(0, 0.25 - u * 0.5))
        : 0.5 + Math.sqrt(Math.max(0, u * 0.5 - 0.25));
      const bz = bezier(A, sp.ctrl, B, t);
      const turb = 0.28 * Math.sin(t * Math.PI) * WORLD_SCALE;
      const tx = (fbm3(bz[0] * 0.9 + 11, bz[1] * 0.9, bz[2] * 0.9) - 0.5) * turb;
      const ty = (fbm3(bz[0] * 0.9, bz[1] * 0.9 + 13, bz[2] * 0.9) - 0.5) * turb;
      const tz = (fbm3(bz[0] * 0.9, bz[1] * 0.9, bz[2] * 0.9 + 17) - 0.5) * turb;
      const thickGate = Math.sin(t * Math.PI);
      const thick = (0.04 + thickGate * 0.10) * WORLD_SCALE;
      const px = bz[0] + tx + gauss(rng) * thick;
      const py = bz[1] + ty + gauss(rng) * thick;
      const pz = bz[2] + tz + gauss(rng) * thick;
      if (rng() > voidSuppression(px, py, pz)) continue;
      const idx = (cursor + placed) * 3;
      pos[idx + 0] = px; pos[idx + 1] = py; pos[idx + 2] = pz;
      type[cursor + placed] = 0;     // filament
      jitter[cursor + placed] = rng();
      placed++;
    }
    cursor += placed;
  }
  return {
    pos: pos.slice(0, cursor * 3),
    type: type.slice(0, cursor),
    jitter: jitter.slice(0, cursor),
  };
}

function buildTributaries(rng: Rng, count: number, specs: FSpec[]): PSet {
  const pos = new Float32Array(count * 3);
  const type = new Float32Array(count);
  const jitter = new Float32Array(count);
  const tribs = specs.length * 3;          // 3 per primary
  const per = Math.floor(count / tribs);
  let cursor = 0;
  for (let si = 0; si < specs.length; si++) {
    const sp = specs[si];
    const A = KNOTS_W[sp.a].pos; const B = KNOTS_W[sp.b].pos;
    for (let n = 0; n < 3; n++) {
      const tStart = 0.25 + rng() * 0.50;
      const root = bezier(A, sp.ctrl, B, tStart);
      const dir: [number, number, number] = [gauss(rng), gauss(rng), gauss(rng)];
      const dlen = Math.hypot(dir[0], dir[1], dir[2]) + 1e-5;
      dir[0] /= dlen; dir[1] /= dlen; dir[2] /= dlen;
      const len = (0.35 + rng() * 0.35) * WORLD_SCALE;
      const slice = (si === specs.length - 1 && n === 2) ? count - cursor : per;
      let placed = 0; let attempts = 0;
      while (placed < slice && attempts < slice * 3) {
        attempts++;
        const u = Math.pow(rng(), 0.7);
        const px = root[0] + dir[0] * len * u + gauss(rng) * 0.025 * WORLD_SCALE;
        const py = root[1] + dir[1] * len * u + gauss(rng) * 0.025 * WORLD_SCALE;
        const pz = root[2] + dir[2] * len * u + gauss(rng) * 0.025 * WORLD_SCALE;
        if (rng() > voidSuppression(px, py, pz)) continue;
        const idx = (cursor + placed) * 3;
        pos[idx + 0] = px; pos[idx + 1] = py; pos[idx + 2] = pz;
        type[cursor + placed] = 0;
        jitter[cursor + placed] = rng() * 0.4;       // dimmer than primary
        placed++;
      }
      cursor += placed;
    }
  }
  return {
    pos: pos.slice(0, cursor * 3),
    type: type.slice(0, cursor),
    jitter: jitter.slice(0, cursor),
  };
}

function buildWalls(rng: Rng, count: number, specs: FSpec[]): PSet {
  const pos = new Float32Array(count * 3);
  const type = new Float32Array(count);
  const jitter = new Float32Array(count);
  // Zel'dovich pancakes: pick adjacent filament pairs and place particles
  // in the 2D sheet spanned by them. Sparse, dim, give atmospheric depth.
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < specs.length; i++) {
    for (let j = i + 1; j < specs.length; j++) pairs.push([i, j]);
  }
  const per = Math.floor(count / Math.max(1, pairs.length));
  let cursor = 0;
  for (const [i, j] of pairs) {
    const s1 = specs[i]; const s2 = specs[j];
    const A1 = KNOTS_W[s1.a].pos; const B1 = KNOTS_W[s1.b].pos;
    const A2 = KNOTS_W[s2.a].pos; const B2 = KNOTS_W[s2.b].pos;
    let placed = 0; let attempts = 0;
    while (placed < per && attempts < per * 5) {
      attempts++;
      const t1 = rng(); const t2 = rng();
      const p1 = bezier(A1, s1.ctrl, B1, t1);
      const p2 = bezier(A2, s2.ctrl, B2, t2);
      const s = rng();
      const px = p1[0] * (1 - s) + p2[0] * s + gauss(rng) * 0.10 * WORLD_SCALE;
      const py = p1[1] * (1 - s) + p2[1] * s + gauss(rng) * 0.10 * WORLD_SCALE;
      const pz = p1[2] * (1 - s) + p2[2] * s + gauss(rng) * 0.10 * WORLD_SCALE;
      // Strong void suppression — walls thin out in voids.
      if (rng() > voidSuppression(px, py, pz) * 0.45) continue;
      const idx = (cursor + placed) * 3;
      pos[idx + 0] = px; pos[idx + 1] = py; pos[idx + 2] = pz;
      type[cursor + placed] = 6;                // wall marker
      jitter[cursor + placed] = rng() * 0.6;
      placed++;
    }
    cursor += placed;
    if (cursor >= count) break;
  }
  return {
    pos: pos.slice(0, cursor * 3),
    type: type.slice(0, cursor),
    jitter: jitter.slice(0, cursor),
  };
}

function buildBackground(rng: Rng, count: number): PSet {
  const pos = new Float32Array(count * 3);
  const type = new Float32Array(count);
  const jitter = new Float32Array(count);
  const ext = 4.0 * WORLD_SCALE;
  let placed = 0; let attempts = 0;
  while (placed < count && attempts < count * 5) {
    attempts++;
    const px = (rng() - 0.5) * ext * 2;
    const py = (rng() - 0.5) * ext * 1.4;
    const pz = (rng() - 0.5) * ext * 2;
    const fb = fbm3(px * 0.25, py * 0.25, pz * 0.25);
    const accept = voidSuppression(px, py, pz) * (0.25 + fb * 0.40);
    if (rng() > accept) continue;
    const idx = placed * 3;
    pos[idx + 0] = px; pos[idx + 1] = py; pos[idx + 2] = pz;
    type[placed] = 7;                          // background dust
    jitter[placed] = rng();
    placed++;
  }
  return {
    pos: pos.slice(0, placed * 3),
    type: type.slice(0, placed),
    jitter: jitter.slice(0, placed),
  };
}

// ─── Shaders ────────────────────────────────────────────────────────────

// All color + intensity computed in VERTEX shader (per-particle, ~Nk times
// per frame). Fragment shader does the bare minimum: one radial alpha
// fall-off and one multiplication. This collapses pixel cost — the heavy
// work is now O(particles) not O(pixels). Bloom carries the actual glow.

const vert = /* glsl */ `
  attribute float aType;
  attribute float aJitter;

  uniform float uPixelRatio;
  uniform float uReveal;
  uniform vec3  uClusterCore;
  uniform vec3  uClusterMantle;
  uniform vec3  uFilCool;
  uniform vec3  uFilMid;
  uniform vec3  uFilWarm;
  uniform vec3  uWall;
  uniform vec3  uBackground;

  varying vec3  vColor;
  varying float vIntensity;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;

    // ── Per-particle color + intensity (vertex stage = O(N), cheap) ──
    float size;
    vec3 col;
    float intensity;

    if (aType >= 0.5 && aType <= 5.5) {
      // Cluster — jitter (0=core, 1=halo) encoded as NFW radius at gen time.
      float coreness = 1.0 - aJitter;
      col = mix(uClusterMantle, uClusterCore, smoothstep(0.55, 0.96, coreness));
      // Top 8% cores bloom; everything else dim so 100k particles don't
      // accumulate to a white wash.
      float hdr = 1.0 + smoothstep(0.92, 1.0, coreness) * 1.4;
      intensity = (0.20 + coreness * 0.35) * hdr;
      size = 1.10 + coreness * 0.70;
    } else if (aType > 5.5 && aType < 6.5) {
      col = uWall;
      intensity = 0.09 + aJitter * 0.06;
      size = 1.00;
    } else if (aType > 6.5) {
      col = uBackground;
      intensity = 0.04 + aJitter * 0.04;
      size = 0.80 + aJitter * 0.25;
    } else {
      // Filament — 4-stop chromatic ramp: navy → cyan → magenta → warm.
      vec3 c1 = mix(uFilCool, uFilMid, smoothstep(0.05, 0.45, aJitter));
      vec3 c2 = mix(c1, uFilWarm, smoothstep(0.45, 0.78, aJitter));
      col = mix(c2, uClusterMantle, smoothstep(0.78, 1.0, aJitter) * 0.85);
      intensity = 0.14 + aJitter * 0.18;
      size = 1.15;
    }

    vColor = col * intensity;
    vIntensity = intensity;

    // Depth attenuation with a wider clamp so cluster cores can grow to
    // 7-8 px (HDR halos register visibly through bloom).
    gl_PointSize = size * uPixelRatio * (32.0 / max(0.5, depth));
    gl_PointSize = clamp(gl_PointSize * uReveal, 0.6, 7.5);
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform float uReveal;

  varying vec3  vColor;
  varying float vIntensity;

  void main() {
    // Mid radial fall-off (pow 2.0) — soft enough to overlap into the
    // burning-web mesh, sharp enough that individual particles read.
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    float fall = pow(1.0 - d, 2.0);
    float alpha = fall * (0.40 + vIntensity * 0.35) * uReveal;
    gl_FragColor = vec4(vColor * (0.50 + fall * 1.05) * uReveal, alpha);
  }
`;

// ─── Module-level particle generation cache ─────────────────────────────
//
// CRITICAL: generation runs ONCE per quality profile per page load. Stored
// at module scope so re-mounting the component (scroll-out + back) is
// instant. No `reveal` in any dep array — reveal updates ride uniforms only.

interface GeneratedBuffers {
  positions: Float32Array;
  types: Float32Array;
  jitters: Float32Array;
  count: number;
}

const CACHE = new Map<Quality, GeneratedBuffers>();

function generate(quality: Quality): GeneratedBuffers {
  const hit = CACHE.get(quality);
  if (hit) return hit;
  const budget = getBudget(quality);
  const rng = mulberry32(0xC05A1234);
  const specs = makeFilamentSpecs(rng);
  const cluster = buildClusters(rng, budget.cluster);
  const filament = buildFilaments(rng, budget.filament, specs);
  const tributary = buildTributaries(rng, budget.tributary, specs);
  const wall = buildWalls(rng, budget.wall, specs);
  const bg = buildBackground(rng, budget.background);

  const sets = [cluster, filament, tributary, wall, bg];
  const total = sets.reduce((a, s) => a + s.type.length, 0);
  const positions = new Float32Array(total * 3);
  const typesArr = new Float32Array(total);
  const jitters = new Float32Array(total);
  let off1 = 0; let off3 = 0;
  for (const s of sets) {
    positions.set(s.pos, off3);
    typesArr.set(s.type, off1);
    jitters.set(s.jitter, off1);
    off3 += s.pos.length;
    off1 += s.type.length;
  }
  const out: GeneratedBuffers = { positions, types: typesArr, jitters, count: total };
  CACHE.set(quality, out);
  return out;
}

// Off-main-thread mounting helper. requestIdleCallback fallback for Safari.
type IdleHandle = number;
function scheduleIdle(cb: () => void): IdleHandle {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(cb, { timeout: 600 });
  }
  return window.setTimeout(cb, 0);
}
function cancelIdle(handle: IdleHandle): void {
  const w = window as unknown as { cancelIdleCallback?: (h: number) => void };
  if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(handle);
  else window.clearTimeout(handle);
}

// ─── Component ──────────────────────────────────────────────────────────

export interface MiraSuperclusterProps {
  reveal: number;
}

interface ReadyState {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

export default function MiraSupercluster({ reveal }: MiraSuperclusterProps): React.ReactElement | null {
  const pointsRef = useRef<THREE.Points>(null);
  // Sentinel so the first frame always pushes the real reveal value into
  // the uniform — bug if this starts at `reveal` because the early-return
  // skips the first uniform write and the particles render at uReveal=0
  // (invisible).
  const revealRef = useRef<number>(-1);
  const activeLang = useMiraState((s) => s.activeLang);
  const density = useMiraState((s) => s.density);

  // Detect quality once.
  const quality = useMemo<Quality>(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({
      width: window.innerWidth, search: window.location.search,
    });
  }, []);

  const pixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 1.75);    // capped 1.75 for fill-rate
  }, []);

  // Lazy mount: if the cache already has buffers, use them on first render.
  // Otherwise schedule generation in idle time so we don't block scroll.
  const [ready, setReady] = useState<ReadyState | null>(() => {
    if (typeof window === 'undefined') return null;
    const buf = CACHE.get(quality);
    if (!buf) return null;
    return buildReadyState(buf, pixelRatio);
  });

  useEffect(() => {
    if (ready) return;
    const handle = scheduleIdle(() => {
      const buf = generate(quality);
      const r = buildReadyState(buf, pixelRatio);
      setReady(r);
    });
    return () => cancelIdle(handle);
  }, [ready, quality, pixelRatio]);

  // Dispose on unmount of THIS instance (geometry/material are per-instance,
  // not cached — only the raw Float32Array buffers are cached).
  useEffect(() => {
    if (!ready) return;
    return () => {
      ready.geometry.dispose();
      ready.material.dispose();
    };
  }, [ready]);

  // The ONLY per-frame work — single uniform write. Skip if unchanged.
  useFrame(() => {
    if (!ready) return;
    if (revealRef.current === reveal) return;
    revealRef.current = reveal;
    ready.material.uniforms.uReveal.value = reveal;
  });

  if (!ready || reveal < 0.18) return null;
  return (
    <group>
      <points
        ref={pointsRef}
        geometry={ready.geometry}
        material={ready.material}
        frustumCulled={false}
      />
      <CoreBillboards reveal={reveal} activeLang={activeLang} density={density} />
    </group>
  );
}

// ─── Core billboards — 5 bright HDR sprites at each knot ────────────────
// Adds the "blazing star" punch the reference shows. Five cheap quads,
// view-aligned via the vertex shader, with strong HDR center so global
// Bloom catches them as luminous halos.

const coreVert = /* glsl */ `
  attribute float aIndex;
  uniform float uScale;
  uniform vec3  uPos0;
  uniform vec3  uPos1;
  uniform vec3  uPos2;
  uniform vec3  uPos3;
  uniform vec3  uPos4;
  uniform float uSize0;
  uniform float uSize1;
  uniform float uSize2;
  uniform float uSize3;
  uniform float uSize4;
  uniform vec3  uHue0;
  uniform vec3  uHue1;
  uniform vec3  uHue2;
  uniform vec3  uHue3;
  uniform vec3  uHue4;
  uniform float uActive;

  varying vec2 vUv;
  varying vec3 vHue;
  varying float vIsActive;

  void main() {
    vec3 origin;
    float s;
    if (aIndex < 0.5)      { origin = uPos0; s = uSize0; vHue = uHue0; }
    else if (aIndex < 1.5) { origin = uPos1; s = uSize1; vHue = uHue1; }
    else if (aIndex < 2.5) { origin = uPos2; s = uSize2; vHue = uHue2; }
    else if (aIndex < 3.5) { origin = uPos3; s = uSize3; vHue = uHue3; }
    else                   { origin = uPos4; s = uSize4; vHue = uHue4; }

    vIsActive = abs(aIndex - uActive) < 0.5 ? 1.0 : 0.0;
    vUv = uv;

    // View-aligned quad — extract camera right + up from the view matrix.
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world = origin
               + right * position.x * s
               + up    * position.y * s;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const coreFrag = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  varying vec2 vUv;
  varying vec3 vHue;
  varying float vIsActive;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float r = length(p) * 2.0;
    if (r > 1.0) discard;

    // Three-stop falloff — pinpoint white-hot centre + bright inner halo +
    // soft outer glow. Restrained HDR so bloom catches centres without
    // washing everything around them.
    float core  = pow(1.0 - r, 8.0);
    float inner = pow(1.0 - r, 2.5);
    float halo  = pow(1.0 - r, 1.2);
    vec3 col = mix(vHue, vec3(1.7, 1.55, 1.20), core);
    float boost = mix(1.0, 1.55, vIsActive);
    float intensity = (core * 3.5 + inner * 0.85 + halo * 0.25) * boost * uReveal;
    float alpha = (inner * 0.35 + halo * 0.18) * (0.65 + vIsActive * 0.35) * uReveal;
    gl_FragColor = vec4(col * intensity, alpha);
  }
`;

interface CoreBillboardsProps {
  reveal: number;
  activeLang: MiraLang;
  density: Record<MiraLang, number>;
}

function CoreBillboards({ reveal, activeLang, density }: CoreBillboardsProps): React.ReactElement {
  const { geometry, material } = useMemo(() => {
    // 5 quads as a single buffer geometry. Each quad has 4 verts + 2 tris.
    const QUAD = 5;
    const positions = new Float32Array(QUAD * 4 * 3);
    const uvs = new Float32Array(QUAD * 4 * 2);
    const indices = new Uint16Array(QUAD * 6);
    const idxAttr = new Float32Array(QUAD * 4);
    for (let q = 0; q < QUAD; q++) {
      const v = q * 4;
      // Local quad vertices [-0.5..0.5] in x/y
      positions[v * 3 + 0] = -0.5; positions[v * 3 + 1] = -0.5; positions[v * 3 + 2] = 0;
      positions[(v + 1) * 3 + 0] =  0.5; positions[(v + 1) * 3 + 1] = -0.5; positions[(v + 1) * 3 + 2] = 0;
      positions[(v + 2) * 3 + 0] =  0.5; positions[(v + 2) * 3 + 1] =  0.5; positions[(v + 2) * 3 + 2] = 0;
      positions[(v + 3) * 3 + 0] = -0.5; positions[(v + 3) * 3 + 1] =  0.5; positions[(v + 3) * 3 + 2] = 0;
      uvs[v * 2 + 0] = 0; uvs[v * 2 + 1] = 0;
      uvs[(v + 1) * 2 + 0] = 1; uvs[(v + 1) * 2 + 1] = 0;
      uvs[(v + 2) * 2 + 0] = 1; uvs[(v + 2) * 2 + 1] = 1;
      uvs[(v + 3) * 2 + 0] = 0; uvs[(v + 3) * 2 + 1] = 1;
      idxAttr[v] = q; idxAttr[v + 1] = q; idxAttr[v + 2] = q; idxAttr[v + 3] = q;
      const tri = q * 6;
      indices[tri]     = v;     indices[tri + 1] = v + 1; indices[tri + 2] = v + 2;
      indices[tri + 3] = v;     indices[tri + 4] = v + 2; indices[tri + 5] = v + 3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    g.setAttribute('aIndex',   new THREE.BufferAttribute(idxAttr, 1));
    g.setIndex(new THREE.BufferAttribute(indices, 1));

    const hueColors = KNOTS_W.map((k) => new THREE.Color(KNOT_TABLE.find((kt) => kt.lang === k.lang)!.hue));
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uReveal: { value: reveal },
        uScale:  { value: 1 },
        uActive: { value: 0 },
        uPos0: { value: new THREE.Vector3(...KNOTS_W[0].pos) },
        uPos1: { value: new THREE.Vector3(...KNOTS_W[1].pos) },
        uPos2: { value: new THREE.Vector3(...KNOTS_W[2].pos) },
        uPos3: { value: new THREE.Vector3(...KNOTS_W[3].pos) },
        uPos4: { value: new THREE.Vector3(...KNOTS_W[4].pos) },
        uSize0: { value: 1.05 * KNOTS_W[0].scale },
        uSize1: { value: 1.05 * KNOTS_W[1].scale },
        uSize2: { value: 1.05 * KNOTS_W[2].scale },
        uSize3: { value: 1.05 * KNOTS_W[3].scale },
        uSize4: { value: 1.05 * KNOTS_W[4].scale },
        uHue0: { value: hueColors[0] },
        uHue1: { value: hueColors[1] },
        uHue2: { value: hueColors[2] },
        uHue3: { value: hueColors[3] },
        uHue4: { value: hueColors[4] },
      },
      vertexShader: coreVert,
      fragmentShader: coreFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [reveal]);

  useFrame(() => {
    material.uniforms.uActive.value = LANG_INDEX[activeLang];
    material.uniforms.uReveal.value = reveal;
    // Halo size grows slightly with density (accretion visible).
    material.uniforms.uSize0.value = 1.05 * KNOTS_W[0].scale * (0.92 + density[KNOTS_W[0].lang] * 0.55);
    material.uniforms.uSize1.value = 1.05 * KNOTS_W[1].scale * (0.92 + density[KNOTS_W[1].lang] * 0.55);
    material.uniforms.uSize2.value = 1.05 * KNOTS_W[2].scale * (0.92 + density[KNOTS_W[2].lang] * 0.55);
    material.uniforms.uSize3.value = 1.05 * KNOTS_W[3].scale * (0.92 + density[KNOTS_W[3].lang] * 0.55);
    material.uniforms.uSize4.value = 1.05 * KNOTS_W[4].scale * (0.92 + density[KNOTS_W[4].lang] * 0.55);
  });

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

function buildReadyState(buf: GeneratedBuffers, pixelRatio: number): ReadyState {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(buf.positions, 3));
  g.setAttribute('aType',    new THREE.BufferAttribute(buf.types, 1));
  g.setAttribute('aJitter',  new THREE.BufferAttribute(buf.jitters, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6 * WORLD_SCALE);

  const m = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio:    { value: pixelRatio },
      uReveal:        { value: 0 },
      uClusterCore:   { value: new THREE.Color('#FFF7E0') },
      uClusterMantle: { value: new THREE.Color('#FFA86A') },
      uFilCool:       { value: new THREE.Color('#1A2F6E') },
      uFilMid:        { value: new THREE.Color('#5C9DFF') },
      uFilWarm:       { value: new THREE.Color('#A06CFF') },
      uWall:          { value: new THREE.Color('#3F5BAE') },
      uBackground:    { value: new THREE.Color('#4F6BB8') },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { geometry: g, material: m };
}
