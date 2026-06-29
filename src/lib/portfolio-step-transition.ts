import { create } from 'zustand';

import {
  getPortfolioStopForProgress,
  type PortfolioStop,
  type PortfolioStopSnapshot,
} from './portfolio-journey';

export interface PortfolioStepTransition {
  readonly active: boolean;
  readonly direction: -1 | 1;
  readonly easedProgress: number;
  readonly fromStop: PortfolioStopSnapshot | null;
  readonly progress: number;
  readonly toStop: PortfolioStop | null;
}

interface PortfolioStepTransitionStore {
  readonly transition: PortfolioStepTransition;
}

const IDLE_TRANSITION: PortfolioStepTransition = {
  active: false,
  direction: 1,
  easedProgress: 1,
  fromStop: null,
  progress: 1,
  toStop: null,
};

export const usePortfolioStepTransition = create<PortfolioStepTransitionStore>(() => ({
  transition: IDLE_TRANSITION,
}));

let transitionFrame: PortfolioStepTransition = IDLE_TRANSITION;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function transitionProgress(config: {
  readonly current: number;
  readonly from: number;
  readonly to: number;
}): number {
  const span = config.to - config.from;
  if (span === 0) return 1;
  return clamp01((config.current - config.from) / span);
}

function publishTransition(transition: PortfolioStepTransition): void {
  transitionFrame = transition;
  usePortfolioStepTransition.setState({ transition });
}

export function beginPortfolioStepTransition(
  currentProgress: number,
  toStop: PortfolioStop,
): void {
  const fromStop = getPortfolioStopForProgress(currentProgress);
  const direction = toStop.progress >= fromStop.progress ? 1 : -1;
  const active = fromStop.index !== toStop.index;
  publishTransition({
    active,
    direction,
    easedProgress: active ? 0 : 1,
    fromStop,
    progress: active ? 0 : 1,
    toStop,
  });
}

export function syncPortfolioStepTransition(currentProgress: number): PortfolioStepTransition {
  const current = transitionFrame;
  if (!current.active || !current.fromStop || !current.toStop) return current;
  const progress = transitionProgress({
    current: currentProgress,
    from: current.fromStop.progress,
    to: current.toStop.progress,
  });
  const transition = {
    ...current,
    easedProgress: smoothstep(progress),
    progress,
  };
  transitionFrame = transition;
  return transition;
}

export function finishPortfolioStepTransition(): void {
  const current = transitionFrame;
  publishTransition({
    ...current,
    active: false,
    easedProgress: 1,
    fromStop: null,
    progress: 1,
  });
}

export function resetPortfolioStepTransition(): void {
  publishTransition(IDLE_TRANSITION);
}

export function getPortfolioStepTransition(): PortfolioStepTransition {
  return transitionFrame;
}
