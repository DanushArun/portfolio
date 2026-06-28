import { describe, expect, it } from 'vitest';
import { PARTICLE_BUDGET } from '@/components/scene/scenes/mira/knot-config';
import { signalVert } from '@/components/scene/scenes/mira/MiraSignalRibbons';

type Budget = Record<string, number>;

function totalParticles(budget: Budget): number {
  return Object.values(budget).reduce((sum, count) => sum + count, 0);
}

describe('MIRA neural supercluster visual contract', () => {
  it('uses bounded cinematic particle budgets', () => {
    const high = PARTICLE_BUDGET.high as Budget;
    const low = PARTICLE_BUDGET.low as Budget;

    expect(Object.keys(high).sort()).toEqual(['halos', 'hubs', 'web']);
    expect(Object.keys(low).sort()).toEqual(['halos', 'hubs', 'web']);
    expect(high.web).toBe(1_500_000);
    expect(totalParticles(high)).toBeLessThanOrEqual(1_600_000);
    expect(low.web).toBe(48_000);
    expect(totalParticles(low)).toBeLessThanOrEqual(60_000);
  });

  it('does not budget an external route plume over the supercluster', () => {
    const high = PARTICLE_BUDGET.high as Budget;

    expect(high.plume).toBeUndefined();
  });

  it('keeps MIRA region signal shader away from reserved GLSL names', () => {
    expect(signalVert).not.toContain('float active =');
  });
});
