import { describe, expect, it } from 'vitest';

import {
  SUPERCLUSTER_CHAPTERS,
  SUPERCLUSTER_PARTICLE_FIELD,
  SUPERCLUSTER_TIMING,
} from '@/lib/supercluster-script';

function totalDots(): number {
  return SUPERCLUSTER_CHAPTERS.reduce((sum, chapter) => sum + chapter.dots.length, 0);
}

describe('supercluster production script', () => {
  it('test_dots_when_loaded_match_pdf_total', () => {
    expect(totalDots()).toBe(37);
  });

  it('test_chapters_when_loaded_match_pdf_dot_counts', () => {
    expect(SUPERCLUSTER_CHAPTERS.map((chapter) => [chapter.id, chapter.dots.length])).toEqual([
      ['MIRA', 6],
      ['AIDEN', 6],
      ['VANGUARD', 5],
      ['INSPECTION', 5],
      ['WAVEFIELD', 5],
      ['EMI', 5],
      ['FORMULA', 5],
    ]);
  });

  it('test_particle_field_when_loaded_matches_pdf_budget', () => {
    expect(SUPERCLUSTER_PARTICLE_FIELD).toMatchObject({
      desktop: 800_000,
      mobile: 200_000,
      starPointRatio: 0.001,
    });
  });

  it('test_timing_when_loaded_preserves_wavefield_minimum', () => {
    expect(SUPERCLUSTER_TIMING.wavefieldTransformMinMs).toBe(1500);
  });

  it('test_wavefield_when_loaded_marks_matrix_to_wave_as_hardest_dot', () => {
    expect(SUPERCLUSTER_CHAPTERS.find((chapter) => chapter.id === 'WAVEFIELD')).toMatchObject({
      mostDemandingDotId: 'wave-transform',
      particlePoolPercent: 18,
    });
  });

  it('test_inspection_when_loaded_uses_carve_for_silhouette', () => {
    const inspection = SUPERCLUSTER_CHAPTERS.find((chapter) => chapter.id === 'INSPECTION');
    expect(inspection?.dots[0]?.behaviors).toContain('carve');
  });

  it('test_mira_latency_when_loaded_preserves_pdf_metric_conflict', () => {
    const mira = SUPERCLUSTER_CHAPTERS.find((chapter) => chapter.id === 'MIRA');

    expect(mira?.dots[4]).toMatchObject({
      answer: '7s -> <500ms TTFB',
      id: 'challenge',
      label: '5/6',
    });
  });

  it('test_mira_when_loaded_maps_dots_to_case_study_sections', () => {
    const mira = SUPERCLUSTER_CHAPTERS.find((chapter) => chapter.id === 'MIRA');

    expect(mira?.dots.map((dot) => dot.id)).toEqual([
      'hero',
      'problem',
      'system',
      'build',
      'challenge',
      'proof',
    ]);
  });

  it('test_mira_when_loaded_does_not_restore_stale_catalogue_labels', () => {
    const text = JSON.stringify(SUPERCLUSTER_CHAPTERS.find((chapter) => chapter.id === 'MIRA'));

    expect(text).not.toMatch(/Ops Automation Loop|MIRA TRACE|CRM \+ WHATSAPP|7\/8/);
  });
});
