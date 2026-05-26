import { describe, expect, it } from 'vitest';
import { PARTICLE_BUDGET } from '@/components/scene/scenes/mira/knot-config';

type Budget = Record<string, number>;

function totalParticles(budget: Budget): number {
  return Object.values(budget).reduce((sum, count) => sum + count, 0);
}

describe('MIRA neural supercluster visual contract', () => {
  it('uses bounded cinematic particle budgets', () => {
    const high = PARTICLE_BUDGET.high as Budget;
    const low = PARTICLE_BUDGET.low as Budget;

    expect(Object.keys(high).sort()).toEqual(['halos', 'hubs', 'plume', 'web']);
    expect(Object.keys(low).sort()).toEqual(['halos', 'hubs', 'plume', 'web']);
    expect(high.web).toBe(1_500_000);
    expect(totalParticles(high)).toBeLessThanOrEqual(1_610_000);
    expect(low.web).toBe(48_000);
    expect(totalParticles(low)).toBeLessThanOrEqual(62_000);
  });

  it('keeps animated plume particles out of the low-quality profile', () => {
    const low = PARTICLE_BUDGET.low as Budget;

    expect(low.plume).toBe(0);
  });
});
