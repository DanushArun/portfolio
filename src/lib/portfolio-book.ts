import { PORTFOLIO_CHAPTERS, PROJECT_PHASES } from './portfolio-chapters';
import type { ScenePhase, WorkPhase } from './scene-state';

export { PORTFOLIO_CHAPTERS, PROJECT_PHASES };

export type PortfolioChapterId =
  | 'MIRA'
  | 'AIDEN'
  | 'VANGUARD'
  | 'INSPECTION'
  | 'WAVEFIELD'
  | 'EMI'
  | 'FORMULA';

export type PortfolioProjectPhase = Exclude<WorkPhase, 'W08_ABOUT' | 'W09_CONNECT'>;
export type PortfolioVec3 = readonly [number, number, number];

export interface PortfolioBookNode {
  readonly anchor: PortfolioVec3;
  readonly color: string;
  readonly labelPosition: { readonly left: string; readonly top: string };
  readonly radius: number;
}

export interface PortfolioBeat {
  readonly description: string;
  readonly distance: number;
  readonly fov: number;
  readonly id: string;
  readonly lift: number;
  readonly metric: string;
  readonly orbit: number;
  readonly particleLines: readonly string[];
  readonly question: string;
  readonly sectionLabel: string;
  readonly stack: readonly string[];
  readonly title: string;
}

export interface PortfolioChapter {
  readonly id: PortfolioChapterId;
  readonly phase: PortfolioProjectPhase;
  readonly number: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly body: string;
  readonly role: string;
  readonly trail: readonly string[];
  readonly node: PortfolioBookNode;
  readonly beats: readonly PortfolioBeat[];
}

export interface PortfolioBookSnapshot {
  readonly beat: PortfolioBeat;
  readonly beatIndex: number;
  readonly beatProgress: number;
  readonly chapter: PortfolioChapter;
  readonly chapterIndex: number;
  readonly completedBeats: readonly string[];
  readonly localProgress: number;
  readonly routeProgress: number;
}

const LAST_CHAPTER_INDEX = PORTFOLIO_CHAPTERS.length - 1;
const ENTRY_SPAN = 0.14;
const EXIT_START = 0.88;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function isPortfolioChapterPhase(phase: ScenePhase): phase is PortfolioProjectPhase {
  return PROJECT_PHASES.includes(phase as PortfolioProjectPhase);
}

export function getPortfolioChapter(id: PortfolioChapterId): PortfolioChapter {
  const chapterMatch = PORTFOLIO_CHAPTERS.find((item) => item.id === id);
  if (!chapterMatch) throw new Error(`Missing portfolio chapter ${id}`);
  return chapterMatch;
}

export function getPortfolioChapterByPhase(phase: PortfolioProjectPhase): PortfolioChapter {
  const chapterMatch = PORTFOLIO_CHAPTERS.find((item) => item.phase === phase);
  if (!chapterMatch) throw new Error(`Missing portfolio chapter for ${phase}`);
  return chapterMatch;
}

export function getPortfolioChapterIndex(id: PortfolioChapterId): number {
  return PORTFOLIO_CHAPTERS.findIndex((item) => item.id === id);
}

function routeFor(index: number, localProgress: number): number {
  if (LAST_CHAPTER_INDEX === 0) return 0;
  const local = clamp01(localProgress);
  if (index > 0 && local < ENTRY_SPAN) return index - 1 + local / ENTRY_SPAN;
  if (index < LAST_CHAPTER_INDEX && local > EXIT_START) {
    return index + (local - EXIT_START) / (1 - EXIT_START);
  }
  return index;
}

function getBeatProgress(localProgress: number): number {
  return clamp01((localProgress - ENTRY_SPAN) / (EXIT_START - ENTRY_SPAN));
}

export function getPortfolioBookSnapshot(
  phase: PortfolioProjectPhase,
  localProgress: number,
): PortfolioBookSnapshot {
  const chapterItem = getPortfolioChapterByPhase(phase);
  const chapterIndex = getPortfolioChapterIndex(chapterItem.id);
  const beatProgress = getBeatProgress(localProgress);
  const rawBeat = beatProgress * chapterItem.beats.length;
  const beatIndex = Math.min(chapterItem.beats.length - 1, Math.floor(rawBeat));
  const completedBeats = chapterItem.beats.slice(0, beatIndex).map((item) => item.id);
  return {
    beat: chapterItem.beats[beatIndex],
    beatIndex,
    beatProgress: rawBeat - beatIndex,
    chapter: chapterItem,
    chapterIndex,
    completedBeats,
    localProgress: clamp01(localProgress),
    routeProgress: routeFor(chapterIndex, localProgress) / LAST_CHAPTER_INDEX,
  };
}

export function getPreludePortfolioSnapshot(): PortfolioBookSnapshot {
  return getPortfolioBookSnapshot('W01_MIRA', 0);
}

export function getClosingPortfolioSnapshot(): PortfolioBookSnapshot {
  return getPortfolioBookSnapshot('W07_FORMULA', 1);
}
