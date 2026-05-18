'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export default function TokenNode({ position, token, hue, isActive }: {
  position: [number, number, number];
  token: string;
  hue: number;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={`hsl(${hue}, 60%, 50%)`}
          roughness={0.2}
          metalness={0.8}
          emissive={`hsl(${hue}, 60%, 30%)`}
          emissiveIntensity={isActive ? 0.5 : 0.1}
        />
      </mesh>
      <Text position={[0, 0.5, 0]} fontSize={0.15} color="#F0E4D2" anchorX="center" anchorY="middle">
        {token}
      </Text>
    </group>
  );
}
