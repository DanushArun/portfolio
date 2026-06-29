import {
  PORTFOLIO_CHAPTERS,
  type PortfolioChapterId,
  type PortfolioProjectPhase,
} from './portfolio-book';
import { phaseToProgress } from './journey-map';

export type PortfolioStopKind = 'projectTitle' | 'proofBeat';

export interface PortfolioStop {
  readonly beatIndex: number;
  readonly cameraLocked: boolean;
  readonly id: string;
  readonly index: number;
  readonly kind: PortfolioStopKind;
  readonly localProgress: number;
  readonly phase: PortfolioProjectPhase;
  readonly progress: number;
  readonly projectId: PortfolioChapterId;
}

export interface PortfolioStopSnapshot extends PortfolioStop {
  readonly activeStopIndex: number;
}

export interface PortfolioGestureInput {
  readonly currentProgress: number;
  readonly delta: number;
  readonly locked: boolean;
}

export interface PortfolioGestureResult {
  readonly committed: boolean;
  readonly stop: PortfolioStop;
}

export interface PortfolioStepInput {
  readonly currentProgress: number;
  readonly direction: -1 | 1;
  readonly locked?: boolean;
}

const ENTRY_SPAN = 0.14;
const EXIT_START = 0.88;
const TITLE_LOCAL_PROGRESS = 0.16;

function beatLocalProgress(beatIndex: number, beatCount: number): number {
  const beatCenter = (beatIndex + 0.5) / Math.max(1, beatCount);
  return ENTRY_SPAN + (EXIT_START - ENTRY_SPAN) * beatCenter;
}

function stopId(projectId: PortfolioChapterId, kind: PortfolioStopKind, beatId: string): string {
  return kind === 'projectTitle' ? `${projectId}-title` : `${projectId}-${beatId}`;
}

function createStop(config: {
  readonly beatId: string;
  readonly beatIndex: number;
  readonly index: number;
  readonly kind: PortfolioStopKind;
  readonly localProgress: number;
  readonly phase: PortfolioProjectPhase;
  readonly projectId: PortfolioChapterId;
}): PortfolioStop {
  return {
    ...config,
    cameraLocked: true,
    id: stopId(config.projectId, config.kind, config.beatId),
    progress: phaseToProgress(config.phase, config.localProgress),
  };
}

export function getPortfolioStops(): readonly PortfolioStop[] {
  const stops: PortfolioStop[] = [];
  PORTFOLIO_CHAPTERS.forEach((chapter) => {
    stops.push(createStop({
      beatId: 'title',
      beatIndex: 0,
      index: stops.length,
      kind: 'projectTitle',
      localProgress: TITLE_LOCAL_PROGRESS,
      phase: chapter.phase,
      projectId: chapter.id,
    }));
    chapter.beats.forEach((beat, beatIndex) => {
      stops.push(createStop({
        beatId: beat.id,
        beatIndex,
        index: stops.length,
        kind: 'proofBeat',
        localProgress: beatLocalProgress(beatIndex, chapter.beats.length),
        phase: chapter.phase,
        projectId: chapter.id,
      }));
    });
  });
  return stops;
}

function nearestStopIndex(progress: number, stops: readonly PortfolioStop[]): number {
  return stops.reduce((best, stop, index) => {
    const bestDistance = Math.abs(stops[best].progress - progress);
    const distance = Math.abs(stop.progress - progress);
    return distance < bestDistance ? index : best;
  }, 0);
}

export function getPortfolioStopForProgress(progress: number): PortfolioStopSnapshot {
  const stops = getPortfolioStops();
  const index = nearestStopIndex(progress, stops);
  return { ...stops[index], activeStopIndex: index };
}

export function getProgressForPortfolioStop(index: number): number {
  const stops = getPortfolioStops();
  const clamped = Math.max(0, Math.min(stops.length - 1, index));
  return stops[clamped].progress;
}

export function getPrimaryPortfolioStopForPhase(phase: PortfolioProjectPhase): PortfolioStop {
  const stops = getPortfolioStops();
  const proofStop = stops.find((stop) => stop.phase === phase && stop.kind === 'proofBeat');
  const titleStop = stops.find((stop) => stop.phase === phase && stop.kind === 'projectTitle');
  const stop = proofStop ?? titleStop;
  if (!stop) throw new Error(`Missing primary portfolio stop for ${phase}`);
  return stop;
}

export function resolvePortfolioGesture(input: PortfolioGestureInput): PortfolioGestureResult {
  return resolvePortfolioStep({
    currentProgress: input.currentProgress,
    direction: input.delta > 0 ? 1 : -1,
    locked: true,
  });
}

export function resolvePortfolioStep(input: PortfolioStepInput): PortfolioGestureResult {
  const stops = getPortfolioStops();
  const currentIndex = nearestStopIndex(input.currentProgress, stops);
  if (input.locked) {
    return { committed: false, stop: stops[currentIndex] };
  }
  const target = Math.max(0, Math.min(stops.length - 1, currentIndex + input.direction));
  return { committed: target !== currentIndex, stop: stops[target] };
}
