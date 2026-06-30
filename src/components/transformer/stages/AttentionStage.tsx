'use client';

import { Text } from '@react-three/drei';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS, ATTENTION_HEADS, N_TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';
import ConnectionLine from '../ConnectionLine';

const HUES = [30, 170, 210, 340];

export default function AttentionStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 2) return null;

  const weights = ATTENTION_HEADS[0].weights;

  return (
    <group>
      <Text position={[-3, 2, 0]} fontSize={0.15} color="#9FB3C8" anchorX="center" anchorY="middle">Q</Text>
      <Text position={[-3, 0, 0]} fontSize={0.15} color="#4ECDC4" anchorX="center" anchorY="middle">K</Text>
      <Text position={[-3, -2, 0]} fontSize={0.15} color="#45B7D1" anchorX="center" anchorY="middle">V</Text>

      {TOKENS.map((token, i) => (
        <TokenNode
          key={token.id}
          position={[i * 2 - 3, -3.5, 0]}
          token={token.text}
          hue={HUES[i]}
          isActive
        />
      ))}

      {Array.from({ length: N_TOKENS }).map((_, i) =>
        Array.from({ length: N_TOKENS }).map((_, j) => (
          <ConnectionLine
            key={`${i}-${j}`}
            from={[i * 2 - 3, -3.5, 0]}
            to={[j * 2 - 3, -3.5, 0]}
            weight={weights[i * N_TOKENS + j]}
            hue={HUES[i]}
          />
        ))
      )}

      <Text position={[0, 3.5, 0]} fontSize={0.12} color="rgba(240,228,210,0.6)" anchorX="center" anchorY="middle">
        A = softmax(Q·Kᵀ / √d)
      </Text>
    </group>
  );
}
