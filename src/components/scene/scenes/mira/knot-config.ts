import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';
import { WORLD_SCALE, hexToRgb, type Vec3 } from './buffers';

export interface KnotW {
  readonly hue: Vec3;
  readonly lang: MiraLang;
  readonly pos: Vec3;
  readonly scale: number;
}

export type Quality = 'high' | 'low';

export const LANG_INDEX: Readonly<Record<MiraLang, number>> = {
  EN: 0,
  HI: 1,
  TA: 2,
  KN: 3,
  TE: 4,
};

export const KNOTS_W: readonly KnotW[] = KNOT_TABLE.map((knot) => ({
  hue: hexToRgb(knot.hue),
  lang: knot.lang,
  pos: [
    knot.position[0] * WORLD_SCALE,
    knot.position[1] * WORLD_SCALE,
    knot.position[2] * WORLD_SCALE,
  ],
  scale: knot.relativeScale,
}));

export const NATIVE_SCRIPT: Readonly<Record<MiraLang, string>> = {
  EN: 'ENGLISH',
  HI: 'हिंदी',
  TA: 'தமிழ்',
  KN: 'ಕನ್ನಡ',
  TE: 'తెలుగు',
};

export const PARTICLE_BUDGET = {
  high: {
    web: 235_000,
    hubs: 24_000,
    halos: 10_000,
    plume: 8_192,
  },
  low: {
    web: 26_000,
    hubs: 5_000,
    halos: 2_000,
    plume: 0,
  },
} as const satisfies Record<Quality, Record<'web' | 'hubs' | 'halos' | 'plume', number>>;

export function getKnot(lang: MiraLang): KnotW {
  return KNOTS_W[LANG_INDEX[lang]];
}
