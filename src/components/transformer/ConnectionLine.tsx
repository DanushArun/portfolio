'use client';

import { Line } from '@react-three/drei';

export default function ConnectionLine({ from, to, weight, hue }: {
  from: [number, number, number];
  to: [number, number, number];
  weight: number;
  hue: number;
}) {
  return (
    <Line
      points={[from, to]}
      color={`hsl(${hue}, 70%, 60%)`}
      lineWidth={1}
      transparent
      opacity={weight * 0.5}
    />
  );
}
