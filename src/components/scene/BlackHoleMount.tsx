'use client';

import { useEffect, useRef } from 'react';
import { createBlackHole, type BlackHoleHandle } from '@/lib/blackHole';

export interface BlackHoleMountProps {
  innerColor?: string;
  outerColor?: string;
  disableInteraction?: boolean;
  zIndex?: number;
  /** Scroll-approach progress 0–1. Drives camera rush + distortion. */
  progress?: number;
}

export default function BlackHoleMount({
  innerColor,
  outerColor,
  disableInteraction,
  zIndex = 1,
  progress = 0,
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

  useEffect(() => {
    handleRef.current?.setProgress(progress);
  }, [progress]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex, background: '#000' }}
    />
  );
}
