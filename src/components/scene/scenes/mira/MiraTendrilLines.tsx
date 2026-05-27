'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { detectQualityProfile } from '@/lib/mira-state';
import { generateTendrilLines } from './generate-tendril-lines';
import { type Quality } from './knot-config';

interface LineMesh {
  readonly geometry: THREE.BufferGeometry;
}

function useQuality(): Quality {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);
}

function opacityFor(quality: Quality): number {
  return quality === 'high' ? 0.07 : 0.08;
}

function createLineMesh(quality: Quality): LineMesh {
  const lines = generateTendrilLines(quality);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(lines.pos, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(lines.color, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 18);
  return { geometry };
}

export function MiraTendrilLines({ reveal }: { reveal: number }): React.JSX.Element {
  const quality = useQuality();
  const mesh = useMemo(() => createLineMesh(quality), [quality]);
  const opacity = opacityFor(quality) * Math.max(0, Math.min(1, reveal));

  useEffect(() => () => {
    mesh.geometry.dispose();
  }, [mesh]);

  return (
    <lineSegments geometry={mesh.geometry} frustumCulled={false}>
      <lineBasicMaterial
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={opacity}
        transparent
        vertexColors
      />
    </lineSegments>
  );
}
