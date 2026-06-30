import { expect, test, type Page } from '@playwright/test';

import { getProgressForPortfolioStop } from '../../src/lib/portfolio-journey';

test.setTimeout(60_000);

async function goToPortfolioStop(page: Page, index: number): Promise<void> {
  await expect.poll(async () => page.evaluate(() => {
    const testWindow = window as Window & {
      __goToJourneyProgress?: (progress: number, options?: { immediate?: boolean }) => void;
    };
    return typeof testWindow.__goToJourneyProgress;
  })).toBe('function');
  await page.evaluate((progress) => {
    const testWindow = window as Window & {
      __goToJourneyProgress?: (progress: number, options?: { immediate?: boolean }) => void;
    };
    testWindow.__goToJourneyProgress?.(progress, { immediate: true });
  }, getProgressForPortfolioStop(index));
  await expect.poll(async () => activeStopIndex(page)).toBe(index);
}

async function activeStopIndex(page: Page): Promise<number | undefined> {
  return page.evaluate(() => {
    const testWindow = window as Window & {
      __portfolioDebug?: { activeStopIndex: number };
    };
    return testWindow.__portfolioDebug?.activeStopIndex;
  });
}

test('test_portfolio_scroll_when_wheel_moves_advances_monotonically', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  await goToPortfolioStop(page, 8);
  const before = await activeStopIndex(page);

  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(350);

  const after = await activeStopIndex(page);

  expect(before).toBe(8);
  expect(after).toBe((before ?? 0) + 1);
});

test('test_portfolio_scroll_when_small_wheel_input_does_not_lock_the_page', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  await goToPortfolioStop(page, 8);

  await page.waitForTimeout(500);
  await page.mouse.wheel(0, 20);
  await page.waitForTimeout(350);

  await expect.poll(async () => page.evaluate(() => {
    const testWindow = window as Window & {
      __portfolioDebug?: { transitionActive: boolean };
    };
    return testWindow.__portfolioDebug?.transitionActive;
  })).toBe(false);
});

test('test_portfolio_scroll_when_on_heading_requires_more_wheel_effort', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  await goToPortfolioStop(page, 8);
  await page.mouse.wheel(0, 90);
  await page.waitForTimeout(350);

  const after = await activeStopIndex(page);

  expect(after).toBe(8);
});
