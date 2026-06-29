import { isPortfolioChapterPhase } from './portfolio-book';
import type { ScenePhase } from './scene-state';

export interface GlobalBloomPolicy {
  readonly enabled: boolean;
  readonly intensity: number;
  readonly luminanceSmoothing: number;
  readonly luminanceThreshold: number;
}

const DISABLED_BLOOM: GlobalBloomPolicy = {
  enabled: false,
  intensity: 0,
  luminanceSmoothing: 0,
  luminanceThreshold: 1.1,
};

const DEFAULT_BLOOM: GlobalBloomPolicy = {
  enabled: true,
  intensity: 0.32,
  luminanceSmoothing: 0.42,
  luminanceThreshold: 0.78,
};

const BLACK_SPACE_PHASES = new Set<ScenePhase>([
  'C07_TRANSITION',
  'C08_EMERGE',
  'C09_PROJECT',
  'W01_MIRA',
]);

const CA_PEAK = 0.018;

export function getGlobalBloomPolicy(phase: ScenePhase): GlobalBloomPolicy {
  if (BLACK_SPACE_PHASES.has(phase) || isPortfolioChapterPhase(phase)) {
    return DISABLED_BLOOM;
  }
  return DEFAULT_BLOOM;
}

export function isChromaticAberrationPhase(phase: ScenePhase): boolean {
  return phase === 'C05_WARP' || phase === 'C06_ANOMALY';
}

export function getChromaticAberrationOffset(config: {
  readonly cosmicProgress: number;
  readonly phase: ScenePhase;
}): number {
  if (!isChromaticAberrationPhase(config.phase)) return 0;

  const cosmic = Math.max(0, Math.min(1, (config.cosmicProgress - 0.50) / 0.25));
  const baseVelocity = 0.08;
  const accelInput = Math.min(1, cosmic / 0.85);
  const velocity = baseVelocity + (1 - baseVelocity) * Math.pow(accelInput, 1.8);
  return velocity * CA_PEAK;
}

export function isPostFxComposerActive(phase: ScenePhase): boolean {
  return getGlobalBloomPolicy(phase).enabled || isChromaticAberrationPhase(phase);
}
