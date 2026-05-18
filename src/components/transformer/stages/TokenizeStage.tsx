'use client';

import { useTransformer } from '@/lib/transformer-store';
import { TOKENS } from '@/lib/transformer/constants';
import TokenNode from '../TokenNode';

const HUES = [30, 170, 210, 340];

export default function TokenizeStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 0) return null;

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
    </group>
  );
}
