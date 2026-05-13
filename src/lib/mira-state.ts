// src/lib/mira-state.ts
// State + cycle controller for the MIRA Virgo Supercluster scene.
// Spec: .coo/jobs/004-mira-virgo-supercluster.md

export type MiraLang = 'EN' | 'HI' | 'TA' | 'KN' | 'TE';

export interface KnotSpec {
  readonly lang: MiraLang;
  readonly position: readonly [number, number, number];
  readonly relativeScale: number;
  readonly hue: string;
}

// Hand-tuned for screen composition. Inspired by Shapley's asymmetric web,
// not traced from it. English central + largest; regionals scattered along
// filament intersections. Hues lean warm white/orange to match the canonical
// quality-bar storyboard Panel 1 (warm cores over cool web).
export const KNOT_TABLE: readonly KnotSpec[] = [
  { lang: 'EN', position: [ 0.00,  0.20,  0.00], relativeScale: 1.40, hue: '#FFD9A8' },
  { lang: 'HI', position: [-1.80,  0.55, -0.40], relativeScale: 1.10, hue: '#FFB07A' },
  { lang: 'TA', position: [ 1.55, -0.65,  0.30], relativeScale: 1.20, hue: '#FFA86E' },
  { lang: 'KN', position: [-1.10, -0.80,  0.55], relativeScale: 1.05, hue: '#FFC58C' },
  { lang: 'TE', position: [ 1.95,  0.35, -0.25], relativeScale: 1.00, hue: '#FF9A5C' },
] as const;
