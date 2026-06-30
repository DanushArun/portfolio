import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { phaseToProgress } from '@/lib/journey-map';
import { getPortfolioStops } from '@/lib/portfolio-journey';
import { useScene } from '@/lib/scene-state';

const mockState = vi.hoisted(() => ({
  lenisInstances: [] as unknown[],
  releaseProgress: 0,
  scrollTriggerConfig: null as ScrollTriggerConfig | null,
}));

type ScrollTriggerConfig = {
  onUpdate: (self: { progress: number }) => void;
};

type RafCallback = FrameRequestCallback;
type VirtualScrollData = {
  deltaX: number;
  deltaY: number;
  event: Event;
};
type LenisOptions = {
  virtualScroll?: (data: VirtualScrollData) => boolean;
};
type MockLenisApi = {
  options: LenisOptions;
  scrollTo: ReturnType<typeof vi.fn>;
};

vi.mock('lenis', () => ({
  default: class MockLenis {
    options: LenisOptions;
    destroy(): void {}
    on(): void {}
    raf(): void {}
    scrollTo = vi.fn((target: number, options?: { immediate?: boolean }) => {
      if (options?.immediate) window.scrollTo({ top: target, behavior: 'auto' });
    });
    stop(): void {}

    start(): void {
      mockState.scrollTriggerConfig?.onUpdate({ progress: mockState.releaseProgress });
    }

    constructor(options: LenisOptions = {}) {
      this.options = options;
      mockState.lenisInstances.push(this);
    }
  },
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: {
      add: vi.fn(),
      lagSmoothing: vi.fn(),
      remove: vi.fn(),
    },
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn((config: ScrollTriggerConfig) => {
      mockState.scrollTriggerConfig = config;
      return { kill: vi.fn() };
    }),
    update: vi.fn(),
  },
}));

import ScrollOrchestrator from '@/components/scene/ScrollOrchestrator';

const WARP_START_PROGRESS = phaseToProgress('C04_HORIZON', 0);
const WARP_RELEASE_PROGRESS = phaseToProgress('C08_EMERGE', 0.12);
const TOTAL_SCROLL = 9_000;

beforeEach(() => {
  mockState.lenisInstances = [];
  mockState.releaseProgress = WARP_RELEASE_PROGRESS;
  mockState.scrollTriggerConfig = null;
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: TOTAL_SCROLL + window.innerHeight,
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  vi.spyOn(performance, 'now').mockReturnValue(1_000);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  act(() => {
    useScene.getState().beginJourney();
  });
});

describe('ScrollOrchestrator warp autoplay', () => {
  it('test_warp_autoplay_when_lenis_resumes_does_not_reenter_from_release_update', async () => {
    let rafCallback: RafCallback | null = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallback = callback;
      return 1;
    });

    render(<ScrollOrchestrator />);
    await waitFor(() => expect(mockState.scrollTriggerConfig).not.toBeNull());

    act(() => {
      mockState.scrollTriggerConfig?.onUpdate({ progress: WARP_START_PROGRESS + 0.001 });
      rafCallback?.(10_000);
    });

    const releaseTop = WARP_RELEASE_PROGRESS * TOTAL_SCROLL;
    const startTop = WARP_START_PROGRESS * TOTAL_SCROLL;
    const lenis = mockState.lenisInstances[0] as MockLenisApi;
    const lenisScrolls = lenis.scrollTo.mock.calls.map(([target, options]) => ({
      immediate: (options as { immediate?: boolean } | undefined)?.immediate,
      force: (options as { force?: boolean } | undefined)?.force,
      lock: (options as { lock?: boolean } | undefined)?.lock,
      target,
    }));
    const scrollTops = vi.mocked(window.scrollTo).mock.calls.map((call) => {
      const [first, second] = call;
      if (typeof first === 'object' && first !== null) return first.top ?? null;
      if (typeof second === 'number') return second;
      return null;
    });
    const releaseIndex = scrollTops.findIndex((top) => top === releaseTop);
    const startAfterRelease = scrollTops.slice(releaseIndex + 1).some((top) => top === startTop);

    expect(releaseIndex).toBeGreaterThanOrEqual(0);
    expect(startAfterRelease).toBe(false);
    expect(lenisScrolls).toEqual(expect.arrayContaining([
      { force: true, immediate: true, lock: false, target: startTop },
      { force: true, immediate: true, lock: false, target: releaseTop },
    ]));
  });

  it('test_project_snap_when_large_wheel_delta_advances_one_locked_stop', async () => {
    render(<ScrollOrchestrator />);
    await waitFor(() => expect(mockState.lenisInstances).toHaveLength(1));

    const stops = getPortfolioStops();
    const start = stops.find((stop) => stop.id === 'AIDEN-title');
    const next = stops.find((stop) => stop.id === 'AIDEN-problem');
    if (!start || !next) throw new Error('AIDEN stop missing');
    act(() => {
      useScene.setState({
        journeyProgress: start.progress,
        localProgress: start.localProgress,
        phase: start.phase,
      });
    });

    const lenis = mockState.lenisInstances[0] as MockLenisApi;
    const handled = lenis.options.virtualScroll?.({
      deltaX: 0,
      deltaY: 650,
      event: new WheelEvent('wheel'),
    });

    expect(handled).toBe(false);
    expect(lenis.scrollTo).toHaveBeenCalledWith(
      next.progress * TOTAL_SCROLL,
      expect.objectContaining({ duration: 0.42, force: true, lock: true }),
    );
  });
});
