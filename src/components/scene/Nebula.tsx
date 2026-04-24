'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hash33, snoise3, fbm3 } from '@/lib/shaders/noise';

/**
 * Nebula — deep-space backdrop gas cloud.
 *
 * Cinematographic purpose: compositional depth. Fraser never shoots a subject
 * on featureless black. There is always a background volume — a wall, a fog
 * bank, a deep sky. Our "wall" here is a procedural gas cloud rendered on
 * the inside of a massive sphere (BackSide) far behind the black hole.
 *
 * Palette discipline (warm + cool, two families total):
 *   BASE   — deep blue-violet (#0A0E1F), the void of space. Cool.
 *   ACCENT — warm golden-brown (#3A2510) glow regions. Warm.
 * No green. No purple beyond the deep-space navy. No cyan. The warm regions
 * coexist with the cool base via soft fbm masks.
 *
 * Lighting:
 *   The black hole at origin subtly illuminates the nebula. When the ray
 *   direction is close to the direction toward the BH (camera origin), the
 *   accent glow brightens — as if the accretion disk's light spilled onto
 *   the nearby gas. This is fake in physics (the disk isn't that bright)
 *   but it's what Nolan did to make Gargantua sit in a lit volume.
 *
 * Motion:
 *   Whole sphere rotates slowly on Y (~0.01 rad/s — almost imperceptible
 *   at normal viewing time but keeps the gas from reading as dead).
 *   Internal gas structure advects via a time offset in the fbm sample
 *   position, so clouds appear to slowly churn.
 */

const vert = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vLocalDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vLocalDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const frag = /* glsl */ `
  precision highp float;

  varying vec3 vWorldPos;
  varying vec3 vLocalDir;

  uniform float uTime;
  uniform vec3  uCamPos;
  uniform vec3  uBHPos;

  ${hash33}
  ${snoise3}
  ${fbm3}

  void main() {
    // Sample direction in a coordinate system that slowly rotates on Y, so
    // cloud structure appears to drift past the viewer without the whole
    // mesh actually needing to rotate.
    float rotTime = uTime * 0.010; // ~0.01 rad/s
    float cr = cos(rotTime), sr = sin(rotTime);
    vec3 d = vec3(vLocalDir.x * cr - vLocalDir.z * sr,
                  vLocalDir.y,
                  vLocalDir.x * sr + vLocalDir.z * cr);

    // --- Four-octave fbm ---
    // Each octave advects at a different time rate so the field never
    // beats against itself harmonically — large gas structures drift
    // slowly, fine filigree moves faster.
    vec3 q1 = d * 2.0  + vec3(0.0, 0.0, uTime * 0.006);
    vec3 q2 = d * 4.5  + vec3(0.0, uTime * 0.012, 0.0);
    vec3 q3 = d * 9.0  + vec3(uTime * 0.020, 0.0, 0.0);
    vec3 q4 = d * 18.0 + vec3(uTime * 0.035, uTime * 0.02, 0.0);

    float n1 = fbm3(q1, 3, 2.1, 0.55);
    float n2 = fbm3(q2, 3, 2.2, 0.52);
    float n3 = fbm3(q3, 3, 2.3, 0.50);
    float n4 = fbm3(q4, 2, 2.1, 0.48);

    // Large-scale cloud mask — controls where warm accent regions live.
    float cloudMask = 0.55 + 0.45 * n1;
    // Mid-scale filaments.
    float filament = 0.5 + 0.5 * n2;
    // Detail noise adds crunch at small scales.
    float detail = 0.5 + 0.5 * n3;
    float microdetail = 0.5 + 0.5 * n4;

    // Carve out dark negative space: only regions where cloudMask AND
    // filament both peak light up. Most of the sphere stays dark blue-black
    // (Fraser's negative space principle).
    float warmMask = smoothstep(0.55, 0.90, cloudMask * filament);
    float gasDensity = smoothstep(0.30, 0.85, cloudMask * filament * (0.6 + 0.4 * detail));

    // --- Palette ---
    // Base: deep blue-violet void.
    vec3 cBase = vec3(0.039, 0.055, 0.122);  // #0A0E1F
    // Cool gas: very subtly brighter blue where density is moderate.
    vec3 cCool = vec3(0.080, 0.102, 0.200);
    // Warm accent: golden-brown ember glow.
    vec3 cWarm = vec3(0.227, 0.145, 0.063);  // #3A2510
    // Hot-warm highlight where warm gas is densest — approaches amber.
    vec3 cHot  = vec3(0.45, 0.28, 0.12);

    vec3 col = cBase;
    col = mix(col, cCool, gasDensity * 0.55);
    col = mix(col, cWarm, warmMask * 0.85);
    col = mix(col, cHot,  pow(warmMask, 2.0) * 0.6);

    // Slight microdetail variation — breaks up uniform cloud faces so the
    // gas doesn't read as a painted dome texture.
    col *= 0.90 + 0.14 * microdetail;

    // --- Black-hole illumination spill ---
    // Direction from sampled point toward the BH position, in world space.
    // Since we're inside the sphere, the cloud point is roughly at the
    // sphere's surface, and the BH is near origin.
    vec3 toBH = normalize(uBHPos - vWorldPos);
    // Compare to the outward-viewing ray direction. Nebula gas in the
    // direction of the BH (from the observer's POV) gets a little extra warm.
    vec3 camToPoint = normalize(vWorldPos - uCamPos);
    float align = clamp(dot(camToPoint, normalize(uBHPos - uCamPos)), 0.0, 1.0);
    // Brighten warm accent only — we stay in the warm family.
    col += cWarm * pow(align, 6.0) * 0.35 * (0.4 + warmMask);

    // --- Vignetting toward the poles ---
    // Fraser always has a darker top & bottom. Fade the density slightly
    // at y-extremes so the eye doesn't get distracted by overhead clouds.
    float polarFade = 1.0 - pow(abs(d.y), 4.0) * 0.4;
    col *= polarFade;

    // Gentle baseline exposure — very low. This layer is deep background.
    col *= 0.85;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Nebula() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
      uBHPos: { value: new THREE.Vector3(0, 0, 0) },
    }),
    []
  );

  useFrame((state, dt) => {
    uniforms.uTime.value += Math.min(dt, 0.05);
    uniforms.uCamPos.value.copy(state.camera.position);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      {/* Huge sphere, rendered from the inside. Radius 500 puts it deep in
          the scene's far plane so it sits firmly behind everything else. */}
      <sphereGeometry args={[500, 48, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
