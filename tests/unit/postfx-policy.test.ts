import { describe, expect, it } from 'vitest';

import {
  getChromaticAberrationOffset,
  getGlobalBloomPolicy,
  isPostFxComposerActive,
} from '@/lib/postfx-policy';

describe('postfx policy', () => {
  it('test_global_bloom_when_portfolio_phase_is_active_is_disabled', () => {
    expect(getGlobalBloomPolicy('W01_MIRA').enabled).toBe(false);
  });

  it('test_global_bloom_when_project_reveal_is_active_is_disabled', () => {
    expect(getGlobalBloomPolicy('C09_PROJECT').enabled).toBe(false);
  });

  it('test_composer_when_portfolio_phase_is_active_is_removed', () => {
    expect(isPostFxComposerActive('W01_MIRA')).toBe(false);
  });

  it('test_composer_when_warp_phase_is_active_remains_available', () => {
    expect(isPostFxComposerActive('C05_WARP')).toBe(true);
  });

  it('test_chromatic_aberration_when_not_warp_is_zero', () => {
    expect(getChromaticAberrationOffset({ cosmicProgress: 0.7, phase: 'W01_MIRA' })).toBe(0);
  });

  it('test_chromatic_aberration_when_warping_is_positive', () => {
    expect(getChromaticAberrationOffset({ cosmicProgress: 0.7, phase: 'C05_WARP' }))
      .toBeGreaterThan(0);
  });
});
