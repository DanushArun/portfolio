'use client';

/**
 * MiraSupercluster — Phase A skeleton.
 *
 * 60k particles forming 5 dense knot clusters + Bezier filaments between
 * them. Deterministic seeded PRNG so positions are stable across reloads.
 *
 * Phase A scope (no physics yet):
 *   • 10k cluster particles (2k per knot, isotropic Gaussian around each
 *     KNOT_TABLE position).
 *   • 50k filament particles (5k along each of 10 Bezier curves connecting
 *     every pair of knots).
 *   • Single <points> with BufferGeometry + ShaderMaterial.
 *   • Vertex shader passes position through; computes gl_PointSize with
 *     simple depth attenuation. Fragment shader does soft radial splat,
 *     additive blend.
 *   • Particle colour: warm white at cluster centres, cool blue along
 *     filaments. Per-particle `aType` attribute distinguishes (0 = filament,
 *     1..5 = cluster owned by that knot).
 *
 * No reveal envelope yet — full opacity. Phase B layers physics.
 *
 * Spec: .coo/jobs/004-mira-virgo-supercluster.md AC1, AC2.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  KNOT_TABLE,
  useMiraState,
  type MiraLang,
} from '@/lib/mira-state';

const LANG_INDEX: Record<MiraLang, number> = { EN: 0, HI: 1, TA: 2, KN: 3, TE: 4 };

const CLUSTER_PARTICLES_PER_KNOT = 2_000;
const FILAMENT_PARTICLES_PER_PAIR = 5_000;

// ─── PRNG ────────────────────────────────────────────────────────────────

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

// ─── Particle generation ─────────────────────────────────────────────────

interface ParticleBuffers {
  positions: Float32Array;
  types: Float32Array;     // 0 = filament, 1..5 = cluster owned by that lang index + 1
}

function buildParticles(rng: Rng): ParticleBuffers {
  const clusterCount = CLUSTER_PARTICLES_PER_KNOT * KNOT_TABLE.length;       // 10 000
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < KNOT_TABLE.length; i++) {
    for (let j = i + 1; j < KNOT_TABLE.length; j++) pairs.push([i, j]);
  }
  const filamentCount = FILAMENT_PARTICLES_PER_PAIR * pairs.length;          // 50 000
  const total = clusterCount + filamentCount;

  const positions = new Float32Array(total * 3);
  const types = new Float32Array(total);

  let cursor = 0;

  // Cluster particles — isotropic Gaussian around each knot.
  for (let ki = 0; ki < KNOT_TABLE.length; ki++) {
    const k = KNOT_TABLE[ki];
    const sigma = 0.18 + k.relativeScale * 0.08;
    for (let i = 0; i < CLUSTER_PARTICLES_PER_KNOT; i++) {
      const idx = cursor * 3;
      positions[idx + 0] = k.position[0] + gauss(rng) * sigma;
      positions[idx + 1] = k.position[1] + gauss(rng) * sigma;
      positions[idx + 2] = k.position[2] + gauss(rng) * sigma;
      types[cursor] = LANG_INDEX[k.lang] + 1;     // 1..5
      cursor++;
    }
  }

  // Filament particles — quadratic Bezier with mid-jitter, thicker near
  // midpoint, density-weighted toward endpoints.
  for (const [a, b] of pairs) {
    const A = KNOT_TABLE[a].position;
    const B = KNOT_TABLE[b].position;
    const mx = (A[0] + B[0]) / 2 + gauss(rng) * 0.45;
    const my = (A[1] + B[1]) / 2 + gauss(rng) * 0.45;
    const mz = (A[2] + B[2]) / 2 + gauss(rng) * 0.45;
    for (let i = 0; i < FILAMENT_PARTICLES_PER_PAIR; i++) {
      const u = rng();
      // Density biased toward endpoints (matter accumulates at nodes).
      const t = u < 0.5
        ? 0.5 - Math.sqrt(Math.max(0, 0.25 - u * 0.5))
        : 0.5 + Math.sqrt(Math.max(0, u * 0.5 - 0.25));
      const omt = 1 - t;
      const bx = omt * omt * A[0] + 2 * omt * t * mx + t * t * B[0];
      const by = omt * omt * A[1] + 2 * omt * t * my + t * t * B[1];
      const bz = omt * omt * A[2] + 2 * omt * t * mz + t * t * B[2];
      const thicknessGate = Math.sin(t * Math.PI);     // 0 at ends, 1 mid
      const thick = 0.035 + thicknessGate * 0.07;
      const idx = cursor * 3;
      positions[idx + 0] = bx + gauss(rng) * thick;
      positions[idx + 1] = by + gauss(rng) * thick;
      positions[idx + 2] = bz + gauss(rng) * thick;
      types[cursor] = 0;                                // filament
      cursor++;
    }
  }

  return { positions, types };
}

// ─── Shaders ─────────────────────────────────────────────────────────────

const vert = /* glsl */ `
  attribute float aType;
  uniform float uPixelRatio;

  varying float vType;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vType = aType;

    // Cluster particles slightly larger so cores read denser.
    float size = aType > 0.5 ? 2.4 : 1.6;
    gl_PointSize = size * uPixelRatio * (60.0 / max(0.5, -mv.z));
    gl_PointSize = clamp(gl_PointSize, 0.6, 6.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform vec3 uClusterWarm;
  uniform vec3 uFilamentCool;

  varying float vType;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float r = length(c);
    if (r > 0.5) discard;
    float fall = pow(1.0 - r * 2.0, 1.5);

    vec3 col = vType > 0.5 ? uClusterWarm : uFilamentCool;
    float intensity = fall * (vType > 0.5 ? 0.95 : 0.50);

    gl_FragColor = vec4(col * intensity, intensity);
  }
`;

// ─── Component ───────────────────────────────────────────────────────────

export interface MiraSuperclusterProps {
  reveal: number;
}

export default function MiraSupercluster({ reveal }: MiraSuperclusterProps): React.ReactElement | null {
  const pointsRef = useRef<THREE.Points>(null);
  void useMiraState;     // keep import for Phase B/C consumers

  const pixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  const { geometry, material } = useMemo(() => {
    const rng = mulberry32(0xC05A1234);
    const { positions, types } = buildParticles(rng);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aType',    new THREE.BufferAttribute(types, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6);

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio:   { value: pixelRatio },
        uClusterWarm:  { value: new THREE.Color('#FFB37A') },
        uFilamentCool: { value: new THREE.Color('#6FA4FF') },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [pixelRatio]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  // No-op frame loop so Phase B has a place to hang per-frame updates.
  useFrame(() => { /* no-op for Phase A */ });

  // Phase A: render unconditionally (no reveal envelope yet).
  void reveal;

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
