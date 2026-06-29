import { describe, expect, it, afterEach } from 'vitest';

import {
  beginPortfolioStepTransition,
  finishPortfolioStepTransition,
  getPortfolioStepTransition,
  resetPortfolioStepTransition,
  syncPortfolioStepTransition,
} from '@/lib/portfolio-step-transition';
import { getPortfolioStops } from '@/lib/portfolio-journey';

describe('portfolio step transition', () => {
  afterEach(() => {
    resetPortfolioStepTransition();
  });

  it('test_transition_when_started_tracks_from_to_stops_and_midpoint', () => {
    const stops = getPortfolioStops();
    const from = stops.find((stop) => stop.id === 'MIRA-hero');
    const to = stops.find((stop) => stop.id === 'MIRA-problem');
    if (!from || !to) throw new Error('MIRA transition stops missing');

    beginPortfolioStepTransition(from.progress, to);
    syncPortfolioStepTransition((from.progress + to.progress) / 2);

    const transition = getPortfolioStepTransition();

    expect(transition.active).toBe(true);
    expect(transition.fromStop?.id).toBe('MIRA-hero');
    expect(transition.toStop?.id).toBe('MIRA-problem');
    expect(transition.progress).toBeCloseTo(0.5, 1);
    expect(transition.easedProgress).toBeGreaterThan(0);
    expect(transition.easedProgress).toBeLessThan(1);
  });

  it('test_transition_when_finished_releases_lock_at_target_stop', () => {
    const stops = getPortfolioStops();
    const from = stops.find((stop) => stop.id === 'MIRA-hero');
    const to = stops.find((stop) => stop.id === 'MIRA-problem');
    if (!from || !to) throw new Error('MIRA transition stops missing');

    beginPortfolioStepTransition(from.progress, to);
    syncPortfolioStepTransition(to.progress);
    finishPortfolioStepTransition();

    const transition = getPortfolioStepTransition();

    expect(transition.active).toBe(false);
    expect(transition.fromStop).toBeNull();
    expect(transition.toStop?.id).toBe('MIRA-problem');
    expect(transition.progress).toBe(1);
  });
});
