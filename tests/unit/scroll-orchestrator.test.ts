import { describe, expect, it } from 'vitest';

import { phaseToProgress } from '@/lib/journey-map';
import { shouldStartWarpAutoplay } from '@/components/scene/ScrollOrchestrator';

describe('scroll orchestrator', () => {
  it('test_warp_autoplay_when_crossing_start_and_not_consumed_starts_once', () => {
    const start = phaseToProgress('C04_HORIZON', 0);

    expect(shouldStartWarpAutoplay({
      consumed: false,
      current: start + 0.001,
      previous: start - 0.001,
    })).toBe(true);
  });

  it('test_warp_autoplay_when_already_consumed_does_not_restart', () => {
    const start = phaseToProgress('C04_HORIZON', 0);

    expect(shouldStartWarpAutoplay({
      consumed: true,
      current: start + 0.001,
      previous: start - 0.001,
    })).toBe(false);
  });
});
