// Job 003 AC14 — axe-core contrast check on `/`.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('no WCAG contrast violations on /', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1500);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag22aa'])
    .disableRules(['color-contrast-enhanced'])
    .analyze();

  const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');
  expect(contrastViolations).toHaveLength(0);
});
