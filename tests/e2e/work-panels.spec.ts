import { test, expect } from '@playwright/test';

const WORK_TARGETS = [
  { title: 'MIRA', progress: 0.57 },
  { title: 'AIDEN', progress: 0.63 },
  { title: 'VANGUARD', progress: 0.68 },
  { title: 'AI INSPECTION', progress: 0.73 },
  { title: 'WAVE FIELD', progress: 0.78 },
  { title: 'EMI ENGINE', progress: 0.83 },
  { title: 'FORMULA MANIPAL', progress: 0.88 },
  { title: 'SYSTEMS-FIRST ENGINEER', progress: 0.93 },
  { title: "LET'S CONNECT", progress: 0.98 },
] as const;

test('test_work_phases_when_scrubbed_show_active_project_without_stubs', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  for (const target of WORK_TARGETS) {
    await page.evaluate((progress) => {
      const testWindow = window as Window & {
        __setJourneyProgress?: (value: number) => void;
      };
      testWindow.__setJourneyProgress?.(progress);
    }, target.progress);

    await expect(page.getByRole('heading', { name: target.title })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Stub');
  }
});
