'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

/**
 * BodyInteractions — physical interactions between celestial bodies.
 *
 * Fraser's reverence principle married to the user's directive: the bodies
 * aren't isolated props, they *interact*. Four interactions run in parallel:
 *
 *   (1) PULSAR SWEEP — a SpotLight rides the pulsar's position and sweeps
 *       with its rotation, illuminating other bodies in pulses. Other bodies
 *       catch this naturally through their receiveRim-enabled materials.
 *
 *   (2) MAGNETAR FIELD BEAMS — every 4-8s, a curved TubeGeometry beam draws
 *       from the magnetar position to a random target body. Lives 1.5s,
 *       fades in/out. UV-scrolling shader suggests electromagnetic flow.
 *
 *   (3) QUASAR SHOCKWAVE — every ~6s, a fresnel-edged sphere expands from
 *       the quasar midpoint (radius 0.5 → 30 over 1.5s), fades as it grows.
 *
 *   (4) RACING BEACON — every quarter-lap, a small lime pulse flashes at
 *       the car's position along the track. Subtle "telemetry ping".
 *
 * All positions here are duplicated from Universe.tsx defaults. Kept in
 * sync by convention rather than shared state so each component stays
 * independently renderable.
 *
 * Orbital motion: bodies drift in a circle around origin. This file reads
 * the *same* orbital parameters Universe.tsx passes to bodies so the
 * interaction sources track the moving targets correctly.
 */

// Shared orbital params — duplicated from Universe.tsx on purpose.
// If Universe.tsx changes, update here too. (Verified at runtime impossible
// because body refs aren't exposed — this is the pragmatic cost.)
const ORBITS = {
  pulsar:         { basePos: [14, 2, -8] as const,   radius: 16, speed: 0.08, phase: 0 },
  binaryMagnetar: { basePos: [-16, 4, -12] as const, radius: 20, speed: 0.05, phase: 1.2 },
  ringedGiant:    { basePos: [22, -2, 4] as const,   radius: 22, speed: 0.04, phase: 2.5 },
  quasarPair:     { basePos: [-10, -5, 10] as const, radius: 14, speed: 0.06, phase: 3.4 },
  racingPlanet:   { basePos: [6, 5, 18] as const,    radius: 19, speed: 0.07, phase: 4.1 },
};

type BodyKey = keyof typeof ORBITS;

function bodyPositionAt(key: BodyKey, t: number, out: THREE.Vector3): THREE.Vector3 {
  const o = ORBITS[key];
  out.x = Math.cos(t * o.speed + o.phase) * o.radius;
  out.z = Math.sin(t * o.speed + o.phase) * o.radius;
  out.y = o.basePos[1];
  return out;
}

// ── Magnetar beam shader — scrolling UV suggests current flow ──────────────
const beamVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const beamFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform float uLife;   // 0..1 envelope (fade in 0→0.2, hold, fade out 0.8→1)

void main() {
  // Tube UV: x around circumference, y along length.
  // Create a travelling pulse along length.
  float flow = fract(vUv.y * 2.5 - uTime * 1.2);
  float pulse = smoothstep(0.0, 0.2, flow) * smoothstep(0.5, 0.2, flow);

  // Radial falloff across tube thickness
  float r = abs(vUv.x - 0.5) * 2.0;
  float core = 1.0 - smoothstep(0.0, 1.0, r);

  // Envelope: fade in over first 20%, hold, fade out last 20%.
  float env = smoothstep(0.0, 0.2, uLife) * (1.0 - smoothstep(0.8, 1.0, uLife));

  float intensity = core * (0.4 + pulse * 0.9) * env;
  vec3 col = vec3(0.72, 1.0, 0.24); // lime
  gl_FragColor = vec4(col * intensity, intensity * 0.45);
}
`;

// ── Quasar shockwave shader — fresnel-edged expanding shell ─────────────────
const shockVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const shockFrag = /* glsl */ `
precision highp float;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform float uLife; // 0..1, 0 = spawn
uniform vec3  uColor;

void main() {
  // Fresnel: alpha peaks at grazing angles, nearly zero facing camera.
  float fres = 1.0 - max(dot(vNormal, vViewDir), 0.0);
  float edge = pow(fres, 2.5);

  // Envelope: bright at spawn, fades with expansion
  float env = 1.0 - uLife;
  // Energy conservation: spread over bigger surface = dimmer
  float a = edge * env * env;

  gl_FragColor = vec4(uColor * a * 1.6, a * 0.7);
}
`;

// ── Magnetar beam state — pool of 3 reusable beams ─────────────────────────
type BeamState = {
  alive: boolean;
  life: number;      // 0..1
  duration: number;  // total seconds
  geom: THREE.TubeGeometry | null;
  mesh: THREE.Mesh | null;
  material: THREE.ShaderMaterial;
};

const BEAM_POOL_SIZE = 3;
const BEAM_MIN_INTERVAL = 4.0;
const BEAM_MAX_INTERVAL = 8.0;
const BEAM_DURATION = 1.5;

// Quasar shockwave constants
const SHOCK_PERIOD = 6.0;
const SHOCK_DURATION = 1.5;
const SHOCK_MAX_RADIUS = 30;

// Racing beacon
const BEACON_PERIOD = 21.0; // LAP_SECONDS / 4
const BEACON_DURATION = 0.4;

export default function BodyInteractions() {
  const phase = useScene((s) => s.phase);
  const active = phase === 'UNIVERSE';

  // ── Pulsar spotlight — follows pulsar's orbital position, rotates on Y ──
  // Target must be a bare THREE.Object3D attached imperatively. Passing it as
  // a JSX prop on <spotLight> causes R3F to serialize the light's scene graph
  // which hits a parent⇄children circular reference. We create the target
  // object here and attach it to the spotlight in useEffect.
  const spotRef = useRef<THREE.SpotLight>(null);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);

  // ── Magnetar beam pool ──
  const beamMeshRefs = useRef<(THREE.Mesh | null)[]>(
    new Array(BEAM_POOL_SIZE).fill(null),
  );
  const beams = useMemo<BeamState[]>(() => {
    return new Array(BEAM_POOL_SIZE).fill(0).map(() => ({
      alive: false,
      life: 0,
      duration: BEAM_DURATION,
      geom: null,
      mesh: null,
      material: new THREE.ShaderMaterial({
        vertexShader: beamVert,
        fragmentShader: beamFrag,
        uniforms: {
          uTime: { value: 0 },
          uLife: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    }));
  }, []);

  // Dispose beam resources on unmount (React 19 StrictMode safe).
  useEffect(() => {
    return () => {
      for (const b of beams) {
        b.material.dispose();
        if (b.geom) b.geom.dispose();
      }
    };
  }, [beams]);

  // Timers
  const nextBeamAt = useRef(2.0); // first beam at t=2s
  const lastShockAt = useRef(0);
  const lastBeaconAt = useRef(0);

  // Shockwave
  const shockRef = useRef<THREE.Mesh>(null);
  const shockUniforms = useMemo(
    () => ({
      uLife: { value: 1.0 }, // 1 = dead/invisible
      uColor: { value: new THREE.Color('#A78BFA') },
    }),
    [],
  );

  // Racing beacon
  const beaconRef = useRef<THREE.Mesh>(null);
  const beaconStart = useRef(-10); // t when last beacon fired

  // Scratch vectors
  const vA = useMemo(() => new THREE.Vector3(), []);
  const vB = useMemo(() => new THREE.Vector3(), []);
  const vMid = useMemo(() => new THREE.Vector3(), []);

  // Body target keys for random beam pick
  const otherBodyKeys: BodyKey[] = useMemo(
    () => ['pulsar', 'ringedGiant', 'quasarPair', 'racingPlanet'],
    [],
  );

  useFrame((state, dt) => {
    if (!active) return;
    const elapsed = state.clock.elapsedTime;

    // ── (1) Pulsar spotlight ───────────────────────────────────────────
    if (spotRef.current) {
      bodyPositionAt('pulsar', elapsed, vA);
      spotRef.current.position.copy(vA);
      // Sweeping direction: rotate in XZ at pulsar's spin rate (2 Hz — visual)
      // but slower here (~0.4 Hz) so the sweep is legible across bodies.
      const sweepAngle = elapsed * 0.4 * Math.PI * 2;
      spotTarget.position.set(
        vA.x + Math.cos(sweepAngle) * 10,
        vA.y,
        vA.z + Math.sin(sweepAngle) * 10,
      );
      spotTarget.updateMatrixWorld();
    }

    // ── (2) Magnetar beams ─────────────────────────────────────────────
    // Advance life on alive beams
    for (let i = 0; i < beams.length; i++) {
      const b = beams[i];
      if (!b.alive) continue;
      b.life += dt / b.duration;
      b.material.uniforms.uTime.value += dt;
      b.material.uniforms.uLife.value = b.life;
      if (b.life >= 1.0) {
        // Kill
        b.alive = false;
        b.life = 0;
        if (b.mesh) b.mesh.visible = false;
      }
    }
    // Spawn check
    if (elapsed >= nextBeamAt.current) {
      // Find a free slot
      const slot = beams.findIndex((b) => !b.alive);
      if (slot !== -1) {
        const target = otherBodyKeys[Math.floor(Math.random() * otherBodyKeys.length)];
        bodyPositionAt('binaryMagnetar', elapsed, vA);
        bodyPositionAt(target, elapsed, vB);
        // Mid-curve control: offset upward + slight lateral for an arc
        vMid.addVectors(vA, vB).multiplyScalar(0.5);
        vMid.y += 3.5 + Math.random() * 2;
        // Lateral offset perpendicular to A→B in XZ plane
        const dx = vB.x - vA.x;
        const dz = vB.z - vA.z;
        const len = Math.hypot(dx, dz) || 1;
        const perp = new THREE.Vector3(-dz / len, 0, dx / len);
        vMid.addScaledVector(perp, (Math.random() - 0.5) * 4);

        const curve = new THREE.CatmullRomCurve3(
          [vA.clone(), vMid.clone(), vB.clone()],
          false,
          'catmullrom',
          0.5,
        );

        // Rebuild geometry for this beam. 48 segments is enough for a smooth arc.
        if (beams[slot].geom) beams[slot].geom!.dispose();
        const geom = new THREE.TubeGeometry(curve, 48, 0.08, 8, false);
        beams[slot].geom = geom;
        beams[slot].alive = true;
        beams[slot].life = 0;
        beams[slot].material.uniforms.uLife.value = 0;

        const mesh = beamMeshRefs.current[slot];
        if (mesh) {
          mesh.geometry = geom;
          mesh.visible = true;
        }
      }
      // Schedule next
      nextBeamAt.current =
        elapsed + BEAM_MIN_INTERVAL + Math.random() * (BEAM_MAX_INTERVAL - BEAM_MIN_INTERVAL);
    }

    // ── (3) Quasar shockwave ───────────────────────────────────────────
    if (shockRef.current) {
      // Fire periodically — track when we last fired
      if (elapsed - lastShockAt.current >= SHOCK_PERIOD) {
        lastShockAt.current = elapsed;
      }
      const age = elapsed - lastShockAt.current;
      if (age <= SHOCK_DURATION) {
        const t = age / SHOCK_DURATION;
        bodyPositionAt('quasarPair', elapsed, vA);
        shockRef.current.position.copy(vA);
        const radius = 0.5 + (SHOCK_MAX_RADIUS - 0.5) * t;
        shockRef.current.scale.setScalar(radius);
        shockUniforms.uLife.value = t;
        shockRef.current.visible = true;
      } else {
        shockRef.current.visible = false;
      }
    }

    // ── (4) Racing beacon ──────────────────────────────────────────────
    if (beaconRef.current) {
      // Fire every quarter-lap
      if (elapsed - lastBeaconAt.current >= BEACON_PERIOD) {
        lastBeaconAt.current = elapsed;
        beaconStart.current = elapsed;
      }
      const age = elapsed - beaconStart.current;
      if (age >= 0 && age <= BEACON_DURATION) {
        const t = age / BEACON_DURATION;
        // Place at racing planet's position (a rough "beacon from the planet").
        // Using the planet's world position is visually sufficient; the car's
        // exact track position would require curve lookup we don't own here.
        bodyPositionAt('racingPlanet', elapsed, vA);
        beaconRef.current.position.copy(vA);
        const radius = 0.3 + t * 4;
        beaconRef.current.scale.setScalar(radius);
        const mat = beaconRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - t) * 0.7;
        beaconRef.current.visible = true;
      } else {
        beaconRef.current.visible = false;
      }
    }
  });

  // Attach the spotlight target object to the light imperatively. This
  // avoids the circular-reference JSON error R3F throws when .target is
  // passed as a JSX prop (the target back-references its parent scene).
  useEffect(() => {
    if (!active || !spotRef.current) return;
    spotRef.current.target = spotTarget;
    // Target must also be in the scene graph for its matrix to update.
    spotRef.current.add(spotTarget);
    const light = spotRef.current;
    return () => {
      light.remove(spotTarget);
    };
  }, [active, spotTarget]);

  if (!active) return null;

  return (
    <group>
      {/* (1) Pulsar sweeping spotlight. Target attached imperatively above. */}
      <spotLight
        ref={spotRef}
        color="#CFE8FF"
        intensity={5}
        distance={40}
        angle={0.2}
        penumbra={0.4}
        decay={2}
      />

      {/* (2) Magnetar beam pool — meshes start hidden with a placeholder
          BufferGeometry (R3F requires children on <mesh>). When a beam
          spawns, we swap in a freshly built TubeGeometry imperatively. */}
      {beams.map((b, i) => (
        <mesh
          key={i}
          ref={(m) => {
            beamMeshRefs.current[i] = m;
            b.mesh = m;
          }}
          visible={false}
          material={b.material}
        >
          <bufferGeometry />
        </mesh>
      ))}

      {/* (3) Quasar shockwave — single reusable sphere */}
      <mesh ref={shockRef} visible={false}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial
          vertexShader={shockVert}
          fragmentShader={shockFrag}
          uniforms={shockUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* (4) Racing beacon — simple additive sphere flash */}
      <mesh ref={beaconRef} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#B8FF3C"
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
