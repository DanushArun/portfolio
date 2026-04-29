import { test } from '@playwright/test';

// settle: R3F scenes (C06+) need longer for dynamic imports + shader compile
const TARGETS = [
  { name: 'C01_orbit',      progress: 0.04,  settle: 1500 },
  { name: 'C02_pull',       progress: 0.12,  settle: 1500 },
  { name: 'C03_stretch',    progress: 0.18,  settle: 1500 },
  { name: 'C04_horizon',    progress: 0.25,  settle: 1500 },
  { name: 'C05_warp',       progress: 0.32,  settle: 1500 },
  { name: 'C06_anomaly',    progress: 0.39,  settle: 3000 },
  { name: 'C07_transition', progress: 0.44,  settle: 3000 },
  { name: 'C08_emerge',     progress: 0.50,  settle: 3000 },
  { name: 'C09_project',    progress: 0.546, settle: 3000 },
];

for (const t of TARGETS) {
  test(`screenshot: ${t.name}`, async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 30_000 });
    await page.waitForTimeout(1000); // initial compile + first render

    // Drive scene state directly — window.scrollTo bypasses Lenis and never
    // reaches ScrollTrigger, so the 3D scene wouldn't update.
    await page.evaluate((p) => {
      (window as any).__setJourneyProgress?.(p);
    }, t.progress);

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
