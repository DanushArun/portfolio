'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { usePortfolioBookState } from '@/lib/portfolio-book-state';
import {
  getMiraArtifactBeatByIndex,
  type MiraArtifactBeat,
} from './mira-artifact-model';
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
}

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

function useArtifactGeometry(beat: MiraArtifactBeat): ArtifactGeometry {
  const buffers = useMemo(() => buildMiraArtifactVisuals(beat, {
    lineCopies: 8,
    pointCount: 18_000,
  }), [beat]);

  const geometry = useMemo(() => ({
    lineGeometry: buildGeometry(buffers.lines),
    pointGeometry: buildGeometry(buffers.points),
  }), [buffers]);

  useEffect(() => () => {
    geometry.lineGeometry.dispose();
    geometry.pointGeometry.dispose();
  }, [geometry]);

  return geometry;
}

function ArtifactField(config: {
  readonly beat: MiraArtifactBeat;
  readonly reveal: number;
}): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useArtifactGeometry(config.beat);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.y = -0.18 + Math.sin(time * 0.24) * 0.025;
    groupRef.current.rotation.z = Math.sin(time * 0.18) * 0.01;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry.lineGeometry} frustumCulled={false}>
        <lineBasicMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.18 * config.reveal}
          transparent
          vertexColors
        />
      </lineSegments>
      <points geometry={geometry.pointGeometry} frustumCulled={false}>
        <pointsMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.62 * config.reveal}
          size={0.026}
          sizeAttenuation
          transparent
          vertexColors
        />
      </points>
    </group>
  );
}

export function MiraSystemArtifact({
  beatIndex,
  forceVisible = false,
  progress,
  reveal,
}: ArtifactProps): React.JSX.Element | null {
  const chapterId = usePortfolioBookState((state) => state.chapterId);
  const liveBeatIndex = usePortfolioBookState((state) => state.beatIndex);
  const beat = getMiraArtifactBeatByIndex(beatIndex ?? liveBeatIndex);
  const visible = forceVisible || chapterId === 'MIRA';
  const safeReveal = clamp01(progress ?? reveal);

  if (!visible) return null;

  return (
    <group position={[1.08, -0.06, 1.48]} scale={[1.02, 1.02, 1.02]}>
      <ArtifactField beat={beat} reveal={safeReveal} />
    </group>
  );
}
