import { describe, expect, it } from 'vitest';

import {
  getMiraJourneyProgressForFocus,
  getMiraJourneyRouteTargets,
  sampleMiraJourneyCamera,
} from '@/lib/mira-region-route';
import { MIRA_RECRUITER_JOURNEY } from '@/lib/mira-state';

describe('MIRA native recruiter route', () => {
  it('test_route_targets_when_declared_match_recruiter_journey', () => {
    expect(getMiraJourneyRouteTargets().map((target) => target.id)).toEqual(MIRA_RECRUITER_JOURNEY);
  });

  it('test_focus_progress_when_region_selected_returns_checkpoint_progress', () => {
    expect(getMiraJourneyProgressForFocus('OPS_AUTOMATION')).toBeCloseTo(6 / 7, 5);
  });

  it('test_route_camera_when_sampled_returns_a_camera_behind_the_active_region', () => {
    const camera = sampleMiraJourneyCamera(0.5, 'EN');

    expect(camera.position.z).toBeGreaterThan(camera.lookAt.z);
  });
});
