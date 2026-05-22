// src/lib/mira-state.ts
// State + cycle controller for the MIRA Virgo Supercluster scene.
// Spec: .coo/jobs/004-mira-virgo-supercluster.md

import { create } from 'zustand';

export type MiraLang = 'EN' | 'HI' | 'TA' | 'KN' | 'TE';

export interface KnotSpec {
  readonly lang: MiraLang;
  readonly position: readonly [number, number, number];
  readonly relativeScale: number;
  readonly hue: string;
}

// Positions adapted from the canonical spec frame (±45) by dividing by 22.5
// into the existing ±2 KNOT_TABLE coordinate system. Hues are exact spec hexes
// so EN/HI/TA/KN/TE read as warm-orange / gold / violet / magenta / cyan
// against the cool filament web.
export const KNOT_TABLE: readonly KnotSpec[] = [
  { lang: 'EN', position: [-2.00,  1.42,  0.53], relativeScale: 1.40, hue: '#FF9933' },
  { lang: 'HI', position: [ 1.69,  1.11, -0.67], relativeScale: 1.15, hue: '#FFB84D' },
  { lang: 'TA', position: [-1.69, -0.53,  0.36], relativeScale: 1.20, hue: '#B266FF' },
  { lang: 'KN', position: [ 1.87, -0.98, -0.22], relativeScale: 1.10, hue: '#E680FF' },
  { lang: 'TE', position: [ 0.22, -1.69,  0.80], relativeScale: 1.00, hue: '#3399FF' },
] as const;

const CYCLE_ORDER: readonly MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE'];

type Density = Record<MiraLang, number>;

const INITIAL_DENSITY: Density = {
  EN: 0.20, HI: 0.20, TA: 0.20, KN: 0.20, TE: 0.20,
};

interface MiraState {
  activeLang: MiraLang;
  hoverLang: MiraLang | null;
  density: Density;
  cycleIndex: number;
  cycleStartMs: number;
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

export const useMiraState = create<MiraState>(() => ({
  activeLang: 'EN',
  hoverLang: null,
  density: { ...INITIAL_DENSITY },
  cycleIndex: 0,
  cycleStartMs: nowMs(),
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

export function setHoverLang(lang: MiraLang | null): void {
  useMiraState.setState({ hoverLang: lang });
}

export function setActiveLang(lang: MiraLang): void {
  const idx = CYCLE_ORDER.indexOf(lang);
  useMiraState.setState({
    activeLang: lang,
    cycleIndex: idx,
    cycleStartMs: nowMs(),
  });
  ingestForLang(lang);
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
    density: { ...INITIAL_DENSITY },
    cycleIndex: 0,
    cycleStartMs: nowMs(),
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
  readonly density: Readonly<Density>;
  readonly cycleIndex: number;
  readonly cycleStartMs: number;
  readonly reveal: number;
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
        density: s.density,
        cycleIndex: s.cycleIndex,
        cycleStartMs: s.cycleStartMs,
        reveal,
        qualityProfile: detectQualityProfile({ width, search }),
      };
    },
  });
}
