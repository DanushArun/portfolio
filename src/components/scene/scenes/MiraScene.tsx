'use client';

/**
 * MiraScene — top-level wrapper for MIRA's celestial-body visualization.
 *
 * Renders inside the main R3F canvas (no extra WebGL context). Composed of:
 *   - MiraPlasma     — boiling FBM-vortex plasma core
 *                      (ports MisterPrada/vortex-glass-sphere, MIT, Mar 2025)
 *   - MiraAttractor  — 65k particles bound to the Aizawa strange attractor
 *                      (inspired by merrypranxter/strange_attractors, Apr 2026)
 *
 * Reveal envelope
 * ───────────────
 * Both children take a `reveal` value in [0..1] that ramps as the user
 * scrolls from the warp's white flash → MIRA. Mapping (matches the white-
 * flash schedule in SceneManager.tsx so they hand off cleanly):
 *
 *   C07_TRANSITION local 0.00 → 0.45  : reveal = 0          (under flash)
 *   C07_TRANSITION local 0.45 → 1.00  : reveal = 0   → 0.40 (flash fading,
 *                                                           body emerging)
 *   C08_EMERGE     local 0.00 → 1.00  : reveal = 0.40 → 0.80
 *   C09_PROJECT    local 0.00 → 1.00  : reveal = 0.80 → 0.95
 *   W01_MIRA       local 0.00 → 1.00  : reveal = 1.00       (fully alive)
 */

import { useScene } from '@/lib/scene-state';
import MiraPlasma from './MiraPlasma';
import MiraAttractor from './MiraAttractor';

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

  return (
    <group>
      <MiraPlasma reveal={reveal} />
      <MiraAttractor reveal={reveal} />
    </group>
  );
}
