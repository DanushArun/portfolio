'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const COUNT = 2000;
const RADIUS = 150;
const DEPTH = 600;

export default function WarpScene() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const phase = useScene((s) => s.phase);
  const localProgress = useScene((s) => s.localProgress);

  // Initial star positions, velocities, and per-instance color (multi-color
  // warp — spectral hues seeded once so each streak holds its own colour).
  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      // Random position in a cylinder around the Z axis
      const r = 5 + Math.random() * RADIUS;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = r * Math.cos(theta); // x
      positions[i * 3 + 1] = r * Math.sin(theta); // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * DEPTH; // z
      velocities[i] = 1 + Math.random() * 2;
      // Spectral palette: warm-amber → cyan → magenta, biased to accretion
      // hues so warp reads as continuation of the BH disc.
      const hue = (i * 0.137 + Math.random() * 0.4) % 1.0;
      tmp.setHSL(hue, 0.85, 0.62);
      colors[i * 3 + 0] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    return { positions, velocities, colors };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // The warp speed increases dramatically based on localProgress
    const speedBase = phase === 'C05_WARP' ? Math.max(0.1, localProgress * 40) : 0;
    
    // As speed increases, we stretch the stars along the Z axis
    const stretch = Math.max(1, speedBase * 5);

    for (let i = 0; i < COUNT; i++) {
      let z = positions[i * 3 + 2];
      
      // Move stars towards the camera (positive Z direction)
      z += velocities[i] * speedBase * 100 * delta;
      
      // If a star passes behind the camera, wrap it to the far distance
      if (z > 50) {
        z -= DEPTH;
      }
      positions[i * 3 + 2] = z;

      dummy.position.set(
        positions[i * 3 + 0],
        positions[i * 3 + 1],
        z
      );
      
      // Scale based on warp speed
      dummy.scale.set(0.1, 0.1, stretch);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Fade out based on progress (towards the anomaly)
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    if (phase === 'C05_WARP') {
      material.opacity = Math.min(1, 1 - (localProgress - 0.8) * 5);
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      onUpdate={(self) => {
        // Apply per-instance colors once after mount
        const attr = new THREE.InstancedBufferAttribute(colors, 3);
        self.geometry.setAttribute('instanceColor', attr);
      }}
    >
      {/* A thin cylinder representing a stretched star */}
      <cylinderGeometry args={[0.2, 0.2, 1, 4]} />
      {/* Rotate the cylinder so it aligns with the Z axis */}
      <group rotation={[Math.PI / 2, 0, 0]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={(shader) => {
          // Wire instanceColor → vColor for additive multi-color streaks.
          shader.vertexShader = shader.vertexShader
            .replace(
              '#include <common>',
              `#include <common>\nattribute vec3 instanceColor;`
            )
            .replace(
              '#include <color_vertex>',
              `#include <color_vertex>\nvColor.rgb *= instanceColor;`
            );
        }}
      />
    </instancedMesh>
  );
}
