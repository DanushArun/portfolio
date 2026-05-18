import { test, expect } from '@playwright/test';

test.describe('Transformer Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transformer');
    await page.waitForTimeout(1000);
  });

  test('loads the transformer page', async ({ page }) => {
    await expect(page).toHaveTitle(/Transformer/);
  });

  test('shows initial stage content', async ({ page }) => {
    const stageLabel = page.locator('text=01').first();
    await expect(stageLabel).toBeVisible();
  });

  test('math panel shows formula', async ({ page }) => {
    const formula = page.locator('text=Formula');
    await expect(formula).toBeVisible();
  });

  test('scroll progression updates stage indicator', async ({ page }) => {
    const progressText = page.locator('text=/\\d+%/');
    await expect(progressText).toHaveText('0%');

    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(500);

    const newProgress = page.locator('text=/\\d+%/');
    await expect(newProgress).not.toHaveText('0%');
  });

  test('responsive layout at mobile breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const splitLayout = page.locator('.flex-col');
    await expect(splitLayout).toBeVisible();
  });
});
