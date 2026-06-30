import { phaseToProgress } from './journey-map';
import { isPortfolioChapterPhase } from './portfolio-book';
import { getPrimaryPortfolioStopForPhase } from './portfolio-journey';
import { ALL_PHASES, type ScenePhase } from './scene-state';

const DEFAULT_PHASE_ENTRY_LOCAL = 0.05;

export function phaseEntryProgress(
  phase: ScenePhase,
  local: number = DEFAULT_PHASE_ENTRY_LOCAL,
): number {
  if (isPortfolioChapterPhase(phase)) return getPrimaryPortfolioStopForPhase(phase).progress;
  return phaseToProgress(phase, local);
}

export function adjacentPhaseProgress(phase: ScenePhase, direction: -1 | 1): number | null {
  const index = ALL_PHASES.indexOf(phase);
  if (index === -1) return null;

  const nextPhase = ALL_PHASES[index + direction];
  if (!nextPhase) return null;

  return phaseEntryProgress(nextPhase);
}
