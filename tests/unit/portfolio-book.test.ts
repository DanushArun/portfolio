import { describe, expect, it } from 'vitest';

import {
  PORTFOLIO_CHAPTERS,
  getPortfolioBookSnapshot,
  getPortfolioChapter,
} from '@/lib/portfolio-book';
import { SUPERCLUSTER_CHAPTERS } from '@/lib/supercluster-script';

describe('portfolio book', () => {
  it('test_chapters_when_loaded_cover_project_phases', () => {
    expect(PORTFOLIO_CHAPTERS.map((chapter) => chapter.phase)).toEqual([
      'W01_MIRA',
      'W02_AIDEN',
      'W03_VANGUARD',
      'W04_INSPECTION',
      'W05_WAVEFIELD',
      'W06_EMI',
      'W07_FORMULA',
    ]);
  });

  it('test_mira_when_loaded_has_eight_catalogue_beats', () => {
    expect(getPortfolioChapter('MIRA').beats).toHaveLength(8);
  });

  it('test_beats_when_loaded_match_supercluster_production_counts', () => {
    expect(PORTFOLIO_CHAPTERS.map((chapter) => [chapter.id, chapter.beats.length])).toEqual(
      SUPERCLUSTER_CHAPTERS.map((chapter) => [chapter.id, chapter.dotCount]),
    );
  });

  it('test_beats_when_loaded_match_production_total', () => {
    const total = PORTFOLIO_CHAPTERS.reduce((sum, chapter) => sum + chapter.beats.length, 0);
    expect(total).toBe(39);
  });

  it('test_aiden_when_halfway_through_selects_parallel_intelligence', () => {
    expect(getPortfolioBookSnapshot('W02_AIDEN', 0.58).beat.id).toBe('parallel');
  });

  it('test_route_when_chapters_advance_moves_forward', () => {
    const miraRoute = getPortfolioBookSnapshot('W01_MIRA', 0.5).routeProgress;
    const emiRoute = getPortfolioBookSnapshot('W06_EMI', 0.5).routeProgress;
    expect(emiRoute).toBeGreaterThan(miraRoute);
  });
});
