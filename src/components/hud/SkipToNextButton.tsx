'use client';

// src/components/hud/SkipToNextButton.tsx
// Bottom-right `↓ next` / `↓ outro`. Hidden at the final phase.
// AC11 keyboard adapter dispatches the same `advanceScene()` action.

import { useScene, ALL_PHASES, type ScenePhase } from '@/lib/scene-state';
import { adjacentPhaseProgress } from '@/lib/journey-navigation';
import styles from './HUD.module.css';

const FINAL_PHASE: ScenePhase = ALL_PHASES[ALL_PHASES.length - 1];
const PENULTIMATE_PHASE: ScenePhase = ALL_PHASES[ALL_PHASES.length - 2];
const JOURNEY_NAVIGATION_EVENT = 'portfolio:go-to-progress';

function nextPhaseProgress(phase: ScenePhase): number | null {
  return adjacentPhaseProgress(phase, 1);
}

function requestJourneyProgress(progress: number): void {
  window.dispatchEvent(new CustomEvent(JOURNEY_NAVIGATION_EVENT, {
    detail: { progress },
  }));
}

export function SkipToNextButton(): React.JSX.Element | null {
  const phase = useScene((s) => s.phase);
  const warpAutoplayActive = useScene((s) => s.warpAutoplayActive);
  if (warpAutoplayActive) return null;
  if (phase === FINAL_PHASE) return null;
  const label = phase === PENULTIMATE_PHASE ? 'outro' : 'next';
  const targetProgress = nextPhaseProgress(phase);
  if (targetProgress === null) return null;
  return (
    <button
      type="button"
      className={styles.skipButton}
      aria-label="Skip to next phase"
      onClick={() => requestJourneyProgress(targetProgress)}
      data-skip-next
    >
      <span aria-hidden="true" className={styles.skipArrow}>↓</span>
      <span>{label}</span>
    </button>
  );
}
