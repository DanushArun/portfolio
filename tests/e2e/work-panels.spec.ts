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

async function waitForJourneyControls(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.waitForFunction(() => {
    const testWindow = window as Window & {
      __setJourneyProgress?: (value: number) => void;
    };
    return typeof testWindow.__setJourneyProgress === 'function';
  }, undefined, { timeout: 30_000 });
}

test('test_project_phases_when_scrubbed_activate_particle_supercluster', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 30_000 });
  await waitForJourneyControls(page);

  for (const target of WORK_TARGETS) {
    const progress = phaseToProgress(target.phase as WorkPhase, 0.5);

    await page.evaluate((progress) => {
      const testWindow = window as Window & {
        __setJourneyProgress?: (value: number) => void;
      };
      testWindow.__setJourneyProgress?.(progress);
    }, progress);

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
  await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 30_000 });
  await waitForJourneyControls(page);

  const progress = phaseToProgress('W01_MIRA', 0.20);

  await page.evaluate((progress) => {
    const testWindow = window as Window & {
      __setJourneyProgress?: (value: number) => void;
    };
    testWindow.__setJourneyProgress?.(progress);
  }, progress);

  await expect(page.getByTestId('project-chapter-title')).toContainText('MIRA');
  await expect(page.getByTestId('project-step-description'))
    .toContainText('calls new leads');
  await expect(page.getByTestId('project-step-description'))
    .toHaveAttribute('aria-label', /calls new leads/);
  await expect(page.getByTestId('project-tag-rail')).toContainText('Voice AI');
  await expect(page.locator('[data-testid="mira-system-trace"]')).toHaveCount(0);
  await expect(page.locator('[data-phase-indicator]')).toHaveCount(0);
  await expect(page.locator('[data-journey-progress]')).toBeVisible();
  await expect(page.locator('[data-skip-next]')).toBeVisible();

  await expect.poll(async () => page.evaluate(() => {
    const testWindow = window as Window & {
      __portfolioDebug?: {
        activeBeat: number;
        activeProjectId: string;
      };
    };
    return testWindow.__portfolioDebug;
  })).toMatchObject({
    activeBeat: 0,
    activeProjectId: 'MIRA',
  });
  await expect(page.locator('body'))
    .not.toContainText(/LIVE LEADS|DriveX live leads|Ops Automation Loop|MIRA TRACE|7\/8/i);

  const titleBox = await page.getByTestId('project-chapter-title').boundingBox();
  const tagBox = await page.getByTestId('project-tag-rail').boundingBox();

  expect(titleBox).not.toBeNull();
  expect(tagBox).not.toBeNull();
  expect(titleBox?.y ?? 0).toBeLessThan(tagBox?.y ?? 0);
});

test('test_about_phase_when_scrubbed_shows_finale_identity', async ({ page }) => {
  await page.goto('/');
  await waitForJourneyControls(page);

  await page.evaluate((progress) => {
    const testWindow = window as Window & {
      __setJourneyProgress?: (value: number) => void;
    };
    testWindow.__setJourneyProgress?.(progress);
  }, phaseToProgress('W08_ABOUT', 0.5));

  await expect(page.getByRole('heading', { name: 'SYSTEMS-FIRST ENGINEER' })).toBeVisible();
});

test('test_connect_phase_when_scrubbed_exposes_email_handoff', async ({ page }) => {
  await page.goto('/');
  await waitForJourneyControls(page);

  await page.evaluate((progress) => {
    const testWindow = window as Window & {
      __setJourneyProgress?: (value: number) => void;
    };
    testWindow.__setJourneyProgress?.(progress);
  }, phaseToProgress('W09_CONNECT', 0.5));

  await expect(page.getByRole('link', { name: /Email Danush/i }))
    .toHaveAttribute('href', 'mailto:danusharun999@gmail.com');
});
