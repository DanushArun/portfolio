'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

// A fragmented cube system representing data glitches
export default function AnomalyGlitch() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const phase = useScene((s) => s.phase);
  const localProgress = useScene((s) => s.localProgress);
  
  const count = 500;
  
  const { positions, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      randoms[i] = Math.random();
    }
    return { positions, randoms };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (phase !== 'C06_ANOMALY' && phase !== 'C07_TRANSITION') return;

    const time = state.clock.elapsedTime;
    // Glitch intensity based on local progress
    const intensity = phase === 'C06_ANOMALY' ? localProgress * 2 : (1 - localProgress);

    for (let i = 0; i < count; i++) {
      // Glitchy erratic movement
      const x = positions[i * 3 + 0] + (Math.sin(time * 10 + randoms[i] * 100) * intensity);
      const y = positions[i * 3 + 1] + (Math.cos(time * 15 + randoms[i] * 100) * intensity);
      const z = positions[i * 3 + 2] + (Math.sin(time * 5 + randoms[i] * 100) * intensity);
      
      dummy.position.set(x, y, z);
      
      // Random scaling
      const s = randoms[i] * 2 + (Math.sin(time * 20 * randoms[i]) > 0.8 ? intensity * 5 : 0);
      dummy.scale.set(s, s, s);
      
      dummy.rotation.set(
        time * randoms[i] * intensity,
        time * randoms[i] * 2 * intensity,
        0
      );
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Opacity
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = phase === 'C06_ANOMALY' 
      ? Math.min(1, localProgress * 2) 
      : Math.max(0, 1 - localProgress * 2);
  });

  if (phase !== 'C06_ANOMALY' && phase !== 'C07_TRANSITION') return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} position={[0, 0, -10]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial 
        color="#00ffff" 
        wireframe 
        transparent 
        opacity={0}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
