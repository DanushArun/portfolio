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

  it('test_mira_when_loaded_has_seven_case_study_sections', () => {
    expect(getPortfolioChapter('MIRA').beats).toHaveLength(7);
  });

  it('test_mira_when_loaded_maps_to_required_case_study_order', () => {
    expect(getPortfolioChapter('MIRA').beats.map((beat) => beat.id)).toEqual([
      'hero',
      'problem',
      'system',
      'build',
      'challenge',
      'proof',
      'reflection',
    ]);
  });

  it('test_mira_when_loaded_exposes_required_section_labels', () => {
    expect(getPortfolioChapter('MIRA').beats.map((beat) => beat.sectionLabel)).toEqual([
      'Hero',
      'Problem',
      'System',
      'Build',
      'Challenge',
      'Proof',
      'Reflection',
    ]);
  });

  it('test_beats_when_loaded_have_particle_safe_description_lines', () => {
    const beats = PORTFOLIO_CHAPTERS.flatMap((chapter) => chapter.beats);

    expect(beats.every((beat) => beat.description.length > 0)).toBe(true);
    expect(beats.every((beat) => beat.particleLines.length >= 1)).toBe(true);
    expect(beats.every((beat) => beat.particleLines.every((line) => line.length <= 18)))
      .toBe(true);
  });

  it('test_mira_hero_when_loaded_has_case_study_copy_and_tags', () => {
    const [hero] = getPortfolioChapter('MIRA').beats;

    expect(hero.particleLines).toEqual(['MIRA', 'VOICE INTAKE']);
    expect(hero.description).toContain('production voice AI');
    expect(hero.stack).toEqual([
      'FastAPI',
      'Pipecat',
      'WebSockets',
      'ASR/TTS',
      'LLM',
      'Zoho',
      'WhatsApp',
    ]);
  });

  it('test_mira_when_loaded_has_tags_for_every_required_section', () => {
    expect(getPortfolioChapter('MIRA').beats.every((beat) => beat.stack.length > 0)).toBe(true);
  });

  it('test_mira_when_loaded_does_not_restore_stale_catalogue_copy', () => {
    const text = JSON.stringify(getPortfolioChapter('MIRA'));

    expect(text).not.toMatch(/Ops Automation Loop|MIRA TRACE|CRM \+ WHATSAPP|7\/8/);
  });

  it('test_beats_when_loaded_match_supercluster_production_counts', () => {
    expect(PORTFOLIO_CHAPTERS.map((chapter) => [chapter.id, chapter.beats.length])).toEqual(
      SUPERCLUSTER_CHAPTERS.map((chapter) => [chapter.id, chapter.dotCount]),
    );
  });

  it('test_beats_when_loaded_match_production_total', () => {
    const total = PORTFOLIO_CHAPTERS.reduce((sum, chapter) => sum + chapter.beats.length, 0);
    expect(total).toBe(38);
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
