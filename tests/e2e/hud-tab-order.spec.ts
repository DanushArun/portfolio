// Job 003 AC12 — Tab order on `/` at scroll=0:
// skip-to-next → audio → rm → quality.
import { test, expect } from '@playwright/test';

test('HUD tab order: skip → audio → rm → quality', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForSelector('[data-skip-next]', { timeout: 30_000 });
  await page.waitForTimeout(1500);

  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  // Focus the skip button directly first so we exercise the bottom-right
  // cluster before moving leftward through the toggle cluster. AC12 fixes
  // the *logical* order via DOM ordering; first Tab landing is browser-
  // dependent (the page is otherwise unfocusable on most chromium setups).
  await page.locator('[data-skip-next]').focus();
  const first = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el?.hasAttribute('data-skip-next') ? 'skip' : null;
  });
  expect(first).toBe('skip');

  await page.keyboard.press('Tab');
  const second = await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.dataset?.toggleSlot ?? null);
  expect(second).toBe('audio');

  await page.keyboard.press('Tab');
  const third = await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.dataset?.toggleSlot ?? null);
  expect(third).toBe('rm');

  await page.keyboard.press('Tab');
  const fourth = await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.dataset?.toggleSlot ?? null);
  expect(fourth).toBe('quality');
});
