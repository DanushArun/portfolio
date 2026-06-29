import { expect, test } from '@playwright/test';

test.setTimeout(60_000);

test('test_portfolio_scroll_when_wheel_moves_advances_monotonically', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const testWindow = window as Window & {
      __setPortfolioStop?: (index: number) => void;
    };
    testWindow.__setPortfolioStop?.(8);
  });

  await page.waitForTimeout(500);
  const before = await page.evaluate(() => {
    const testWindow = window as Window & {
      __portfolioDebug?: { activeStopIndex: number };
    };
    return testWindow.__portfolioDebug?.activeStopIndex;
  });

  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(350);

  const after = await page.evaluate(() => {
    const testWindow = window as Window & {
      __portfolioDebug?: { activeStopIndex: number };
    };
    return testWindow.__portfolioDebug?.activeStopIndex;
  });

  expect(before).toBe(8);
  expect(after ?? 0).toBeGreaterThanOrEqual(before ?? 0);
});

test('test_portfolio_scroll_when_small_wheel_input_does_not_lock_the_page', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const testWindow = window as Window & {
      __setPortfolioStop?: (index: number) => void;
    };
    testWindow.__setPortfolioStop?.(8);
  });

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
