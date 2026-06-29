import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ProjectChapterOverlay from '@/components/work/ProjectChapterOverlay';
import { syncPortfolioBookForScene } from '@/lib/portfolio-book-state';

afterEach(() => {
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
});
