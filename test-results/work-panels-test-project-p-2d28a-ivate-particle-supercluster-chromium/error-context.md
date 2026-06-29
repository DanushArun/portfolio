# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: work-panels.spec.ts >> test_project_phases_when_scrubbed_activate_particle_supercluster
- Location: tests/e2e/work-panels.spec.ts:17:5

# Error details

```
Error: Timeout 5000ms exceeded while waiting on the predicate
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { phaseToProgress } from '../../src/lib/journey-map';
  3  | import type { WorkPhase } from '../../src/lib/scene-state';
  4  | 
  5  | test.setTimeout(60_000);
  6  | 
  7  | const WORK_TARGETS = [
  8  |   { project: 'MIRA', phase: 'W01_MIRA' },
  9  |   { project: 'AIDEN', phase: 'W02_AIDEN' },
  10 |   { project: 'VANGUARD', phase: 'W03_VANGUARD' },
  11 |   { project: 'INSPECTION', phase: 'W04_INSPECTION' },
  12 |   { project: 'WAVEFIELD', phase: 'W05_WAVEFIELD' },
  13 |   { project: 'EMI', phase: 'W06_EMI' },
  14 |   { project: 'FORMULA', phase: 'W07_FORMULA' },
  15 | ] as const;
  16 | 
  17 | test('test_project_phases_when_scrubbed_activate_particle_supercluster', async ({ page }) => {
  18 |   await page.goto('/');
  19 |   await page.waitForSelector('canvas', { timeout: 30_000 });
  20 |   await page.waitForTimeout(1000);
  21 | 
  22 |   for (const target of WORK_TARGETS) {
  23 |     const progress = phaseToProgress(target.phase as WorkPhase, 0.5);
  24 | 
  25 |     await page.evaluate((progress) => {
  26 |       const testWindow = window as Window & {
  27 |         __setJourneyProgress?: (value: number) => void;
  28 |       };
  29 |       testWindow.__setJourneyProgress?.(progress);
  30 |     }, progress);
  31 | 
  32 |     await page.waitForTimeout(600);
  33 | 
> 34 |     await expect.poll(async () => page.evaluate(() => {
     |     ^ Error: Timeout 5000ms exceeded while waiting on the predicate
  35 |       const testWindow = window as Window & {
  36 |         __portfolioDebug?: { activeProjectId: string };
  37 |       };
  38 |       return testWindow.__portfolioDebug?.activeProjectId;
  39 |     })).toBe(target.project);
  40 |     await expect(page.locator('body')).not.toContainText('catalogue');
  41 |   }
  42 | });
  43 | 
  44 | test('test_mira_phase_when_scrubbed_shows_particle_flow_context', async ({ page }) => {
  45 |   await page.goto('/');
  46 |   await page.waitForSelector('canvas', { timeout: 30_000 });
  47 |   await page.waitForTimeout(1000);
  48 | 
  49 |   const progress = phaseToProgress('W01_MIRA', 0.5);
  50 | 
  51 |   await page.evaluate((progress) => {
  52 |     const testWindow = window as Window & {
  53 |       __setJourneyProgress?: (value: number) => void;
  54 |     };
  55 |     testWindow.__setJourneyProgress?.(progress);
  56 |   }, progress);
  57 | 
  58 |   await page.waitForTimeout(600);
  59 | 
  60 |   await expect(page.getByTestId('mira-project-title')).toContainText('MIRA');
  61 |   await expect(page.getByTestId('mira-particle-caption')).toContainText('Realtime Voice Intake');
  62 |   await expect(page.locator('[data-testid="mira-system-trace"]')).toHaveCount(0);
  63 | 
  64 |   await expect.poll(async () => page.evaluate(() => {
  65 |     const testWindow = window as Window & {
  66 |       __miraArtifactDebug?: {
  67 |         activeBeatId: string;
  68 |         hasFlowTargets: boolean;
  69 |         renderMode: string;
  70 |       };
  71 |     };
  72 |     return testWindow.__miraArtifactDebug;
  73 |   })).toMatchObject({
  74 |     activeBeatId: 'voice',
  75 |     hasFlowTargets: true,
  76 |     renderMode: 'filament-wake',
  77 |   });
  78 |   await expect(page.locator('body')).not.toContainText(/LIVE LEADS|DriveX live leads/i);
  79 | 
  80 |   const titleBox = await page.getByTestId('mira-project-title').boundingBox();
  81 |   const captionBox = await page.getByTestId('mira-particle-caption').boundingBox();
  82 | 
  83 |   expect(titleBox).not.toBeNull();
  84 |   expect(captionBox).not.toBeNull();
  85 |   expect(titleBox?.y ?? 0).toBeLessThan(captionBox?.y ?? 0);
  86 | });
  87 | 
```