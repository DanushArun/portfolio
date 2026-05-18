'use client';

import { Text } from '@react-three/drei';
import { useTransformer } from '@/lib/transformer-store';
import { TOKENS, EMBEDDINGS, EMBED_DIM_DISPLAY } from '@/lib/transformer/constants';

const HUES = [30, 170, 210, 340];

function EmbedBars({ position, hue, values }: {
  position: [number, number, number];
  hue: number;
  values: Float32Array;
}) {
  return (
    <group position={position}>
      {Array.from({ length: EMBED_DIM_DISPLAY }).map((_, i) => {
        const height = values[i] * 1.5 + 0.1;
        return (
          <mesh key={i} position={[(i - EMBED_DIM_DISPLAY / 2) * 0.15, height / 2, 0]}>
            <boxGeometry args={[0.08, height, 0.08]} />
            <meshStandardMaterial
              color={`hsl(${hue + i * 10}, 60%, 50%)`}
              emissive={`hsl(${hue + i * 10}, 60%, 20%)`}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function EmbedStage() {
  const currentStage = useTransformer((s) => s.currentStage);
  if (currentStage !== 1) return null;

  return (
    <group>
      {TOKENS.map((token, i) => (
        <group key={token.id} position={[i * 2 - 3, 0, 0]}>
          <EmbedBars position={[0, 0, 0]} hue={HUES[i]} values={EMBEDDINGS[i].data} />
          <Text position={[0, -0.8, 0]} fontSize={0.12} color="#F0E4D2" anchorX="center" anchorY="middle">
            {token.text}
          </Text>
        </group>
      ))}
    </group>
  );
}
