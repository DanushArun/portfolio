'use client';

// src/components/hud/SkipToNextButton.tsx
// Bottom-right `↓ next` / `↓ outro`. Hidden at the final phase.
// AC11 keyboard adapter dispatches the same `advanceScene()` action.

import { useScene, ALL_PHASES, type ScenePhase } from '@/lib/scene-state';
import styles from './HUD.module.css';

const FINAL_PHASE: ScenePhase = ALL_PHASES[ALL_PHASES.length - 1];
const PENULTIMATE_PHASE: ScenePhase = ALL_PHASES[ALL_PHASES.length - 2];

export function SkipToNextButton(): React.JSX.Element | null {
  const phase = useScene((s) => s.phase);
  const advance = useScene((s) => s.advanceScene);
  if (phase === FINAL_PHASE) return null;
  const label = phase === PENULTIMATE_PHASE ? 'outro' : 'next';
  return (
    <button
      type="button"
      className={styles.skipButton}
      aria-label="Skip to next phase"
      onClick={advance}
      data-skip-next
    >
      <span aria-hidden="true" className={styles.skipArrow}>↓</span>
      <span>{label}</span>
    </button>
  );
}
