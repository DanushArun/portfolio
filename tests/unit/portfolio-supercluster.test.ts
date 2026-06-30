import { describe, expect, it } from 'vitest';

import { PORTFOLIO_CHAPTERS, getPortfolioChapter } from '@/lib/portfolio-book';
import { progressToPhase } from '@/lib/journey-map';
import {
  getPortfolioArtifactLabel,
  portfolioArtifactProfile,
} from '@/lib/portfolio-artifacts';
import { buildPortfolioGlyphLayout } from '@/lib/portfolio-glyphs';
import { getPortfolioStops } from '@/lib/portfolio-journey';
import {
  buildPortfolioSuperclusterModel,
  getPortfolioTitleGlyphLines,
  getPortfolioMorphState,
  portfolioProjectIndex,
} from '@/lib/portfolio-supercluster';
import {
  beginPortfolioStepTransition,
  getPortfolioStepTransition,
  resetPortfolioStepTransition,
  syncPortfolioStepTransition,
} from '@/lib/portfolio-step-transition';

describe('portfolio supercluster', () => {
  function samplesFor(id: 'MIRA'): ReturnType<typeof portfolioArtifactProfile>[] {
    const center = getPortfolioChapter(id).node.anchor;
    return Array.from({ length: 900 }, (_, localIndex) => portfolioArtifactProfile({
      beatIndex: 0,
      center,
      id,
      localIndex,
      seed: localIndex * 97,
      total: 900,
    }));
  }

  function glyphPointsForMiraHero(particlesPerBeat: number): readonly [number, number, number][] {
    const model = buildPortfolioSuperclusterModel({ particlesPerBeat });
    const points: [number, number, number][] = [];
    model.attributes.role.forEach((role, index) => {
      const isMiraHero = role === 4 &&
        model.attributes.projectIndex[index] === 0 &&
        model.attributes.beatIndex[index] === 0;
      if (!isMiraHero) return;
      const offset = index * 3;
      points.push([
        model.attributes.glyphPosition[offset],
        model.attributes.glyphPosition[offset + 1],
        model.attributes.glyphPosition[offset + 2],
      ]);
    });
    return points;
  }

  function beatParticleCount(config: {
    readonly beatIndex: number;
    readonly projectId: string;
  }): number {
    const model = buildPortfolioSuperclusterModel();
    return model.attributes.projectIndex.reduce((sum, projectIndex, index) => {
      const project = PORTFOLIO_CHAPTERS[projectIndex]?.id;
      if (project !== config.projectId) return sum;
      return model.attributes.beatIndex[index] === config.beatIndex ? sum + 1 : sum;
    }, 0);
  }

  function spread(values: readonly number[]): number {
    return Math.max(...values) - Math.min(...values);
  }

  it('test_model_when_built_assigns_particles_to_every_project', () => {
    const model = buildPortfolioSuperclusterModel({ particlesPerBeat: 12 });

    expect(model.projects.map((project) => project.id)).toEqual(
      PORTFOLIO_CHAPTERS.map((chapter) => chapter.id),
    );
    expect(model.projectRanges).toHaveLength(PORTFOLIO_CHAPTERS.length);
  });

  it('test_model_when_built_exposes_matching_morph_attribute_lengths', () => {
    const model = buildPortfolioSuperclusterModel({ particlesPerBeat: 12 });
    const vectorLength = model.count * 3;

    expect(model.attributes.homePosition).toHaveLength(vectorLength);
    expect(model.attributes.projectPosition).toHaveLength(vectorLength);
    expect(model.attributes.beatPosition).toHaveLength(vectorLength);
    expect(model.attributes.glyphPosition).toHaveLength(vectorLength);
    expect(model.attributes.artifactPosition).toHaveLength(vectorLength);
    expect(model.attributes.artifactAlpha).toHaveLength(model.count);
    expect(model.attributes.artifactScale).toHaveLength(model.count);
    expect(model.attributes.titleGlyphPosition).toHaveLength(vectorLength);
    expect(model.attributes.projectIndex).toHaveLength(model.count);
  });

  it('test_artifact_profiles_when_sampled_recede_behind_glyph_plane', () => {
    PORTFOLIO_CHAPTERS.forEach((chapter) => {
      const profile = portfolioArtifactProfile({
        beatIndex: 0,
        center: chapter.node.anchor,
        id: chapter.id,
        localIndex: 24,
        seed: 2048,
        total: 128,
      });

      expect(profile.position.every(Number.isFinite)).toBe(true);
      expect(profile.alpha).toBeGreaterThan(0);
      expect(profile.alpha).toBeLessThanOrEqual(0.62);
      expect(profile.scale).toBeGreaterThan(0);
      expect(profile.scale).toBeLessThanOrEqual(0.9);
      expect(profile.position[2]).toBeLessThan(chapter.node.anchor[2] + 0.26);
    });
  });

  it('test_mira_artifact_when_sampled_forms_a_wide_recessed_signal_field', () => {
    const samples = samplesFor('MIRA');
    const xs = samples.map((profile) => profile.position[0]);
    const zs = samples.map((profile) => profile.position[2]);
    const centerZ = getPortfolioChapter('MIRA').node.anchor[2];
    const xSpread = Math.max(...xs) - Math.min(...xs);
    const meanZ = zs.reduce((sum, z) => sum + z, 0) / zs.length;

    expect(xSpread).toBeGreaterThan(5.2);
    expect(meanZ).toBeLessThan(centerZ - 0.28);
  });

  it('test_model_when_built_contains_glyph_particles_for_each_project', () => {
    const model = buildPortfolioSuperclusterModel({ particlesPerBeat: 12 });
    const glyphRole = 4;

    const projectsWithGlyphs = new Set<number>();
    model.attributes.role.forEach((role, index) => {
      if (role === glyphRole) projectsWithGlyphs.add(model.attributes.projectIndex[index]);
    });

    expect(projectsWithGlyphs.size).toBe(PORTFOLIO_CHAPTERS.length);
  });

  it('test_glyph_layout_when_built_maps_project_name_to_letter_cells', () => {
    const layout = buildPortfolioGlyphLayout(['MIRA', 'VOICE OPS']);

    expect(layout.cells.length).toBeGreaterThan(40);
    expect(layout.width).toBeGreaterThan(20);
    expect(layout.height).toBe(16);
  });

  it('test_glyph_layout_when_built_preserves_complexity_parentheses', () => {
    const withParentheses = buildPortfolioGlyphLayout(['O(N LOG N)']);
    const withoutParentheses = buildPortfolioGlyphLayout(['O N LOG N']);

    expect(withParentheses.cells.length).toBeGreaterThan(withoutParentheses.cells.length);
  });

  it('test_glyph_layout_when_built_preserves_quadratic_notation', () => {
    const withExponent = buildPortfolioGlyphLayout(['O(N²)']);
    const withoutExponent = buildPortfolioGlyphLayout(['O(N)']);

    expect(withExponent.cells.length).toBeGreaterThan(withoutExponent.cells.length);
  });

  it('test_glyph_layout_when_built_samples_letters_as_solid_particle_cells', () => {
    const layout = buildPortfolioGlyphLayout(['A']);

    expect(layout.cells.length).toBeGreaterThan(120);
  });

  it('test_model_when_built_uses_enough_particles_for_readable_glyphs', () => {
    const model = buildPortfolioSuperclusterModel();

    expect(model.count).toBeGreaterThan(170_000);
  });

  it('test_model_when_description_is_long_allocates_more_particles', () => {
    const miraHeroCount = beatParticleCount({ beatIndex: 0, projectId: 'MIRA' });
    const aidenSopCount = beatParticleCount({ beatIndex: 2, projectId: 'AIDEN' });

    expect(miraHeroCount).toBeGreaterThan(aidenSopCount);
  });

  it('test_model_when_built_keeps_each_beat_above_readable_particle_floor', () => {
    const model = buildPortfolioSuperclusterModel();
    const counts = new Map<string, number>();

    model.attributes.projectIndex.forEach((projectIndex, index) => {
      const project = PORTFOLIO_CHAPTERS[projectIndex]?.id;
      const beat = model.attributes.beatIndex[index];
      const key = `${project}-${beat}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    expect(Math.min(...counts.values())).toBeGreaterThanOrEqual(1400);
  });

  it('test_model_when_description_is_short_does_not_use_long_text_budget', () => {
    const vanguardOverviewCount = beatParticleCount({ beatIndex: 0, projectId: 'VANGUARD' });
    const vanguardProbeCount = beatParticleCount({ beatIndex: 1, projectId: 'VANGUARD' });

    expect(vanguardProbeCount).toBeLessThan(vanguardOverviewCount);
    expect(vanguardProbeCount).toBeLessThan(5200);
  });

  it('test_glyph_positions_when_description_is_long_fit_reading_plane_width', { timeout: 15_000 }, () => {
    const points = glyphPointsForMiraHero(5200);
    const xSpread = spread(points.map((point) => point[0]));

    expect(xSpread).toBeLessThanOrEqual(4.45);
  });

  it('test_glyph_positions_when_particle_budget_is_low_sample_full_description_height', () => {
    const points = glyphPointsForMiraHero(120);
    const ySpread = spread(points.map((point) => point[1]));

    expect(ySpread).toBeGreaterThan(0.9);
  });

  it('test_artifact_label_when_aiden_maps_to_short_readable_claim', () => {
    expect(getPortfolioArtifactLabel('AIDEN')).toBe('CALL INTEL');
  });

  it('test_artifact_label_when_mira_maps_to_voice_ai_not_live_leads', () => {
    expect(getPortfolioArtifactLabel('MIRA')).toBe('VOICE AI');
  });

  it('test_model_when_built_exposes_project_reading_labels', () => {
    const model = buildPortfolioSuperclusterModel({ particlesPerBeat: 12 });

    expect(model.projectRanges.find((project) => project.id === 'FORMULA')?.label)
      .toBe('RACE OPS');
  });

  it('test_title_glyph_lines_when_mira_title_builds_do_not_use_description_copy', () => {
    const lines = getPortfolioTitleGlyphLines(getPortfolioChapter('MIRA'));
    const text = lines.join(' ');

    expect(lines).toEqual(['MIRA', 'VOICE AI']);
    expect(text).not.toMatch(/calls new leads|qualifies them|syncs data/i);
  });

  it('test_morph_state_when_phase_is_aiden_selects_aiden_and_current_beat', () => {
    const state = getPortfolioMorphState('W02_AIDEN', 0.58);

    expect(state.activeProject).toBe(portfolioProjectIndex('AIDEN'));
    expect(state.activeBeat).toBe(3);
    expect(state.projectMorph).toBeGreaterThan(0.9);
  });

  it('test_morph_state_when_project_title_stop_uses_title_glyphs', () => {
    const titleStop = getPortfolioStops().find((stop) => stop.id === 'AIDEN-title');
    if (!titleStop) throw new Error('AIDEN-title stop missing');

    const state = getPortfolioMorphState(
      'W02_AIDEN',
      0.16,
      titleStop.progress,
    );

    expect(state.titleMorph).toBeGreaterThan(0.9);
    expect(state.glyphMorph).toBe(0);
  });

  it('test_morph_state_when_step_transition_is_active_exposes_from_to_beats', () => {
    const stops = getPortfolioStops();
    const from = stops.find((stop) => stop.id === 'MIRA-hero');
    const to = stops.find((stop) => stop.id === 'MIRA-problem');
    if (!from || !to) throw new Error('MIRA transition stops missing');
    const midpoint = (from.progress + to.progress) / 2;
    const snap = progressToPhase(midpoint);

    beginPortfolioStepTransition(from.progress, to);
    syncPortfolioStepTransition(midpoint);

    const state = getPortfolioMorphState(
      snap.phase,
      snap.localProgress,
      midpoint,
      getPortfolioStepTransition(),
    );

    expect(state.isTransitioning).toBe(true);
    expect(state.fromBeat).toBe(0);
    expect(state.toBeat).toBe(1);
    expect(state.stepMorph).toBeGreaterThan(0);
    expect(state.stepMorph).toBeLessThan(1);

    resetPortfolioStepTransition();
  });
});
