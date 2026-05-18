'use client';

/**
 * MiraScene — Phase 0 stub.
 *
 * The previous shader-sphere and broken supercluster were deleted per founder
 * directive ("clear out the old mira code first. then start"). This file
 * keeps the reveal envelope verbatim from the spec, exposes the debug
 * surface, and renders nothing. Phase A will compose `<MiraSupercluster />`.
 *
 * Reveal envelope (preserved verbatim from .coo/jobs/004-...md AC7)
 * ─────────────────────────────────────────────────────────────────
 *   C07_TRANSITION local 0.00 → 0.45  : reveal = 0          (under flash)
 *   C07_TRANSITION local 0.45 → 1.00  : reveal = 0   → 0.40 (flash fading)
 *   C08_EMERGE     local 0.00 → 1.00  : reveal = 0.40 → 0.80
 *   C09_PROJECT    local 0.00 → 1.00  : reveal = 0.80 → 0.95
 *   W01_MIRA       local 0.00 → 1.00  : reveal = 1.00       (fully alive)
 */

import { useEffect } from 'react';
import { useScene } from '@/lib/scene-state';
import { exposeMiraDebug } from '@/lib/mira-state';
import MiraSupercluster from './MiraSupercluster';
import MiraPlume from './MiraPlume';

function computeReveal(phase: string, local: number): number {
  if (phase === 'C07_TRANSITION') {
    if (local < 0.45) return 0;
    return ((local - 0.45) / 0.55) * 0.40;
  }
  if (phase === 'C08_EMERGE')  return 0.40 + Math.min(1, local) * 0.40;
  if (phase === 'C09_PROJECT') return 0.80 + Math.min(1, local) * 0.15;
  if (phase === 'W01_MIRA')    return 1.0;
  return 0;
}

export default function MiraScene() {
  const phase = useScene((s) => s.phase);
  const local = useScene((s) => s.localProgress);
  const reveal = computeReveal(phase, local);

  useEffect(() => {
    if (typeof window !== 'undefined') exposeMiraDebug(window);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __miraReveal?: number }).__miraReveal = reveal;
    }
  }, [reveal]);

  return (
    <group>
      {reveal >= 0.20 && <MiraSupercluster reveal={reveal} />}
      {reveal >= 0.85 && <MiraPlume reveal={reveal} />}
    </group>
  );
}
