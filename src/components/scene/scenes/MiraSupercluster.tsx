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
  // Generation is now cached at module scope (no per-frame regen, no
  // per-mount rebuild) so we can afford density. Per-particle pixel cost
  // is what matters at frame time; budgets sized for M1 + Bloom.
  return q === 'high'
    ? { cluster: 70_000, filament: 200_000, tributary: 60_000, wall: 22_000, background: 8_000 }
    : { cluster: 18_000, filament:  55_000, tributary: 16_000, wall:  6_000, background: 3_000 };
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
      col = mix(uClusterMantle, uClusterCore, smoothstep(0.78, 0.99, coreness));
      // Densest 6% get controlled HDR boost — sharp white cores, no blowout.
      float hdr = 1.0 + smoothstep(0.94, 1.0, coreness) * 0.9;
      intensity = (0.30 + coreness * 0.55) * hdr;
      // Smaller cluster particles — pinpricks, not blobs. Bloom does the glow.
      size = 0.95 + coreness * 0.55;
    } else if (aType > 5.5 && aType < 6.5) {
      col = uWall;
      intensity = 0.085 + aJitter * 0.060;
      size = 0.95;
    } else if (aType > 6.5) {
      col = uBackground;
      intensity = 0.045 + aJitter * 0.040;
      size = 0.75 + aJitter * 0.20;
    } else {
      // Filament — 3-stop chromatic ramp: navy → cyan → magenta.
      vec3 c1 = mix(uFilCool, uFilMid, smoothstep(0.12, 0.55, aJitter));
      col = mix(c1, uFilWarm, smoothstep(0.55, 0.92, aJitter) * 0.7);
      intensity = 0.14 + aJitter * 0.20;
      size = 1.00;
    }

    vColor = col * intensity;
    vIntensity = intensity;

    // Tight depth attenuation + small clamp range = sharp pinpricks.
    gl_PointSize = size * uPixelRatio * (24.0 / max(0.5, depth));
    gl_PointSize = clamp(gl_PointSize * uReveal, 0.55, 2.2);
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform float uReveal;

  varying vec3  vColor;
  varying float vIntensity;

  void main() {
    // Sharper radial fall-off (pow 2.6) → tight pinprick particles, not
    // soft blobs. Bloom on the HDR cores does the glow externally.
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    float fall = pow(1.0 - d, 2.6);
    float alpha = fall * (0.55 + vIntensity * 0.55) * uReveal;
    gl_FragColor = vec4(vColor * (0.65 + fall * 1.4) * uReveal, alpha);
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
  void useMiraState;
  const pointsRef = useRef<THREE.Points>(null);
  const revealRef = useRef(reveal);

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
    <points
      ref={pointsRef}
      geometry={ready.geometry}
      material={ready.material}
      frustumCulled={false}
    />
  );
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
