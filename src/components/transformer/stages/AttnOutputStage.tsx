'use client';

import { Text } from '@react-three/drei';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';

const HUES = [30, 170, 210, 340];

export default function AttnOutputStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 3) return null;

  return (
    <group>
      {TOKENS.map((token, i) => (
        <TokenNode
          key={token.id}
          position={[i * 2 - 3, 0, 0]}
          token={token.text}
          hue={HUES[i]}
          isActive
        />
      ))}
      <Text position={[0, -2, 0]} fontSize={0.12} color="rgba(240,228,210,0.6)" anchorX="center" anchorY="middle">
        X&apos; = X + MultiHeadOutput
      </Text>
    </group>
  );
}
