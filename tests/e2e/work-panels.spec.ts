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
