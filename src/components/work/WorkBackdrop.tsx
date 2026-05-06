'use client';

/**
 * Persistent low-opacity starfield + faint nebula behind the dashboard.
 * Single shared GL context (own Canvas) that mounts once and stays alive
 * across W01..W09. Runs at fixed inset:0, z-index:1, pointer-events:none.
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const STAR_COUNT = 1500;

function Stars() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 50 + Math.random() * 200;
      pos[i*3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.005;
  });

  return (
    <points ref={ref}>
      <primitive attach="geometry" object={geo} />
      <pointsMaterial size={0.4} sizeAttenuation transparent opacity={0.6} color="#9FB3C8" />
    </points>
  );
}

export default function WorkBackdrop() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 30], fov: 50 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <Stars />
    </Canvas>
  );
}
