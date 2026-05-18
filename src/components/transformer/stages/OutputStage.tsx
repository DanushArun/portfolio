'use client';

import { Text } from '@react-three/drei';
import { useTransformer } from '@/lib/transformer-store';
import { OUTPUT_PROBS } from '@/lib/transformer/constants';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

export default function OutputStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 6) return null;

  return (
    <group>
      {OUTPUT_PROBS.map((p, i) => (
        <group key={i} position={[(i - OUTPUT_PROBS.length / 2) * 0.6, 0, 0]}>
          <mesh position={[0, p.prob * 1.5, 0]}>
            <boxGeometry args={[0.35, p.prob * 3, 0.35]} />
            <meshStandardMaterial
              color={COLORS[i]}
              emissive={COLORS[i]}
              emissiveIntensity={0.3}
            />
          </mesh>
          <Text position={[0, -0.5, 0]} fontSize={0.1} color="#F0E4D2" anchorX="center" anchorY="middle">
            {p.word}
          </Text>
          <Text position={[0, p.prob * 3 + 0.25, 0]} fontSize={0.1} color={COLORS[i]} anchorX="center" anchorY="middle">
            {(p.prob * 100).toFixed(0)}%
          </Text>
        </group>
      ))}
      <Text position={[0, -2.5, 0]} fontSize={0.12} color="rgba(240,228,210,0.6)" anchorX="center" anchorY="middle">
        softmax(logits) → probabilities
      </Text>
    </group>
  );
}
