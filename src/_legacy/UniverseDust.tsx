'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

/**
 * UniverseDust — three parallax layers of atmospheric particles.
 *
 * Fraser principle: compositional depth. Foreground dust → midground bodies
 * → background nebula. The viewer should always feel *through* something.
 *
 * Layers:
 *   - Foreground (200 pts): large warm amber motes, z ∈ [-5, 5]. Slow drift.
 *     These are the closest specks — they move fastest visually as camera
 *     translates, carrying the sense of a medium we're swimming through.
 *   - Midground (800 pts): cool white dust, z ∈ [10, 40]. Gentle turbulence.
 *     Fills the middle distance.
 *   - Far (1500 pts): tiny multi-tint points, z ∈ [50, 200]. Nearly static.
 *     Reads as deep-space detritus between the nebular patches and the stars.
 *
 * Each layer uses a ShaderMaterial with an additively blended soft circle,
 * so particles bloom naturally through the postprocess chain without
 * harsh quads. Size scales inversely with projected distance (the shader
 * uses gl_PointSize with a 1/distance factor) so perspective is correct.
 */

type Layer = {
  count: number;
  zMin: number;
  zMax: number;
  xzSpread: number;   // horizontal half-extent around camera forward
  ySpread: number;    // vertical half-extent
  baseSize: number;   // base point size in world units (before distance scaling)
  driftSpeed: number; // world-space drift magnitude
  palette: [string, string, string]; // 3 tints the shader picks from per particle
};

const LAYERS: Layer[] = [
  {
    count: 200,
    zMin: -5,
    zMax: 5,
    xzSpread: 24,
    ySpread: 14,
    baseSize: 18,
    driftSpeed: 0.45,
    palette: ['#D4B898', '#C9A87A', '#E8D2A8'], // warm amber
  },
  {
    count: 800,
    zMin: 10,
    zMax: 40,
    xzSpread: 55,
    ySpread: 30,
    baseSize: 9,
    driftSpeed: 0.22,
    palette: ['#C8D8E8', '#A8B8D0', '#E0E8F0'], // cool white
  },
  {
    count: 1500,
    zMin: 50,
    zMax: 200,
    xzSpread: 160,
    ySpread: 90,
    baseSize: 4.5,
    driftSpeed: 0.06,
    palette: ['#8890A8', '#B08090', '#6888A8'], // varied deep-space tints
  },
];

/**
 * Shared vertex shader. Each vertex gets:
 *   - aSeed: per-particle random [0..1] for breathing/phase offsets
 *   - aTint: per-particle color (already chosen from palette at build time)
 *
 * Point size is scaled as uSize / gl_Position.w — standard 1/distance law.
 */
const dustVert = /* glsl */ `
attribute float aSeed;
attribute vec3  aTint;

uniform float uTime;
uniform float uSize;
uniform float uBreathe;

varying vec3 vTint;
varying float vSeed;

void main() {
  // Gentle per-particle oscillation in local space so the field feels alive
  // without obvious grid-like drift. Amplitudes are small (<0.1 world units).
  vec3 p = position;
  float ph = aSeed * 6.2831853;
  p.x += sin(uTime * 0.5 + ph) * 0.12;
  p.y += cos(uTime * 0.43 + ph * 1.7) * 0.08;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // Size shrinks with distance (perspective-correct). clamp so very-far
  // particles don't vanish to sub-pixel and disappear.
  gl_PointSize = clamp(uSize * (1.0 + sin(uTime * 0.7 + ph) * uBreathe) / -mv.z, 0.5, 42.0);
  gl_Position = projectionMatrix * mv;

  vTint = aTint;
  vSeed = aSeed;
}
`;

/**
 * Fragment shader: soft circular falloff on gl_PointCoord.
 * r² attenuation gives a glow feel without texture samples.
 */
const dustFrag = /* glsl */ `
precision mediump float;

varying vec3 vTint;
varying float vSeed;

uniform float uOpacity;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  // Discard outside unit disc — saves fill cost on the quad corners.
  if (d2 > 0.25) discard;
  // Soft falloff: bright core, long tail
  float core = exp(-d2 * 14.0);
  float halo = exp(-d2 * 5.0) * 0.35;
  float a = (core + halo) * uOpacity;
  gl_FragColor = vec4(vTint * a, a);
}
`;

function buildLayerGeometry(layer: Layer) {
  const { count, zMin, zMax, xzSpread, ySpread, palette } = layer;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const tints = new Float32Array(count * 3);
  const paletteColors = palette.map((hex) => new THREE.Color(hex));

  for (let i = 0; i < count; i++) {
    // Uniform in a box in front of origin. Camera sits near origin pointing +Z
    // but also moves — these bounds are generous so the field always wraps.
    positions[i * 3 + 0] = (Math.random() - 0.5) * 2 * xzSpread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * ySpread;
    positions[i * 3 + 2] = zMin + Math.random() * (zMax - zMin);
    // But also some particles wrap behind the origin (creates symmetry).
    if (Math.random() < 0.35) positions[i * 3 + 2] *= -1;

    seeds[i] = Math.random();

    const c = paletteColors[Math.floor(Math.random() * paletteColors.length)];
    // small per-particle jitter so each palette entry reads as a family, not a flat value.
    const jitter = 0.85 + Math.random() * 0.3;
    tints[i * 3 + 0] = c.r * jitter;
    tints[i * 3 + 1] = c.g * jitter;
    tints[i * 3 + 2] = c.b * jitter;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geom.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));
  return geom;
}

export default function UniverseDust() {
  const phase = useScene((s) => s.phase);

  // Only mount during UNIVERSE/ASSEMBLY/FINAL — during IDLE/THRESHOLD/VOID/EMERGENCE
  // another agent owns the background, and dust would leak into their composition.
  const visible = phase === 'UNIVERSE' || phase === 'ASSEMBLY' || phase === 'FINAL';

  const layerState = useMemo(() => {
    return LAYERS.map((layer) => {
      const geom = buildLayerGeometry(layer);
      const material = new THREE.ShaderMaterial({
        vertexShader: dustVert,
        fragmentShader: dustFrag,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: layer.baseSize },
          uBreathe: { value: 0.15 },
          uOpacity: { value: 0.85 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return { layer, geom, material };
    });
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    if (!visible) return;
    for (const { material, layer } of layerState) {
      material.uniforms.uTime.value += dt;
      // Drift the layer along -Z at its own pace so near dust parallaxes past
      // the camera faster than far dust. Wrap particles that exit the bounds
      // back to the far edge — done in-shader would need an extra attribute,
      // so we do it here at O(count) which is cheap for our sizes.
    }
    // Layer-level drift by shifting the whole layer group — cheap and effective.
    // We translate each Points object; when a particle z falls below zMin we
    // add (zMax - zMin) to recycle it.
    if (!groupRef.current) return;
    for (let li = 0; li < layerState.length; li++) {
      const { layer, geom } = layerState[li];
      const pos = geom.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const span = layer.zMax - layer.zMin;
      const d = dt * layer.driftSpeed;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 2] -= d;
        if (arr[i + 2] < layer.zMin - 10) arr[i + 2] += span + 20;
      }
      pos.needsUpdate = true;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {layerState.map(({ geom, material }, i) => (
        <points key={i} geometry={geom} material={material} frustumCulled={false} />
      ))}
    </group>
  );
}
