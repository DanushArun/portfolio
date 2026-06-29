import { test, expect } from '@playwright/test';
import { phaseToProgress } from '../../src/lib/journey-map';
import type { WorkPhase } from '../../src/lib/scene-state';

test.setTimeout(60_000);

const WORK_TARGETS = [
  { project: 'MIRA', phase: 'W01_MIRA' },
  { project: 'AIDEN', phase: 'W02_AIDEN' },
  { project: 'VANGUARD', phase: 'W03_VANGUARD' },
  { project: 'INSPECTION', phase: 'W04_INSPECTION' },
  { project: 'WAVEFIELD', phase: 'W05_WAVEFIELD' },
  { project: 'EMI', phase: 'W06_EMI' },
  { project: 'FORMULA', phase: 'W07_FORMULA' },
] as const;

test('test_project_phases_when_scrubbed_activate_particle_supercluster', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  for (const target of WORK_TARGETS) {
    const progress = phaseToProgress(target.phase as WorkPhase, 0.5);

    await page.evaluate((progress) => {
      const testWindow = window as Window & {
        __setJourneyProgress?: (value: number) => void;
      };
      testWindow.__setJourneyProgress?.(progress);
    }, progress);

    await page.waitForTimeout(600);

    await expect.poll(async () => page.evaluate(() => {
      const testWindow = window as Window & {
        __portfolioDebug?: { activeProjectId: string };
      };
      return testWindow.__portfolioDebug?.activeProjectId;
    })).toBe(target.project);
    await expect(page.locator('body')).not.toContainText('catalogue');
  }
});

test('test_mira_phase_when_scrubbed_shows_particle_flow_context', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 30_000 });
  await page.waitForTimeout(1000);

  const progress = phaseToProgress('W01_MIRA', 0.5);

  await page.evaluate((progress) => {
    const testWindow = window as Window & {
      __setJourneyProgress?: (value: number) => void;
    };
    testWindow.__setJourneyProgress?.(progress);
  }, progress);

  await page.waitForTimeout(600);

  await expect(page.getByTestId('mira-project-title')).toContainText('MIRA');
  await expect(page.getByTestId('mira-particle-caption')).toContainText('Realtime Voice Intake');
  await expect(page.locator('[data-testid="mira-system-trace"]')).toHaveCount(0);

  await expect.poll(async () => page.evaluate(() => {
    const testWindow = window as Window & {
      __miraArtifactDebug?: { activeBeatId: string; hasFlowTargets: boolean };
    };
    return testWindow.__miraArtifactDebug;
  })).toMatchObject({
    activeBeatId: 'voice',
    hasFlowTargets: true,
  });

  const titleBox = await page.getByTestId('mira-project-title').boundingBox();
  const captionBox = await page.getByTestId('mira-particle-caption').boundingBox();

  expect(titleBox).not.toBeNull();
  expect(captionBox).not.toBeNull();
  expect(titleBox?.y ?? 0).toBeLessThan(captionBox?.y ?? 0);
});
