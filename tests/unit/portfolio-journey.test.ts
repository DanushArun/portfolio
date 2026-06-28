import { describe, expect, it } from 'vitest';

import {
  getPortfolioStopForProgress,
  getPortfolioStops,
  resolvePortfolioGesture,
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

  it('test_gesture_when_delta_is_committed_advances_one_stop_only', () => {
    const stops = getPortfolioStops();
    const current = stops.find((stop) => stop.id === 'AIDEN-sop');
    const result = resolvePortfolioGesture({
      currentProgress: current?.progress ?? 0,
      delta: 140,
      locked: false,
    });

    expect(result.committed).toBe(true);
    expect(result.stop.index).toBe((current?.index ?? 0) + 1);
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
});
