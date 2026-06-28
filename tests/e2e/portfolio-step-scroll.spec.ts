import { expect, test } from '@playwright/test';

test.setTimeout(60_000);

test('test_portfolio_scroll_when_wheel_moves_advances_one_stop_only', async ({ page }) => {
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
  await page.waitForTimeout(1200);

  const after = await page.evaluate(() => {
    const testWindow = window as Window & {
      __portfolioDebug?: { activeStopIndex: number };
    };
    return testWindow.__portfolioDebug?.activeStopIndex;
  });

  expect(before).toBe(8);
  expect(after).toBe(9);
});

test('test_portfolio_scroll_when_wheel_is_small_holds_current_stop', async ({ page }) => {
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
  await page.waitForTimeout(700);

  await expect.poll(async () => page.evaluate(() => {
    const testWindow = window as Window & {
      __portfolioDebug?: { activeStopIndex: number };
    };
    return testWindow.__portfolioDebug?.activeStopIndex;
  })).toBe(8);
});
