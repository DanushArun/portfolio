'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { hash33, snoise3, fbm3 } from '@/lib/shaders/noise';

/**
 * Pulsar — represents MIRA (agentic AI pipeline, 92ms latency).
 *
 * A rotating neutron star with twin opposing plasma jets. The star rotates
 * rapidly (2 Hz for visual legibility; real pulse cadence is displayed as
 * "92MS PULSE" in the HUD). A Gaussian pulse window fires at 92ms intervals
 * whenever either beam sweeps past the viewer — that IS the pulsation.
 *
 * Physics analog:
 *   - Magnetic poles misaligned with spin axis ⇒ lighthouse beam
 *   - Plasma streams channelled along field lines
 *   - Blueshifted emission on the approaching side
 *
 * Spatial layout (local to group):
 *   - Sphere at origin (neutron star)
 *   - Two cones along +Y and -Y (magnetic axis) — each length 4, tip out
 *   - Torus in XZ plane at radius 1.1 (magnetosphere)
 *   - Glow sprite on +Z for bloom
 */

// ── Jet shader: fbm-driven plasma streaks scrolling outward along jet length
const jetVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vLocalPos;
void main() {
  vUv = uv;
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const jetFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec3 vLocalPos;

uniform float uTime;
uniform float uPulse;   // 0..1 brightness envelope when beam faces camera

${hash33}
${snoise3}
${fbm3}

void main() {
  // uv.y runs 0 (tip) → 1 (base) on Three.js ConeGeometry — normalize to
  //   t = 0 at base (hot, dense) → 1 at tip (cool, diffuse)
  float t = 1.0 - vUv.y;

  // Radial coord inside cone cross-section: distance from axis, normalized.
  float r = abs(vUv.x - 0.5) * 2.0;

  // Core vs sheath — bright needle along axis, softer halo around it
  float core   = exp(-pow(r / 0.22, 2.0));
  float sheath = exp(-pow(r / 0.55, 2.0)) * 0.5;

  // Plasma turbulence — fbm scrolling outward along jet length
  vec3 np = vec3(vUv.x * 4.0, vUv.y * 8.0 - uTime * 1.8, uTime * 0.4);
  float turb = fbm3(np, 4, 2.1, 0.55);
  float filaments = 0.6 + 0.4 * turb;

  // Density falls off along length (mass conservation + radiative cooling)
  float lengthFalloff = pow(1.0 - t, 0.7);

  // Color: hot blue-white at base, deep cyan-blue at tip
  vec3 hot  = vec3(0.85, 0.96, 1.0);
  vec3 mid  = vec3(0.45, 0.75, 1.0);
  vec3 cool = vec3(0.12, 0.25, 0.85);
  vec3 col  = mix(hot, mid, smoothstep(0.0, 0.4, t));
  col       = mix(col, cool, smoothstep(0.4, 1.0, t));

  // Brightness envelope — core dominates, sheath adds volume
  float brightness = (core + sheath) * filaments * lengthFalloff;

  // Pulse boost: when the beam is swept toward camera, crank the gain.
  // Base 1.2 ensures jets remain visible off-pulse.
  brightness *= (1.2 + 3.5 * uPulse);

  // Alpha fades at the very tip and at the outer radial edge
  float alpha = brightness * smoothstep(1.0, 0.05, t) * smoothstep(1.0, 0.2, r);

  gl_FragColor = vec4(col * brightness, clamp(alpha, 0.0, 0.95));
}
`;

type PulsarProps = {
  position?: [number, number, number];
  orbit?: { radius: number; speed: number; phase: number };
  receiveRim?: boolean;
};

export default function Pulsar({
  position = [12, 2, -5],
  orbit,
  receiveRim = false,
}: PulsarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const jetTopMat = useRef<THREE.ShaderMaterial>(null);
  const jetBotMat = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState(false);

  // Each ShaderMaterial needs its own uniforms object (uPulse differs between
  // top/bottom jets as only one beam faces the camera at a time).
  const jetTopUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: 0 },
    }),
    [],
  );
  const jetBotUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: 0 },
    }),
    [],
  );

  // Pre-compute a radial glow sprite texture (cheap, one-time)
  const glowTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0.0, 'rgba(200,230,255,1.0)');
    grad.addColorStop(0.3, 'rgba(120,180,255,0.55)');
    grad.addColorStop(0.7, 'rgba(40,80,200,0.15)');
    grad.addColorStop(1.0, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Rotation rate — chosen for visual legibility (2 Hz). Real pulse cadence
  // would be 10.87 Hz (one rotation per 92ms); the HUD badge shows the true value.
  const rotationsPerSec = 2.0;
  const pulsePeriodSec = 0.092; // 92ms — shown in HUD, drives the pulse envelope

  useFrame((state, dt) => {
    // Advance shader time (use dt, not absolute time, so a paused tab doesn't jump).
    jetTopUniforms.uTime.value += dt;
    jetBotUniforms.uTime.value += dt;

    if (!groupRef.current) return;

    // Orbital drift around scene origin (if enabled). Keeps local spin intact.
    if (orbit) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.x = Math.cos(t * orbit.speed + orbit.phase) * orbit.radius;
      groupRef.current.position.z = Math.sin(t * orbit.speed + orbit.phase) * orbit.radius;
      groupRef.current.position.y = position[1];
    }

    // Spin the whole body — jets rotate rigidly with the star.
    groupRef.current.rotation.y += dt * rotationsPerSec * Math.PI * 2;

    // Pulse envelope: a narrow Gaussian in time, repeating every 92ms.
    // Peak aligns with the moment a beam is closest to camera-facing — but
    // since the rotation rate is decoupled from the pulse cadence for
    // legibility, we drive the envelope directly from wall-clock.
    const t = state.clock.elapsedTime;
    const phase = (t % pulsePeriodSec) / pulsePeriodSec; // 0..1
    // Two pulses per period (one per beam), width ~15% of period
    const pulseA = Math.exp(-Math.pow((phase - 0.0) / 0.08, 2));
    const pulseB = Math.exp(-Math.pow((phase - 0.5) / 0.08, 2));
    // Wrap-around: also handle phase near 1.0 feeding back to 0.0
    const pulseWrap = Math.exp(-Math.pow((phase - 1.0) / 0.08, 2));
    jetTopUniforms.uPulse.value = Math.max(pulseA, pulseWrap);
    jetBotUniforms.uPulse.value = pulseB;

    // Core sphere glows brighter on each pulse so the whole system flashes.
    const flash = Math.max(pulseA, pulseB, pulseWrap);
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 3.0 + 4.0 * flash;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + 0.5 * flash;
      // Camera-facing billboard so glow always reads as a halo.
      glowRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Neutron star core — small, very emissive sphere */}
      <mesh
        ref={coreRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshStandardMaterial
          color="#D8ECFF"
          emissive="#A8C8FF"
          emissiveIntensity={3.0}
          roughness={receiveRim ? 0.35 : 0.2}
          metalness={receiveRim ? 0.15 : 0.3}
        />
      </mesh>

      {/* Billboard glow sprite — catches bloom pass, sells the luminosity */}
      {glowTexture && (
        <mesh ref={glowRef} position={[0, 0, 0]}>
          <planeGeometry args={[3.5, 3.5]} />
          <meshBasicMaterial
            map={glowTexture}
            transparent
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Top jet — ConeGeometry default has tip at +Y, base at -Y.
          We position at +Y so base meets star, tip shoots outward. */}
      <mesh position={[0, 2.4, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.45, 4.0, 24, 1, true]} />
        <shaderMaterial
          ref={jetTopMat}
          vertexShader={jetVert}
          fragmentShader={jetFrag}
          uniforms={jetTopUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bottom jet — flip across X so tip shoots -Y */}
      <mesh position={[0, -2.4, 0]}>
        <coneGeometry args={[0.45, 4.0, 24, 1, true]} />
        <shaderMaterial
          ref={jetBotMat}
          vertexShader={jetVert}
          fragmentShader={jetFrag}
          uniforms={jetBotUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Magnetosphere — thin equatorial torus of plasma */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.04, 16, 64]} />
        <meshBasicMaterial
          color="#6AA8FF"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Hover HUD — rendered in world space, scales with distance */}
      {hovered && (
        <Html
          position={[2.2, 1.8, 0]}
          transform
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              color: 'rgba(216, 236, 255, 0.92)',
              background: 'rgba(6, 12, 28, 0.72)',
              border: '1px solid rgba(168, 200, 255, 0.35)',
              padding: '10px 14px',
              letterSpacing: '0.22em',
              fontSize: 9,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: '0.14em',
                color: '#FFFFFF',
                marginBottom: 6,
              }}
            >
              MIRA
            </div>
            <div style={{ opacity: 0.75 }}>AGENTIC AI PIPELINE</div>
            <div style={{ color: '#B8FF3C', marginTop: 6 }}>LATENCY · 92MS</div>
            <div style={{ opacity: 0.55, marginTop: 2 }}>PIPECAT · WEBSOCKETS</div>
            <div style={{ opacity: 0.4, marginTop: 2 }}>DRIVEX · 2025</div>
          </div>
        </Html>
      )}
    </group>
  );
}
