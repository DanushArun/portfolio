import { expect, test } from '@playwright/test';

test('test_mira_render_board_when_loaded_shows_artifact_without_planet_language', async ({
  page,
}) => {
  await page.goto('/mira-render-board');
  await page.waitForSelector('canvas', { timeout: 30_000 });

  await expect(page.getByRole('heading', { name: 'MIRA' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'post call' })).toBeVisible();
  await expect(page.getByTestId('mira-artifact-canvas')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/planet|orbit/i);
});
