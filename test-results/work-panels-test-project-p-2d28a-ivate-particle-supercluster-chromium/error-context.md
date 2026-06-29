# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: work-panels.spec.ts >> test_project_phases_when_scrubbed_activate_particle_supercluster
- Location: tests/e2e/work-panels.spec.ts:30:5

# Error details

```
TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic "Scene controls":
    - generic [ref=e5]:
      - generic "Phase 1 of 18" [ref=e6]:
        - generic [ref=e7]: 01 / 18
      - progressbar "Journey progress"
      - button "Skip to next phase" [ref=e8] [cursor=pointer]:
        - generic [ref=e9]: ↓
        - generic [ref=e10]: next
    - generic [ref=e11]:
      - button "Toggle audio (unavailable)" [disabled] [ref=e12]:
        - generic [ref=e13]: ⌀
      - button "Toggle reduced motion (unavailable)" [disabled] [ref=e14]:
        - generic [ref=e15]: =
      - button "Toggle quality (unavailable)" [disabled] [ref=e16]:
        - generic [ref=e17]: ◐
  - button "Open Next.js Dev Tools" [ref=e23] [cursor=pointer]:
    - img [ref=e24]
  - alert [ref=e27]
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
  17 | async function waitForJourneyControls(
  18 |   page: import('@playwright/test').Page,
  19 | ): Promise<void> {
> 20 |   await page.waitForFunction(() => {
     |              ^ TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
  21 |     const testWindow = window as Window & {
  22 |       __setJourneyProgress?: (value: number) => void;
  23 |       __portfolioDebug?: { activeProjectId?: string | null };
  24 |     };
  25 |     return typeof testWindow.__setJourneyProgress === 'function' &&
  26 |       typeof testWindow.__portfolioDebug === 'object';
  27 |   }, undefined, { timeout: 30_000 });
  28 | }
  29 | 
  30 | test('test_project_phases_when_scrubbed_activate_particle_supercluster', async ({ page }) => {
  31 |   await page.goto('/');
  32 |   await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 30_000 });
  33 |   await waitForJourneyControls(page);
  34 | 
  35 |   for (const target of WORK_TARGETS) {
  36 |     const progress = phaseToProgress(target.phase as WorkPhase, 0.5);
  37 | 
  38 |     await page.evaluate((progress) => {
  39 |       const testWindow = window as Window & {
  40 |         __setJourneyProgress?: (value: number) => void;
  41 |       };
  42 |       testWindow.__setJourneyProgress?.(progress);
  43 |     }, progress);
  44 | 
  45 |     await expect.poll(async () => page.evaluate(() => {
  46 |       const testWindow = window as Window & {
  47 |         __portfolioDebug?: { activeProjectId: string };
  48 |       };
  49 |       return testWindow.__portfolioDebug?.activeProjectId;
  50 |     })).toBe(target.project);
  51 |     await expect(page.locator('body')).not.toContainText('catalogue');
  52 |   }
  53 | });
  54 | 
  55 | test('test_mira_phase_when_scrubbed_shows_particle_flow_context', async ({ page }) => {
  56 |   await page.goto('/');
  57 |   await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 30_000 });
  58 |   await waitForJourneyControls(page);
  59 | 
  60 |   const progress = phaseToProgress('W01_MIRA', 0.20);
  61 | 
  62 |   await page.evaluate((progress) => {
  63 |     const testWindow = window as Window & {
  64 |       __setJourneyProgress?: (value: number) => void;
  65 |     };
  66 |     testWindow.__setJourneyProgress?.(progress);
  67 |   }, progress);
  68 | 
  69 |   await expect(page.getByTestId('project-chapter-title')).toContainText('MIRA');
  70 |   await expect(page.getByTestId('project-step-description'))
  71 |     .toContainText('MIRA / VOICE INTAKE');
  72 |   await expect(page.getByTestId('project-step-description'))
  73 |     .toHaveAttribute('aria-label', /production voice AI/);
  74 |   await expect(page.getByTestId('project-tag-rail')).toContainText('FastAPI');
  75 |   await expect(page.locator('[data-testid="mira-system-trace"]')).toHaveCount(0);
  76 | 
  77 |   await expect.poll(async () => page.evaluate(() => {
  78 |     const testWindow = window as Window & {
  79 |       __portfolioDebug?: {
  80 |         activeBeat: number;
  81 |         activeProjectId: string;
  82 |       };
  83 |     };
  84 |     return testWindow.__portfolioDebug;
  85 |   })).toMatchObject({
  86 |     activeBeat: 0,
  87 |     activeProjectId: 'MIRA',
  88 |   });
  89 |   await expect(page.locator('body'))
  90 |     .not.toContainText(/LIVE LEADS|DriveX live leads|Ops Automation Loop|MIRA TRACE|7\/8/i);
  91 | 
  92 |   const titleBox = await page.getByTestId('project-chapter-title').boundingBox();
  93 |   const tagBox = await page.getByTestId('project-tag-rail').boundingBox();
  94 | 
  95 |   expect(titleBox).not.toBeNull();
  96 |   expect(tagBox).not.toBeNull();
  97 |   expect(titleBox?.y ?? 0).toBeLessThan(tagBox?.y ?? 0);
  98 | });
  99 | 
```