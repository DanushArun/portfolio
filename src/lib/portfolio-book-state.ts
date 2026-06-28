import { create } from 'zustand';

import {
  getClosingPortfolioSnapshot,
  getPreludePortfolioSnapshot,
  getPortfolioBookSnapshot,
  isPortfolioChapterPhase,
  type PortfolioBookSnapshot,
  type PortfolioChapterId,
} from './portfolio-book';
import type { ScenePhase } from './scene-state';

interface PortfolioBookState {
  readonly beatIndex: number;
  readonly beatProgress: number;
  readonly chapterId: PortfolioChapterId;
  readonly completedBeats: readonly string[];
  readonly hoverChapterId: PortfolioChapterId | null;
  readonly localProgress: number;
  readonly routeProgress: number;
}

function toState(snapshot: PortfolioBookSnapshot): Omit<PortfolioBookState, 'hoverChapterId'> {
  return {
    beatIndex: snapshot.beatIndex,
    beatProgress: snapshot.beatProgress,
    chapterId: snapshot.chapter.id,
    completedBeats: snapshot.completedBeats,
    localProgress: snapshot.localProgress,
    routeProgress: snapshot.routeProgress,
  };
}

export const usePortfolioBookState = create<PortfolioBookState>(() => ({
  ...toState(getPreludePortfolioSnapshot()),
  hoverChapterId: null,
}));

export function setHoverPortfolioChapter(chapterId: PortfolioChapterId | null): void {
  usePortfolioBookState.setState({ hoverChapterId: chapterId });
}

export function syncPortfolioBookSnapshot(snapshot: PortfolioBookSnapshot): void {
  usePortfolioBookState.setState((state) => {
    const next = toState(snapshot);
    const unchanged = state.chapterId === next.chapterId &&
      state.beatIndex === next.beatIndex &&
      state.completedBeats.length === next.completedBeats.length &&
      Math.abs(state.routeProgress - next.routeProgress) < 0.0005 &&
      Math.abs(state.beatProgress - next.beatProgress) < 0.0005;
    if (unchanged) return state;
    return { ...state, ...next };
  });
}

export function syncPortfolioBookForScene(phase: ScenePhase, localProgress: number): void {
  if (isPortfolioChapterPhase(phase)) {
    syncPortfolioBookSnapshot(getPortfolioBookSnapshot(phase, localProgress));
    return;
  }
  if (phase === 'C07_TRANSITION' || phase === 'C08_EMERGE' || phase === 'C09_PROJECT') {
    syncPortfolioBookSnapshot(getPreludePortfolioSnapshot());
    return;
  }
  if (phase.startsWith('W')) syncPortfolioBookSnapshot(getClosingPortfolioSnapshot());
}
