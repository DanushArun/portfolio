import { describe, expect, it } from 'vitest';

import {
  getPrimaryPortfolioStopForPhase,
  getPortfolioStopForProgress,
  getPortfolioStops,
  resolvePortfolioGesture,
  resolvePortfolioSnapStep,
} from '@/lib/portfolio-journey';

describe('portfolio journey stops', () => {
  it('test_stops_when_built_include_project_title_and_each_project_beat', () => {
    const stops = getPortfolioStops();

    expect(stops[0]).toMatchObject({
      id: 'MIRA-title',
      kind: 'projectTitle',
      projectId: 'MIRA',
    });
    expect(stops.some((stop) => stop.id === 'AIDEN-sop')).toBe(true);
  });

  it('test_progress_when_near_stop_returns_stable_stop_snapshot', () => {
    const stops = getPortfolioStops();
    const aidenStop = stops.find((stop) => stop.id === 'AIDEN-sop');

    expect(aidenStop).toBeDefined();
    expect(getPortfolioStopForProgress(aidenStop?.progress ?? 0)).toMatchObject({
      activeStopIndex: aidenStop?.index,
      projectId: 'AIDEN',
      beatIndex: 2,
      cameraLocked: true,
    });
  });

  it('test_primary_stop_when_mira_phase_requested_returns_first_readable_beat', () => {
    const stop = getPrimaryPortfolioStopForPhase('W01_MIRA');

    expect(stop.id).toBe('MIRA-hero');
    expect(stop.kind).toBe('proofBeat');
  });

  it('test_gesture_when_delta_is_small_holds_current_stop', () => {
    const stops = getPortfolioStops();
    const current = stops.find((stop) => stop.id === 'AIDEN-sop');
    const result = resolvePortfolioGesture({
      currentProgress: current?.progress ?? 0,
      delta: 24,
      locked: false,
    });

    expect(result).toEqual({ committed: false, stop: current });
  });

  it('test_gesture_when_delta_is_committed_allows_native_scroll_to_drive_progress', () => {
    const stops = getPortfolioStops();
    const current = stops.find((stop) => stop.id === 'AIDEN-sop');
    const result = resolvePortfolioGesture({
      currentProgress: current?.progress ?? 0,
      delta: 140,
      locked: false,
    });

    expect(result).toEqual({ committed: false, stop: current });
  });

  it('test_gesture_when_locked_holds_current_stop', () => {
    const stops = getPortfolioStops();
    const current = stops.find((stop) => stop.id === 'AIDEN-sop');
    const result = resolvePortfolioGesture({
      currentProgress: current?.progress ?? 0,
      delta: 240,
      locked: true,
    });

    expect(result).toEqual({ committed: false, stop: current });
  });

  it('test_snap_step_when_between_stops_advances_to_adjacent_stop', () => {
    const stops = getPortfolioStops();
    const current = stops.find((stop) => stop.id === 'AIDEN-title');
    const next = stops.find((stop) => stop.id === 'AIDEN-problem');
    if (!current || !next) throw new Error('AIDEN stop missing');
    const progress = current.progress + ((next.progress - current.progress) * 0.25);

    const result = resolvePortfolioSnapStep({ currentProgress: progress, direction: 1 });

    expect(result).toEqual({ committed: true, stop: next });
  });

  it('test_snap_step_when_near_next_stop_still_lands_on_next_stop', () => {
    const stops = getPortfolioStops();
    const current = stops.find((stop) => stop.id === 'AIDEN-title');
    const next = stops.find((stop) => stop.id === 'AIDEN-problem');
    if (!current || !next) throw new Error('AIDEN stop missing');
    const progress = current.progress + ((next.progress - current.progress) * 0.75);

    const result = resolvePortfolioSnapStep({ currentProgress: progress, direction: 1 });

    expect(result).toEqual({ committed: true, stop: next });
  });
});
