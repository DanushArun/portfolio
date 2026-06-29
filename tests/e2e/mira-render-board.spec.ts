import { expect, test } from '@playwright/test';

test('test_mira_render_board_when_loaded_shows_artifact_without_planet_language', async ({
  page,
}) => {
  await page.goto('/mira-render-board');
  await page.waitForSelector('canvas', { timeout: 30_000 });

  await expect(page.getByRole('heading', { name: 'MIRA' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Post-Call Intelligence' })).toBeVisible();
  await expect(page.getByTestId('mira-artifact-canvas')).toBeVisible();
  await expect(page.locator('[data-testid="mira-system-trace"]')).toHaveCount(0);

  await expect.poll(async () => page.evaluate(() => {
    const testWindow = window as Window & {
      __miraArtifactDebug?: {
        activeBeatId: string;
        hasFlowTargets: boolean;
        renderMode: string;
      };
    };
    return testWindow.__miraArtifactDebug;
  })).toMatchObject({
    activeBeatId: 'post-call',
    hasFlowTargets: true,
    renderMode: 'filament-wake',
  });
  await expect(page.locator('body')).not.toContainText(/LIVE LEADS|DriveX live leads/i);
  await expect(page.locator('body')).not.toContainText(/planet|orbit/i);
});
