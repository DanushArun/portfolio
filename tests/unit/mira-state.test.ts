import { describe, it, expect, beforeEach } from 'vitest';
import {
  KNOT_TABLE,
  type MiraLang,
  type MiraDebug,
  useMiraState,
  advanceCycle,
  resetMiraStateForTest,
  ingestForLang,
  detectQualityProfile,
  exposeMiraDebug,
  stepMiraFocus,
  setMiraFocus,
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

describe('mira cutaway navigation', () => {
  it('starts at the supercluster overview camera stop', () => {
    expect(useMiraState.getState().focusId).toBe('OVERVIEW');
  });

  it('steps from overview into the English language core', () => {
    stepMiraFocus(1);
    expect(useMiraState.getState().focusId).toBe('EN');
  });

  it('wraps backward from overview to the Telugu language core', () => {
    stepMiraFocus(-1);
    expect(useMiraState.getState().focusId).toBe('TE');
  });

  it('sets focus directly for clicked celestial modules', () => {
    setMiraFocus('ROUTER');
    expect(useMiraState.getState().focusId).toBe('ROUTER');
  });
});

describe('quality profile detection', () => {
  it('returns "low" for viewport <= 768px', () => {
    expect(detectQualityProfile({ width: 768, search: '' })).toBe('low');
    expect(detectQualityProfile({ width: 500, search: '' })).toBe('low');
  });

  it('returns "high" for desktop viewports', () => {
    expect(detectQualityProfile({ width: 1440, search: '' })).toBe('high');
    expect(detectQualityProfile({ width: 1920, search: '' })).toBe('high');
  });

  it('respects ?quality=low override on desktop', () => {
    expect(detectQualityProfile({ width: 1440, search: '?quality=low' })).toBe('low');
  });
});

describe('window.__miraDebug surface', () => {
  it('installs a debug getter in non-production envs', () => {
    const fakeWin = Object.create(window) as Window;
    exposeMiraDebug(fakeWin);
    const dbg = (fakeWin as unknown as { __miraDebug: MiraDebug }).__miraDebug;
    expect(dbg).toBeDefined();
    expect(dbg.activeLang).toBe('EN');
    expect(dbg.cycleIndex).toBe(0);
    expect(dbg.density.EN).toBe(0.20);
    expect(['high', 'low']).toContain(dbg.qualityProfile);
  });
});
