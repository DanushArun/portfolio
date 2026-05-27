import type { MiraLang } from './mira-state';

export interface MiraCameraSpec {
  readonly position: readonly [number, number, number];
  readonly fov: number;
}

export interface MiraTendrilEdge {
  readonly from: MiraLang;
  readonly to: MiraLang;
  readonly weight: number;
  readonly bow: readonly [number, number, number];
  readonly strands: number;
}

export const MIRA_CAMERA = {
  position: [0, 0, 14.4],
  fov: 44,
} as const satisfies MiraCameraSpec;

export const MIRA_TENDRIL_EDGES: readonly MiraTendrilEdge[] = [
  { from: 'EN', to: 'HI', weight: 1.24, bow: [0.10, 1.02, -0.24], strands: 8 },
  { from: 'EN', to: 'TA', weight: 0.86, bow: [-0.72, -0.22, 0.16], strands: 6 },
  { from: 'EN', to: 'TE', weight: 0.58, bow: [-0.22, -0.88, 0.48], strands: 4 },
  { from: 'TA', to: 'HI', weight: 0.76, bow: [0.18, -0.30, -0.44], strands: 5 },
  { from: 'TA', to: 'TE', weight: 1.02, bow: [-0.08, -0.84, 0.28], strands: 7 },
  { from: 'HI', to: 'KN', weight: 1.32, bow: [1.18, 0.18, -0.06], strands: 9 },
  { from: 'HI', to: 'TE', weight: 0.72, bow: [0.50, -0.78, 0.38], strands: 5 },
  { from: 'TE', to: 'KN', weight: 1.08, bow: [0.82, -0.16, -0.20], strands: 7 },
];
