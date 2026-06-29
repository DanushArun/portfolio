import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ProjectChapterOverlay from '@/components/work/ProjectChapterOverlay';
import { syncPortfolioBookForScene } from '@/lib/portfolio-book-state';
import { progressToPhase } from '@/lib/journey-map';
import { getPortfolioStops } from '@/lib/portfolio-journey';
import {
  beginPortfolioStepTransition,
  resetPortfolioStepTransition,
  syncPortfolioStepTransition,
} from '@/lib/portfolio-step-transition';

afterEach(() => {
  resetPortfolioStepTransition();
  cleanup();
});

describe('project chapter overlay', () => {
  it('test_mira_hero_when_active_shows_project_title_section_and_description', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.20));

    const { container } = render(<ProjectChapterOverlay />);

    expect(container.textContent).toContain('MIRA');
    expect(container.textContent).toContain('Hero');
    expect(container.textContent).toContain('01 / 07');
    expect(container.textContent).toContain('MIRA / VOICE INTAKE');
  });

  it('test_mira_hero_when_active_keeps_full_description_as_accessible_label', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.20));

    const { container } = render(<ProjectChapterOverlay />);
    const description = container.querySelector('[data-testid="project-step-description"]');

    expect(description?.getAttribute('aria-label')).toContain('production voice AI');
  });

  it('test_mira_hero_when_active_places_tech_badges_in_bottom_center_rail', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.20));

    const { container } = render(<ProjectChapterOverlay />);
    const rail = container.querySelector('[data-testid="project-tag-rail"]');

    expect(rail?.textContent).toContain('FastAPI');
    expect(rail?.textContent).toContain('Pipecat');
    expect(rail?.textContent).toContain('WhatsApp');
  });

  it('test_mira_challenge_when_active_shows_latency_constraint', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.62));

    const { container } = render(<ProjectChapterOverlay />);

    expect(container.textContent).toContain('Challenge');
    expect(container.textContent).toContain('LATENCY / COLLAPSE');
    expect(container.textContent).toContain('Streaming');
  });

  it('test_step_transition_when_active_shows_outgoing_and_incoming_descriptions', () => {
    const stops = getPortfolioStops();
    const from = stops.find((stop) => stop.id === 'MIRA-hero');
    const to = stops.find((stop) => stop.id === 'MIRA-problem');
    if (!from || !to) throw new Error('MIRA transition stops missing');
    const midpoint = (from.progress + to.progress) / 2;
    const snap = progressToPhase(midpoint);

    act(() => {
      beginPortfolioStepTransition(from.progress, to);
      syncPortfolioStepTransition(midpoint);
      syncPortfolioBookForScene(snap.phase, snap.localProgress);
    });

    const { container } = render(<ProjectChapterOverlay />);
    const incoming = container.querySelector('[data-testid="project-step-description-incoming"]');

    expect(container.textContent).toContain('Hero');
    expect(container.textContent).toContain('Problem');
    expect(incoming?.getAttribute('aria-label')).toContain('Live C2C');
  });
});
