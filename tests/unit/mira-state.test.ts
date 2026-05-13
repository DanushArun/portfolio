import { describe, it, expect, beforeEach } from 'vitest';
import {
  KNOT_TABLE,
  type MiraLang,
  useMiraState,
  advanceCycle,
  resetMiraStateForTest,
  ingestForLang,
} from '@/lib/mira-state';

beforeEach(() => resetMiraStateForTest());

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

describe('mira cycle controller', () => {
  it('starts on EN at cycleIndex 0', () => {
    const s = useMiraState.getState();
    expect(s.activeLang).toBe('EN');
    expect(s.cycleIndex).toBe(0);
  });

  it('advances EN→HI→TA→KN→TE→EN on advanceCycle()', () => {
    const order: MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE', 'EN'];
    expect(useMiraState.getState().activeLang).toBe(order[0]);
    for (let i = 1; i < order.length; i++) {
      advanceCycle();
      expect(useMiraState.getState().activeLang).toBe(order[i]);
    }
  });

  it('updates cycleStartMs monotonically on each advance', () => {
    const t0 = useMiraState.getState().cycleStartMs;
    advanceCycle();
    const t1 = useMiraState.getState().cycleStartMs;
    expect(t1).toBeGreaterThanOrEqual(t0);
    expect(useMiraState.getState().cycleIndex).toBe(1);
  });
});

describe('mira density accretion', () => {
  it('starts every language at 0.20', () => {
    const d = useMiraState.getState().density;
    expect(d.EN).toBe(0.20);
    expect(d.HI).toBe(0.20);
    expect(d.TA).toBe(0.20);
    expect(d.KN).toBe(0.20);
    expect(d.TE).toBe(0.20);
  });

  it('grows density by +0.020 per ingestion', () => {
    ingestForLang('EN');
    expect(useMiraState.getState().density.EN).toBeCloseTo(0.22, 5);
    ingestForLang('EN');
    expect(useMiraState.getState().density.EN).toBeCloseTo(0.24, 5);
  });

  it('caps density at 1.00', () => {
    for (let i = 0; i < 100; i++) ingestForLang('EN');
    expect(useMiraState.getState().density.EN).toBe(1.00);
  });

  it('isolates per-language growth (same-knot only)', () => {
    ingestForLang('EN');
    const d = useMiraState.getState().density;
    expect(d.EN).toBeCloseTo(0.22, 5);
    expect(d.HI).toBe(0.20);
    expect(d.TA).toBe(0.20);
    expect(d.KN).toBe(0.20);
    expect(d.TE).toBe(0.20);
  });
});
