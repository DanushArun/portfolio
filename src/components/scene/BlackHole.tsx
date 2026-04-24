'use client';

/**
 * Physics-accurate Schwarzschild black hole renderer.
 *
 * Core technique: iterative null-geodesic ray marching in curved spacetime.
 * The geodesic equation for a photon in Schwarzschild geometry (BH at origin,
 * natural units c=1, Rs=1):
 *
 *   d²x⃗/dλ² = -(3Rs/2) · h² / r⁵ · x⃗
 *
 * where h² = r² - (x⃗·v̂)² is the square of the specific angular momentum
 * (h = |x⃗ × v̂|, conserved along null geodesics).
 *
 * By marching with small steps and detecting every equatorial plane crossing,
 * we naturally obtain:
 *   - The correct circular event-horizon shadow (b < b_c = 3√3/2 · Rs ≈ 2.598)
 *   - Primary accretion disk (direct ray)
 *   - Secondary disk image (ray bent around the near side)
 *   - Photon ring (near-critical rays that orbit once before escaping)
 *   - Gravitational lensing of background stars
 *
 * Accretion disk physics:
 *   - Novikov–Thorne temperature profile: T ∝ r^(-¾) · (1 - √(r_isco/r))^¼
 *   - Relativistic Doppler beaming: I_obs = g⁴ · I_emit,
 *     where g = 1/(γ(1 - β·n̂_obs))
 *   - Keplerian orbital velocity: v = √(Rs / 2r)
 *   - Gravitational redshift: g_grav = √(1 - Rs/r)
 *   - Multi-scale turbulence (large eddies + filaments) + log-spiral density waves
 *
 * References:
 *   oseiskar.github.io/black-hole/docs/physics.html
 *   github.com/brunosimon/webgl-black-hole
 *   James & Thorne (2015), "Gravitational lensing by spinning black holes"
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { hash33, fbm3, snoise3 } from '@/lib/shaders/noise';
import { useScene, phaseTime } from '@/lib/scene-state';

// ─────────────────────────────────────────────────────────────────────────────
// Vertex shader — fullscreen quad, reconstruct world-space ray
// ─────────────────────────────────────────────────────────────────────────────
const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldDir;
void main() {
  vUv = uv;
  vec4 ndc  = vec4(position.xy, 1.0, 1.0);
  vec4 view = inverse(projectionMatrix) * ndc;
  view /= view.w;
  vWorldDir = normalize((inverse(viewMatrix) * vec4(view.xyz, 0.0)).xyz);
  gl_Position = ndc;
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Fragment shader
// ─────────────────────────────────────────────────────────────────────────────
const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec3 vWorldDir;

uniform vec3  uCamPos;
uniform float uTime;
uniform float uRs;        // Schwarzschild radius (world-space; set to 1.0)
uniform float uDiskTilt;  // disk inclination in radians
uniform float uThreshold; // 0..1 animation driver

${hash33}
${snoise3}
${fbm3}

// ── Physical constants (in units where Rs = uRs) ────────────────────────────
#define STEPS     96
#define ESCAPE    62.0
// ISCO = 3Rs for Schwarzschild (innermost stable circular orbit)
// b_crit = 3√3/2 · Rs ≈ 2.598 · Rs (photon-capture impact parameter)
#define RI        (uRs * 3.0)
#define RO        (uRs * 11.5)
#define B_CRIT    (uRs * 2.5981)

// ── Procedural starfield ────────────────────────────────────────────────────
vec3 bgStars(vec3 d) {
  vec3 col = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float sc  = 42.0 + float(i) * 88.0;
    vec3  p   = d * sc;
    vec3  h   = hash33(floor(p));
    float dst = length(fract(p) - 0.5 - h * 0.38);
    float tw  = 0.65 + 0.35 * sin(h.x * 17.3 + uTime * (0.18 + h.y * 0.35));
    float b   = smoothstep(0.032, 0.0, dst) * (0.15 + h.z * 0.62) * tw;
    col += b * mix(vec3(0.58,0.76,1.0), vec3(1.0,0.90,0.68), fract(h.x*6.8)) * 0.52;
  }
  // Faint milky-way band
  float band = exp(-pow(d.y * 4.2, 2.0));
  float mw   = fbm3(d * 2.3, 4, 2.0, 0.5) * 0.5 + 0.5;
  col += band * mw * vec3(0.025, 0.035, 0.072) * 0.38;
  return col;
}

// ── Blackbody color ramp ────────────────────────────────────────────────────
// t = 0 → deep red/dark (cool outer disk)
// t = 1 → blue-white (inner ISCO wall, >10^7 K)
// Steeper gradient gives harder contrast between hot ring and outer disk.
vec3 bbColor(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.18)      return mix(vec3(0.30,0.02,0.01), vec3(0.75,0.18,0.04), t/0.18);
  if (t < 0.42)      return mix(vec3(0.75,0.18,0.04), vec3(1.00,0.68,0.22), (t-0.18)/0.24);
  if (t < 0.68)      return mix(vec3(1.00,0.68,0.22), vec3(1.00,0.96,0.78), (t-0.42)/0.26);
                     return mix(vec3(1.00,0.96,0.78), vec3(0.82,0.90,1.00), (t-0.68)/0.32);
}

// ── Disk emission at a disk-plane crossing point ────────────────────────────
// diskPos:     position in DISK-LOCAL coordinates (disk is the y=0 plane here)
// viewDirDisk: ray direction in disk-local coordinates
vec3 diskEmission(vec3 diskPos, vec3 viewDirDisk) {
  float r = length(diskPos.xz);
  if (r < RI * 0.88 || r > RO * 1.06) return vec3(0.0);

  float theta = atan(diskPos.z, diskPos.x);

  // Novikov-Thorne temperature profile
  // T ~ r^(-3/4) * (1 - sqrt(rISCO/r))^(1/4), extra pow(0.7) steepens gradient
  float tNorm = 0.0;
  if (r > RI) {
    float x = r / RI;
    float base = pow(1.0/x, 0.75) * pow(max(0.0, 1.0 - inversesqrt(x)), 0.25);
    tNorm = pow(base, 0.70);  // steeper drop-off from ISCO to outer disk
  }
  tNorm = clamp(tNorm, 0.0, 1.0);

  // ── Gravitational redshift: g_grav = √(1 − Rs/r) ──
  float gGrav = sqrt(max(0.0, 1.0 - uRs / r));

  // ── Keplerian orbital velocity v = √(Rs / 2r) ──
  float v = sqrt(uRs / (2.0 * r));
  v = clamp(v, 0.0, 0.87);

  // Prograde tangential direction in disk-local XZ plane
  vec2  tang = normalize(vec2(-diskPos.z, diskPos.x));
  vec3  vel  = vec3(tang.x, 0.0, tang.y) * v;

  // ── Relativistic Doppler beaming: I_obs = g^4 · I_emit ──
  // g = 1 / (γ(1 − β·n̂_obs))
  // g^4: two powers from solid-angle (beaming) + two from photon energy shift
  float beta_n = dot(vel, -viewDirDisk);
  float gamma  = 1.0 / sqrt(max(1.0 - v*v, 0.001));
  float gDopp  = 1.0 / (gamma * (1.0 - beta_n) + 1e-5);
  float beam   = pow(clamp(gDopp, 0.02, 10.0), 4.0);

  // ── Radial structure ──
  // Sharp ISCO inner wall; gentle power-law taper to outer edge
  float radial = smoothstep(RI - uRs*0.08, RI + uRs*0.55, r)
               * smoothstep(RO + uRs*0.4,  RO - uRs*1.8,  r);

  // ── Multi-scale turbulence (large eddies + fine filaments) ──
  // 2 octaves (was 3) per fbm for better GPU performance.
  vec3 np1 = vec3(cos(theta)*r*0.26, sin(theta)*r*0.26, uTime*0.042);
  vec3 np2 = vec3(cos(theta)*r*1.05, sin(theta)*r*1.05, uTime*0.155);
  float tb = clamp(0.52 + 0.32*fbm3(np1,2,2.0,0.55) + 0.23*fbm3(np2,2,2.2,0.50),
                   0.18, 1.75);

  // ── Log-spiral density waves (self-gravity pattern) ──
  float dw = 0.83 + 0.24*sin(log(max(r, 0.1))*7.8 - uTime*0.38 + theta*1.9);

  // ── Radial dust lanes (dark rifts) ──
  float lane = 1.0 - 0.62 * smoothstep(0.0, 0.26, -sin(theta*3.1)*sin(theta*4.9+0.5))
             * smoothstep(RI, (RI+RO)*0.48, r) * (1.0-smoothstep((RI+RO)*0.56, RO, r));

  vec3  col       = bbColor(tNorm);
  // Intensity: temperature drives brightness cube so inner ring dominates.
  float intensity = pow(tNorm, 1.4) * radial * tb * dw * lane * beam * gGrav;

  return col * intensity * 5.5;
}

// ── Disk emission (cheap, no fbm) — for 3rd+ disk crossing ─────────────────
vec3 diskEmissionCheap(vec3 diskPos, vec3 viewDirDisk) {
  float r = length(diskPos.xz);
  if (r < RI * 0.88 || r > RO * 1.06) return vec3(0.0);
  float tNorm = (r > RI) ? clamp(pow(RI/r, 0.75) * pow(max(0.0,1.0-inversesqrt(r/RI)),0.25), 0.0, 1.0) : 0.0;
  float v = clamp(sqrt(uRs/(2.0*r)), 0.0, 0.87);
  vec2  tang = normalize(vec2(-diskPos.z, diskPos.x));
  vec3  vel  = vec3(tang.x,0.0,tang.y)*v;
  float gamma = 1.0/sqrt(max(1.0-v*v,0.001));
  float gD    = 1.0/(gamma*(1.0-dot(vel,-viewDirDisk))+1e-5);
  float beam  = pow(clamp(gD,0.04,8.0),4.0);
  float radial= smoothstep(RI-uRs*0.08, RI+uRs*0.55, r) * smoothstep(RO+uRs*0.4, RO-uRs*1.8, r);
  float gGrav = sqrt(max(0.0, 1.0-uRs/r));
  return bbColor(tNorm) * tNorm * radial * beam * gGrav * 4.2;
}

// ── Schwarzschild null geodesic — velocity-Verlet step ──────────────────────
// Geodesic equation: d(dir)/dλ = -(3Rs/2) · h²/r⁵ · pos
//   where h² = r² − (pos·dir)² is the conserved angular momentum squared
//   and dir is kept unit-length (maintained along null geodesics).
void geodStep(inout vec3 pos, inout vec3 dir, float h) {
  float r2  = dot(pos, pos);
  float r   = sqrt(r2);
  float r4  = r2 * r2;
  float r5  = r4 * r;
  float pd  = dot(pos, dir);
  float h2  = max(0.0, r2 - pd*pd);
  // Schwarzschild geodesic: a = -(3Rs/2) * h^2 / r^5 * pos
  vec3  acc = -(1.5 * uRs * h2 / r5) * pos;
  dir = normalize(dir + acc * h);
  pos = pos + dir * h;
}

// ────────────────────────────────────────────────────────────────────────────
void main() {
  vec3 ro = uCamPos;
  vec3 rd = normalize(vWorldDir);

  // ── Disk tilt: rotation around X by uDiskTilt ──
  // "toDisk" maps world-space positions to disk-local coords.
  // In disk-local coords, the accretion disk lies in the y=0 plane.
  float ca    = cos(uDiskTilt);
  float sa    = sin(uDiskTilt);
  mat3  toDisk = mat3(1.0, 0.0, 0.0,
                      0.0,  ca,  sa,
                      0.0, -sa,  ca);

  // Accumulated disk emission + transmission tracking
  vec3  diskAccum  = vec3(0.0);
  float diskTrans  = 1.0;   // remaining transparency (starts fully transparent)
  int   nCross     = 0;     // disk-plane crossing count

  vec3 pos    = ro;
  vec3 dir    = rd;
  bool captured = false;

  // Pre-compute disk-space y of starting position
  vec3 prevDisk = toDisk * pos;

  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);

    // Event horizon capture: shadow radius ≈ Rs (geometric interior)
    if (r < uRs * 0.97) { captured = true; break; }

    // Escaped to background
    if (r > ESCAPE) break;

    // Adaptive step: ~0.09 at photon sphere (r=1.5Rs), 1.5 far out.
    // Finer near the photon sphere gives sharper photon ring.
    float h = clamp(0.30 * (r/uRs - 0.96), 0.04, 1.5);

    vec3 preDisk = prevDisk;

    // Advance along geodesic (Schwarzschild curved spacetime)
    geodStep(pos, dir, h);

    vec3 postDisk = toDisk * pos;

    // Disk plane crossing detection
    if (preDisk.y * postDisk.y < 0.0) {
      // Linear interpolate between pre and post to find exact crossing in disk coords
      float frac     = preDisk.y / (preDisk.y - postDisk.y);
      vec3  crossDisk = preDisk + (postDisk - preDisk) * frac;
      float crossR   = length(crossDisk.xz);

      if (crossR > RI * 0.86 && crossR < RO * 1.07 && nCross < 4) {
        vec3 viewDirDisk = toDisk * dir;
        vec3 emit;
        if (nCross < 2) {
          // Full physics emission for primary + secondary image
          emit = diskEmission(crossDisk, viewDirDisk);
        } else {
          // Cheap approximation for tertiary+ (photon ring territory)
          emit = diskEmissionCheap(crossDisk, viewDirDisk);
        }

        // Front-to-back compositing; each successive image dimmer
        // (physical: each extra geodesic loop loses ~e^{-π} ≈ 4% intensity)
        float crossWeight = diskTrans * exp(-float(nCross) * 0.68);
        diskAccum += emit * crossWeight;
        diskTrans *= 0.48;
        nCross++;
      }
    }

    prevDisk = postDisk;
  }

  vec3 color;

  if (captured) {
    // ── Event horizon shadow — physically black ──
    // The photon ring emerges naturally from near-critical geodesics above.
    // We add a thin analytic ring as visual insurance at lower step counts.
    color = vec3(0.0);

    // Disk contributions from rays that crossed disk before capture
    color += diskAccum;

    // Analytic photon ring: bright at angular radius b_crit / dist
    float dist0   = length(ro);
    float cosA    = dot(rd, normalize(-ro));
    float angSep  = acos(clamp(cosA, -1.0, 1.0));
    float critA   = B_CRIT / dist0;

    // Three sub-bands (primary, secondary, tertiary photon ring)
    // Each successive ring is fainter and tighter (magnification diverges)
    // Primary photon ring: thin, very bright
    float pr1 = exp(-pow((angSep - critA)         / (critA * 0.009), 2.0));
    // Secondary and tertiary (each successive image is sqrt-dimmer + tighter)
    float pr2 = exp(-pow((angSep - critA * 1.018) / (critA * 0.006), 2.0));
    float pr3 = exp(-pow((angSep - critA * 1.034) / (critA * 0.004), 2.0));
    color += vec3(1.00, 0.95, 0.72) * pr1 * 7.0;
    color += vec3(0.95, 0.78, 0.40) * pr2 * 3.0;
    color += vec3(0.88, 0.62, 0.24) * pr3 * 1.2;

    // Soft warm halo just inside the photon ring (scattered corona emission)
    float halo = exp(-pow((angSep - critA * 0.97) / (critA * 0.06), 2.0));
    color += vec3(0.75, 0.40, 0.10) * halo * 0.45;

  } else {
    // ── Escaped — background + lensed disk images ──
    float bgMask = clamp(1.0 - float(nCross) * 0.35, 0.0, 1.0);
    color = bgStars(dir) * bgMask;
    color += diskAccum;
  }

  // ── Threshold phase: chromatic aberration + vignette collapse ──
  if (uThreshold > 0.01) {
    vec2  ctr = vUv - 0.5;
    float d   = length(ctr);
    float cs  = uThreshold * 0.036;
    color.r = mix(color.r, bgStars(normalize(vWorldDir + vec3(ctr, 0.0)*cs)).r,
                  uThreshold * 0.38);
    color.b = mix(color.b, bgStars(normalize(vWorldDir - vec3(ctr, 0.0)*cs)).b,
                  uThreshold * 0.38);
    color  *= mix(1.0, smoothstep(0.90, 0.06, d), uThreshold);
  }

  // ── ACES filmic tonemap ──
  // Shoulder + toe prevent blown highlights while keeping deep blacks.
  color = max(vec3(0.0), color);
  color = (color*(2.51*color + 0.03)) / (color*(2.43*color + 0.59) + 0.14);

  gl_FragColor = vec4(color, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// React component
// ─────────────────────────────────────────────────────────────────────────────
export default function BlackHole() {
  const matRef  = useRef<THREE.ShaderMaterial>(null);
  const { camera, size } = useThree();
  const scene   = useScene();

  // Handheld camera breath — two-octave Lissajous drift so it never repeats
  const breath  = useMemo(() => new THREE.Vector3(), []);
  const basePos = useMemo(() => new THREE.Vector3(), []);

  const uniforms = useMemo(
    () => ({
      uCamPos:    { value: new THREE.Vector3() },
      uTime:      { value: 0 },
      uRs:        { value: 1.0 },
      uDiskTilt:  { value: 0.28 },
      uThreshold: { value: 0.0 },
    }),
    []
  );

  useFrame((_, dt) => {
    if (!matRef.current) return;
    uniforms.uTime.value += dt;

    const t   = uniforms.uTime.value;
    const AMP = 0.038;
    breath.set(
      (Math.sin(t * 1.88) * 0.6 + Math.sin(t * 4.39 + 1.3) * 0.4) * AMP,
      (Math.sin(t * 2.64 + 0.7) * 0.55 + Math.sin(t * 3.45 + 2.1) * 0.45) * AMP * 0.75,
      (Math.sin(t * 4.39 + 1.3) * 0.3 + Math.sin(t * 3.45 + 2.1) * 0.3) * AMP * 0.4
    );
    basePos.copy(camera.position);
    uniforms.uCamPos.value.copy(basePos).add(breath);

    if (scene.phase === 'THRESHOLD') {
      uniforms.uThreshold.value = Math.min(1, phaseTime(scene.phaseStart) / 1.2);
    } else if (scene.phase === 'IDLE') {
      uniforms.uThreshold.value = 0;
    } else {
      uniforms.uThreshold.value = 1;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
