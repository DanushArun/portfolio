// Job 003 AC8 + AC9 — system cursor + custom cursor + C04 override.
import { test, expect } from '@playwright/test';

const SETTLE_MS = 1500;

test('system cursor hidden at scroll=0', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(SETTLE_MS);
  const bodyCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
  expect(bodyCursor).toBe('none');
  expect(await page.locator('[data-custom-cursor]').count()).toBe(1);
});

test('CustomCursor present at scroll=0.5 outside C04 band', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.evaluate(() => (window as unknown as { __setJourneyProgress?: (p: number) => void })
    .__setJourneyProgress?.(0.5));
  await page.waitForTimeout(SETTLE_MS);
  const cursorAttr = await page.evaluate(() => document.body.dataset.cursor ?? '');
  expect(cursorAttr).not.toBe('gravity');
  expect(await page.locator('[data-custom-cursor]').count()).toBe(1);
});

test('gravity cursor active during C04 band (~0.25)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.evaluate(() => (window as unknown as { __setJourneyProgress?: (p: number) => void })
    .__setJourneyProgress?.(0.25));
  await page.waitForTimeout(SETTLE_MS);
  const cursorAttr = await page.evaluate(() => document.body.dataset.cursor ?? '');
  expect(cursorAttr).toBe('gravity');
});
