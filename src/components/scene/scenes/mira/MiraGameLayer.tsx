'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  computeMiraGameProgress,
  getMiraGameProgressForFocus,
  getMiraGameTargets,
} from '@/lib/mira-game-route';
import { setMiraFocus, useMiraState, type MiraLang } from '@/lib/mira-state';
import { useScene } from '@/lib/scene-state';

interface MiraGameLayerProps {
  readonly reveal: number;
}

const ADDITIVE = THREE.AdditiveBlending;

type CheckpointKind = 'audio' | 'gate' | 'transcript' | 'router' | 'learning';

interface CheckpointSpec {
  readonly color: string;
  readonly kind: CheckpointKind;
}

interface CheckpointFieldProps {
  readonly active: boolean;
  readonly focused: boolean;
  readonly lang: MiraLang;
  readonly position: THREE.Vector3;
  readonly progress: number;
  readonly reveal: number;
  readonly routeProgress: number;
}

const CHECKPOINT_SPEC: Readonly<Record<MiraLang, CheckpointSpec>> = {
  EN: { color: '#ffe4a3', kind: 'audio' },
  HI: { color: '#f6fbff', kind: 'gate' },
  TA: { color: '#9feeff', kind: 'transcript' },
  KN: { color: '#ffd36a', kind: 'router' },
  TE: { color: '#fff0c4', kind: 'learning' },
};

function makeAudioGeometry(): THREE.BufferGeometry {
  const count = 220;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) {
    const ptr = index * 3;
    const t = index / (count - 1);
    const wave = Math.sin(t * Math.PI * 8);
    positions[ptr] = (t - 0.5) * 1.34;
    positions[ptr + 1] = wave * 0.18;
    positions[ptr + 2] = Math.cos(t * Math.PI * 4) * 0.12;
  }
  return positionsToGeometry(positions);
}

function makeGateGeometry(): THREE.BufferGeometry {
  const count = 220;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) {
    const ptr = index * 3;
    const angle = index * 2.399963;
    const ring = index % 3;
    const radius = 0.28 + ring * 0.17;
    positions[ptr] = Math.cos(angle) * radius;
    positions[ptr + 1] = Math.sin(angle) * radius;
    positions[ptr + 2] = (ring - 1) * 0.14;
  }
  return positionsToGeometry(positions);
}

function makeTranscriptGeometry(): THREE.BufferGeometry {
  const cols = 16;
  const rows = 9;
  const positions = new Float32Array(cols * rows * 3);
  for (let index = 0; index < cols * rows; index++) {
    const ptr = index * 3;
    const col = index % cols;
    const row = Math.floor(index / cols);
    positions[ptr] = (col - (cols - 1) / 2) * 0.075;
    positions[ptr + 1] = (row - (rows - 1) / 2) * 0.075;
    positions[ptr + 2] = ((index * 29) % 100) / 320;
  }
  return positionsToGeometry(positions);
}

function makeRouterGeometry(): THREE.BufferGeometry {
  const branches = 7;
  const perBranch = 32;
  const positions = new Float32Array(branches * perBranch * 3);
  for (let index = 0; index < branches * perBranch; index++) {
    const branch = Math.floor(index / perBranch);
    const step = (index % perBranch) / (perBranch - 1);
    const ptr = index * 3;
    const angle = (branch / branches) * Math.PI * 2;
    positions[ptr] = Math.cos(angle) * step * 0.74;
    positions[ptr + 1] = Math.sin(angle) * step * 0.48;
    positions[ptr + 2] = (step - 0.5) * 0.28;
  }
  return positionsToGeometry(positions);
}

function makeLearningGeometry(): THREE.BufferGeometry {
  const count = 220;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) {
    const ptr = index * 3;
    const t = index / (count - 1);
    const angle = t * Math.PI * 7;
    const radius = 0.76 - t * 0.55;
    positions[ptr] = Math.cos(angle) * radius;
    positions[ptr + 1] = Math.sin(angle) * radius * 0.72;
    positions[ptr + 2] = (t - 0.5) * 0.38;
  }
  return positionsToGeometry(positions);
}

function positionsToGeometry(positions: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function makeCheckpointGeometry(kind: CheckpointKind): THREE.BufferGeometry {
  if (kind === 'audio') return makeAudioGeometry();
  if (kind === 'gate') return makeGateGeometry();
  if (kind === 'transcript') return makeTranscriptGeometry();
  if (kind === 'router') return makeRouterGeometry();
  return makeLearningGeometry();
}

function checkpointOpacity(props: CheckpointFieldProps): number {
  const reached = props.routeProgress + 0.035 >= props.progress;
  if (props.focused) return props.reveal * 0.78;
  if (props.active) return props.reveal * 0.50;
  return props.reveal * (reached ? 0.30 : 0.10);
}

function MiraCheckpointField(props: CheckpointFieldProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const spec = CHECKPOINT_SPEC[props.lang];
  const geometry = useMemo(() => makeCheckpointGeometry(spec.kind), [spec.kind]);
  const opacity = checkpointOpacity(props);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z += delta * (props.focused ? 0.16 : 0.05);
    const pulse = Math.sin(state.clock.elapsedTime * 4.8 + props.progress * 11) * 0.05;
    groupRef.current.scale.setScalar((props.focused ? 1.16 : 1) + pulse);
  });

  return (
    <group
      ref={groupRef}
      onClick={(event) => {
        event.stopPropagation();
        setMiraFocus(props.lang);
      }}
      position={props.position}
    >
      <points geometry={geometry}>
        <pointsMaterial
          blending={ADDITIVE}
          color={spec.color}
          depthWrite={false}
          opacity={opacity}
          size={0.026}
          sizeAttenuation
          toneMapped={false}
          transparent
        />
      </points>
      <mesh visible={false}>
        <sphereGeometry args={[0.74, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

export function MiraGameLayer({ reveal }: MiraGameLayerProps): React.JSX.Element | null {
  const phase = useScene((state) => state.phase);
  const local = useScene((state) => state.localProgress);
  const activeLang = useMiraState((state) => state.activeLang);
  const focusId = useMiraState((state) => state.focusId);
  const focusProgress = getMiraGameProgressForFocus(focusId);
  const progress = focusProgress ?? computeMiraGameProgress(phase, local, reveal);
  const layerReveal = Math.max(0, Math.min(1, (reveal - 0.28) / 0.28));
  const targets = getMiraGameTargets();

  if (layerReveal <= 0.01) return null;

  return (
    <group>
      {targets.map((target) => (
        <MiraCheckpointField
          key={target.lang}
          active={activeLang === target.lang}
          focused={focusId === target.lang}
          lang={target.lang}
          position={target.position}
          progress={target.progress}
          reveal={layerReveal}
          routeProgress={progress}
        />
      ))}
    </group>
  );
}
