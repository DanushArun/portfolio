'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';
import { palette } from '@/lib/design-tokens';

const FRAGMENT_COUNT = 800;
const RING_PARTICLE_COUNT = 5000;

export default function TransitionConvergence() {
  const local = useScene((s) => s.localProgress);
  const phase = useScene((s) => s.phase);

  const fragmentsRef = useRef<THREE.InstancedMesh>(null);
  const ringsRef = useRef<THREE.Points>(null);
  const starRef = useRef<THREE.Mesh>(null);

  // Pre-calculate chaotic starts and orbital targets for fragments
  const [{ fragmentStarts, fragmentTargets, fragmentRotations, fragmentSizes }] = useState(() => {
    const starts = new Float32Array(FRAGMENT_COUNT * 3);
    const targets = new Float32Array(FRAGMENT_COUNT * 3);
    const rotations = new Float32Array(FRAGMENT_COUNT * 3);
    const sizes = new Float32Array(FRAGMENT_COUNT);

    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      // Chaotic scatter across a wide void
      starts[i*3]   = (Math.random() - 0.5) * 80;
      starts[i*3+1] = (Math.random() - 0.5) * 80;
      starts[i*3+2] = (Math.random() - 0.5) * 80;

      // Target organized orbit around the star
      const radius = 6 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2;

      targets[i*3]   = Math.cos(angle) * radius;
      targets[i*3+1] = height;
      targets[i*3+2] = Math.sin(angle) * radius;

      rotations[i*3]   = Math.random() * Math.PI;
      rotations[i*3+1] = Math.random() * Math.PI;
      rotations[i*3+2] = Math.random() * Math.PI;

      sizes[i] = 0.2 + Math.random() * 0.4;
    }
    return { fragmentStarts: starts, fragmentTargets: targets, fragmentRotations: rotations, fragmentSizes: sizes };
  });

  // Pre-calculate dense rings
  const [ringGeo] = useState(() => {    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(RING_PARTICLE_COUNT * 3);
    const colors = new Float32Array(RING_PARTICLE_COUNT * 3);
    const colorBlue = new THREE.Color(palette.cream);
    const colorOrange = new THREE.Color(palette.accretion);

    for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
      const ringIdx = i % 3; // 3 intersecting rings
      const radius = 5 + ringIdx * 2.5 + (Math.random() * 0.6);
      const angle = Math.random() * Math.PI * 2;
      
      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;
      let y = (Math.random() - 0.5) * 0.2;

      // Intersecting orbital tilts
      if (ringIdx === 1) {
        const tmp = y;
        y = z * 0.4;
        z = tmp - z * 0.1;
      } else if (ringIdx === 2) {
        const tmp = y;
        y = -x * 0.3;
        x = x * 0.9;
      }

      pos[i*3]   = x;
      pos[i*3+1] = y;
      pos[i*3+2] = z;

      const c = ringIdx === 0 ? colorOrange : colorBlue;
      colors[i*3]   = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
    });

    useFrame((state) => {
    if (phase !== 'C07_TRANSITION') return;

    // Smoothstep easing for cinematic convergence
    const t = local * local * (3 - 2 * local); 
    const time = state.clock.elapsedTime;

    if (fragmentsRef.current) {
      for (let i = 0; i < FRAGMENT_COUNT; i++) {
        // Interpolate from chaotic void to organized orbit
        tmpPos.x = THREE.MathUtils.lerp(fragmentStarts[i*3],   fragmentTargets[i*3],   t);
        tmpPos.y = THREE.MathUtils.lerp(fragmentStarts[i*3+1], fragmentTargets[i*3+1], t);
        tmpPos.z = THREE.MathUtils.lerp(fragmentStarts[i*3+2], fragmentTargets[i*3+2], t);

        // Add slow orbit once they converge
        if (t > 0.8) {
          const orbitSpeed = 0.2 * (1 - t) + 0.05;
          const angle = Math.atan2(tmpPos.z, tmpPos.x) + orbitSpeed * 0.5;
          const radius = Math.sqrt(tmpPos.x * tmpPos.x + tmpPos.z * tmpPos.z);
          tmpPos.x = Math.cos(angle) * radius;
          tmpPos.z = Math.sin(angle) * radius;
        }

        tmpEul.set(
          fragmentRotations[i*3] + time * 0.1,
          fragmentRotations[i*3+1] + time * 0.15,
          fragmentRotations[i*3+2]
        );
        tmpQuat.setFromEuler(tmpEul);

        const s = fragmentSizes[i];
        tmpScale.set(s, s, s);

        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        fragmentsRef.current.setMatrixAt(i, tmpMatrix);
      }
      fragmentsRef.current.instanceMatrix.needsUpdate = true;
      (fragmentsRef.current.material as THREE.MeshBasicMaterial).opacity = t * 0.8;
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.y = time * 0.08;
      ringsRef.current.rotation.z = time * 0.04;
      (ringsRef.current.material as THREE.PointsMaterial).opacity = t * 0.6;
    }

    if (starRef.current) {
      starRef.current.scale.setScalar(t * 1.5 + 0.1);
      (starRef.current.material as THREE.MeshBasicMaterial).opacity = t;
    }
  });

  return (
    <group visible={phase === 'C07_TRANSITION'}>
      {/* Central Bright Star */}
      <mesh ref={starRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0} />
      </mesh>

      {/* Core Volumetric Glow */}
      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color={palette.accretion} transparent opacity={local * 0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Intersecting Orbit Rings */}
      <points ref={ringsRef}>
        <primitive attach="geometry" object={ringGeo} />
        <pointsMaterial size={0.06} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* Flat Data Fragments */}
      <instancedMesh ref={fragmentsRef} args={[undefined, undefined, FRAGMENT_COUNT]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={palette.cream} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
