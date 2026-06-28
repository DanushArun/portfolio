import { test } from '@playwright/test';
import { phaseToProgress } from '../../src/lib/journey-map';
import type { CosmicPhase } from '../../src/lib/scene-state';

// settle: R3F scenes (C06+) need longer for dynamic imports + shader compile
const TARGETS = [
  { name: 'C01_orbit', phase: 'C01_ORBIT', settle: 1500 },
  { name: 'C02_pull', phase: 'C02_PULL', settle: 1500 },
  { name: 'C03_stretch', phase: 'C03_STRETCH', settle: 1500 },
  { name: 'C04_horizon', phase: 'C04_HORIZON', settle: 1500 },
  { name: 'C05_warp', phase: 'C05_WARP', settle: 1500 },
  { name: 'C06_anomaly', phase: 'C06_ANOMALY', settle: 3000 },
  { name: 'C07_transition', phase: 'C07_TRANSITION', settle: 3000 },
  { name: 'C08_emerge', phase: 'C08_EMERGE', settle: 3000 },
  { name: 'C09_project', phase: 'C09_PROJECT', settle: 3000 },
];

for (const t of TARGETS) {
  test(`screenshot: ${t.name}`, async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 30_000 });
    await page.waitForTimeout(1000); // initial compile + first render

    // Drive scene state directly — window.scrollTo bypasses Lenis and never
    // reaches ScrollTrigger, so the 3D scene wouldn't update.
    const progress = phaseToProgress(t.phase as CosmicPhase, 0.5);

    await page.evaluate((p) => {
      const testWindow = window as Window & {
        __setJourneyProgress?: (progress: number) => void;
      };
      testWindow.__setJourneyProgress?.(p);
    }, progress);

    await page.waitForTimeout(t.settle);

    // Hide the dev-only debug overlay so screenshots are clean.
    await page.evaluate(() => {
      document.querySelectorAll<HTMLElement>('[data-debug-overlay]').forEach(
        (el) => { el.style.display = 'none'; },
      );
    });

    await page.screenshot({
      path: `tests/screenshots/cosmic/${t.name}.png`,
      fullPage: false,
      animations: 'disabled',
    });
  });
}
