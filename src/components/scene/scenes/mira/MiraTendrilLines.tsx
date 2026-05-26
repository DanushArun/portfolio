'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { detectQualityProfile } from '@/lib/mira-state';
import { generateTendrilLines } from './generate-tendril-lines';
import { type Quality } from './knot-config';

interface LineMesh {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.LineBasicMaterial;
}

function useQuality(): Quality {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);
}

function opacityFor(quality: Quality): number {
  return quality === 'high' ? 0.24 : 0.18;
}

function createLineMesh(quality: Quality): LineMesh {
  const lines = generateTendrilLines(quality);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(lines.pos, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(lines.color, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 18);
  const material = new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0,
    transparent: true,
    vertexColors: true,
  });
  return { geometry, material };
}

export function MiraTendrilLines({ reveal }: { reveal: number }): React.JSX.Element {
  const quality = useQuality();
  const mesh = useMemo(() => createLineMesh(quality), [quality]);

  useEffect(() => () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }, [mesh]);

  useFrame(() => {
    mesh.material.opacity = opacityFor(quality) * Math.max(0, Math.min(1, reveal));
  });

  return <lineSegments geometry={mesh.geometry} material={mesh.material} frustumCulled={false} />;
}
