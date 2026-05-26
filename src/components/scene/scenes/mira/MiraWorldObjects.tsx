'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import { setMiraFocus, useMiraState, type MiraFocusId } from '@/lib/mira-state';
import { MIRA_WORLD_NODES, type MiraWorldNode } from '@/lib/mira-world';

interface MiraWorldObjectsProps {
  reveal: number;
}

interface NodeProps {
  active: boolean;
  focused: boolean;
  node: MiraWorldNode;
  reducedMotion: boolean;
  reveal: number;
}

const ADDITIVE = THREE.AdditiveBlending;
const LANG_IDS = new Set<MiraFocusId>(['EN', 'HI', 'TA', 'KN', 'TE']);

function opacityFor(reveal: number, active: boolean, focused: boolean): number {
  const base = Math.max(0, Math.min(1, (reveal - 0.64) / 0.36));
  if (focused) return base * 0.58;
  if (active) return base * 0.12;
  return base * 0.06;
}

function isActiveNode(node: MiraWorldNode, activeLang: MiraFocusId): boolean {
  if (node.id === activeLang) return true;
  return node.kind !== 'language' && node.id !== 'MEMORY';
}

function isVisibleNode(
  node: MiraWorldNode,
  focusId: MiraFocusId,
  activeLang: MiraFocusId,
): boolean {
  if (focusId === 'OVERVIEW') return false;
  if (node.id === focusId) return true;
  return node.kind === 'language' && node.id === activeLang;
}

function GlowMaterial(props: {
  color: string;
  opacity: number;
  wireframe?: boolean;
}): React.JSX.Element {
  return (
    <meshBasicMaterial
      blending={ADDITIVE}
      color={props.color}
      depthWrite={false}
      opacity={props.opacity}
      toneMapped={false}
      transparent
      wireframe={props.wireframe}
    />
  );
}

function makeMistGeometry(seed: number): THREE.BufferGeometry {
  const count = 260;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const ptr = i * 3;
    const angle = ((i * 137.5 + seed) * Math.PI) / 180;
    const radius = Math.sqrt((i + 0.5) / count) * 0.42;
    positions[ptr] = Math.cos(angle) * radius;
    positions[ptr + 1] = Math.sin(angle) * radius * 0.72;
    positions[ptr + 2] = ((i * 37 + seed) % 100) / 260 - 0.18;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function NodeMist(props: {
  color: string;
  opacity: number;
  scale: number;
  seed: number;
}): React.JSX.Element {
  const geometry = useMemo(() => makeMistGeometry(props.seed), [props.seed]);
  return (
    <points geometry={geometry} scale={props.scale}>
      <pointsMaterial
        blending={ADDITIVE}
        color={props.color}
        depthWrite={false}
        opacity={props.opacity}
        size={0.018}
        sizeAttenuation
        toneMapped={false}
        transparent
      />
    </points>
  );
}

function NodeBody({ active, focused, node, reveal }: NodeProps): React.JSX.Element {
  const opacity = opacityFor(reveal, active, focused);
  if (node.kind === 'language') return <LanguageBody node={node} opacity={opacity} />;
  if (node.kind === 'router') return <RouterBody node={node} opacity={opacity} />;
  if (node.kind === 'memory') return <MemoryBody node={node} opacity={opacity} />;
  if (node.kind === 'tools') return <ToolsBody node={node} opacity={opacity} />;
  if (node.kind === 'learning') return <LearningBody node={node} opacity={opacity} />;
  return <NebulaBody node={node} opacity={opacity} />;
}

function LanguageBody(props: { node: MiraWorldNode; opacity: number }): React.JSX.Element {
  return (
    <>
      <NodeMist color={props.node.color} opacity={props.opacity * 0.38} scale={1.1} seed={11} />
      <NodeRings color={props.node.color} opacity={props.opacity * 0.56} radius={0.42} />
    </>
  );
}

function RouterBody(props: { node: MiraWorldNode; opacity: number }): React.JSX.Element {
  return (
    <>
      <NodeMist color={props.node.color} opacity={props.opacity * 0.44} scale={1.18} seed={23} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46 * props.node.scale, 0.006, 8, 96]} />
        <GlowMaterial color="#f1ddff" opacity={props.opacity * 0.48} />
      </mesh>
      <mesh rotation={[0.42, Math.PI / 2, 0.28]}>
        <torusGeometry args={[0.32 * props.node.scale, 0.005, 8, 96]} />
        <GlowMaterial color={props.node.color} opacity={props.opacity * 0.34} />
      </mesh>
    </>
  );
}

function MemoryBody(props: { node: MiraWorldNode; opacity: number }): React.JSX.Element {
  return (
    <>
      <NodeRings color={props.node.color} opacity={props.opacity * 0.62} radius={0.56} />
      <NodeMist color="#dbe5ff" opacity={props.opacity * 0.34} scale={0.86} seed={41} />
    </>
  );
}

function ToolsBody(props: { node: MiraWorldNode; opacity: number }): React.JSX.Element {
  return (
    <>
      <NodeRings color={props.node.color} opacity={props.opacity * 0.42} radius={0.40} />
      <NodeMist color={props.node.color} opacity={props.opacity * 0.28} scale={0.72} seed={59} />
      <OrbitSparks color={props.node.color} opacity={props.opacity * 0.52} radius={0.50} />
    </>
  );
}

function LearningBody(props: { node: MiraWorldNode; opacity: number }): React.JSX.Element {
  return (
    <>
      <NodeMist color="#fff1b8" opacity={props.opacity * 0.40} scale={0.96} seed={71} />
      <NodeRings color={props.node.color} opacity={props.opacity * 0.46} radius={0.36} />
    </>
  );
}

function NebulaBody(props: { node: MiraWorldNode; opacity: number }): React.JSX.Element {
  return (
    <>
      <NodeMist color={props.node.color} opacity={props.opacity * 0.34} scale={0.86} seed={89} />
      <NodeRings color={props.node.color} opacity={props.opacity * 0.32} radius={0.44} />
    </>
  );
}

function NodeRings(props: {
  color: string;
  opacity: number;
  radius: number;
}): React.JSX.Element {
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0.22, 0]}>
        <torusGeometry args={[props.radius, 0.007, 8, 96]} />
        <GlowMaterial color={props.color} opacity={props.opacity * 0.68} />
      </mesh>
      <mesh rotation={[0.34, Math.PI / 2, 0.78]}>
        <torusGeometry args={[props.radius * 0.72, 0.006, 8, 80]} />
        <GlowMaterial color={props.color} opacity={props.opacity * 0.48} />
      </mesh>
    </>
  );
}

function OrbitSparks(props: {
  color: string;
  opacity: number;
  radius: number;
}): React.JSX.Element {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const angle = (index / 6) * Math.PI * 2;
        const position: [number, number, number] = [
          Math.cos(angle) * props.radius,
          Math.sin(angle) * props.radius,
          0,
        ];
        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <GlowMaterial color={props.color} opacity={props.opacity * 0.82} />
          </mesh>
        );
      })}
    </>
  );
}

function MiraSystemNode(props: NodeProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const activeScale = props.focused ? 1.04 : 0.86;

  useFrame((state, delta) => {
    if (props.reducedMotion || !groupRef.current) return;
    const speed = props.focused ? 0.34 : 0.16;
    groupRef.current.rotation.y += delta * speed;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.42) * 0.06;
  });

  return (
    <group
      ref={groupRef}
      onClick={(event) => {
        event.stopPropagation();
        setMiraFocus(props.node.id);
      }}
      position={[...props.node.position]}
      scale={activeScale}
    >
      <NodeBody {...props} />
      <mesh visible={false}>
        <sphereGeometry args={[LANG_IDS.has(props.node.id) ? 0.72 : 0.58, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

export function MiraWorldObjects({ reveal }: MiraWorldObjectsProps): React.JSX.Element | null {
  const activeLang = useMiraState((state) => state.activeLang);
  const focusId = useMiraState((state) => state.focusId);
  const reducedMotion = useReducedMotion();

  if (reveal < 0.64) return null;

  return (
    <group>
      {MIRA_WORLD_NODES.filter((node) => isVisibleNode(node, focusId, activeLang)).map((node) => (
        <MiraSystemNode
          key={node.id}
          active={isActiveNode(node, activeLang)}
          focused={focusId === node.id}
          node={node}
          reducedMotion={reducedMotion}
          reveal={reveal}
        />
      ))}
    </group>
  );
}
