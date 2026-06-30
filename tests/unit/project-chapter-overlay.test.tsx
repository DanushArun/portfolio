import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ProjectChapterOverlay from '@/components/work/ProjectChapterOverlay';
import { getPortfolioChapter } from '@/lib/portfolio-book';
import { syncPortfolioBookForScene } from '@/lib/portfolio-book-state';
import { progressToPhase } from '@/lib/journey-map';
import { getPortfolioStops } from '@/lib/portfolio-journey';
import {
  beginPortfolioStepTransition,
  resetPortfolioStepTransition,
  syncPortfolioStepTransition,
} from '@/lib/portfolio-step-transition';

afterEach(() => {
  act(() => resetPortfolioStepTransition());
  cleanup();
});

function renderOverlayTransitionFixture(): ReturnType<typeof render> {
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

  return render(<ProjectChapterOverlay />);
}

describe('project chapter overlay', () => {
  it('test_mira_hero_when_active_shows_project_title_section_and_description', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.20));

    const { container } = render(<ProjectChapterOverlay />);

    expect(container.textContent).toContain('MIRA');
    expect(container.textContent).toContain('Overview');
    expect(container.textContent).toContain('01 / 06');
    expect(container.textContent).toContain('calls new leads');
  });

  it('test_mira_hero_when_active_uses_one_description_for_text_and_aria', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.20));

    const { container } = render(<ProjectChapterOverlay />);
    const [hero] = getPortfolioChapter('MIRA').beats;
    const description = container.querySelector('[data-testid="project-step-description"]');

    expect(description?.textContent).toBe(hero.description);
    expect(description?.getAttribute('aria-label')).toBe(hero.description);
  });

  it('test_mira_hero_when_active_places_tech_badges_in_bottom_center_rail', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.20));

    const { container } = render(<ProjectChapterOverlay />);
    const rail = container.querySelector('[data-testid="project-tag-rail"]');

    expect(rail?.textContent).toContain('Voice AI');
    expect(rail?.textContent).toContain('Multilingual');
    expect(rail?.textContent).toContain('CRM Sync');
  });

  it('test_tag_when_clicked_opens_context_card_for_selected_tag', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.20));

    render(<ProjectChapterOverlay />);
    fireEvent.click(screen.getByRole('button', { name: 'Voice AI' }));

    expect(screen.getByRole('dialog', { name: 'Voice AI' }).textContent)
      .toContain('outbound qualification');
  });

  it('test_mira_challenge_when_active_shows_latency_constraint', () => {
    act(() => syncPortfolioBookForScene('W01_MIRA', 0.70));

    const { container } = render(<ProjectChapterOverlay />);

    expect(container.textContent).toContain('05 / 06');
    expect(container.textContent).toContain('Tuning VAD and pre-warming');
    expect(container.textContent).toContain('Pre-warming');
  });

  it('test_step_transition_when_active_shows_outgoing_and_incoming_descriptions', () => {
    const { container } = renderOverlayTransitionFixture();
    const incoming = container.querySelector('[data-testid="project-step-description-incoming"]');

    expect(container.textContent).toContain('calls new leads');
    expect(container.textContent).toContain('Lead decay');
    expect(incoming?.textContent).toContain('High intent leads');
    expect(incoming?.getAttribute('aria-label')).toContain('High intent leads');
  });

  it('test_step_transition_when_active_keeps_project_title_locked', () => {
    renderOverlayTransitionFixture();

    const titles = screen.getAllByTestId('project-chapter-title');
    const titleLayer = titles[0].parentElement;

    expect(titles).toHaveLength(1);
    expect(titles[0]).toHaveTextContent('MIRA');
    expect(titleLayer).not.toHaveStyle({ opacity: 'var(--outgoing-opacity, 1)' });
    expect(titleLayer).not.toHaveStyle({
      transform: 'translate3d(0, var(--outgoing-y, 0px), 0)',
    });
  });
});
