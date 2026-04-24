'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * SpaceDust — foreground volumetric dust layer.
 *
 * Cinematographic purpose (Dune / Interstellar): give the foreground physical
 * weight. A "subject on black" frame reads flat. Dust drifting in the near
 * plane creates parallax, suggests atmosphere, and makes the black hole feel
 * like it lives in a real volume rather than a vacuum placeholder.
 *
 * Physics sketch:
 *   - ~800 particles sampled in a slab in front of the camera
 *     (z ∈ [camZ - 3, camZ + 1]) so some drift INTO the lens.
 *   - Sizes weighted small: a Pareto-ish distribution where most are
 *     specks (0.3 units) and a few are larger motes (up to 2.0 units).
 *   - Brownian drift velocity (tiny random walk each frame).
 *   - Gravitational attraction toward the black hole center, falling
 *     as 1/r^2 (capped to avoid singularities near the center).
 *   - Particles that cross the event horizon "capture": alpha fades
 *     over ~0.6s then respawn at the outer edge of the slab.
 *
 * Render: gl.Points with a custom ShaderMaterial. Soft circular falloff via
 * gl_PointCoord; additive blending so dust accumulates brightness in stacks.
 *
 * Color: warm cream-amber (#E8DBC5) — Fraser's warm family, keeps palette
 * coherent with the amber disk. Alpha is very soft so the dust reads as
 * atmosphere rather than particulate noise.
 */

const N = 800;
const EVENT_HORIZON = 1.0;   // matches BlackHole Rs
const CAPTURE_FADE_SEC = 0.6;

// Spawn volume — slab in front of camera. Camera lives near z ≈ 30 by default
// (see SceneManager), so we parameterize relative to the camera position at
// init time, then advect relative to that anchor.
const SLAB_HALF_WIDTH = 14;   // xy half-extent
const SLAB_NEAR_OFFSET = 1;   // z above (in front of) camera base
const SLAB_FAR_OFFSET = -3;   // z below (behind-ish) camera base

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;     // 0..1 life alpha (1=alive, 0=captured/respawning)
  attribute float aSeed;

  uniform vec2 uResolution;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);

    // Perspective-attenuated point size. The 300.0 constant matches the
    // streak layer so dust and streaks have a consistent "lens-inch" feel.
    float dist = -mv.z;
    float sizePx = aSize * 120.0 / max(dist, 0.1);
    gl_PointSize = clamp(sizePx, 1.0, 40.0);

    vAlpha = aAlpha;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform float uTime;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Soft circular falloff. Gaussian-ish — bright core fading to nothing
    // at the edge. Reads as motes of dust catching key light rather than
    // hard impostor sprites.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    // Core bias so centers pop.
    soft = pow(soft, 1.6);

    // Cream-amber. #E8DBC5 base with tiny per-particle drift toward either
    // slightly warmer or slightly cooler cream so the field isn't uniform.
    vec3 base = vec3(0.910, 0.859, 0.773);
    vec3 warm = base * vec3(1.03, 0.98, 0.90);
    vec3 cool = base * vec3(0.96, 0.99, 1.05);
    vec3 col = mix(cool, warm, fract(vSeed * 7.371));

    // Subtle slow pulse keyed to per-particle seed so motes breathe out of
    // phase. Amplitude small — this is supporting atmosphere, not fireworks.
    float pulse = 0.88 + 0.12 * sin(uTime * 0.7 + vSeed * 6.283);

    float a = soft * vAlpha * pulse * 0.42;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * pulse, a);
  }
`;

// Deterministic PRNG (mulberry32) so particle layout is stable across HMR.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type DustBuffers = {
  positions: Float32Array;
  velocities: Float32Array; // XYZ per particle
  sizes: Float32Array;
  alphas: Float32Array;     // life alpha
  seeds: Float32Array;
  // Book-keeping: how long particle has been in capture-fade state. <0 = alive.
  captureT: Float32Array;
};

function buildDust(camZ: number): DustBuffers {
  const rand = mulberry32(0xD0579E51);
  const positions = new Float32Array(N * 3);
  const velocities = new Float32Array(N * 3);
  const sizes = new Float32Array(N);
  const alphas = new Float32Array(N);
  const seeds = new Float32Array(N);
  const captureT = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const x = (rand() - 0.5) * 2 * SLAB_HALF_WIDTH;
    const y = (rand() - 0.5) * 2 * SLAB_HALF_WIDTH;
    const z = camZ + SLAB_FAR_OFFSET + rand() * (SLAB_NEAR_OFFSET - SLAB_FAR_OFFSET);
    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Brownian drift — small initial velocity, will evolve each frame.
    velocities[i * 3 + 0] = (rand() - 0.5) * 0.06;
    velocities[i * 3 + 1] = (rand() - 0.5) * 0.06;
    velocities[i * 3 + 2] = (rand() - 0.5) * 0.03;

    // Size distribution: mostly small motes, rare larger dust.
    // u^3 pulls the distribution toward zero; rare tail for chunkier grains.
    const u = rand();
    sizes[i] = 0.3 + Math.pow(u, 3) * 1.7;

    alphas[i] = 1.0;
    seeds[i] = rand();
    captureT[i] = -1;
  }

  return { positions, velocities, sizes, alphas, seeds, captureT };
}

export default function SpaceDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, size } = useThree();

  // Anchor the slab to the initial camera z so the slab position is stable
  // across the IDLE/THRESHOLD window (camera only drifts slightly).
  const dust = useMemo(() => buildDust(camera.position.z), [camera.position.z]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(dust.positions, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(dust.sizes, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(dust.alphas, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(dust.seeds, 1));
    // Keep dust always visible — frustum culling on points with small
    // bounding spheres can flicker at high FOV.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
    return g;
  }, [dust]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    []
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    uniforms.uTime.value += dt;
    uniforms.uResolution.value.set(size.width, size.height);

    const geom = pointsRef.current?.geometry;
    if (!geom) return;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const alphaAttr = geom.attributes.aAlpha as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const vel = dust.velocities;
    const alphas = dust.alphas;
    const captureT = dust.captureT;

    // Gravitational acceleration strength.
    // Real units: a = GM/r^2. We pick a constant that gives visible motion at
    // the slab distance (~30 units from BH at z=0) within a couple seconds
    // of drift. Capped at short range to avoid numerical blow-up near BH.
    const GM = 0.9;

    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;

      if (captureT[i] >= 0) {
        // Fading after capture — alpha ramps to 0, then respawn at outer edge.
        captureT[i] += dt;
        const f = 1 - captureT[i] / CAPTURE_FADE_SEC;
        alphas[i] = Math.max(0, f);
        if (captureT[i] >= CAPTURE_FADE_SEC) {
          // Respawn on outer edge of slab — pick random angle and push out.
          const rand = (a: number) => {
            // cheap hash-based pseudorand seeded per particle & respawn count
            const v = Math.sin(a * 12.9898 + captureT[i] * 78.233) * 43758.5453;
            return v - Math.floor(v);
          };
          const theta = rand(i + 1) * Math.PI * 2;
          const r = SLAB_HALF_WIDTH * (0.85 + 0.15 * rand(i + 17));
          pos[ix] = Math.cos(theta) * r;
          pos[iy] = Math.sin(theta) * r;
          pos[iz] = camera.position.z + SLAB_FAR_OFFSET + rand(i + 29) *
                    (SLAB_NEAR_OFFSET - SLAB_FAR_OFFSET);
          // Reset velocity to small Brownian again.
          vel[ix] = (rand(i + 3) - 0.5) * 0.06;
          vel[iy] = (rand(i + 5) - 0.5) * 0.06;
          vel[iz] = (rand(i + 7) - 0.5) * 0.03;
          alphas[i] = 1.0;
          captureT[i] = -1;
        }
        continue;
      }

      // --- Gravitational pull toward BH at origin ---
      const x = pos[ix];
      const y = pos[iy];
      const z = pos[iz];
      const r2 = x * x + y * y + z * z;
      const r = Math.sqrt(r2);

      // Capture check — anything inside event horizon gets flagged.
      if (r < EVENT_HORIZON * 1.4) {
        captureT[i] = 0;
        continue;
      }

      // Acceleration vector: a = -GM/r^2 * r_hat. Soft clamp near center to
      // prevent numerical explosion if a particle strays inward.
      const rSoft = Math.max(r, 1.5);
      const aMag = GM / (rSoft * rSoft);
      const invR = 1 / r;
      const ax = -x * invR * aMag;
      const ay = -y * invR * aMag;
      const az = -z * invR * aMag;

      // --- Brownian jitter ---
      // Tiny random walk each frame. Keeps motes "alive" even when far from
      // gravitational field. Amplitude small so it reads as atmospheric
      // turbulence, not noise.
      const brown = 0.04;
      const bx = (Math.random() - 0.5) * brown;
      const by = (Math.random() - 0.5) * brown;
      const bz = (Math.random() - 0.5) * brown * 0.5;

      // Integrate semi-implicit Euler.
      vel[ix] += (ax + bx) * dt;
      vel[iy] += (ay + by) * dt;
      vel[iz] += (az + bz) * dt;

      // Mild velocity damping — space is collisionless but this prevents
      // particles from escaping to infinity in the CPU simulation window.
      const damp = 0.996;
      vel[ix] *= damp;
      vel[iy] *= damp;
      vel[iz] *= damp;

      pos[ix] += vel[ix] * dt;
      pos[iy] += vel[iy] * dt;
      pos[iz] += vel[iz] * dt;
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
