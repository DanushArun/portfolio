'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { hash33, snoise3, fbm3 } from '@/lib/shaders/noise';

/**
 * RINGED GAS GIANT — represents VERONICA
 * AI vehicle inspection agent, 1,047 parts analyzed.
 *
 * Visual language:
 *   - Saturn-like gas giant with banded atmosphere (fbm in y-direction)
 *   - Amber / cream / rust terrestrial inspection palette
 *   - Ring system with EXACTLY 1047 particles, one per inspected part
 *   - Rings tilted ~18° for dramatic angle
 *   - Particles orbit the planet at slightly different radii
 */

// Total particle count must equal the project's signature number.
const PART_COUNT = 1047;
const RING_COUNT = 10;
const RING_INNER = 2.5;
const RING_OUTER = 4.5;
const PLANET_RADIUS = 1.8;
const RING_TILT_RAD = (18 * Math.PI) / 180;

const planetVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const planetFrag = /* glsl */ `
precision highp float;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

uniform float uTime;
uniform vec3  uSunDir;

${hash33}
${snoise3}
${fbm3}

// Horizontal banded atmosphere — noise driven purely by y-coordinate
// so bands wrap around the equator like Jupiter stripes.
vec3 bandedAtmosphere(vec3 localNormal) {
  // Latitude (-1 at south pole, +1 at north pole)
  float lat = localNormal.y;

  // Primary banding: sharp sinusoidal stripes warped by fbm
  float bandBase = sin(lat * 9.0);
  float turb = fbm3(vec3(localNormal.xz * 2.5, lat * 4.0 + uTime * 0.03), 5, 2.0, 0.55);
  float warpedLat = lat + turb * 0.12;
  float bands = sin(warpedLat * 11.0);

  // Secondary fine detail — cirrus-like tendrils
  float detail = fbm3(vec3(localNormal.xyz * 4.0 + vec3(0.0, uTime * 0.02, 0.0)), 4, 2.2, 0.5);

  // Map [-1, 1] -> mixing factor
  float t1 = smoothstep(-0.4, 0.4, bands);
  float t2 = smoothstep(0.0, 1.0, detail * 0.5 + 0.5);

  // Terrestrial inspection palette: amber / cream / rust
  vec3 amber  = vec3(0.95, 0.70, 0.35);   // warm amber
  vec3 cream  = vec3(0.98, 0.92, 0.78);   // cream highlights
  vec3 rust   = vec3(0.55, 0.25, 0.12);   // deep rust
  vec3 shadow = vec3(0.28, 0.15, 0.08);   // band shadow

  vec3 col = mix(rust, amber, t1);
  col = mix(col, cream, smoothstep(0.55, 0.95, bandBase) * 0.6);
  col = mix(col, shadow, smoothstep(0.6, 1.0, 1.0 - t2) * 0.35);

  // Subtle lime tint (matches project accent) near the poles
  vec3 limeTint = vec3(0.72, 1.0, 0.24);
  col = mix(col, limeTint, pow(abs(lat), 6.0) * 0.18);

  return col;
}

void main() {
  // Sample using the object-space normal so bands stay fixed to the planet
  // and rotate with the mesh.
  vec3 n = normalize(vNormal);

  // Object-space direction (ignoring the normal matrix) approximated by uv->sphere
  float lon = (vUv.x - 0.5) * 6.2831853;
  float lat = (vUv.y - 0.5) * 3.1415927;
  vec3 localN = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));

  vec3 albedo = bandedAtmosphere(localN);

  // Simple lambert with a rim for gas-giant softness
  float ndl = max(dot(n, normalize(uSunDir)), 0.0);
  float rim = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.4);

  vec3 lit = albedo * (0.35 + 0.75 * ndl);
  lit += rim * vec3(1.0, 0.85, 0.55) * 0.35;

  gl_FragColor = vec4(lit, 1.0);
}
`;

type RingedGiantProps = {
  position?: [number, number, number];
  orbit?: { radius: number; speed: number; phase: number };
  receiveRim?: boolean;
};

// Pre-compute particle positions once. Each particle sits on one of RING_COUNT
// concentric rings with a small radial jitter and orbital phase.
function buildRingParticles(): {
  positions: Float32Array;
  radii: Float32Array;
  phases: Float32Array;
} {
  const positions = new Float32Array(PART_COUNT * 3);
  const radii = new Float32Array(PART_COUNT);
  const phases = new Float32Array(PART_COUNT);

  const ringStep = (RING_OUTER - RING_INNER) / (RING_COUNT - 1);

  for (let i = 0; i < PART_COUNT; i++) {
    // Distribute particles across rings — more particles on outer rings
    // so density appears roughly uniform in area.
    const ringIndex = i % RING_COUNT;
    const baseRadius = RING_INNER + ringIndex * ringStep;
    // Small radial jitter so rings feel like dust streams, not perfect circles
    const jitter = (Math.random() - 0.5) * ringStep * 0.35;
    const r = baseRadius + jitter;

    const theta = Math.random() * Math.PI * 2;
    const yJitter = (Math.random() - 0.5) * 0.015;

    positions[i * 3 + 0] = Math.cos(theta) * r;
    positions[i * 3 + 1] = yJitter;
    positions[i * 3 + 2] = Math.sin(theta) * r;

    radii[i] = r;
    phases[i] = theta;
  }

  return { positions, radii, phases };
}

export default function RingedGiant({
  position = [20, -1, 5],
  orbit,
  receiveRim: _receiveRim = false,
}: RingedGiantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  const ringData = useMemo(buildRingParticles, []);

  const ringGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(ringData.positions, 3));
    return geom;
  }, [ringData.positions]);

  const ringMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.015,
        color: new THREE.Color('#E8FFB0'), // lime-tinted white
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        depthWrite: false,
      }),
    []
  );

  const planetUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.6, 0.3, 0.8).normalize() },
    }),
    []
  );

  // Smooth hover scale in useRef so we don't rebuild on every frame
  const targetScale = useRef(1);
  const currentScale = useRef(1);

  useFrame((state, dt) => {
    planetUniforms.uTime.value += dt;

    // Orbital drift around scene origin. Preserves tilt (applied on group already).
    if (orbit && groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.x = Math.cos(t * orbit.speed + orbit.phase) * orbit.radius;
      groupRef.current.position.z = Math.sin(t * orbit.speed + orbit.phase) * orbit.radius;
      groupRef.current.position.y = position[1];
    }

    // Slow planet rotation around y
    if (planetRef.current) {
      planetRef.current.rotation.y += dt * 0.06;
    }

    // Orbital motion of ring particles.
    // Slightly faster rings inner, slower outer — Keplerian-like feel.
    if (ringsRef.current) {
      const posAttr = ringsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < PART_COUNT; i++) {
        const r = ringData.radii[i];
        const angularSpeed = 0.08 / Math.sqrt(r); // softer falloff
        ringData.phases[i] += dt * angularSpeed;
        arr[i * 3 + 0] = Math.cos(ringData.phases[i]) * r;
        arr[i * 3 + 2] = Math.sin(ringData.phases[i]) * r;
      }
      posAttr.needsUpdate = true;
    }

    // Hover scale lerp on the group
    targetScale.current = hovered ? 1.05 : 1.0;
    currentScale.current += (targetScale.current - currentScale.current) * Math.min(1, dt * 8);
    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentScale.current);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[RING_TILT_RAD, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {/* Gas giant body */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[PLANET_RADIUS, 96, 96]} />
        <shaderMaterial
          vertexShader={planetVert}
          fragmentShader={planetFrag}
          uniforms={planetUniforms}
        />
      </mesh>

      {/* Ring system — 1,047 particles */}
      <points ref={ringsRef} geometry={ringGeometry} material={ringMaterial} />

      {/* Data HUD — fades in on hover */}
      <Html
        position={[0, PLANET_RADIUS + 1.1, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 260ms ease-out',
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '11px',
            lineHeight: 1.55,
            color: '#E8FFB0',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: '1px solid rgba(184, 255, 60, 0.35)',
            background: 'rgba(8, 12, 6, 0.78)',
            padding: '8px 12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 24px rgba(184, 255, 60, 0.12)',
          }}
        >
          <div style={{ color: '#B8FF3C', fontWeight: 600 }}>VERONICA</div>
          <div>AI VEHICLE INSPECTION AGENT</div>
          <div>1,047 PARTS ANALYZED</div>
          <div>AUTOMATED QA &middot; PRODUCTION</div>
          <div>DRIVEX &middot; 2025</div>
        </div>
      </Html>
    </group>
  );
}
