'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export default function ConnectionLine({ from, to, weight, hue }: {
  from: [number, number, number];
  to: [number, number, number];
  weight: number;
  hue: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ];
    geo.setFromPoints(points);
    return geo;
  }, [from, to]);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={`hsl(${hue}, 70%, 60%)`}
        transparent
        opacity={weight * 0.5}
      />
    </line>
  );
}
