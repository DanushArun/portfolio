import { describe, expect, it } from 'vitest';

import {
  PORTFOLIO_CHAPTERS,
  getPortfolioBookSnapshot,
  getPortfolioChapter,
} from '@/lib/portfolio-book';
import { SUPERCLUSTER_CHAPTERS } from '@/lib/supercluster-script';

describe('portfolio book', () => {
  const FIRST_BEAT_SECTION_LABELS = {
    MIRA: 'Hero',
    AIDEN: 'Overview',
    VANGUARD: 'Overview',
    INSPECTION: 'Overview',
    WAVEFIELD: 'Overview',
    EMI: 'Overview',
    FORMULA: 'Overview',
  } as const;
  const PARTICLE_LINE_MAX = 26;

  function normalizedText(value: string): string {
    return value.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

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
    expect(beats.every((beat) => beat.description.length <= 120)).toBe(true);
    expect(beats.every((beat) => beat.particleLines.length >= 1)).toBe(true);
    expect(beats.every((beat) => (
      beat.particleLines.every((line) => line.length <= PARTICLE_LINE_MAX)
    ))).toBe(true);
  });

  it('test_beats_when_loaded_put_description_copy_into_particle_lines', () => {
    PORTFOLIO_CHAPTERS.flatMap((chapter) => chapter.beats).forEach((beat) => {
      const particleText = beat.particleLines.join(' ');

      expect(particleText).toBe(normalizedText(beat.description));
      expect(particleText).not.toBe(normalizedText(beat.title));
    });
  });

  it('test_beats_when_loaded_have_one_description_source', () => {
    PORTFOLIO_CHAPTERS.flatMap((chapter) => chapter.beats).forEach((beat) => {
      const runtimeBeat = beat as unknown as Record<string, unknown>;

      expect(runtimeBeat.proof).toBeUndefined();
      expect(runtimeBeat.summaryLines).toBeUndefined();
    });
  });

  it('test_mira_hero_when_loaded_has_case_study_copy_and_tags', () => {
    const [hero] = getPortfolioChapter('MIRA').beats;

    expect(hero.particleLines.join(' ')).toContain('ZOHO RECEIVES THE LEAD');
    expect(hero.particleLines.join(' ')).toContain('CRM');
    expect(hero.description).toBe(
      'Zoho receives the lead, MIRA calls the seller, and outcomes sync back to CRM.',
    );
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

  it('test_vanguard_when_loaded_uses_local_testing_engine_terms', () => {
    const text = JSON.stringify(getPortfolioChapter('VANGUARD'));

    expect(text).toContain('template clustering');
  });

  it('test_formula_when_loaded_uses_manufacturing_and_competition_facts', () => {
    const text = JSON.stringify(getPortfolioChapter('FORMULA'));

    expect(text).toContain('3K twill carbon fiber');
  });

  it('test_projects_when_loaded_open_with_clear_project_descriptions', () => {
    PORTFOLIO_CHAPTERS.forEach((chapter) => {
      const [intro] = chapter.beats;

      expect(intro.title).toBe(chapter.title);
      expect(intro.sectionLabel).toBe(FIRST_BEAT_SECTION_LABELS[chapter.id]);
      expect(intro.description.length).toBeGreaterThanOrEqual(40);
      expect(intro.description.length).toBeLessThanOrEqual(120);
      expect(intro.description).toContain(chapter.title.split(' ')[0]);
      expect(intro.particleLines.length).toBeGreaterThanOrEqual(3);
      expect(intro.particleLines.join(' ')).toContain(
        chapter.title.split(' ')[0].toUpperCase(),
      );
    });
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
