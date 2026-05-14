import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';
import { WORLD_SCALE } from './buffers';

export interface KnotW {
  lang: MiraLang;
  pos: readonly [number, number, number];
  scale: number;
}

export const KNOTS_W: ReadonlyArray<KnotW> = KNOT_TABLE.map((k) => ({
  lang: k.lang,
  pos: [
    k.position[0] * WORLD_SCALE,
    k.position[1] * WORLD_SCALE,
    k.position[2] * WORLD_SCALE,
  ] as const,
  scale: k.relativeScale,
}));

export const NATIVE_SCRIPT: Record<MiraLang, string> = {
  EN: 'ENGLISH',
  HI: 'हिंदी',
  TA: 'தமிழ்',
  KN: 'ಕನ್ನಡ',
  TE: 'తెలుగు',
};

export type Quality = 'high' | 'low';

export const PARTICLE_BUDGET = {
  high: {
    EN: 120_000,
    HI: 120_000,
    TA: 80_000,
    KN: 90_000,
    TE: 80_000,
    HILoop: 60_000,
    Tendrils: 450_000,
  },
  low: {
    EN: 30_000,
    HI: 30_000,
    TA: 20_000,
    KN: 22_500,
    TE: 20_000,
    HILoop: 15_000,
    Tendrils: 112_500,
  }
};
