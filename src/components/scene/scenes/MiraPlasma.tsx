'use client';

/**
 * MiraPlasma — boiling plasma star core.
 *
 * Ports the FBM-vortex technique from MisterPrada/vortex-glass-sphere
 * (https://github.com/MisterPrada/vortex-glass-sphere — MIT, Mar 2025,
 * Codrops tutorial 2025-03-10), rewritten from TSL nodes into a plain
 * GLSL ShaderMaterial for portability. The technique is the value, not
 * the syntax.
 *
 * What it does
 *   - Sphere geometry with subtle FBM-driven vertex displacement (surface
 *     breathing — the silhouette stays round, but the skin moves).
 *   - Fragment shader samples 3D FBM noise at coordinates that are first
 *     rotated around the local Y axis by an angle proportional to radial
 *     distance from the body axis. This produces the spiral convection
 *     pattern. Sample maps through a 3-stop colour ramp via two smoothstep
 *     calls. A Fresnel rim term catches the silhouette. A 482 ms Gaussian
 *     heartbeat modulates overall brightness, anchored to MIRA's metric.
 *   - Final colour multiplied by 1.8 into HDR range so the existing global
 *     <Bloom> in PostFX adds the halo without us needing a second composer.
 *   - No glass enclosure. No ring billboards (the prior MiraCore looked
 *     like a loading-spinner partly because of those rings).
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PULSE_PERIOD = 0.482;     // matches W01_MIRA's "482ms" metric

// ─── Shared noise + FBM (used by both vertex and fragment shaders) ──────────
const NOISE_GLSL = /* glsl */ `
  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7,  74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`;

const plasmaVert = /* glsl */ `
  ${NOISE_GLSL}
  uniform float uTime;
  uniform float uReveal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vec3 p = position;
    // Surface breathing — small displacement so silhouette stays round.
    float disp = fbm(p * 2.4 + vec3(uTime * 0.45)) * 0.045 * (0.4 + 0.6 * uReveal);
    p += normal * disp;

    vLocalPos = position;
    vWorldNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const plasmaFrag = /* glsl */ `
  ${NOISE_GLSL}
  uniform float uTime;
  uniform float uReveal;
  uniform vec3  uColorCold;
  uniform vec3  uColorWarm;
  uniform vec3  uColorHot;
  uniform float uPulsePeriod;
  uniform vec3  uCameraPos;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    // ── Vortex coordinate transform ──────────────────────────────────────
    // Rotate sample point around local Y by an angle proportional to the
    // radial distance from the body axis. Closer to the axis → less twist;
    // farther out → more twist. This produces the spiral convection look.
    vec3 p = vLocalPos;
    float rho = length(vec2(p.x, p.z));
    float angle = rho * 2.4 + uTime * 0.35;
    float c = cos(angle), s = sin(angle);
    vec3 q = vec3(
      p.x * c - p.z * s,
      p.y + uTime * 0.05,                  // small drift along axis
      p.x * s + p.z * c
    );

    // ── Multi-octave noise sample ────────────────────────────────────────
    float n = fbm(q * 1.9 + vec3(uTime * 0.20));
    n = clamp(n * 0.5 + 0.5, 0.0, 1.0);    // [-1..1] → [0..1]

    // ── 3-stop colour ramp ──────────────────────────────────────────────
    vec3 col = mix(uColorCold, uColorWarm, smoothstep(0.30, 0.70, n));
    col = mix(col, uColorHot, smoothstep(0.72, 0.96, n));

    // ── 482 ms heartbeat (Gaussian flash, decays fast) ──────────────────
    float phase = mod(uTime, uPulsePeriod) / uPulsePeriod;     // 0..1
    float pulse = exp(-pow(phase * 18.0, 2.0)) * 0.40;
    // Secondary echo so it reads as a heartbeat, not a click.
    pulse += exp(-pow((phase - 0.18) * 22.0, 2.0)) * 0.20;

    // ── Fresnel rim (Y-axis-up, view from world camera) ─────────────────
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float rim = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), 2.4);
    vec3 rimColor = vec3(0.45, 0.65, 1.05);

    // ── Composite ───────────────────────────────────────────────────────
    col *= (0.85 + pulse);                     // brightness modulation
    col += rim * rimColor * (0.55 + pulse);    // rim glow

    // HDR boost so the global Bloom (luminanceThreshold 0.6) catches the
    // hottest convection cells, but NOT every pixel — we want texture,
    // not a uniform white blob.
    col *= 1.8;

    // Reveal envelope — body emerges as the user scrolls into MIRA.
    col *= mix(0.18, 1.00, uReveal);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface MiraPlasmaProps {
  /** 0..1 reveal — drives baseline brightness and surface activity. */
  reveal: number;
}

export default function MiraPlasma({ reveal }: MiraPlasmaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const uniforms = useMemo(() => ({
    uTime:         { value: 0 },
    uReveal:       { value: reveal },
    uColorCold:    { value: new THREE.Color('#0A1638') },     // deep blue void
    uColorWarm:    { value: new THREE.Color('#FF9A3C') },     // warm orange
    uColorHot:     { value: new THREE.Color('#FFE9B3') },     // hot highlight
    uPulsePeriod:  { value: PULSE_PERIOD },
    uCameraPos:    { value: new THREE.Vector3() },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useEffect(() => {
    uniforms.uReveal.value = reveal;
  }, [reveal, uniforms]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uCameraPos.value.copy(camera.position);
    if (meshRef.current) {
      // Slow body rotation so the displaced surface noise reads as motion
      // even when the camera isn't orbiting much.
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.06;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.10;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.4, 96, 96]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={plasmaVert}
        fragmentShader={plasmaFrag}
      />
    </mesh>
  );
}
