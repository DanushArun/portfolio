// tests/unit/journey-map.test.ts
import { describe, it, expect } from 'vitest';
import { progressToPhase } from '@/lib/journey-map';

describe('progressToPhase', () => {
  it('returns C01_ORBIT at 0', () => {
    const r = progressToPhase(0);
    expect(r.phase).toBe('C01_ORBIT');
    expect(r.cosmicProgress).toBe(0);
    expect(r.workProgress).toBe(0);
    expect(r.localProgress).toBeCloseTo(0, 5);
  });
  it('returns C09_PROJECT at 0.55', () => {
    const r = progressToPhase(0.54);
    expect(r.phase).toBe('C09_PROJECT');
  });
  it('returns W01_MIRA right after cosmic', () => {
    const r = progressToPhase(0.56);
    expect(r.phase).toBe('W01_MIRA');
  });
  it('returns W09_CONNECT at 1', () => {
    const r = progressToPhase(1);
    expect(r.phase).toBe('W09_CONNECT');
    expect(r.workProgress).toBeCloseTo(1, 5);
  });
  it('cosmicProgress is 1 when crossing into work', () => {
    const r = progressToPhase(0.555);
    expect(r.cosmicProgress).toBeGreaterThanOrEqual(0.99);
  });
  it('localProgress wraps correctly across boundary', () => {
    const a = progressToPhase(0.050);  // late C01
    const b = progressToPhase(0.060);  // early C02
    expect(a.localProgress).toBeGreaterThan(0.5);
    expect(b.localProgress).toBeLessThan(0.5);
    expect(a.phase).toBe('C01_ORBIT');
    expect(b.phase).toBe('C02_PULL');
  });
  it('clamps at boundaries', () => {
    expect(progressToPhase(-0.1).phase).toBe('C01_ORBIT');
    expect(progressToPhase(1.1).phase).toBe('W09_CONNECT');
  });
});