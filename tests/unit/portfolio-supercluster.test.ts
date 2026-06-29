import { describe, expect, it } from 'vitest';

import { PORTFOLIO_CHAPTERS } from '@/lib/portfolio-book';
import { getPortfolioArtifactLabel } from '@/lib/portfolio-artifacts';
import { buildPortfolioGlyphLayout } from '@/lib/portfolio-glyphs';
import { getPortfolioStops } from '@/lib/portfolio-journey';
import {
  buildPortfolioSuperclusterModel,
  getPortfolioMorphState,
  portfolioProjectIndex,
} from '@/lib/portfolio-supercluster';

describe('portfolio supercluster', () => {
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
    expect(model.attributes.titleGlyphPosition).toHaveLength(vectorLength);
    expect(model.attributes.projectIndex).toHaveLength(model.count);
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

  it('test_glyph_layout_when_built_samples_letters_as_solid_particle_cells', () => {
    const layout = buildPortfolioGlyphLayout(['A']);

    expect(layout.cells.length).toBeGreaterThan(120);
  });

  it('test_model_when_built_uses_enough_particles_for_readable_glyphs', () => {
    const model = buildPortfolioSuperclusterModel();

    expect(model.count).toBeGreaterThan(180_000);
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
});
