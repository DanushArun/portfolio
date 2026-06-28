// src/lib/mira-state.ts
// State + cycle controller for the MIRA Virgo Supercluster scene.
// Spec: .coo/jobs/004-mira-virgo-supercluster.md

import { create } from 'zustand';

export type MiraLang = 'EN' | 'HI' | 'TA' | 'KN' | 'TE';
export const MIRA_RECRUITER_JOURNEY = [
  'SHIPPED',
  'LATENCY',
  'LANGUAGES',
  'VOICE_INTAKE',
  'ORCHESTRATION',
  'POST_CALL',
  'OPS_AUTOMATION',
  'PRODUCTION',
] as const;

export type MiraWorkRegionId = typeof MIRA_RECRUITER_JOURNEY[number];
export type MiraFocusId =
  | 'OVERVIEW'
  | MiraWorkRegionId;
export type MiraGameStatus = 'playing' | 'complete';

export interface KnotSpec {
  readonly lang: MiraLang;
  readonly position: readonly [number, number, number];
  readonly relativeScale: number;
  readonly hue: string;
}

// Positions adapt the canonical spec frame into the scene coordinate system.
// The five cores stay in the same warm family so they read as one supercluster.
export const KNOT_TABLE: readonly KnotSpec[] = [
  { lang: 'EN', position: [-2.00,  1.42,  0.53], relativeScale: 1.40, hue: '#FFD36A' },
  { lang: 'HI', position: [ 1.69,  1.11, -0.67], relativeScale: 1.15, hue: '#FFB84D' },
  { lang: 'TA', position: [-1.69, -0.53,  0.36], relativeScale: 1.20, hue: '#FFE08A' },
  { lang: 'KN', position: [ 1.87, -0.98, -0.22], relativeScale: 1.10, hue: '#FFCD65' },
  { lang: 'TE', position: [ 0.22, -1.69,  0.80], relativeScale: 1.00, hue: '#FFB55C' },
] as const;

const CYCLE_ORDER: readonly MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE'];
export const MIRA_FOCUS_ORDER: readonly MiraFocusId[] = [
  'OVERVIEW',
  ...MIRA_RECRUITER_JOURNEY,
];

type Density = Record<MiraLang, number>;
export interface MiraCatalogueSnapshot {
  readonly completedRegions: readonly MiraWorkRegionId[];
  readonly focusId: MiraFocusId;
  readonly gameStatus: MiraGameStatus;
  readonly routeProgress: number;
}

const INITIAL_DENSITY: Density = {
  EN: 0.20, HI: 0.20, TA: 0.20, KN: 0.20, TE: 0.20,
};
const MIRA_CATALOGUE_INTRO_PROGRESS = 0.08;
const MIRA_PRELUDE_PHASES = new Set(['C07_TRANSITION', 'C08_EMERGE', 'C09_PROJECT']);

interface MiraState {
  activeLang: MiraLang;
  completedRegions: MiraWorkRegionId[];
  gameStatus: MiraGameStatus;
  hoverLang: MiraLang | null;
  hoverRegion: MiraWorkRegionId | null;
  focusId: MiraFocusId;
  tourComplete: boolean;
  density: Density;
  cycleIndex: number;
  cycleStartMs: number;
  userExploring: boolean;
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sameRegions(
  left: readonly MiraWorkRegionId[],
  right: readonly MiraWorkRegionId[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((region, index) => region === right[index]);
}

export const useMiraState = create<MiraState>(() => ({
  activeLang: 'EN',
  completedRegions: [],
  gameStatus: 'playing',
  hoverLang: null,
  hoverRegion: null,
  focusId: 'OVERVIEW',
  tourComplete: false,
  density: { ...INITIAL_DENSITY },
  cycleIndex: 0,
  cycleStartMs: nowMs(),
  userExploring: false,
}));

export function advanceCycle(): void {
  useMiraState.setState((s) => {
    const nextIndex = s.cycleIndex + 1;
    return {
      activeLang: CYCLE_ORDER[nextIndex % CYCLE_ORDER.length],
      cycleIndex: nextIndex,
      cycleStartMs: nowMs(),
    };
  });
}

export function restartCycleClock(): void {
  useMiraState.setState({ cycleStartMs: nowMs() });
}

export function holdCycleAtEnglish(): void {
  useMiraState.setState({
    activeLang: 'EN',
    cycleIndex: 0,
    cycleStartMs: nowMs(),
  });
}

export function setHoverLang(lang: MiraLang | null): void {
  useMiraState.setState({ hoverLang: lang });
}

export function setHoverRegion(region: MiraWorkRegionId | null): void {
  useMiraState.setState({ hoverRegion: region });
}

export function setActiveLang(lang: MiraLang): void {
  const idx = CYCLE_ORDER.indexOf(lang);
  useMiraState.setState({
    activeLang: lang,
    focusId: 'LANGUAGES',
    cycleIndex: idx,
    cycleStartMs: nowMs(),
    userExploring: true,
  });
  ingestForLang(lang);
}

export function setMiraFocus(focusId: MiraFocusId): void {
  useMiraState.setState({
    focusId,
    userExploring: true,
  });
}

export function getMiraCatalogueRouteProgress(progress: number): number {
  const safeProgress = clamp01(progress);
  if (safeProgress <= MIRA_CATALOGUE_INTRO_PROGRESS) return 0;
  return (safeProgress - MIRA_CATALOGUE_INTRO_PROGRESS) /
    (1 - MIRA_CATALOGUE_INTRO_PROGRESS);
}

export function getMiraCatalogueSnapshot(progress: number): MiraCatalogueSnapshot {
  const routeProgress = getMiraCatalogueRouteProgress(progress);
  if (routeProgress <= 0) {
    return {
      completedRegions: [],
      focusId: 'OVERVIEW',
      gameStatus: 'playing',
      routeProgress,
    };
  }

  const lastIndex = MIRA_RECRUITER_JOURNEY.length - 1;
  const focusIndex = Math.min(lastIndex, Math.floor(routeProgress * MIRA_RECRUITER_JOURNEY.length));
  const isComplete = routeProgress >= 1;
  const completedCount = isComplete ? MIRA_RECRUITER_JOURNEY.length : focusIndex;

  return {
    completedRegions: MIRA_RECRUITER_JOURNEY.slice(0, completedCount),
    focusId: MIRA_RECRUITER_JOURNEY[focusIndex],
    gameStatus: isComplete ? 'complete' : 'playing',
    routeProgress,
  };
}

export function setMiraCatalogueProgress(progress: number): void {
  const snapshot = getMiraCatalogueSnapshot(progress);
  useMiraState.setState((state) => {
    const unchanged = state.focusId === snapshot.focusId &&
      state.gameStatus === snapshot.gameStatus &&
      sameRegions(state.completedRegions, snapshot.completedRegions);
    if (unchanged) return state;
    return {
      completedRegions: [...snapshot.completedRegions],
      focusId: snapshot.focusId,
      gameStatus: snapshot.gameStatus,
      userExploring: false,
    };
  });
}

export function syncMiraCatalogueForScene(phase: string, localProgress: number): void {
  if (phase === 'W01_MIRA') {
    setMiraCatalogueProgress(localProgress);
    return;
  }
  if (MIRA_PRELUDE_PHASES.has(phase)) {
    setMiraCatalogueProgress(0);
    return;
  }
  if (phase.startsWith('W')) setMiraCatalogueProgress(1);
}

function hasRegion(regions: readonly MiraWorkRegionId[], region: MiraWorkRegionId): boolean {
  return regions.includes(region);
}

function nextObjective(completed: readonly MiraWorkRegionId[]): MiraWorkRegionId | null {
  return MIRA_RECRUITER_JOURNEY.find((region) => !hasRegion(completed, region)) ?? null;
}

export function getCurrentMiraObjective(): MiraWorkRegionId | null {
  return nextObjective(useMiraState.getState().completedRegions);
}

export function activateFocusedMiraRegion(): void {
  useMiraState.setState((state) => {
    const objective = nextObjective(state.completedRegions);
    if (!objective) return { ...state, gameStatus: 'complete' };
    if (state.focusId !== objective) {
      return { ...state, focusId: objective, userExploring: true };
    }
    const completedRegions = [...state.completedRegions, objective];
    const next = nextObjective(completedRegions);
    return {
      ...state,
      completedRegions,
      focusId: next ?? objective,
      gameStatus: next ? 'playing' : 'complete',
      userExploring: true,
    };
  });
}

export function advanceGuidedTour(): void {
  useMiraState.setState((s) => {
    if (s.userExploring || s.tourComplete) return s;
    const current = MIRA_FOCUS_ORDER.indexOf(s.focusId);
    const next = current + 1;
    if (next >= MIRA_FOCUS_ORDER.length) return { ...s, tourComplete: true };
    return { ...s, focusId: MIRA_FOCUS_ORDER[next] };
  });
}

export function stepMiraFocus(direction: -1 | 1): void {
  const state = useMiraState.getState();
  const current = MIRA_FOCUS_ORDER.indexOf(state.focusId);
  const index = current === -1 ? 0 : current;
  const next = (index + direction + MIRA_FOCUS_ORDER.length) % MIRA_FOCUS_ORDER.length;
  setMiraFocus(MIRA_FOCUS_ORDER[next]);
}

const DENSITY_STEP = 0.020;
const DENSITY_CAP = 1.00;

export function ingestForLang(lang: MiraLang): void {
  useMiraState.setState((s) => ({
    density: {
      ...s.density,
      [lang]: Math.min(DENSITY_CAP, s.density[lang] + DENSITY_STEP),
    },
  }));
}

export function resetMiraStateForTest(): void {
  useMiraState.setState({
    activeLang: 'EN',
    completedRegions: [],
    gameStatus: 'playing',
    hoverLang: null,
    hoverRegion: null,
    focusId: 'OVERVIEW',
    tourComplete: false,
    density: { ...INITIAL_DENSITY },
    cycleIndex: 0,
    cycleStartMs: nowMs(),
    userExploring: false,
  });
}

export type QualityProfile = 'high' | 'low';

export interface QualityProbe {
  width: number;
  search: string;
}

export function detectQualityProfile(probe: QualityProbe): QualityProfile {
  if (probe.search.includes('quality=low')) return 'low';
  if (probe.width <= 768) return 'low';
  return 'high';
}

export interface MiraDebug {
  readonly activeLang: MiraLang;
  readonly completedRegions: readonly MiraWorkRegionId[];
  readonly density: Readonly<Density>;
  readonly cycleIndex: number;
  readonly cycleStartMs: number;
  readonly focusId: MiraFocusId;
  readonly gameStatus: MiraGameStatus;
  readonly hoverRegion: MiraWorkRegionId | null;
  readonly reveal: number;
  readonly tourComplete: boolean;
  readonly qualityProfile: QualityProfile;
}

export function exposeMiraDebug(target: Window): void {
  if (process.env.NODE_ENV === 'production') return;
  Object.defineProperty(target, '__miraDebug', {
    configurable: true,
    get(): MiraDebug {
      const s = useMiraState.getState();
      const width = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const reveal = (target as unknown as { __miraReveal?: number }).__miraReveal ?? 0;
      return {
        activeLang: s.activeLang,
        completedRegions: s.completedRegions,
        density: s.density,
        cycleIndex: s.cycleIndex,
        cycleStartMs: s.cycleStartMs,
        focusId: s.focusId,
        gameStatus: s.gameStatus,
        hoverRegion: s.hoverRegion,
        reveal,
        tourComplete: s.tourComplete,
        qualityProfile: detectQualityProfile({ width, search }),
      };
    },
  });
}
