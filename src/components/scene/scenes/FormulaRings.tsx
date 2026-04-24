'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 8000;
const RING_INNER     = 8;
const RING_OUTER     = 40;
const RING_THICKNESS = 0.3;

// ─────────────────────────────────────────────────────────────────────────────
// Vertex shader
//
// Orbital positions are computed on the GPU each frame from per-particle
// attributes (aAngle seed, aRadius, aSpeed). uTime advances each frame.
// uSpeed (= smoothed |scrollVelocity|) controls point size and streak width.
// ─────────────────────────────────────────────────────────────────────────────

const ringVert = /* glsl */ `
attribute float aAngle;
attribute float aRadius;
attribute float aSpeed;
attribute float aY;

uniform float uTime;
uniform float uSpeed;

varying float vAlpha;
varying float vSpeed;

void main() {
  float angle = aAngle + uTime * aSpeed;

  float x = cos(angle) * aRadius;
  float z = sin(angle) * aRadius;

  vec4 mvPosition = modelViewMatrix * vec4(x, aY, z, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Point size: grows with scroll speed to sell the motion-blur feel
  float base       = 1.8;
  float speedBoost = uSpeed * 0.8;
  gl_PointSize     = (base + speedBoost) * (120.0 / -mvPosition.z);

  // Fade at inner and outer ring edges
  float span       = ${(RING_OUTER - RING_INNER).toFixed(1)};
  float normalized = (aRadius - ${RING_INNER.toFixed(1)}) / span;
  float edgeFade   = smoothstep(0.0, 0.06, normalized) * smoothstep(1.0, 0.92, normalized);

  vAlpha = edgeFade * (0.55 + 0.45 * aSpeed * 6.0);
  vSpeed = uSpeed;
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Fragment shader
//
// At low speed: crisp circular dot.
// At high speed: elongated Gaussian streak along the tangential (U) axis of
//   the point sprite, which approximates motion-blur in orbital direction.
// ─────────────────────────────────────────────────────────────────────────────

const ringFrag = /* glsl */ `
uniform float uSpeed;

varying float vAlpha;
varying float vSpeed;

void main() {
  vec2  uv     = gl_PointCoord - 0.5;
  float streak = clamp(vSpeed * 0.12, 0.0, 0.96);

  // Anisotropic Gaussian: wide along U (orbital tangent), narrow along V
  float sigma_u = max(0.18, 0.18 + streak * 0.32);
  float sigma_v = 0.18;
  float dist    = (uv.x * uv.x) / (sigma_u * sigma_u)
                + (uv.y * uv.y) / (sigma_v * sigma_v);

  float alpha = exp(-dist) * vAlpha;
  if (alpha < 0.008) discard;

  // Silver at rest → bright white at high speed
  vec3 silver = vec3(0.75, 0.75, 0.75);
  vec3 bright = vec3(1.0,  1.0,  1.0);
  vec3 col    = mix(silver, bright, clamp(vSpeed * 0.05, 0.0, 1.0));

  gl_FragColor = vec4(col, alpha * 0.88);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Geometry — built once on mount
// ─────────────────────────────────────────────────────────────────────────────

function buildRingGeometry(): THREE.BufferGeometry {
  const angles  = new Float32Array(PARTICLE_COUNT);
  const radii   = new Float32Array(PARTICLE_COUNT);
  const speeds  = new Float32Array(PARTICLE_COUNT);
  const yCoords = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r    = RING_INNER + Math.random() * (RING_OUTER - RING_INNER);
    angles[i]  = Math.random() * Math.PI * 2;
    radii[i]   = r;
    // Keplerian-ish: inner particles orbit faster
    speeds[i]  = (0.04 / Math.sqrt(r / RING_INNER)) * (0.85 + Math.random() * 0.3);
    yCoords[i] = (Math.random() * 2 - 1) * RING_THICKNESS;
  }

  // Dummy position buffer — actual positions computed per-frame in the shader
  const dummy = new Float32Array(PARTICLE_COUNT * 3);
  const geom  = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(dummy,   3));
  geom.setAttribute('aAngle',   new THREE.BufferAttribute(angles,  1));
  geom.setAttribute('aRadius',  new THREE.BufferAttribute(radii,   1));
  geom.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds,  1));
  geom.setAttribute('aY',       new THREE.BufferAttribute(yCoords, 1));
  return geom;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene component
// ─────────────────────────────────────────────────────────────────────────────

export default function FormulaRings() {
  const matRef  = useRef<THREE.ShaderMaterial>(null);

  // Exponentially-smoothed scroll speed fed to the shader
  const smoothSpeed = useRef(0);

  const geometry = useMemo(buildRingGeometry, []);

  const uniforms = useMemo(
    () => ({
      uTime:  { value: 0 },
      uSpeed: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_state, dt) => {
    const raw = Math.abs(useScene.getState().scrollVelocity);

    // Fast rise, slow fall — snappy on scroll, graceful decay
    const rate         = raw > smoothSpeed.current ? 0.35 : 0.06;
    smoothSpeed.current += (raw - smoothSpeed.current) * Math.min(1, rate);

    uniforms.uTime.value  += dt;
    uniforms.uSpeed.value  = smoothSpeed.current;

    if (matRef.current) {
      matRef.current.uniformsNeedUpdate = true;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={ringVert}
        fragmentShader={ringFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
