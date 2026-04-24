'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

/**
 * Jigsaw Assembly — the resume-manifestation finale.
 *
 * Concept: resume fragments (education, roles, achievements) are scattered
 * in space around the camera. As `scene.assemblyProgress` climbs from 0 → 1
 * (driven by scroll in a parent), gravity pulls each fragment into a final
 * lattice — a coherent 3D mosaic of Danush's career.
 *
 * Implementation:
 *   - 24 fragments, each a flat Plane carrying an MSDF <Text/> overlay.
 *   - Scatter positions are deterministic (seeded Math.random replacement)
 *     so the layout is stable across hot reloads.
 *   - Final positions: 6-col × 4-row grid at the universe center, facing +Z.
 *   - Per-fragment delay staggers assembly — heavier (more "massive")
 *     fragments settle first, lighter ones snap in last.
 *   - Motion uses easeOutExpo on the blended progress for a satisfying
 *     "slam into place" feel.
 *
 * Render gating: the parent (Universe / SceneManager) should conditionally
 * mount this component only during ASSEMBLY and FINAL phases. We also
 * fade it in via an alpha ramp on the material for robustness.
 */

// ────────────────────────────────────────────────────────────────────────────
// Fragment data — each row is one resume milestone
// ────────────────────────────────────────────────────────────────────────────
//
// `mass` drives assembly order: higher mass = earlier delay slot (pulled
// in first). Identity + headline facts are mass-heavy; peripheral skills
// are lighter.
type FragmentSpec = {
  text: string;
  subtext?: string;
  mass: number;
  accent?: boolean; // lime-highlighted
};

const FRAGMENT_SPECS: FragmentSpec[] = [
  { text: 'DANUSH ARUN', subtext: 'ENGINEER · 2026', mass: 1.0, accent: true },
  { text: 'B.TECH ELECTRICAL', subtext: 'MANIPAL INSTITUTE · 2025', mass: 0.95 },
  { text: 'EXEC. PG FULL STACK', subtext: 'IIT ROORKEE · 2025', mass: 0.95 },
  { text: 'DRIVEX', subtext: 'TECHNICAL APM + SWE · 2025→', mass: 0.92, accent: true },
  { text: 'FORMULA MANIPAL', subtext: 'OPERATIONS LEAD · 2022-2024', mass: 0.9 },
  { text: '1ST PLACE', subtext: 'FORMULA BHARAT 2024', mass: 0.88, accent: true },
  { text: '₹60L', subtext: 'SPONSORSHIP RAISED', mass: 0.85 },
  { text: 'EVOASTRA', subtext: 'DATA SCIENCE INTERN · 2024', mass: 0.8 },
  { text: 'TESCOM', subtext: 'HARDWARE INTERN · 2024', mass: 0.8 },
  { text: 'SCHELKUNOFF', subtext: 'EM SHIELDING · PUBLISHED', mass: 0.78 },
  { text: '1,047 PARTS', subtext: 'INSPECTED · VERONICA', mass: 0.76 },
  { text: '70% SPEEDUP', subtext: 'MONTE CARLO · QUANTUM', mass: 0.74 },
  { text: '92MS LATENCY', subtext: 'MIRA · VOICE AGENT', mass: 0.72, accent: true },
  { text: '15% SHARPE', subtext: 'PORTFOLIO IMPROVEMENT', mass: 0.7 },
  { text: 'PYTHON', subtext: 'TYPESCRIPT · C++', mass: 0.6 },
  { text: 'REACT NATIVE', subtext: 'NEXT.JS · R3F', mass: 0.6 },
  { text: 'PIPECAT', subtext: 'WEBSOCKETS · FASTAPI', mass: 0.58 },
  { text: 'AGENTIC AI', subtext: 'LLM ORCHESTRATION', mass: 0.56, accent: true },
  { text: 'QUANTUM', subtext: 'VARIATIONAL ALGORITHMS', mass: 0.55 },
  { text: 'PHYSICS', subtext: 'EM · SIGNAL INTEGRITY', mass: 0.52 },
  { text: 'RACING', subtext: 'FORMULA STUDENT · EV', mass: 0.5 },
  { text: 'FURYX', subtext: 'BUILT · 2024', mass: 0.48 },
  { text: 'VERONICA', subtext: 'BUILT · 2024', mass: 0.46 },
  { text: 'MIRA', subtext: 'BUILT · 2025', mass: 0.44 },
];

// ────────────────────────────────────────────────────────────────────────────
// Layout constants
// ────────────────────────────────────────────────────────────────────────────

const COLS = 6;
const ROWS = 4;
const CELL_W = 3.6;
const CELL_H = 1.2;
const PANEL_W = 3.2;
const PANEL_H = 1.0;

// Scatter sphere — fragments originate somewhere in this volume
const SCATTER_RADIUS = 40;
const SCATTER_MIN = 8; // minimum distance so nothing starts on top of camera

// ────────────────────────────────────────────────────────────────────────────
// Deterministic pseudo-random per fragment
// ────────────────────────────────────────────────────────────────────────────
//
// We avoid Math.random so layout is stable across hot reloads and SSR.
// Mulberry32 — small, fast, good distribution for this use case.

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Pre-computed fragment state (scatter, final, delay)
// ────────────────────────────────────────────────────────────────────────────

type FragmentState = {
  spec: FragmentSpec;
  scatter: THREE.Vector3;
  scatterQuat: THREE.Quaternion;
  tumbleAxis: THREE.Vector3;
  tumbleRate: number;
  final: THREE.Vector3;
  finalQuat: THREE.Quaternion;
  delay: number;
};

function buildFragmentStates(): FragmentState[] {
  // Sort by mass descending so heavier fragments get earlier delay slots
  const sorted = FRAGMENT_SPECS.map((spec, i) => ({ spec, originalIndex: i }))
    .sort((a, b) => b.spec.mass - a.spec.mass);

  const states: FragmentState[] = [];

  sorted.forEach((entry, i) => {
    const rand = seeded(entry.originalIndex * 97 + 131);

    // Scatter on a shell between SCATTER_MIN and SCATTER_RADIUS
    const phi   = rand() * Math.PI * 2;
    const theta = Math.acos(rand() * 2 - 1);
    const r     = SCATTER_MIN + rand() * (SCATTER_RADIUS - SCATTER_MIN);
    const scatter = new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(theta)
    );

    // Random initial orientation
    const scatterQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        (rand() - 0.5) * Math.PI * 2,
        (rand() - 0.5) * Math.PI * 2,
        (rand() - 0.5) * Math.PI * 2
      )
    );

    const tumbleAxis = new THREE.Vector3(
      rand() - 0.5,
      rand() - 0.5,
      rand() - 0.5
    ).normalize();
    const tumbleRate = 0.3 + rand() * 0.6;

    // Final grid position — 6 × 4 centered at origin, facing +Z
    const col = entry.originalIndex % COLS;
    const row = Math.floor(entry.originalIndex / COLS);
    const x = (col - (COLS - 1) / 2) * CELL_W;
    const y = ((ROWS - 1) / 2 - row) * CELL_H;
    const final = new THREE.Vector3(x, y, 0);

    // Final orientation — all facing camera (identity)
    const finalQuat = new THREE.Quaternion();

    // Delay: heavier fragments land first. i is now sorted by mass desc.
    // Last fragment finishes at progress ≈ 1.0.
    const delay = (i / sorted.length) * 0.6; // 0 .. 0.6

    states.push({
      spec: entry.spec,
      scatter,
      scatterQuat,
      tumbleAxis,
      tumbleRate,
      final,
      finalQuat,
      delay,
    });
  });

  // Restore original-index order so React keys line up with spec order
  states.sort((a, b) => FRAGMENT_SPECS.indexOf(a.spec) - FRAGMENT_SPECS.indexOf(b.spec));
  return states;
}

// ────────────────────────────────────────────────────────────────────────────
// Easing
// ────────────────────────────────────────────────────────────────────────────

function easeOutExpo(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.pow(2, -10 * x);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export default function Assembly() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Group | null)[]>([]);
  const panelMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  // Build once per mount
  const states = useMemo(() => buildFragmentStates(), []);
  const phase = useScene((s) => s.phase);

  // Scratch vectors to avoid per-frame allocations
  const scratchPos = useRef(new THREE.Vector3());
  const scratchQuatA = useRef(new THREE.Quaternion());
  const scratchQuatB = useRef(new THREE.Quaternion());
  const scratchAxis = useRef(new THREE.Vector3());

  useFrame((state) => {
    const progress = useScene.getState().assemblyProgress;
    const elapsed = state.clock.elapsedTime;

    states.forEach((s, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;

      // Local progress is global progress shifted by this fragment's delay,
      // and slightly stretched so the last fragment still reaches 1.
      const local = clamp01((progress - s.delay) / (1 - s.delay || 1));
      const eased = easeOutExpo(local);

      // Position: lerp scatter → final
      scratchPos.current.lerpVectors(s.scatter, s.final, eased);
      mesh.position.copy(scratchPos.current);

      // Orientation: while scattered, tumble; once locked, slerp to final
      if (eased < 1) {
        // Tumble from scatterQuat about its axis
        const angle = elapsed * s.tumbleRate * (1 - eased);
        scratchAxis.current.copy(s.tumbleAxis);
        scratchQuatA.current.setFromAxisAngle(scratchAxis.current, angle);
        scratchQuatB.current.copy(s.scatterQuat).multiply(scratchQuatA.current);
        // Slerp this tumbling quaternion toward the final (identity) quat
        scratchQuatB.current.slerp(s.finalQuat, eased);
        mesh.quaternion.copy(scratchQuatB.current);
      } else {
        mesh.quaternion.copy(s.finalQuat);
      }

      // Panel opacity ramps with a small fade-in so fragments don't pop
      const panelMat = panelMatRefs.current[i];
      if (panelMat) {
        // Base opacity 0.72 at rest, slight dim while scattered
        panelMat.opacity = 0.55 + eased * 0.2;
      }
    });
  });

  // Only render during ASSEMBLY / FINAL phases; still allow component to
  // mount during UNIVERSE so parent can drive a fade-in.
  if (phase !== 'ASSEMBLY' && phase !== 'FINAL') return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {states.map((s, i) => (
        <group
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
        >
          {/* Panel backing — thin translucent plane */}
          <mesh>
            <planeGeometry args={[PANEL_W, PANEL_H]} />
            <meshBasicMaterial
              ref={(el) => {
                panelMatRefs.current[i] = el;
              }}
              color={s.spec.accent ? '#0d1406' : '#050607'}
              transparent
              opacity={0.7}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Thin accent bar on the left — lime if accent, bone otherwise */}
          <mesh position={[-PANEL_W / 2 + 0.04, 0, 0.001]}>
            <planeGeometry args={[0.025, PANEL_H * 0.85]} />
            <meshBasicMaterial
              color={s.spec.accent ? '#B8FF3C' : '#E8E4D8'}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>

          {/* Primary text */}
          <Text
            position={[-PANEL_W / 2 + 0.18, PANEL_H * 0.12, 0.01]}
            anchorX="left"
            anchorY="middle"
            fontSize={0.22}
            letterSpacing={0.04}
            color={s.spec.accent ? '#B8FF3C' : '#E8E4D8'}
            maxWidth={PANEL_W - 0.3}
            outlineWidth={0}
          >
            {s.spec.text}
          </Text>

          {/* Subtext */}
          {s.spec.subtext && (
            <Text
              position={[-PANEL_W / 2 + 0.18, -PANEL_H * 0.22, 0.01]}
              anchorX="left"
              anchorY="middle"
              fontSize={0.12}
              letterSpacing={0.12}
              color="rgba(232, 228, 216, 0.62)"
              maxWidth={PANEL_W - 0.3}
              outlineWidth={0}
            >
              {s.spec.subtext}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
}
