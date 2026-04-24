'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { hash33, snoise3, fbm3 } from '@/lib/shaders/noise';

/**
 * Racing Planet — Formula Manipal.
 *
 * A rocky, basalt-colored planet (radius 2.2) with the Kari Motor Speedway
 * circuit carved into its northern hemisphere as a luminous green trench.
 * A small FM23e car orbits the track with a 84-second lap time (matching
 * the real 1:24 we recorded at Formula Bharat 2024).
 *
 * Rendering strategy:
 *   - Planet body: SphereGeometry with a custom ShaderMaterial whose
 *     vertex stage applies fbm-based displacement (no displacementMap texture
 *     needed — the noise is computed on the GPU per-frame).
 *   - Track: a TubeGeometry following a CatmullRomCurve3 at radius ~2.28,
 *     tilted onto the northern hemisphere. Emissive lime material, with a
 *     traveling gradient implemented via an animated uniform + per-vertex
 *     arc length.
 *   - Car: an emissive box following `curve.getPointAt((t / 84) % 1)`.
 *   - Atmosphere: a slightly larger back-facing sphere with a fresnel-green
 *     glow. Cheap, no raymarching.
 */

const LAP_SECONDS = 84;
const PLANET_RADIUS = 2.2;
const TRACK_RADIUS = 2.28; // sits just above the crust
const TRACK_TUBE_RADIUS = 0.045;
const TRACK_TILT = -0.35; // radians — tilts track onto northern hemisphere

// ────────────────────────────────────────────────────────────────────────────
// Planet shader — rocky basalt surface with fbm displacement & AO
// ────────────────────────────────────────────────────────────────────────────

const planetVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPos;
varying float vElev;

${hash33}
${snoise3}
${fbm3}

uniform float uTime;

void main() {
  vec3 p = position;
  // fbm-based displacement in object space
  float e = fbm3(p * 1.4, 5, 2.1, 0.55);
  // ridged component for sharper relief
  float ridge = 1.0 - abs(fbm3(p * 2.3 + 11.0, 4, 2.0, 0.5));
  e = e * 0.6 + ridge * 0.35;
  float disp = e * 0.13;
  vec3 displaced = p + normal * disp;

  vElev = e;
  vPos = displaced;
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const planetFrag = /* glsl */ `
precision highp float;
varying vec3 vNormal;
varying vec3 vPos;
varying float vElev;

uniform vec3 uLightDir;

void main() {
  // Basalt palette — dark, slightly warm
  vec3 lowCol  = vec3(0.055, 0.055, 0.063);  // deep basalt
  vec3 midCol  = vec3(0.14, 0.13, 0.12);     // weathered rock
  vec3 highCol = vec3(0.24, 0.22, 0.18);     // exposed highlands

  float t = clamp(vElev * 0.5 + 0.5, 0.0, 1.0);
  vec3 rock = mix(lowCol, midCol, smoothstep(0.2, 0.55, t));
  rock = mix(rock, highCol, smoothstep(0.6, 0.9, t));

  // Lambertian + slight ambient
  float lam = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  float amb = 0.12;
  // Ambient occlusion baked into crevasses (low elev = darker)
  float ao = mix(0.55, 1.0, smoothstep(0.0, 0.6, t));

  vec3 col = rock * (amb + lam) * ao;

  // Faint green rim from atmosphere bleed
  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
  col += vec3(0.12, 0.32, 0.08) * rim * 0.25;

  gl_FragColor = vec4(col, 1.0);
}
`;

// ────────────────────────────────────────────────────────────────────────────
// Track shader — emissive lime with traveling gradient
// ────────────────────────────────────────────────────────────────────────────

const trackVert = /* glsl */ `
varying float vU;
varying vec3 vNormal;

void main() {
  // uv.x is parametric along the tube length
  vU = uv.x;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const trackFrag = /* glsl */ `
precision highp float;
varying float vU;
varying vec3 vNormal;

uniform float uTime;
uniform vec3  uGlowColor;

void main() {
  // Traveling bright pulse — cars racing along the circuit
  float pulse = 0.0;
  for (int i = 0; i < 3; i++) {
    float phase = float(i) / 3.0;
    float head  = fract(uTime / 84.0 + phase);
    float d = abs(vU - head);
    d = min(d, 1.0 - d);             // wrap-around distance on closed loop
    pulse += exp(-d * 90.0) * 1.4;
  }

  // Soft base glow along whole track
  float base = 0.55;
  float intensity = base + pulse;
  gl_FragColor = vec4(uGlowColor * intensity, 1.0);
}
`;

// ────────────────────────────────────────────────────────────────────────────
// Kari Motor Speedway — simplified closed-loop approximation
// ────────────────────────────────────────────────────────────────────────────
//
// The real Kari is a 2.1 km tight technical circuit. We parameterize 16
// control points around a unit circle and perturb them to sketch the
// characteristic long straight + hairpin + triple-apex complex. The
// CatmullRomCurve3 will smoothly interpolate and close the loop.

function buildTrackCurve(): THREE.CatmullRomCurve3 {
  // Shape constants expressed as (radius_scale, angle_offset, y_offset).
  // Angles sweep full 2π for a closed loop.
  const raw: Array<[number, number, number]> = [
    [1.0,  0.0,   0.0],   // start/finish straight begin
    [1.1,  0.35,  0.01],  // long right curve out
    [1.15, 0.7,   0.0],   // end of back straight
    [0.88, 0.95,  0.02],  // hairpin apex
    [0.78, 1.1,   0.0],   // hairpin exit
    [0.95, 1.4,   0.01],
    [1.05, 1.75, -0.01],
    [1.0,  2.1,   0.0],
    [0.9,  2.45,  0.02],  // triple-apex 1
    [0.82, 2.7,   0.01],  // triple-apex 2
    [0.92, 3.0,   0.0],
    [1.08, 3.35,  0.02],
    [1.1,  3.75, -0.01],  // fast sweeper
    [0.95, 4.15,  0.0],
    [0.85, 4.6,   0.02],  // chicane
    [0.98, 5.05,  0.0],
    [1.1,  5.45,  0.01],
    [1.05, 5.85,  0.0],
  ];

  const points = raw.map(([r, a, dy]) => {
    // Place on a flat ring at y ≈ 0, then the tilt is applied at the
    // group level to position it on the northern hemisphere.
    const x = Math.cos(a) * TRACK_RADIUS * r;
    const z = Math.sin(a) * TRACK_RADIUS * r;
    const y = dy * TRACK_RADIUS;
    return new THREE.Vector3(x, y, z);
  });

  const curve = new THREE.CatmullRomCurve3(points, /* closed */ true, 'catmullrom', 0.5);
  return curve;
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

type Props = {
  position?: [number, number, number];
  orbit?: { radius: number; speed: number; phase: number };
  receiveRim?: boolean;
};

export default function RacingPlanet({
  position = [5, 4, 14],
  orbit,
  receiveRim: _receiveRim = false,
}: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const trackGroupRef = useRef<THREE.Group>(null);
  const carRef = useRef<THREE.Mesh>(null);
  const planetMatRef = useRef<THREE.ShaderMaterial>(null);
  const trackMatRef = useRef<THREE.ShaderMaterial>(null);

  // Curve and geometry — memoised so we only build once
  const { curve, trackGeom } = useMemo(() => {
    const c = buildTrackCurve();
    const g = new THREE.TubeGeometry(c, 256, TRACK_TUBE_RADIUS, 12, true);
    return { curve: c, trackGeom: g };
  }, []);

  // Shader uniforms
  const planetUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLightDir: { value: new THREE.Vector3(1, 0.6, 0.8).normalize() },
    }),
    []
  );

  const trackUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGlowColor: { value: new THREE.Color('#B8FF3C') },
    }),
    []
  );

  // Reused scratch vector for car position updates
  const carPos = useRef(new THREE.Vector3());
  const carTangent = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const elapsed = state.clock.elapsedTime;

    // Orbital drift around scene origin (optional).
    if (orbit && rootRef.current) {
      rootRef.current.position.x = Math.cos(elapsed * orbit.speed + orbit.phase) * orbit.radius;
      rootRef.current.position.z = Math.sin(elapsed * orbit.speed + orbit.phase) * orbit.radius;
      rootRef.current.position.y = position[1];
    }

    // Rotate the planet (and its attached track group) slowly
    if (planetRef.current) {
      planetRef.current.rotation.y += dt * 0.04;
    }
    if (trackGroupRef.current) {
      trackGroupRef.current.rotation.y += dt * 0.04;
    }

    // Drive shader time
    if (planetMatRef.current) planetMatRef.current.uniforms.uTime.value = elapsed;
    if (trackMatRef.current) trackMatRef.current.uniforms.uTime.value = elapsed;

    // Car progresses along the curve at 1 lap per LAP_SECONDS
    if (carRef.current) {
      const u = (elapsed / LAP_SECONDS) % 1;
      curve.getPointAt(u, carPos.current);
      curve.getTangentAt(u, carTangent.current);
      carRef.current.position.copy(carPos.current);
      // Orient car along track tangent
      const lookTarget = carPos.current.clone().add(carTangent.current);
      carRef.current.lookAt(lookTarget);
    }
  });

  return (
    <group ref={rootRef} position={position}>
      {/* Planet body */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[PLANET_RADIUS, 128, 128]} />
        <shaderMaterial
          ref={planetMatRef}
          vertexShader={planetVert}
          fragmentShader={planetFrag}
          uniforms={planetUniforms}
        />
      </mesh>

      {/* Atmosphere glow — back-faced sphere with fresnel green tint.
          Using meshBasicMaterial with BackSide is cheap and reads well. */}
      <mesh scale={1.08}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#B8FF3C"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Track group — tilts the ring so it crosses the northern hemisphere,
          then rotates with the planet via useFrame. */}
      <group ref={trackGroupRef} rotation={[TRACK_TILT, 0, 0.12]}>
        <mesh geometry={trackGeom}>
          <shaderMaterial
            ref={trackMatRef}
            vertexShader={trackVert}
            fragmentShader={trackFrag}
            uniforms={trackUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* FM23e car — tiny emissive box that follows the curve */}
        <mesh ref={carRef}>
          <boxGeometry args={[0.09, 0.045, 0.18]} />
          <meshBasicMaterial color="#F4FFD8" />
        </mesh>
      </group>

      {/* HUD — floating data panel */}
      <Html
        position={[0, PLANET_RADIUS + 1.2, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(232,228,216,0.85)',
          whiteSpace: 'nowrap',
          textAlign: 'left',
          borderLeft: '1px solid rgba(184,255,60,0.6)',
          paddingLeft: 10,
          lineHeight: 1.55,
        }}
      >
        <div style={{ color: '#B8FF3C', fontWeight: 600 }}>FORMULA MANIPAL</div>
        <div>FM23E · AUTONOMOUS EV</div>
        <div>KARI MOTOR SPEEDWAY</div>
        <div>FORMULA BHARAT 2024 · 1ST PLACE</div>
        <div style={{ color: 'rgba(184,255,60,0.75)' }}>₹60L SPONSORSHIP</div>
      </Html>
    </group>
  );
}
