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

// Hexagonal layout from founder's reference storyboard — EN top-left (largest),
// HI top-right, TA middle-left, KN bottom-right, TE bottom-centre. Each hue
// distinct per-language so language identity reads at a glance against the
// cool blue/purple web.
export const KNOT_TABLE: readonly KnotSpec[] = [
  { lang: 'EN', position: [-1.55,  0.95,  0.00], relativeScale: 1.40, hue: '#FF6648' },
  { lang: 'HI', position: [ 1.80,  1.05,  0.25], relativeScale: 1.15, hue: '#FF5B6F' },
  { lang: 'TA', position: [-1.95, -0.25,  0.40], relativeScale: 1.20, hue: '#FF7A8C' },
  { lang: 'KN', position: [ 1.55, -1.20, -0.20], relativeScale: 1.10, hue: '#B57BFF' },
  { lang: 'TE', position: [ 0.00, -1.55,  0.30], relativeScale: 1.00, hue: '#5FD0E0' },
] as const;

const CYCLE_ORDER: readonly MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE'];

type Density = Record<MiraLang, number>;

const INITIAL_DENSITY: Density = {
  EN: 0.20, HI: 0.20, TA: 0.20, KN: 0.20, TE: 0.20,
};

interface MiraState {
  activeLang: MiraLang;
  density: Density;
  cycleIndex: number;
  cycleStartMs: number;
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

export const useMiraState = create<MiraState>(() => ({
  activeLang: 'EN',
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
