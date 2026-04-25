'use client';

/**
 * BlackHoleMount — React lifecycle bridge for the vanilla Bruno Simon experience.
 *
 * Mounts a single `<div>` with fixed inset:0; the createBlackHole factory
 * appends its own `<canvas>` inside. On unmount the factory's destroy() runs
 * and disposes every GL resource. No state, no re-renders.
 */

import { useEffect, useRef } from 'react';
import { createBlackHole, type BlackHoleHandle } from '@/lib/blackHole';

export interface BlackHoleMountProps {
  innerColor?: string;
  outerColor?: string;
  disableInteraction?: boolean;
  zIndex?: number;
}

export default function BlackHoleMount({
  innerColor,
  outerColor,
  disableInteraction,
  zIndex = 1,
}: BlackHoleMountProps) {
  const hostRef   = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BlackHoleHandle | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    handleRef.current = createBlackHole({
      target: hostRef.current,
      innerColor,
      outerColor,
      disableInteraction,
    });
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [innerColor, outerColor, disableInteraction]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: '#000',
      }}
    />
  );
}
