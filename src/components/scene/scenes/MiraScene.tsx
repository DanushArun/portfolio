'use client';

/**
 * MiraScene — top-level wrapper for MIRA's celestial-body visualization.
 *
 * Renders inside the main R3F canvas (no extra WebGL context). Currently
 * wired to MiraKnots only (Task 6 checkpoint).
 *
 * TODO Task 9: compose with MiraSupercluster + MiraPlume once built.
 *
 * Reveal envelope
 * ───────────────
 * Children take a `reveal` value in [0..1] that ramps as the user scrolls
 * from the warp's white flash → MIRA. Mapping (matches the white-flash
 * schedule in SceneManager.tsx):
 *
 *   C07_TRANSITION local 0.00 → 0.45  : reveal = 0          (under flash)
 *   C07_TRANSITION local 0.45 → 1.00  : reveal = 0   → 0.40 (flash fading)
 *   C08_EMERGE     local 0.00 → 1.00  : reveal = 0.40 → 0.80
 *   C09_PROJECT    local 0.00 → 1.00  : reveal = 0.80 → 0.95
 *   W01_MIRA       local 0.00 → 1.00  : reveal = 1.00       (fully alive)
 */

import { useEffect } from 'react';
import { useScene } from '@/lib/scene-state';
import MiraKnots from './MiraKnots';

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

  // Expose reveal for the debug surface — must be an effect, not render body,
  // to satisfy react-hooks/immutability (window is external mutable state).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __miraReveal?: number }).__miraReveal = reveal;
    }
  }, [reveal]);

  return (
    <group>
      {/* TODO Task 9: compose with MiraSupercluster + MiraPlume once built */}
      <MiraKnots reveal={reveal} />
    </group>
  );
}
