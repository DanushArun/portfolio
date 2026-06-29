'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { usePortfolioBookState } from '@/lib/portfolio-book-state';
import {
  MIRA_ARTIFACT_BEATS,
  getMiraArtifactBeatByIndex,
  type MiraArtifactBeat,
} from './mira-artifact-model';
import { miraFlowFrag, miraFlowVert } from './mira-flow-shader.glsl';
import {
  buildMiraArtifactVisuals,
  type ArtifactBuffer,
} from './mira-artifact-visuals';

interface ArtifactProps {
  readonly beatIndex?: number;
  readonly forceVisible?: boolean;
  readonly progress?: number;
  readonly reveal: number;
}

interface ArtifactGeometry {
  readonly lineGeometry: THREE.BufferGeometry;
  readonly pointGeometry: THREE.BufferGeometry;
  readonly pointCount: number;
}

interface ArtifactTransform {
  readonly position: [number, number, number];
  readonly scale: [number, number, number];
}

const TARGET_ATTRS = [
  'aTarget0',
  'aTarget1',
  'aTarget2',
  'aTarget3',
  'aTarget4',
  'aTarget5',
  'aTarget6',
  'aTarget7',
] as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function buildGeometry(buffer: ArtifactBuffer): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(buffer.position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(buffer.color, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 7);
  return geometry;
}

function homePositions(target: Float32Array): Float32Array {
  const home = new Float32Array(target.length);
  for (let index = 0; index < target.length; index += 3) {
    const seed = index * 0.013;
    home[index] = target[index] * 0.22 + Math.sin(seed) * 4.8;
    home[index + 1] = target[index + 1] * 0.22 + Math.cos(seed * 1.7) * 2.6;
    home[index + 2] = target[index + 2] * 0.18 + Math.sin(seed * 2.1) * 0.9;
  }
  return home;
}

function seedBuffer(pointCount: number): Float32Array {
  const seeds = new Float32Array(pointCount);
  for (let index = 0; index < pointCount; index += 1) seeds[index] = index;
  return seeds;
}

function artifactTransformForSize(size: {
  readonly height: number;
  readonly width: number;
}): ArtifactTransform {
  const aspect = size.width / Math.max(1, size.height);
  if (aspect < 0.72 || size.width < 700) {
    return {
      position: [0.04, -0.12, 1.48],
      scale: [0.54, 0.54, 0.54],
    };
  }

  return {
    position: [1.08, -0.06, 1.48],
    scale: [1.02, 1.02, 1.02],
  };
}

function buildPointGeometry(pointCount: number): THREE.BufferGeometry {
  const targets = MIRA_ARTIFACT_BEATS.map((beat) => buildMiraArtifactVisuals(beat, {
    lineCopies: 1,
    pointCount,
  }).points);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(homePositions(targets[0].position), 3),
  );
  geometry.setAttribute('aColor', new THREE.BufferAttribute(targets[0].color, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seedBuffer(pointCount), 1));
  TARGET_ATTRS.forEach((name, index) => {
    geometry.setAttribute(name, new THREE.BufferAttribute(targets[index].position, 3));
  });
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 8);
  return geometry;
}

function useArtifactGeometry(beat: MiraArtifactBeat): ArtifactGeometry {
  const pointGeometry = useMemo(() => buildPointGeometry(18_000), []);
  const lineGeometry = useMemo(() => {
    const buffers = buildMiraArtifactVisuals(beat, { lineCopies: 8, pointCount: 256 });
    return buildGeometry(buffers.lines);
  }, [beat]);

  useEffect(() => () => pointGeometry.dispose(), [pointGeometry]);
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry]);

  return { lineGeometry, pointGeometry, pointCount: 18_000 };
}

function buildUniforms(): Record<string, THREE.IUniform<number>> {
  return {
    uBeatIndex: { value: 0 },
    uBeatMorph: { value: 1 },
    uPixelRatio: { value: 1 },
    uReveal: { value: 0 },
    uTime: { value: 0 },
  };
}

function ArtifactField(config: {
  readonly beat: MiraArtifactBeat;
  readonly beatIndex: number;
  readonly beatMorph: number;
  readonly reveal: number;
}): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometry = useArtifactGeometry(config.beat);
  const uniforms = useMemo(() => buildUniforms(), []);

  useFrame((state) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uBeatIndex.value = config.beatIndex;
    material.uniforms.uBeatMorph.value = config.beatMorph;
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.5);
    material.uniforms.uReveal.value = config.reveal;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y = -0.12;
    exposeArtifactDebug(config.beat.id, config.beatIndex, geometry.pointCount);
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry.lineGeometry} frustumCulled={false}>
        <lineBasicMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.2 * config.reveal}
          transparent
          vertexColors
        />
      </lineSegments>
      <points geometry={geometry.pointGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={miraFlowFrag}
          transparent
          uniforms={uniforms}
          vertexShader={miraFlowVert}
        />
      </points>
    </group>
  );
}

function exposeArtifactDebug(beatId: string, beatIndex: number, pointCount: number): void {
  if (process.env.NODE_ENV === 'production') return;
  if (typeof window === 'undefined') return;
  const target = window as Window & { __miraArtifactDebug?: unknown };
  target.__miraArtifactDebug = {
    activeBeatId: beatId,
    activeBeatIndex: beatIndex,
    hasFlowTargets: true,
    particleCount: pointCount,
  };
}

export function MiraSystemArtifact({
  beatIndex,
  forceVisible = false,
  progress,
  reveal,
}: ArtifactProps): React.JSX.Element | null {
  const size = useThree((state) => state.size);
  const chapterId = usePortfolioBookState((state) => state.chapterId);
  const liveBeatIndex = usePortfolioBookState((state) => state.beatIndex);
  const liveBeatProgress = usePortfolioBookState((state) => state.beatProgress);
  const activeBeatIndex = beatIndex ?? liveBeatIndex;
  const beat = getMiraArtifactBeatByIndex(activeBeatIndex);
  const visible = forceVisible || chapterId === 'MIRA';
  const safeReveal = clamp01(reveal);
  const beatMorph = clamp01(progress ?? liveBeatProgress);
  const transform = artifactTransformForSize(size);

  useEffect(() => {
    if (visible) exposeArtifactDebug(beat.id, activeBeatIndex, 18_000);
  }, [activeBeatIndex, beat.id, visible]);

  useEffect(() => () => {
    delete (window as Window & { __miraArtifactDebug?: unknown }).__miraArtifactDebug;
  }, []);

  if (!visible) return null;

  return (
    <group position={transform.position} scale={transform.scale}>
      <ArtifactField
        beat={beat}
        beatIndex={activeBeatIndex}
        beatMorph={beatMorph}
        reveal={safeReveal}
      />
    </group>
  );
}
