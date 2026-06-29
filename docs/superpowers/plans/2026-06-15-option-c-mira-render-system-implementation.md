# Option C MIRA Render System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the failed planet-node chapter treatment with a MIRA-only high-quality
system-artifact prototype that can be reviewed through desktop/mobile stills before other
chapters are touched.

**Architecture:** Preserve the portfolio book chapter/beat data model, but remove literal
planet visuals from the scene. Add a MIRA system artifact component driven by the active MIRA
beat, and add both a browser review path and a Remotion composition that share the same model.

**Tech Stack:** Next.js 16, React 19, Three.js/R3F/drei, GSAP + ScrollTrigger, Lenis,
Zustand, Vitest, Playwright, Remotion

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/scene/scenes/MiraSupercluster.tsx` | Modify | Mount artifact in MIRA |
| `src/components/scene/scenes/mira/PortfolioProjectNodes.tsx` | Delete | Remove planet layer |
| `src/components/scene/scenes/mira/MiraSystemArtifact.tsx` | Create | Live MIRA artifact |
| `src/components/scene/scenes/mira/mira-artifact-model.ts` | Create | Shared beat model |
| `src/remotion/mira/MiraRenderBoard.tsx` | Create | Remotion export scene |
| `src/app/mira-render-board/page.tsx` | Create | Local review route |
| `tests/unit/mira-system-artifact.test.ts` | Create | Model contract tests |
| `tests/e2e/mira-render-board.spec.ts` | Create | Route smoke test |

---

## Task 1: Remove Failed Planet Runtime Layer

**Files:**
- Modify: `src/components/scene/scenes/MiraSupercluster.tsx`
- Delete or quarantine: `src/components/scene/scenes/mira/PortfolioProjectNodes.tsx`

- [ ] **Step 1: Remove the import**

```tsx
// Remove this from MiraSupercluster.tsx
import { PortfolioProjectNodes } from './mira/PortfolioProjectNodes';
```

- [ ] **Step 2: Remove the runtime mount**

```tsx
// Remove this JSX
{reveal >= 0.85 && <PortfolioProjectNodes />}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: pass. If `PortfolioProjectNodes.tsx` becomes unused, delete it.

---

## Task 2: Add Deterministic MIRA Artifact Model

**Files:**
- Create: `src/components/scene/scenes/mira/mira-artifact-model.ts`
- Test: `tests/unit/mira-system-artifact.test.ts`

- [ ] **Step 1: Write the failing model test**

```ts
import { describe, expect, it } from 'vitest';
import {
  MIRA_ARTIFACT_BEATS,
  getMiraArtifactBeat,
} from '@/components/scene/scenes/mira/mira-artifact-model';

describe('mira artifact model', () => {
  it('test_beats_when_loaded_match_mira_catalogue_count', () => {
    expect(MIRA_ARTIFACT_BEATS).toHaveLength(8);
  });

  it('test_post_call_when_requested_returns_output_paths', () => {
    expect(getMiraArtifactBeat('post-call').outputs).toContain('crm');
  });
});
```

- [ ] **Step 2: Add model**

```ts
export type MiraArtifactBeatId =
  | 'shipped'
  | 'latency'
  | 'languages'
  | 'voice'
  | 'orchestration'
  | 'post-call'
  | 'ops'
  | 'ownership';

export interface MiraArtifactBeat {
  readonly id: MiraArtifactBeatId;
  readonly activeLanes: readonly string[];
  readonly coreIntensity: number;
  readonly outputs: readonly string[];
  readonly waveform: readonly number[];
}

export const MIRA_ARTIFACT_BEATS: readonly MiraArtifactBeat[] = [
  {
    id: 'shipped',
    activeLanes: ['lead', 'voice', 'crm'],
    coreIntensity: 0.68,
    outputs: ['crm'],
    waveform: [0.12, 0.34, 0.18, 0.55, 0.22, 0.48],
  },
  // Add the remaining seven beats with real lane/output intent.
];
```

- [ ] **Step 3: Run focused test**

```bash
npm run test -- tests/unit/mira-system-artifact.test.ts
```

Expected: pass after all eight beats are defined.

---

## Task 3: Build MIRA System Artifact Component

**Files:**
- Create: `src/components/scene/scenes/mira/MiraSystemArtifact.tsx`
- Modify: `src/components/scene/scenes/MiraSupercluster.tsx`

- [ ] **Step 1: Create artifact component**

Build a R3F component with:

- no `sphereGeometry` used as a planet;
- no orbital rings;
- waveform strip on the left;
- five language/intake lanes;
- central orchestration core using thin boxes, planes, or line geometry;
- output paths to CRM and WhatsApp;
- material style: additive lines, translucent planes, warm cream/accretion highlights.

- [ ] **Step 2: Drive it from portfolio book state**

Use:

```ts
const chapterId = usePortfolioBookState((state) => state.chapterId);
const beatIndex = usePortfolioBookState((state) => state.beatIndex);
```

Return `null` when `chapterId !== 'MIRA'`.

- [ ] **Step 3: Mount inside `MiraSupercluster`**

```tsx
{reveal >= 0.85 && <MiraSystemArtifact reveal={reveal} />}
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: pass.

---

## Task 4: Add MIRA Render Board

**Files:**
- Create: `src/app/mira-render-board/page.tsx`

- [ ] **Step 1: Create local review page**

The route should render a grid of approved still states:

- `frame=voice`
- `frame=orchestration`
- `frame=post-call`
- `frame=ops`

Each frame should show the same artifact style and overlay copy. Use deterministic props,
not live scroll.

- [ ] **Step 2: Keep it review-only**

Do not link it in public navigation. The route exists for local screenshot review.

- [ ] **Step 3: Run route smoke check**

```bash
npm run build
```

Expected: `/mira-render-board` prerenders or compiles without errors.

---

## Task 5: Visual Verification

**Files:**
- Create: `tests/e2e/mira-render-board.spec.ts`

- [ ] **Step 1: Add e2e smoke test**

```ts
import { expect, test } from '@playwright/test';

test('test_mira_render_board_when_loaded_shows_system_artifact', async ({ page }) => {
  await page.goto('/mira-render-board');
  await expect(page.getByRole('heading', { name: /MIRA/i })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('planet');
});
```

- [ ] **Step 2: Capture stills manually**

Run the local app and capture:

```bash
npm run dev
```

Then use Playwright to capture:

- `/private/tmp/mira-render-board-desktop.png`
- `/private/tmp/mira-render-board-mobile.png`

- [ ] **Step 3: Review before expanding**

Do not implement AIDEN, Vanguard, Inspection, Wave Field, EMI, or Formula until the MIRA
render board is visually approved.

---

## Task 6: Regression Verification

**Files:**
- Existing tests only unless failures expose missing coverage.

- [ ] **Step 1: Run focused tests**

```bash
npm run test -- tests/unit/mira-system-artifact.test.ts tests/unit/portfolio-book.test.ts
```

- [ ] **Step 2: Run full unit suite**

```bash
npm run test
```

- [ ] **Step 3: Run typecheck, lint, build**

```bash
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 4: Run affected e2e**

```bash
npm run test:e2e -- tests/e2e/work-panels.spec.ts tests/e2e/mira-render-board.spec.ts
```

Expected: all pass. Existing lint warning in `src/lib/blackHole/index.ts:548` may remain
unless this task explicitly fixes it.
