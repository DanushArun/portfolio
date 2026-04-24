'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hash33, snoise3, fbm3 } from '@/lib/shaders/noise';
import { useScene } from '@/lib/scene-state';

/**
 * DeepNebula — the universe scene's signature background.
 *
 * Two stacked techniques:
 *   (1) Inverted-sphere skybox (radius 600) with a 5-octave fbm shader.
 *       Colors suggest where the "sun" sits (upper-left bright patch) and
 *       where deep voids fall. This is the *painted backdrop* — wide,
 *       low-frequency beauty.
 *   (2) Four large additive gas planes scattered in front of the skybox
 *       (scale 80-120). They parallax against the skybox as the camera
 *       moves, giving the background volumetric depth without the cost
 *       of true volumetrics.
 *
 * The key light direction is assumed at ~[40, 30, -20] (warm key). The
 * skybox brightens in the direction of that vector — sells the lighting
 * by painting the nebula itself as the god-ray source.
 */

// ── Skybox shader ──────────────────────────────────────────────────────────
// Fragment samples fbm in the world-space view direction. A single bright
// "sun" smear in the upper-left, cool voids opposite.

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  // The inverted sphere is centered on the camera; vDir is the view ray.
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const skyFrag = /* glsl */ `
precision highp float;

varying vec3 vDir;

uniform float uTime;
uniform vec3  uKeyDir;   // direction toward the imaginary sun
uniform vec3  uColorBase;   // deep indigo-purple
uniform vec3  uColorWarm;   // nebular core
uniform vec3  uColorCool;   // teal emission

${hash33}
${snoise3}
${fbm3}

void main() {
  vec3 d = normalize(vDir);

  // Primary low-frequency structure — the continent-scale gas swirls
  float f1 = fbm3(d * 1.1 + vec3(0.0, 0.0, 0.23), 5, 2.0, 0.55);
  // Mid-frequency detail
  float f2 = fbm3(d * 3.2 + vec3(4.1, 1.7, -2.3), 4, 2.1, 0.55);
  // High-frequency sparkle
  float f3 = fbm3(d * 8.0, 3, 2.2, 0.5);

  // Combined density [0..1]
  float density = clamp(0.55 * f1 + 0.3 * f2 + 0.15 * f3, -0.2, 1.2);

  // Bright key-light hotspot in the nebula in the uKeyDir direction.
  // cos(angle between view ray and key) — raised to a power for sharpness.
  float keyDot = max(dot(d, normalize(uKeyDir)), 0.0);
  float keySmear = pow(keyDot, 2.8);

  // Cool opposite-side void
  float voidSide = pow(max(-dot(d, normalize(uKeyDir)), 0.0), 2.0);

  // Color assembly: base + warm where density*key is high,
  // cool where density is moderate and we're opposite the key.
  vec3 col = uColorBase;
  col = mix(col, uColorWarm, smoothstep(0.0, 0.9, density * 0.65 + keySmear * 0.7));
  col = mix(col, uColorCool, smoothstep(0.2, 0.9, max(0.0, -density) + voidSide * 0.5) * 0.55);

  // Dark pockets — occasional deep violet voids (density < -0.15)
  col = mix(col, uColorBase * 0.35, smoothstep(-0.15, -0.5, density));

  // Subtle shimmer — very slow temporal evolution for a "living" sky
  col *= 0.92 + 0.08 * sin(uTime * 0.15 + f2 * 6.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

// ── Gas plane shader ──────────────────────────────────────────────────────
// Each plane is a large additively blended quad with fbm-driven softness.
// Center bright, edges fade. Animated slowly. Alpha peaks near center.

const gasVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const gasFrag = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uSeed;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform float uOpacity;

${hash33}
${snoise3}
${fbm3}

void main() {
  // Centered coord for radial falloff
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  // Radial vignette — cloud pinches to zero at edges, keeps plane's hard
  // rectangle from being visible.
  float vignette = smoothstep(1.0, 0.25, r);

  // Internal cloud structure (3 fbm octaves — we're close and big)
  vec3 p = vec3(vUv * 4.2 + uSeed, uTime * 0.03 + uSeed);
  float density = fbm3(p, 4, 2.1, 0.55) * 0.5 + 0.5;

  // Gradient color from centre to edges
  vec3 col = mix(uColorB, uColorA, density);

  float a = density * vignette * uOpacity;
  // Pre-multiplied additive
  gl_FragColor = vec4(col * a, a);
}
`;

// Four gas plane placements. Positions roughly follow the key-light
// direction so brighter planes cluster near the nebula "sun", darker
// ones at the opposite side.
type GasPlane = {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  colorA: string;
  colorB: string;
  opacity: number;
  seed: number;
};

const GAS_PLANES: GasPlane[] = [
  // Near the key (upper-left): warm orange/amber
  {
    position: [-120, 85, -240],
    scale: 160,
    rotation: [0.2, 0.3, 0.15],
    colorA: '#7A3418',
    colorB: '#30130A',
    opacity: 0.55,
    seed: 1.3,
  },
  // Mid-right: teal emission
  {
    position: [140, 20, -260],
    scale: 130,
    rotation: [-0.1, -0.25, -0.1],
    colorA: '#1F5A66',
    colorB: '#0A2026',
    opacity: 0.4,
    seed: 5.1,
  },
  // Below center: deep violet
  {
    position: [-40, -90, -220],
    scale: 140,
    rotation: [0.35, 0.05, 0.4],
    colorA: '#2C1238',
    colorB: '#100418',
    opacity: 0.45,
    seed: 7.7,
  },
  // Far back: cool blue wash (largest)
  {
    position: [60, -20, -340],
    scale: 200,
    rotation: [-0.2, 0.4, -0.05],
    colorA: '#18304A',
    colorB: '#050B14',
    opacity: 0.35,
    seed: 11.2,
  },
  // Additional foreground-ish amber smear (closer, smaller)
  {
    position: [-60, 40, -150],
    scale: 90,
    rotation: [0.5, -0.2, 0.25],
    colorA: '#5E2A10',
    colorB: '#1C0A03',
    opacity: 0.3,
    seed: 2.9,
  },
];

export default function DeepNebula() {
  const phase = useScene((s) => s.phase);
  // Skybox + gas planes ONLY during UNIVERSE/ASSEMBLY/FINAL. Other phases
  // are owned by other agents (void transit, black hole, etc).
  const visible = phase === 'UNIVERSE' || phase === 'ASSEMBLY' || phase === 'FINAL';

  const skyUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // Warm key from upper-left front — matches Universe.tsx directional key
      // position [40, 30, -20]. Direction from origin to that light.
      uKeyDir: { value: new THREE.Vector3(0.75, 0.56, -0.37).normalize() },
      uColorBase: { value: new THREE.Color('#0F0820') },
      uColorWarm: { value: new THREE.Color('#4D2C15') },
      uColorCool: { value: new THREE.Color('#1F3D42') },
    }),
    [],
  );

  const gasUniformsList = useMemo(() => {
    return GAS_PLANES.map((g) => ({
      uTime: { value: 0 },
      uSeed: { value: g.seed },
      uColorA: { value: new THREE.Color(g.colorA) },
      uColorB: { value: new THREE.Color(g.colorB) },
      uOpacity: { value: g.opacity },
    }));
  }, []);

  useFrame((_, dt) => {
    if (!visible) return;
    skyUniforms.uTime.value += dt;
    for (const u of gasUniformsList) {
      u.uTime.value += dt;
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Skybox — inverted sphere at radius 600. Camera lives inside. */}
      <mesh>
        <sphereGeometry args={[600, 64, 48]} />
        <shaderMaterial
          vertexShader={skyVert}
          fragmentShader={skyFrag}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Gas planes — additive, each quad ~scale units across */}
      {GAS_PLANES.map((g, i) => (
        <mesh
          key={i}
          position={g.position}
          rotation={g.rotation}
          scale={[g.scale, g.scale, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            vertexShader={gasVert}
            fragmentShader={gasFrag}
            uniforms={gasUniformsList[i]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
