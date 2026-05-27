import { describe, expect, it } from 'vitest';

import {
  getMiraGameProgressForFocus,
  getMiraGameTargets,
  sampleMiraGameRoute,
} from '@/lib/mira-game-route';
import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';

describe('mira game route', () => {
  it('test_route_targets_when_declared_match_language_order', () => {
    expect(getMiraGameTargets().map((target) => target.lang)).toEqual([
      'EN',
      'HI',
      'TA',
      'KN',
      'TE',
    ]);
  });

  it('test_route_target_positions_when_declared_match_supercluster_cores', () => {
    const targets = getMiraGameTargets();
    const distances = targets.map((target, index) => {
      const knot = KNOT_TABLE[index];
      return target.position.distanceTo({
        x: knot.position[0] * 2.35,
        y: knot.position[1] * 2.35,
        z: knot.position[2] * 2.35,
      });
    });
    expect(Math.max(...distances)).toBeLessThan(0.001);
  });

  it('test_focus_progress_when_language_is_focused_returns_checkpoint_progress', () => {
    const progress = getMiraGameProgressForFocus('KN');
    expect(progress).toBe(0.75);
  });

  it('test_route_sample_when_on_checkpoint_sits_on_same_core', () => {
    const target = getMiraGameTargets()[2];
    const sample = sampleMiraGameRoute(target.progress, 0);
    expect(sample.position.distanceTo(target.position)).toBeLessThan(0.001);
  });

  it('test_route_sample_when_on_checkpoint_reports_same_language', () => {
    const lang: MiraLang = sampleMiraGameRoute(1, 0).checkpoint;
    expect(lang).toBe('TE');
  });
});
