'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene, phaseTime } from '@/lib/scene-state';

/**
 * VoidTransit — the 3s singularity interior.
 *
 * The user has crossed the event horizon. Inside, spacetime is collapsing.
 * We render the tunnel as three overlapping layers:
 *
 *   1. HYPERSPACE STREAKS — 12,000 photons smeared along their worldlines.
 *      Custom ShaderMaterial + Points. Each streak is a point billboard whose
 *      internal pixels are painted as a radial screen-aligned smear, so the
 *      streak axis lines up with the apparent outward flow from screen center.
 *      Color temperature varies per particle; blue-white near the forward axis
 *      (high-energy photons), amber out in the periphery (relativistic redshift
 *      of off-axis rays).
 *
 *   2. SPACETIME LATTICE — a 3D grid of faint lime points that hyperbolically
 *      warps toward the forward axis. Rendered with an InstancedMesh of small
 *      cubes so the grid is actually volumetric instead of screen-projected.
 *      The warp offset is direction/(distance+1) * strength, computed on CPU
 *      once in the vertex inputs then sheared in the vertex shader by a phase
 *      uniform for breathing.
 *
 *   3. TUNNEL VOID — enforced in the streak spawn law: positions are sampled
 *      from a cylindrical shell (innerR .. outerR), never inside innerR. This
 *      gives the dark forward corridor the camera stares into. Time dilation
 *      at the axis is encoded as a per-particle speed multiplier that tapers
 *      toward 0 for particles with small radial distance (tau -> 0 at r -> 0).
 *
 * Phase response:
 *   VOID        — full speed, cool-to-amber palette, streaks at peak length.
 *   EMERGENCE   — streaks decelerate, particles disperse, colors warm to gold
 *                 and then calm into the quiet starfield that backs the
 *                 universe scene. By t=1.5s into EMERGENCE the motion is
 *                 effectively frozen and only the cooled stars remain.
 */

const N_STREAKS = 12000;
const SHELL_INNER = 0.6;   // forward-axis void radius
const SHELL_OUTER = 60.0;  // widest streak spawn
const Z_BACK = -200;       // spawn depth (far away, streaming toward camera)
const Z_FRONT = 20;        // wrap depth (past the camera)

const GRID_RES = 14;       // 14^3 ~= 2744 grid cells
const GRID_SPAN_Z = 220;   // grid spans z in [-200, +20] roughly

// ---- Shaders -----------------------------------------------------------

const streakVert = /* glsl */ `
  attribute vec3 aRandom;
  attribute vec3 aVelocity;

  uniform float uTime;
  uniform float uVoidProgress;
  uniform float uEmergence;
  uniform float uSpeedScale;
  uniform vec2  uResolution;

  varying vec3  vRandom;
  varying vec2  vScreenDir;   // unit radial direction on screen (for streak orientation)
  varying float vSpeedFrac;   // 0..1 — how "fast" this particle currently is (for streak length & brightness)
  varying float vRadialFrac;  // 0..1 — distance from forward axis normalized (for color temperature)
  varying float vEmerge;      // EMERGENCE blend pulled through to fragment

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * mv;

    // --- Screen-space direction from the frame center to this point.
    // Used to orient the streak smear along the apparent outward motion.
    vec2 ndc = clip.xy / max(clip.w, 1e-5);
    float ndcLen = length(ndc);
    vScreenDir = ndcLen > 1e-4 ? ndc / ndcLen : vec2(0.0, 1.0);

    // --- Speed fraction. Particles near the forward axis are time-dilated:
    // tau -> 0 as radial distance -> 0, so they barely drift. This also enforces
    // the bright moving "wall" perception at the periphery.
    float radial = length(position.xy);
    float radialNorm = clamp(radial / 60.0, 0.0, 1.0);
    vRadialFrac = radialNorm;

    // Bigger streaks for faster, closer, and brighter particles. During
    // EMERGENCE this collapses toward zero — streaks become small quiet stars.
    float voidWeight = smoothstep(0.0, 1.0, uVoidProgress) * (1.0 - uEmergence);
    float speedFrac = uSpeedScale * (0.35 + 0.65 * radialNorm) * voidWeight;
    // Per-particle speed jitter so the field doesn't look metronomic.
    speedFrac *= (0.7 + 0.6 * aRandom.y);
    vSpeedFrac = speedFrac;
    vEmerge = uEmergence;

    // --- Size in pixels. Scale with speed (stretch during VOID), shrink with
    // distance via attenuation, and grow a small amount with radial position
    // so foreground streaks at the periphery dominate, matching hyperspace
    // visual language (Rogue One, Interstellar).
    float dist = -mv.z;
    float attenuate = 300.0 / max(dist, 1.0);
    float sizePx = (4.0 + speedFrac * 46.0) * attenuate;
    // On EMERGENCE, collapse to a crisp star dot.
    sizePx = mix(sizePx, 1.6 * attenuate, uEmergence);
    // Per-particle size variation.
    sizePx *= (0.8 + 0.4 * aRandom.z);
    gl_PointSize = clamp(sizePx, 1.0, 160.0);

    vRandom = aRandom;
    gl_Position = clip;

    // aVelocity is intentionally a shader-visible attribute so the GPU knows
    // the motion vector at spawn — not used for displacement here (we advect
    // on CPU to allow wrap-around bookkeeping) but it carries color info and
    // future shader-side animation. Reference to keep the attribute live.
    vSpeedFrac += aVelocity.z * 0.0;
  }
`;

const streakFrag = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uVoidProgress;
  uniform float uEmergence;

  varying vec3  vRandom;
  varying vec2  vScreenDir;
  varying float vSpeedFrac;
  varying float vRadialFrac;
  varying float vEmerge;

  // Rotate gl_PointCoord so the streak long axis aligns with vScreenDir.
  // This turns each square billboard into a radially-aligned smear.
  vec2 orientedUV(vec2 pc, vec2 dir) {
    // Recenter [-0.5 .. 0.5]
    vec2 c = pc - 0.5;
    // Build a 2D basis where +Y = streak direction, +X = perpendicular.
    vec2 ty = dir;
    vec2 tx = vec2(ty.y, -ty.x);
    float u = dot(c, tx);
    float v = dot(c, ty);
    return vec2(u, v);
  }

  void main() {
    vec2 uv = orientedUV(gl_PointCoord, vScreenDir);

    // Width (perpendicular to streak). Thin core, soft shoulder.
    float half_w = 0.05 + 0.04 * (1.0 - vSpeedFrac);
    float w = smoothstep(half_w, 0.0, abs(uv.x));

    // Length (along streak). Head = +v direction, tail = -v. Brightness peaks
    // at the head (recent worldline position) and decays along the tail.
    float headAmp = smoothstep(-0.5, 0.5, uv.y);
    // Exponential tail so the streak has the classic Rogue-One taper.
    float tail = exp(-max(-uv.y, 0.0) * 6.0);
    float lengthProfile = mix(tail, headAmp, 0.5);

    // As EMERGENCE progresses, collapse streak to a round star — kill the
    // axial stretch and go isotropic.
    float radial = length(uv);
    float star = smoothstep(0.5, 0.0, radial);
    float shape = mix(w * lengthProfile, star, vEmerge);

    // --- Color ramp. Three waypoints: cool blue-white (deep VOID),
    // amber mid, warm gold into EMERGENCE. The radial position biases
    // each particle along the ramp (outer rim is already warmer than
    // forward-axis photons even at t=0).
    vec3 cBlue  = vec3(0.72, 0.86, 1.10);
    vec3 cAmber = vec3(1.00, 0.66, 0.28);
    vec3 cGold  = vec3(1.00, 0.88, 0.55);

    float ramp = clamp(uVoidProgress * 0.6 + vRadialFrac * 0.5, 0.0, 1.0);
    vec3 col = mix(cBlue, cAmber, ramp);
    col = mix(col, cGold, vEmerge);

    // Per-particle chromatic tint so the field isn't uniform.
    col *= mix(vec3(0.9, 0.95, 1.1), vec3(1.1, 1.0, 0.85), vRandom.x);

    // Brightness envelope:
    //   - speedFrac pumps up moving streaks during VOID
    //   - on EMERGENCE, fade toward a quiet star brightness (~0.35)
    float voidBrightness = 0.6 + 1.8 * vSpeedFrac;
    float emergeBrightness = 0.25 + 0.35 * vRandom.z;
    float brightness = mix(voidBrightness, emergeBrightness, vEmerge);

    float alpha = shape * brightness;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(col * brightness, alpha);
  }
`;

// Spacetime-grid shaders. Points-based, hyperbolically warped.
const gridVert = /* glsl */ `
  uniform float uTime;
  uniform float uWarp;     // warp strength, driven by phase
  uniform float uEmergence;

  varying float vDepth;
  varying float vAxisDist;

  void main() {
    vec3 p = position;

    // Hyperbolic warp: points drift toward the forward axis as they get
    // closer, like spacetime funneling into a singularity.
    float radial = length(p.xy);
    vec2 toward = radial > 1e-4 ? -p.xy / radial : vec2(0.0);
    // 1/(d+1) profile with depth dependence so the funnel narrows
    // as z advances (from far -> near).
    float zFrac = clamp((p.z + 200.0) / 220.0, 0.0, 1.0);
    float pull = (1.0 / (radial * 0.08 + 1.0)) * uWarp * (0.2 + zFrac);
    p.xy += toward * pull * radial * 0.35;

    // Gentle breathing along z so the lattice isn't rigid.
    p.z += sin(uTime * 0.7 + p.x * 0.2 + p.y * 0.17) * 0.15;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    vAxisDist = length(p.xy);

    float attenuate = 280.0 / max(-mv.z, 1.0);
    float sz = 1.4 * attenuate * (1.0 - uEmergence * 0.6);
    gl_PointSize = clamp(sz, 1.0, 4.0);

    gl_Position = projectionMatrix * mv;
  }
`;

const gridFrag = /* glsl */ `
  precision highp float;

  uniform float uEmergence;

  varying float vDepth;
  varying float vAxisDist;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);

    // Distance fade so the grid disappears near the camera (feels volumetric).
    float depthFade = smoothstep(1.5, 18.0, vDepth) * smoothstep(220.0, 40.0, vDepth);
    // Axis fade — the grid thins near the forward axis so the void stays clear.
    float axisFade = smoothstep(0.2, 3.0, vAxisDist);

    float a = soft * depthFade * axisFade * 0.08 * (1.0 - uEmergence);
    // Lime #B8FF3C -> (0.721, 1.0, 0.235).
    gl_FragColor = vec4(0.721, 1.0, 0.235, a);
  }
`;

// ------------------------------------------------------------------------
// Component
// ------------------------------------------------------------------------

// Small local PRNG so the layout is deterministic across renders.
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

type StreakBuffers = {
  positions: Float32Array;
  aRandom: Float32Array;
  aVelocity: Float32Array;
  // CPU-only book-keeping (kept out of GPU attributes):
  speeds: Float32Array; // scalar base speed per particle
};

function buildStreakBuffers(): StreakBuffers {
  const rand = mulberry32(0xA1DEC0DE);
  const positions = new Float32Array(N_STREAKS * 3);
  const aRandom = new Float32Array(N_STREAKS * 3);
  const aVelocity = new Float32Array(N_STREAKS * 3);
  const speeds = new Float32Array(N_STREAKS);

  const rRange = SHELL_OUTER - SHELL_INNER;
  const zRange = Z_FRONT - Z_BACK;
  for (let i = 0; i < N_STREAKS; i++) {
    // Cylindrical shell — never inside SHELL_INNER.
    // sqrt distribution so particles are area-uniform in the ring.
    const u = rand();
    const r = Math.sqrt(u) * rRange + SHELL_INNER;
    const theta = rand() * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    // Uniform z spread so the tunnel is filled from the start.
    const z = Z_BACK + rand() * zRange;

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    aRandom[i * 3 + 0] = rand();
    aRandom[i * 3 + 1] = rand();
    aRandom[i * 3 + 2] = rand();

    // Velocity: mostly +z (toward camera), tiny radial drift scaled by aRandom.
    const baseSpeed = 40 + rand() * 90;
    speeds[i] = baseSpeed;
    // Slight axial drift inward so distant streaks curve toward the void mouth.
    const axialDrift = -0.08; // toward axis
    aVelocity[i * 3 + 0] = (x / Math.max(r, 1e-4)) * axialDrift * baseSpeed;
    aVelocity[i * 3 + 1] = (y / Math.max(r, 1e-4)) * axialDrift * baseSpeed;
    aVelocity[i * 3 + 2] = baseSpeed;
  }

  return { positions, aRandom, aVelocity, speeds };
}

function buildGridBuffer(): Float32Array {
  const count = GRID_RES * GRID_RES * GRID_RES;
  const arr = new Float32Array(count * 3);
  const span = 80; // XY extent
  let idx = 0;
  for (let ix = 0; ix < GRID_RES; ix++) {
    for (let iy = 0; iy < GRID_RES; iy++) {
      for (let iz = 0; iz < GRID_RES; iz++) {
        const fx = (ix / (GRID_RES - 1) - 0.5) * 2;
        const fy = (iy / (GRID_RES - 1) - 0.5) * 2;
        const fz = iz / (GRID_RES - 1);
        arr[idx++] = fx * span;
        arr[idx++] = fy * span;
        arr[idx++] = -200 + fz * GRID_SPAN_Z;
      }
    }
  }
  return arr;
}

export default function VoidTransit() {
  const streakPointsRef = useRef<THREE.Points>(null);
  const streakMatRef = useRef<THREE.ShaderMaterial>(null);
  const gridMatRef = useRef<THREE.ShaderMaterial>(null);

  // Pull phase info imperatively via getState() inside useFrame to avoid
  // re-renders while we advect the buffer every frame.
  const sceneApi = useScene;

  const streakBuffers = useMemo<StreakBuffers>(() => buildStreakBuffers(), []);
  const gridPositions = useMemo(() => buildGridBuffer(), []);

  // Streak geometry — built once, position attribute is mutated in place.
  const streakGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(streakBuffers.positions, 3));
    g.setAttribute('aRandom', new THREE.BufferAttribute(streakBuffers.aRandom, 3));
    g.setAttribute('aVelocity', new THREE.BufferAttribute(streakBuffers.aVelocity, 3));
    // Disable frustum culling — these are all near the camera and we don't
    // want pop-out during fast motion.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
    return g;
  }, [streakBuffers]);

  const gridGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(gridPositions, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
    return g;
  }, [gridPositions]);

  const streakUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPhaseTime: { value: 0 },
      uVoidProgress: { value: 0 },
      uEmergence: { value: 0 },
      uSpeedScale: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  const gridUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWarp: { value: 1 },
      uEmergence: { value: 0 },
    }),
    []
  );

  useFrame((state, dt) => {
    // Clamp dt so a stutter (tab switch, GC) doesn't teleport particles.
    const step = Math.min(dt, 0.05);
    const { phase, phaseStart } = sceneApi.getState();
    const t = phaseTime(phaseStart);

    // ---- Phase-driven scalars ----------------------------------------
    // VOID phase: ramp up 0->1 quickly, then hold at 1.
    // EMERGENCE: independent 0..1 ramp — drives the "slowdown to stars" blend.
    const voidProgress =
      phase === 'VOID' ? Math.min(1, t / 0.5) : phase === 'EMERGENCE' ? 1 : 0;

    const emergence =
      phase === 'EMERGENCE' ? Math.min(1, t / 1.5) : 0;

    // Speed multiplier: peak during VOID, decays through EMERGENCE.
    // Small asymmetric curve: quick ramp-in, exponential tail-off.
    const voidSpeed = phase === 'VOID' ? 1.0 + 0.2 * Math.sin(t * 3.0) : 0.0;
    const emergeSpeed =
      phase === 'EMERGENCE' ? Math.max(0, 1.0 - emergence) * (0.7 - emergence * 0.5) : 0;
    const speedMul = phase === 'VOID' ? voidSpeed : emergeSpeed;

    streakUniforms.uTime.value += step;
    streakUniforms.uPhaseTime.value = t;
    streakUniforms.uVoidProgress.value = voidProgress;
    streakUniforms.uEmergence.value = emergence;
    streakUniforms.uSpeedScale.value = speedMul;
    streakUniforms.uResolution.value.set(state.size.width, state.size.height);

    gridUniforms.uTime.value += step;
    // Warp strength breathes gently during VOID, releases during EMERGENCE.
    gridUniforms.uWarp.value = voidProgress * (1.0 - emergence) * (1.0 + 0.15 * Math.sin(t * 1.3));
    gridUniforms.uEmergence.value = emergence;

    // ---- Streak advection --------------------------------------------
    if (!streakPointsRef.current) return;
    const attr = streakPointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const pos = attr.array as Float32Array;
    const vel = streakBuffers.aVelocity;
    const speeds = streakBuffers.speeds;

    // Global frame speed; during EMERGENCE this eases toward 0 so streaks
    // freeze into place and become the universe's background stars.
    const globalSpeed = phase === 'VOID' ? 1.0 : phase === 'EMERGENCE' ? 1.0 - emergence : 0.0;
    if (globalSpeed <= 0.0001) return;

    for (let i = 0; i < N_STREAKS; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;

      // Time-dilation tau: particles near the forward axis barely move.
      // tau = smoothstep(0, shell_mid, r). r<shell_inner yields tau=0 (frozen).
      const x = pos[ix];
      const y = pos[iy];
      const r = Math.sqrt(x * x + y * y);
      const tau =
        r < SHELL_INNER ? 0 : Math.min(1, (r - SHELL_INNER) / 8.0);

      const s = speeds[i] * globalSpeed * tau;
      pos[ix] += vel[ix] * step * globalSpeed * tau * 0.02;
      pos[iy] += vel[iy] * step * globalSpeed * tau * 0.02;
      pos[iz] += s * step;

      // Wrap: once past the camera, respawn at the back at a new radius.
      if (pos[iz] > Z_FRONT) {
        pos[iz] = Z_BACK;
        // Respawn at a new radial position & angle — keeps the field fresh
        // without needing to reshuffle everything.
        const u = streakBuffers.aRandom[ix]; // reuse stable rand
        const theta = streakBuffers.aRandom[iy] * Math.PI * 2;
        const nr = Math.sqrt(u) * (SHELL_OUTER - SHELL_INNER) + SHELL_INNER;
        pos[ix] = Math.cos(theta) * nr;
        pos[iy] = Math.sin(theta) * nr;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <group>
      {/* Spacetime lattice (render first so streaks composite over it) */}
      <points geometry={gridGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={gridMatRef}
          vertexShader={gridVert}
          fragmentShader={gridFrag}
          uniforms={gridUniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Hyperspace streaks */}
      <points ref={streakPointsRef} geometry={streakGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={streakMatRef}
          vertexShader={streakVert}
          fragmentShader={streakFrag}
          uniforms={streakUniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
