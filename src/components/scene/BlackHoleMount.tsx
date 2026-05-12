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

const IS_DEV = process.env.NODE_ENV !== 'production';

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

    // Dev-only: publish BH camera position each frame so E2E tests can assert
    // the user is falling INTO the void (Job 003.5). Gated to non-production.
    let rafId = 0;
    if (IS_DEV) {
      const tick = () => {
        const pos = handleRef.current?.getCameraPosition();
        if (pos) {
          (window as unknown as { __bhCameraPos?: { x: number; y: number; z: number } })
            .__bhCameraPos = pos;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (IS_DEV) {
        delete (window as unknown as { __bhCameraPos?: unknown }).__bhCameraPos;
      }
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
