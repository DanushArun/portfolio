import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HUD from '@/components/hud/HUD';
import { useScene } from '@/lib/scene-state';

afterEach(() => {
  cleanup();
  act(() => {
    useScene.getState().beginJourney();
  });
});

describe('HUD progress', () => {
  it('test_hud_when_journey_progress_updates_shows_progress_value', () => {
    act(() => {
      useScene.setState({ journeyProgress: 0.42, phase: 'W02_AIDEN' });
    });

    render(<HUD />);

    expect(screen.getByLabelText('Journey progress')).toHaveAttribute('value', '42');
  });

  it('test_hud_when_rendered_places_progress_above_next', () => {
    const { container } = render(<HUD />);

    const progressBeforeNext = container.querySelector(
      '[data-journey-progress] + [data-skip-next]',
    );

    expect(progressBeforeNext).not.toBeNull();
  });

  it('test_hud_when_mira_is_active_keeps_bottom_right_progress_visible', () => {
    act(() => {
      useScene.setState({ journeyProgress: 0.57, phase: 'W01_MIRA' });
    });

    const { container } = render(<HUD />);

    const bottomRightHud = container.querySelector(
      '[data-phase-indicator] + [data-journey-progress] + [data-skip-next]',
    );

    expect(bottomRightHud).not.toBeNull();
  });
});
