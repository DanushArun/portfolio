'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const JET_COUNT = 3000;
const JET_LENGTH = 14;
const JET_BASE_RADIUS = 0.08;
const JET_SPREAD = 2.2;
const CARD_FADE_THRESHOLD = 0.35;

// ─────────────────────────────────────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type JetBuffers = {
  velocities: Float32Array;
  phases: Float32Array;
  radialSeeds: Float32Array;
  progress: Float32Array;
};

function buildJetBuffers(seed: number): JetBuffers {
  const rand = mulberry32(seed);
  const velocities = new Float32Array(JET_COUNT);
  const phases = new Float32Array(JET_COUNT);
  const radialSeeds = new Float32Array(JET_COUNT);
  const progress = new Float32Array(JET_COUNT);

  for (let i = 0; i < JET_COUNT; i++) {
    progress[i] = rand();
    velocities[i] = 3.0 + rand() * 2.5;
    phases[i] = rand() * Math.PI * 2;
    radialSeeds[i] = rand();
  }

  return { velocities, phases, radialSeeds, progress };
}

// ─────────────────────────────────────────────────────────────────────────────
// Jet particle system
// ─────────────────────────────────────────────────────────────────────────────

type JetProps = {
  direction: 1 | -1;
  color: string;
  mouseX: number;
  mouseY: number;
  seed: number;
  turbulence: 'structured' | 'organic';
};

function JetParticles({ direction, color, mouseX, mouseY, seed, turbulence }: JetProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const buffers = useMemo(() => buildJetBuffers(seed), [seed]);

  const workPos = useMemo(() => new Float32Array(JET_COUNT * 3), []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(workPos, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
    return g;
  }, [workPos]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(color),
        size: turbulence === 'structured' ? 0.055 : 0.07,
        transparent: true,
        opacity: turbulence === 'structured' ? 0.82 : 0.72,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color, turbulence],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const bendX = mouseX * 0.6 * direction;
    const bendZ = mouseY * 0.3;

    for (let i = 0; i < JET_COUNT; i++) {
      const speed = buffers.velocities[i];
      buffers.progress[i] += (speed / JET_LENGTH) * dt;
      if (buffers.progress[i] > 1) buffers.progress[i] -= 1;

      const p = buffers.progress[i];
      const phase = buffers.phases[i];
      const axial = p * JET_LENGTH * direction;
      const coneR = JET_BASE_RADIUS + (JET_SPREAD - JET_BASE_RADIUS) * p;

      let angle: number;
      let radialR: number;

      if (turbulence === 'structured') {
        const baseAngle = buffers.radialSeeds[i] * Math.PI * 2;
        angle = baseAngle + Math.sin(t * 0.8 + phase) * 0.18;
        radialR = coneR * (0.5 + 0.5 * buffers.radialSeeds[i]);
      } else {
        const baseAngle = buffers.radialSeeds[i] * Math.PI * 2;
        angle = baseAngle + t * (1.4 + buffers.radialSeeds[i] * 1.2) + phase;
        const churn = 0.5 + 0.5 * Math.sin(t * 2.1 + phase * 1.7);
        radialR = coneR * churn;
      }

      const localBendX = bendX * p * p;
      const localBendZ = bendZ * p * p;

      arr[i * 3 + 0] = Math.cos(angle) * radialR + localBendX;
      arr[i * 3 + 1] = axial;
      arr[i * 3 + 2] = Math.sin(angle) * radialR + localBendZ;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM overlay types
// ─────────────────────────────────────────────────────────────────────────────

type HoverRegion = 'left' | 'right' | null;

const CARD_BASE: React.CSSProperties = {
  position: 'absolute',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 9,
  letterSpacing: '0.22em',
  color: '#E8E4D8',
  lineHeight: 1.75,
  textTransform: 'uppercase',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
};

// ─────────────────────────────────────────────────────────────────────────────
// TextCard — fades in from particle opacity rather than sliding in from side
// ─────────────────────────────────────────────────────────────────────────────

type TextCardProps = {
  particleOpacity: number;
  style?: React.CSSProperties;
  heading: string;
  lines: string[];
};

function TextCard({ particleOpacity, style, heading, lines }: TextCardProps) {
  const cardOpacity = Math.max(
    0,
    (particleOpacity - CARD_FADE_THRESHOLD) / (1 - CARD_FADE_THRESHOLD),
  );

  return (
    <div style={{ ...CARD_BASE, ...style, opacity: cardOpacity, transition: 'opacity 0.4s ease-out' }}>
      <div style={{ color: '#B8FF3C', marginBottom: 6, fontSize: 10 }}>{heading}</div>
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: 0.6 + i * 0.1 }}>{line}</div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HoverDetail — shown when cursor enters left/right jet region
// ─────────────────────────────────────────────────────────────────────────────

const LEFT_DETAIL = {
  heading: 'ARCHITECTURE DEPTH',
  lines: [
    'Multi-agent orchestration',
    'Event-driven pipeline design',
    'Webhook mesh integration',
    'Sub-100ms decision latency',
    'Pipecat · LangGraph · FastAPI',
  ],
};

const RIGHT_DETAIL = {
  heading: 'BUSINESS IMPACT',
  lines: [
    '3.4× lead conversion uplift',
    '87% reduction in manual ops',
    'Real-time qualification at scale',
    '12k+ interactions automated',
    'DriveX · 2025 → ongoing',
  ],
};

function HoverDetail({ region }: { region: HoverRegion }) {
  const content = region === 'left' ? LEFT_DETAIL : RIGHT_DETAIL;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '18vh',
        left: region === 'left' ? '6vw' : undefined,
        right: region === 'right' ? '6vw' : undefined,
        zIndex: 30,
        opacity: region !== null ? 1 : 0,
        transition: 'opacity 0.32s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: 'none',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 9,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#E8E4D8',
        lineHeight: 1.75,
      }}
    >
      {region !== null && (
        <>
          <div style={{ color: '#B8FF3C', fontSize: 10, marginBottom: 6 }}>{content.heading}</div>
          {content.lines.map((line, i) => (
            <div key={i} style={{ opacity: 0.55 + i * 0.09 }}>{line}</div>
          ))}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main R3F scene component
// ─────────────────────────────────────────────────────────────────────────────

export default function DriveXQuasar() {
  const mouseX = useScene((s) => s.mouseX);
  const mouseY = useScene((s) => s.mouseY);

  return (
    <>
      <Stars radius={300} depth={100} count={4000} factor={3} fade speed={0.15} />

      {/* Blue structured jet — erupts upward */}
      <JetParticles
        direction={1}
        color="#3A7BD5"
        mouseX={mouseX}
        mouseY={mouseY}
        seed={0xa1b2c3d4}
        turbulence="structured"
      />

      {/* Amber organic jet — erupts downward */}
      <JetParticles
        direction={-1}
        color="#E8820C"
        mouseX={mouseX}
        mouseY={mouseY}
        seed={0xf9e8d7c6}
        turbulence="organic"
      />

      {/* Faint accretion disk glow at origin */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.55, 64]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM overlay — rendered outside the Canvas by SceneManager
// ─────────────────────────────────────────────────────────────────────────────

export function DriveXQuasarOverlay() {
  const phase = useScene((s) => s.phase);
  const mouseX = useScene((s) => s.mouseX);

  const [particleLife, setParticleLife] = useState(0);
  const [hoverRegion, setHoverRegion] = useState<HoverRegion>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (phase !== 'BINARY_MERGER') return;
    startRef.current = performance.now();
    setParticleLife(0);

    let raf: number;
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      setParticleLife(Math.min(1, elapsed / 2.2));
      if (elapsed < 2.2) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const pct = e.clientX / window.innerWidth;
      if (pct < 0.4) setHoverRegion('left');
      else if (pct > 0.6) setHoverRegion('right');
      else setHoverRegion(null);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  if (phase !== 'BINARY_MERGER') return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 25, pointerEvents: 'none' }}>
      {/* Jet Alpha card — upper-left, condenses from blue jet */}
      <TextCard
        particleOpacity={particleLife}
        style={{ top: '22vh', left: '6vw' }}
        heading="JET ALPHA — TECHNICAL APM"
        lines={[
          'Architecting Agentic AI systems',
          'High-scale automation frameworks',
          'DriveX · 2025 onwards',
        ]}
      />

      {/* Jet Beta card — lower-right, condenses from amber jet */}
      <TextCard
        particleOpacity={particleLife}
        style={{ bottom: '22vh', right: '6vw', textAlign: 'right' }}
        heading="JET BETA — SOFTWARE ENGINEERING"
        lines={[
          'Conversion pipeline architecture',
          'Lead qualification automation',
          'Webhook & integration systems',
        ]}
      />

      {/* Cursor-region detail overlay */}
      <HoverDetail region={hoverRegion} />

      {/* Subtle vertical axis indicator that bends with mouse */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '10vh',
          bottom: '10vh',
          width: 1,
          background:
            'linear-gradient(to bottom, transparent, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 70%, transparent)',
          transform: `translateX(calc(-50% + ${mouseX * 18}px))`,
          transition: 'transform 0.18s ease-out',
        }}
      />
    </div>
  );
}
