'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * QUASAR PAIR — represents QUANTUM OPTIONS PRICING
 * 70% Monte Carlo speedup via quantum amplitude estimation.
 *
 * Visual language:
 *   - Two bright quasar cores connected by a visible entanglement tube
 *   - 70% of photon-particles travel the straight-line "wormhole" shortcut
 *     in half the time — literal visualization of the speedup
 *   - 30% take the long arcing path through conventional space
 *   - Periodic entanglement pulse (~every 2s) flashes instantly between cores
 */

const CORE_RADIUS = 0.3;
const DISK_INNER = 0.35;
const DISK_OUTER = 0.9;
const CORE_SEPARATION = 15; // total distance between the two cores
const TUBE_PARTICLES = 140;
const ARC_PARTICLES = 60;
const SHORTCUT_RATIO = 0.7; // 70% via shortcut
const PULSE_PERIOD = 2.0; // seconds between entanglement flashes

type QuasarPairProps = {
  position?: [number, number, number];
  orbit?: { radius: number; speed: number; phase: number };
  receiveRim?: boolean;
};

// ── Shortcut path particles ───────────────────────────────────────────────
// Each shortcut particle has:
//   - direction (0 = A->B, 1 = B->A), encoded in the sign of speed
//   - progress along the line [0, 1]
//   - a speed (particles move fast; they traverse the tube in ~0.7s)
type ShortcutParticle = {
  progress: number;
  speed: number; // units per second along the tube
  jitterSeed: number;
};

function buildShortcutParticles(): ShortcutParticle[] {
  const out: ShortcutParticle[] = [];
  for (let i = 0; i < TUBE_PARTICLES; i++) {
    out.push({
      progress: Math.random(),
      // half-time traversal -> fast speed. Unit progress per 0.7s.
      speed: 1.4 + Math.random() * 0.2,
      jitterSeed: Math.random() * 1000,
    });
  }
  return out;
}

// ── Arc path particles ────────────────────────────────────────────────────
// The 30% that take the long way. We send them along a quadratic Bezier
// from coreA to coreB via a control point offset in +y.
function buildArcParticles(): ShortcutParticle[] {
  const out: ShortcutParticle[] = [];
  for (let i = 0; i < ARC_PARTICLES; i++) {
    out.push({
      progress: Math.random(),
      // conventional traversal — slower. Unit progress per ~1.4s.
      speed: 0.7 + Math.random() * 0.15,
      jitterSeed: Math.random() * 1000,
    });
  }
  return out;
}

// Evaluate a quadratic Bezier curve.
// P(t) = (1-t)^2 * p0 + 2(1-t)t * p1 + t^2 * p2
function bezier(
  t: number,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  out: THREE.Vector3
): THREE.Vector3 {
  const mt = 1 - t;
  out.x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
  out.y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
  out.z = mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z;
  return out;
}

export default function QuasarPair({
  position = [-8, -4, 8],
  orbit,
  receiveRim: _receiveRim = false,
}: QuasarPairProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shortcutPointsRef = useRef<THREE.Points>(null);
  const arcPointsRef = useRef<THREE.Points>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const coreARef = useRef<THREE.Mesh>(null);
  const coreBRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Core positions in local space
  const coreA = useMemo(() => new THREE.Vector3(-CORE_SEPARATION / 2, 0, 0), []);
  const coreB = useMemo(() => new THREE.Vector3(CORE_SEPARATION / 2, 0, 0), []);
  // Arc control point — curves the long-path above the straight line
  const arcControl = useMemo(() => new THREE.Vector3(0, 4.5, 0), []);

  const shortcutParticles = useMemo(buildShortcutParticles, []);
  const arcParticles = useMemo(buildArcParticles, []);

  // ── Geometry buffers ───────────────────────────────────────────────
  const shortcutGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TUBE_PARTICLES * 3), 3));
    return g;
  }, []);

  const arcGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_PARTICLES * 3), 3));
    return g;
  }, []);

  const shortcutMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.08,
        color: new THREE.Color('#B8FF3C'), // lime — the "quantum" tube
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const arcMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.05,
        color: new THREE.Color('#6FAAFF'), // cooler — the "classical" path
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Scratch vector to avoid allocations in useFrame
  const scratch = useMemo(() => new THREE.Vector3(), []);

  // Hover scale
  const targetScale = useRef(1);
  const currentScale = useRef(1);

  // Time accumulator for the entanglement pulse
  const timeRef = useRef(0);

  useFrame((state, dt) => {
    timeRef.current += dt;

    // Orbital drift around scene origin.
    if (orbit && groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.x = Math.cos(t * orbit.speed + orbit.phase) * orbit.radius;
      groupRef.current.position.z = Math.sin(t * orbit.speed + orbit.phase) * orbit.radius;
      groupRef.current.position.y = position[1];
    }

    // ── Shortcut particles travel the straight line between cores ──
    if (shortcutPointsRef.current) {
      const posAttr = shortcutPointsRef.current.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < TUBE_PARTICLES; i++) {
        const p = shortcutParticles[i];
        p.progress += dt * p.speed;
        // Half travel A->B, half B->A. Wrap progress.
        const dir = i % 2 === 0 ? 1 : -1;
        if (p.progress > 1) p.progress -= 1;
        const t = dir === 1 ? p.progress : 1 - p.progress;

        // Lerp along the straight line, plus a tiny transverse jitter so it
        // feels like a tube of finite thickness, not a laser.
        scratch.lerpVectors(coreA, coreB, t);
        const phase = timeRef.current * 3.0 + p.jitterSeed;
        arr[i * 3 + 0] = scratch.x;
        arr[i * 3 + 1] = scratch.y + Math.sin(phase) * 0.08;
        arr[i * 3 + 2] = scratch.z + Math.cos(phase * 1.3) * 0.08;
      }
      posAttr.needsUpdate = true;
    }

    // ── Arc particles take the long path via the Bezier curve ──
    if (arcPointsRef.current) {
      const posAttr = arcPointsRef.current.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < ARC_PARTICLES; i++) {
        const p = arcParticles[i];
        p.progress += dt * p.speed;
        if (p.progress > 1) p.progress -= 1;

        bezier(p.progress, coreA, arcControl, coreB, scratch);
        arr[i * 3 + 0] = scratch.x;
        arr[i * 3 + 1] = scratch.y;
        arr[i * 3 + 2] = scratch.z;
      }
      posAttr.needsUpdate = true;
    }

    // ── Entanglement pulse — a sphere midway that scales up every PULSE_PERIOD
    if (pulseRef.current) {
      const t = (timeRef.current % PULSE_PERIOD) / PULSE_PERIOD;
      // Fast rise, fast decay envelope centered at t=0.5
      const env = Math.max(0, 1 - Math.abs(t - 0.5) * 6);
      const scale = 0.05 + env * 1.6;
      pulseRef.current.scale.setScalar(scale);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = env * 0.9;
    }

    // Core subtle pulse — slower, independent of entanglement
    const corePulse = 1 + Math.sin(timeRef.current * 1.4) * 0.04;
    if (coreARef.current) coreARef.current.scale.setScalar(corePulse);
    if (coreBRef.current) coreBRef.current.scale.setScalar(corePulse * 0.98);

    // Hover scale
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
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {/* Core A */}
      <group position={coreA}>
        <mesh ref={coreARef}>
          <sphereGeometry args={[CORE_RADIUS, 32, 32]} />
          <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
        </mesh>
        {/* Bloom-friendly emissive corona */}
        <mesh>
          <sphereGeometry args={[CORE_RADIUS * 1.6, 24, 24]} />
          <meshBasicMaterial
            color="#B8FF3C"
            transparent
            opacity={0.35}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Thin accretion disk */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[DISK_INNER, DISK_OUTER, 64]} />
          <meshBasicMaterial
            color="#FFD27A"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Core B */}
      <group position={coreB}>
        <mesh ref={coreBRef}>
          <sphereGeometry args={[CORE_RADIUS, 32, 32]} />
          <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[CORE_RADIUS * 1.6, 24, 24]} />
          <meshBasicMaterial
            color="#6FAAFF"
            transparent
            opacity={0.35}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0.4]}>
          <ringGeometry args={[DISK_INNER, DISK_OUTER, 64]} />
          <meshBasicMaterial
            color="#AEC9FF"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Entanglement tube — 70% of particles take this fast path */}
      <points ref={shortcutPointsRef} geometry={shortcutGeometry} material={shortcutMaterial} />

      {/* Arcing conventional path — 30% of particles */}
      <points ref={arcPointsRef} geometry={arcGeometry} material={arcMaterial} />

      {/* Instantaneous entanglement pulse — flashes periodically mid-tube */}
      <mesh ref={pulseRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial
          color="#E8FFB0"
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Data HUD */}
      <Html
        position={[0, 3.6, 0]}
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
          <div style={{ color: '#B8FF3C', fontWeight: 600 }}>QUANTUM OPTIONS PRICING</div>
          <div>QISKIT &middot; MONTE CARLO SIMULATION</div>
          <div>70% COMPUTATIONAL SPEEDUP</div>
          <div>FINANCIAL DERIVATIVES</div>
          <div>QUANTUM COMPUTING</div>
        </div>
      </Html>
    </group>
  );
}
