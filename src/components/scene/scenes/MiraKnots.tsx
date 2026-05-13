'use client';

/**
 * MiraKnots — five galaxy-cluster X-ray cores for the MIRA Virgo Supercluster.
 *
 * Each knot = (a) sphere with ShaderMaterial producing a warm-cored HDR radial
 * falloff — core at 2.0–3.5 HDR range so global Bloom (threshold 0.6) fires;
 * (b) a large additive-blended halo billboard using a view-aligned vertex trick
 * so it always faces the camera without CPU quaternion copies.
 *
 * Skills: r3f-shaders, r3f-materials
 * Spec: .coo/jobs/004-mira-virgo-supercluster.md AC1, AC2, AC3
 */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KNOT_TABLE, useMiraState } from '@/lib/mira-state';
import { NOISE_GLSL, GAUSSIAN_PULSE_GLSL } from './_shaders';

export interface MiraKnotsProps {
  reveal: number;
}

// ─── Core sphere shader ──────────────────────────────────────────────────────
// Hot inner white core (HDR 3.5) blending to saturated warm hue (HDR 2.8).
// Both above Bloom threshold 0.6. FBM noise prevents flat-sphere reading.

const coreVert = /* glsl */ `
  ${NOISE_GLSL}
  uniform float uTime;
  uniform float uReveal;
  varying vec3  vLocalPos;

  void main() {
    vec3 p = position;
    float disp = fbm(p * 2.6 + vec3(uTime * 0.26)) * 0.04 * uReveal;
    p += normal * disp;
    vLocalPos   = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const coreFrag = /* glsl */ `
  ${NOISE_GLSL}
  ${GAUSSIAN_PULSE_GLSL}
  uniform float uTime;
  uniform float uReveal;
  uniform vec3  uCoreColor;
  uniform float uBrightness;
  varying vec3  vLocalPos;

  void main() {
    float r = length(vLocalPos);
    // Power falloff — stays bright out to ~r=0.7 before dropping.
    float glow    = pow(clamp(1.0 - r * 0.95, 0.0, 1.0), 0.45);
    // Centre mask: 1 at core, 0 at r=0.45. Drives white-hot central peak.
    float ctrMask = 1.0 - smoothstep(0.0, 0.45, r);
    vec3  hotCore = vec3(3.8, 3.2, 2.5);   // near-white inner at HDR
    vec3  midGlow = uCoreColor * 3.0;       // saturated warm hue at HDR

    vec3 col = mix(midGlow, hotCore, ctrMask);

    // FBM surface texture — breaks up the smooth sphere look.
    float n = fbm(vLocalPos * 1.4 + vec3(uTime * 0.18));
    n = n * 0.5 + 0.5;
    col *= 0.60 + 0.65 * n;

    // 482ms Gaussian heartbeat — active knot pulses noticeably.
    float pulse = gaussianPulse(0.482);
    col *= glow * uBrightness * (1.0 + pulse * 0.35) * uReveal;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Halo billboard shader ────────────────────────────────────────────────────
// View-aligned via modelViewMatrix column-stripping in the vertex shader:
// translating model origin to view space then offsetting position.xy in view
// space gives perfect camera-facing billboard without CPU quaternion updates.
const haloVert = /* glsl */ `
  uniform float uScale;
  varying vec2  vUv;

  void main() {
    vUv = uv;
    // Strip rotation: push model origin to view space, then add local XY offset.
    vec4 origin  = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    origin.xy   += position.xy * uScale;
    gl_Position  = projectionMatrix * origin;
  }
`;

// Smooth gaussian nebula — no discard, just steep exponential so corners
// reach < 0.5% alpha and never read as a rectangle.
const haloFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uHaloColor;
  uniform float uOpacity;
  varying vec2  vUv;

  void main() {
    // r is 0 at centre, ~1.41 at corners. Normalise so edge midpoint = 1.0.
    float r    = length(vUv - 0.5) * 2.0;
    // Tight gaussian: at r=1 (edge), alpha = exp(-5.2) = 0.0055. Invisible.
    float base = exp(-r * r * 5.2);
    // Secondary inner peak makes the corona read as a bright ring, not a disc.
    float ring = exp(-pow(r - 0.22, 2.0) * 28.0) * 0.55;
    float a    = (base + ring) * uOpacity;

    // Subtle shimmer prevents static halos looking identical at rest.
    float shimmer = 0.94 + 0.06 * sin(uTime * 0.9 + r * 8.0);
    gl_FragColor  = vec4(uHaloColor * shimmer, a);
  }
`;

// ─── Per-knot material pair ───────────────────────────────────────────────────

interface KnotMats {
  cMat: THREE.ShaderMaterial;
  hMat: THREE.ShaderMaterial;
}

function buildMats(hue: string): KnotMats {
  const c = new THREE.Color(hue);

  const cMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:       { value: 0 },
      uReveal:     { value: 0 },
      uCoreColor:  { value: c.clone() },
      uBrightness: { value: 0.45 },
    },
    vertexShader:   coreVert,
    fragmentShader: coreFrag,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
  });

  const hMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:      { value: 0 },
      uScale:     { value: 1.0 },
      uHaloColor: { value: c.clone().multiplyScalar(1.8) },
      uOpacity:   { value: 0.40 },
    },
    vertexShader:   haloVert,
    fragmentShader: haloFrag,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
    side:           THREE.DoubleSide,
  });

  return { cMat, hMat };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MiraKnots({ reveal }: MiraKnotsProps) {
  const activeLang = useMiraState((s) => s.activeLang);
  const density    = useMiraState((s) => s.density);

  const mats = useMemo(
    () => KNOT_TABLE.map((k) => buildMats(k.hue)),
    [],
  );

  useEffect(() => () => {
    mats.forEach(({ cMat, hMat }) => { cMat.dispose(); hMat.dispose(); });
  }, [mats]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    KNOT_TABLE.forEach((k, i) => {
      const { cMat, hMat } = mats[i];
      const isActive = k.lang === activeLang;
      const d = density[k.lang];

      // Idle brightness drives [0.18..0.45] HDR output.
      // Active = ×1.65 → guaranteed ≥40% boost over idle (AC3).
      const idle   = 0.45 * (0.4 + d * 0.6);
      const bright = isActive ? idle * 1.65 : idle;

      cMat.uniforms.uTime.value       = t;
      cMat.uniforms.uReveal.value     = reveal;
      cMat.uniforms.uBrightness.value = bright;

      // Halo scale in world units. Small knots get 0.55-0.95; EN active ~1.7.
      const haloR  = (0.55 + d * 0.65) * k.relativeScale * reveal;
      const aSca   = isActive ? haloR * 1.55 : haloR;
      const baseOp = 0.28 + d * 0.55;
      hMat.uniforms.uTime.value    = t;
      hMat.uniforms.uScale.value   = aSca;
      hMat.uniforms.uOpacity.value = isActive ? baseOp * 1.55 : baseOp;
    });
  });

  return (
    <group>
      {KNOT_TABLE.map((k, i) => {
        const { cMat, hMat } = mats[i];
        // Sphere radius: EN = 0.168, smallest (TE) = 0.12.
        const r = 0.12 * k.relativeScale;

        return (
          <group key={k.lang} position={k.position as [number, number, number]}>
            {/* Core sphere — HDR warm-white X-ray hotspot. */}
            <mesh material={cMat} frustumCulled={false}>
              <sphereGeometry args={[r, 32, 32]} />
            </mesh>

            {/* Halo billboard — camera-facing soft nebula glow. */}
            <mesh material={hMat} frustumCulled={false}>
              <planeGeometry args={[1, 1]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
