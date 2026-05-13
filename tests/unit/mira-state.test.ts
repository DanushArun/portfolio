import { describe, it, expect } from 'vitest';
import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';

describe('KNOT_TABLE', () => {
  it('contains exactly 5 entries in EN→HI→TA→KN→TE order', () => {
    const langs: MiraLang[] = KNOT_TABLE.map((k) => k.lang);
    expect(langs).toEqual(['EN', 'HI', 'TA', 'KN', 'TE']);
  });

  it('makes the English knot the largest by at least 1.4x', () => {
    const en = KNOT_TABLE.find((k) => k.lang === 'EN')!;
    const smallest = Math.min(...KNOT_TABLE.map((k) => k.relativeScale));
    expect(en.relativeScale / smallest).toBeGreaterThanOrEqual(1.4);
  });

  it('keeps all entries within asymmetric supercluster bounds', () => {
    for (const k of KNOT_TABLE) {
      const radius = Math.hypot(k.position[0], k.position[1], k.position[2]);
      expect(radius).toBeLessThanOrEqual(3.5);
    }
  });

  it('assigns each knot a hex color hue', () => {
    for (const k of KNOT_TABLE) {
      expect(k.hue).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
