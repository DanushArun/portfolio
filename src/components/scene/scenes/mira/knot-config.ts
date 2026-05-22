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
    EN: 40000,
    HI: 40000,
    TA: 30000,
    KN: 30000,
    TE: 30000,
    HILoop: 40000,
    Tendrils: 1200000, // 1.2M is the safe ceiling for CPU buffer generation
  },
  low: {
    EN: 15000,
    HI: 15000,
    TA: 12000,
    KN: 12000,
    TE: 12000,
    HILoop: 15000,
    Tendrils: 150000,
  }
};

