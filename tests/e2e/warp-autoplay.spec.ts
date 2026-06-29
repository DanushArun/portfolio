import { expect, test } from '@playwright/test';
import { phaseToProgress } from '../../src/lib/journey-map';

type ScrollToLog = {
  top: number | null;
  scrollY: number;
};

declare global {
  interface Window {
    __setJourneyProgress?: (progress: number) => void;
    __scrollToLog?: ScrollToLog[];
  }
}

const WARP_START_PROGRESS = phaseToProgress('C04_HORIZON', 0);
const WARP_RELEASE_PROGRESS = phaseToProgress('C08_EMERGE', 0.12);
const SCROLL_TOLERANCE_PX = 8;

test.setTimeout(60_000);

test('test_warp_autoplay_when_wheel_continues_does_not_jump_back_to_horizon', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalScrollTo = window.scrollTo.bind(window);
    window.__scrollToLog = [];
    window.scrollTo = ((first?: ScrollToOptions | number, second?: number) => {
      const top = typeof first === 'object' && first !== null
        ? first.top ?? null
        : typeof second === 'number'
          ? second
          : null;
      window.__scrollToLog?.push({ top, scrollY: window.scrollY });
      if (typeof first === 'object') {
        originalScrollTo(first);
        return;
      }
      originalScrollTo(first ?? 0, second ?? 0);
    }) as typeof window.scrollTo;
  });

  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForFunction(() => typeof window.__setJourneyProgress === 'function');

  await page.evaluate((progress) => {
    window.__setJourneyProgress?.(progress);
  }, WARP_START_PROGRESS - 0.004);

  await page.waitForTimeout(300);

  for (let i = 0; i < 24; i += 1) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(350);

    const sawRelease = await page.evaluate(({ releaseProgress, tolerance }) => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const releaseTop = releaseProgress * totalScroll;
      return (window.__scrollToLog ?? []).some((entry) => (
        entry.top !== null && Math.abs(entry.top - releaseTop) <= tolerance
      ));
    }, {
      releaseProgress: WARP_RELEASE_PROGRESS,
      tolerance: SCROLL_TOLERANCE_PX,
    });

    if (sawRelease) break;
  }

  await page.waitForTimeout(500);

  const releaseStatus = await page.evaluate(({ releaseProgress, startProgress, tolerance }) => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    const releaseTop = releaseProgress * totalScroll;
    const startTop = startProgress * totalScroll;
    const log = window.__scrollToLog ?? [];
    let sawRelease = false;

    for (const entry of log) {
      if (entry.top === null) continue;
      if (Math.abs(entry.top - releaseTop) <= tolerance) sawRelease = true;
      if (sawRelease && Math.abs(entry.top - startTop) <= tolerance) return 'jumped-back';
    }

    return sawRelease ? 'stable-release' : 'no-release';
  }, {
    releaseProgress: WARP_RELEASE_PROGRESS,
    startProgress: WARP_START_PROGRESS,
    tolerance: SCROLL_TOLERANCE_PX,
  });

  expect(releaseStatus).toBe('stable-release');
});
