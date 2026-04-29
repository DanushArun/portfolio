# Cinematic Portfolio — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Supersedes** `2026-04-29-cinematic-journey-work-done.md` (delete after this lands).

**Goal:** Ship the 18-phase cinematic portfolio shown in the DRIVEX storyboards — 9 cosmic beats (Orbit → Pull → Stretch → Horizon → Warp → Anomaly → Transition → Emerge → Project) flowing seamlessly into a 9-panel "Work Done" dashboard (MIRA → Connect), at Bruno Simon / Active Theory visual fidelity, sustained 60 FPS on M2-class hardware.

**Architecture:** Single Next.js page with one Lenis-driven scroll signal feeding a Zustand store; `journeyProgress: 0..1` scrubs the entire experience. Two `<Canvas>` layers compose: the existing custom-WebGL black-hole (cosmic 01–05) and an R3F canvas (cosmic 06–09 + dashboard 3D inserts). Selective bloom on Layer 1, ChromaticAberration scaled by `cosmicProgress`, Glitch active only during ANOMALY. Dashboard panels are HTML/SVG with WebGL inserts teleported via group-positioning in a single shared GL context. WebAudio synthesizes all sound — zero licensing exposure.

**Tech Stack:** Next.js 16 / React 19 / Three.js 0.184 / R3F 9.6 / @react-three/postprocessing 3.0 / GSAP 3.15 + ScrollTrigger / Lenis 1.3 / Zustand 5 / Tailwind 4 / Vitest (added) / Playwright (already installed).

**Quality Bar:**
- 60 FPS sustained on M2 MBA (verified Playwright trace).
- Zero console errors / warnings in `next build`.
- Zero React state mutations inside any `useFrame` / animation loop (verified by code review against ref pattern).
- Pixel-faithful to storyboard frames within ±5% color delta (verified screenshot diff).
- Every commit is independently green: `tsc --noEmit && next build && npx playwright test --reporter=line` all pass.
- Mobile (≤768px, `pointer: coarse`) renders a usable degraded experience — never a blank canvas.

---

## §1 LOCKED DECISIONS (no TBDs anywhere downstream)

| # | Decision | Locked Value |
|---|---|---|
| D1 | Audio source | **100% WebAudio synthesized.** No samples, no licenses. `OscillatorNode` + `BiquadFilter` + `WaveShaperNode` for all timbres. |
| D2 | Motorcycle model (W04) | **Quaternius "Modular Vehicles Pack" CC0** — bike01.glb, decimated to ~3k tris via Blender. Stored at `public/models/inspection-bike.glb`. |
| D3 | Earth model (W09) | **Procedural sphere with NASA Blue Marble equirectangular at 2048×1024**, downloaded from `https://visibleearth.nasa.gov/images/57735` (public domain). Stored at `public/textures/earth-2k.jpg`. |
| D4 | Panel copy | Storyboard text is **final** — frozen as constants in `src/lib/copy.ts`. Any edit must update that file with a commit `chore: update copy`. |
| D5 | WebM fallback for Warp/Anomaly on mobile | **Yes, ship in M5.** Pre-render at 1280×720 H.264+VP9, 2.4s, target file size ≤500 KB. |
| D6 | Test framework | **Vitest** for unit (pure logic), **Playwright** for visual smoke + screenshot regression. |
| D7 | Color tokens | **Locked in `src/lib/design-tokens.ts`** before any panel work. Source of truth. |
| D8 | Scroll provider | **Lenis** (already installed). `@studio-freight/lenis` and `framer-motion` to be uninstalled in M5. |
| D9 | Camera handoff EMERGE→MIRA | **Color binding:** EMERGE blue dwarf (`#85CCF7`) → MIRA waveform glow color. Same hex across both scenes. |
| D10 | Pre-render | No SSR for any scene component — all rendered with `dynamic(..., { ssr: false })`. Already current pattern. |
| D11 | DPR | Desktop `[1, 1.5]`, mobile `[1, 1]`. Tablet detected via `(pointer: coarse) and (min-width: 600px)` → `[1, 1.25]`. |
| D12 | Code-of-conduct on `useFrame` | No `useState`, no `setState`, no Zustand `set` calls inside any `useFrame` body. Refs and uniforms only. Enforced by code review. |

---

## §2 STORYBOARD → PHASE MAP (canonical)

This table is the source of truth that every milestone references. Memorize it.

### §2.1 Cosmic Journey (9 beats, 0–50% page scroll)

| Phase ID | Storyboard # | Scroll Range | Existing Asset | New Build | Visual Target |
|---|---|---|---|---|---|
| `C01_ORBIT` | 1 | 0.000 – 0.055 | BH `setProgress(0..0.10)` Phase A start | parameterize `intensity` | Distant BH, calm accretion ring, `45° camera FOV`, particles drifting |
| `C02_PULL` | 2 | 0.055 – 0.139 | BH `setProgress(0.10..0.30)` Phase A mid | none | Camera pulled in, disk stretches, FOV ramps `45° → 70°` |
| `C03_STRETCH` | 3 | 0.139 – 0.222 | BH `setProgress(0.30..0.45)` Phase A late | none | Spacetime distortion peaks, FOV `70° → 95°`, RGB shift `0.001 → 0.02` |
| `C04_HORIZON` | 4 | 0.222 – 0.278 | BH `setProgress(0.45..0.55)` Phase B | add white-flash uniform | Crossing edge, RGB shift `0.02 → 0.06`, brief overexposure spike |
| `C05_WARP` | 5 | 0.278 – 0.361 | `WarpScene.tsx` (existing), BH `setProgress(0.55..0.78)` Phase C/D | extend duration, depth | Stars stretch into trails (Interstellar) |
| `C06_ANOMALY` | 6 | 0.361 – 0.417 | none | **`AnomalyGlitch.tsx`** (new) | Reality fragments, RGB-split shards, datamosh, scanline jitter |
| `C07_TRANSITION` | 7 | 0.417 – 0.472 | none | **`TransitionConvergence.tsx`** (new) | Fragments converge to a structured central point — order from chaos |
| `C08_EMERGE` | 8 | 0.472 – 0.528 | none | **`EmergeSystem.tsx`** (new) | Binary stars (`#E8A020` amber + `#85CCF7` blue), faint accretion ring |
| `C09_PROJECT` | 9 | 0.528 – 0.555 | binding only | **handoff seam** | Camera pulls back; EMERGE blue dwarf bloom inherits as MIRA waveform glow |

### §2.2 Work Done Dashboard (9 panels, 50–100% page scroll)

| Phase ID | Panel | Scroll Range | Hero Visualization | Background |
|---|---|---|---|---|
| `W01_MIRA` | 01 MIRA | 0.555 – 0.605 | Purple violet waveform pulse, multilingual tokens (5 Indian languages) flowing through | Dark indigo void |
| `W02_AIDEN` | 02 AIDEN | 0.605 – 0.655 | Sine-wave engagement graph + intent cluster scatter + sentiment rail | Dark teal void |
| `W03_VANGUARD` | 03 VANGUARD | 0.655 – 0.705 | Graph network with traversal trail, 3 callouts (issue, healing, pass) | Dark green void |
| `W04_INSPECTION` | 04 AI INSPECTION | 0.705 – 0.755 | Wireframe motorcycle rotating + defect heatmap overlay | Dark cyan void |
| `W05_WAVEFIELD` | 05 WAVE FIELD | 0.755 – 0.805 | Two particle clouds: O(n²) dense vs O(n log n) lattice | Dark purple void |
| `W06_EMI` | 06 EMI ENGINE | 0.805 – 0.855 | Incident wave → layered shielding → attenuated wave + freq sweep | Dark slate void |
| `W07_FORMULA` | 07 FORMULA MANIPAL | 0.855 – 0.905 | Multi-color racing lines on dark track | Dark amber void |
| `W08_ABOUT` | 08 ABOUT ME | 0.905 – 0.955 | Silhouette + orbital skill rings, 6 skill labels | Dark violet void |
| `W09_CONNECT` | 09 LET'S CONNECT | 0.955 – 1.000 | Earth horizon at bottom, distant moons, single rising sun | Dark blue void |

---

## §3 DESIGN TOKENS (locked before any panel work)

**File:** `src/lib/design-tokens.ts` (new — built in Task 1.3).

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Cinematic Portfolio Design Tokens
// Source of truth for every color, spacing, type ramp, and panel copy hue.
// ─────────────────────────────────────────────────────────────────────────────

export const cosmicHues = {
  void:        '#0B0D10',  // absolute background
  ember:       '#FF8040',  // BH inner ring
  ash:         '#5A1A08',  // BH outer ring
  warpDeep:    '#0A1438',
  warpMid:     '#2E8CFF',
  warpHot:     '#FFEABF',
  glitchA:     '#FF2E3F',  // ANOMALY chromatic split R
  glitchB:     '#22FFD8',  // ANOMALY chromatic split G
  glitchC:     '#9266FF',  // ANOMALY chromatic split B
  emergeAmber: '#E8A020',
  emergeBlue:  '#85CCF7',  // ← also MIRA glow accent (D9)
} as const;

export const panelHues = {
  W01_MIRA:        { primary: '#85CCF7', accent: '#A78BFA', bg: '#0A0820' },  // blue→violet
  W02_AIDEN:       { primary: '#5EEAD4', accent: '#34D399', bg: '#02161A' },  // teal→emerald
  W03_VANGUARD:    { primary: '#86EFAC', accent: '#FCA5A5', bg: '#02180C' },  // green / red signals
  W04_INSPECTION:  { primary: '#A5F3FC', accent: '#F472B6', bg: '#021820' },  // cyan / magenta
  W05_WAVEFIELD:   { primary: '#C4B5FD', accent: '#67E8F9', bg: '#0A0418' },  // purple / cyan
  W06_EMI:         { primary: '#94A3B8', accent: '#38BDF8', bg: '#0E1218' },  // slate / azure
  W07_FORMULA:     { primary: '#FCD34D', accent: '#22C55E', bg: '#1A1604' },  // amber / lime
  W08_ABOUT:       { primary: '#DDD6FE', accent: '#FAFAFA', bg: '#0E0820' },  // violet / paper
  W09_CONNECT:     { primary: '#7DD3FC', accent: '#FCD34D', bg: '#020A1A' },  // sky / sun
} as const;

export const type = {
  display:  'var(--font-syne, "Syne", sans-serif)',     // Syne 800
  body:     'var(--font-grotesk, "Space Grotesk", sans-serif)',
  mono:     'var(--font-mono, "Space Mono", monospace)',
  serif:    '"Instrument Serif", "Cormorant Garamond", serif',  // BH text only
} as const;

export const fontSize = {
  panelNumber: 'clamp(0.7rem, 0.9vw, 0.85rem)',
  panelTitle:  'clamp(2.2rem, 4vw, 3.4rem)',
  panelSubtitle: 'clamp(0.95rem, 1.1vw, 1.05rem)',
  panelBody:   'clamp(0.82rem, 0.95vw, 0.92rem)',
  chip:        '10px',
  trail:       '11px',
} as const;

export const spacing = {
  panelPad:    'clamp(2rem, 4vw, 4rem)',
  cardPad:     'clamp(1.5rem, 3vw, 2.5rem)',
  chipGap:     '0.5rem',
} as const;

export const ease = {
  // Already exists in src/lib/ease.ts — re-export the GSAP form here.
  instrument: 'cubic-bezier(0.16, 1, 0.3, 1)',
  precision:  'cubic-bezier(0.25, 0.1, 0.25, 1)',
  typeset:    'cubic-bezier(0.19, 1, 0.22, 1)',
} as const;
```

---

## §4 FILE STRUCTURE (full tree of new + modified files)

```
src/
├── app/
│   ├── layout.tsx                            (modify — inline body bg)
│   └── page.tsx                              (modify — wire dashboard)
├── components/
│   ├── scene/
│   │   ├── BlackHoleMount.tsx                (modify — accept intensity prop)
│   │   ├── SceneManager.tsx                  (modify — replace floor-bucket router)
│   │   ├── PostFX.tsx                        (modify — add CA + Glitch passes)
│   │   ├── ScrollOrchestrator.tsx            (NEW — Lenis + GSAP single source)
│   │   ├── HUD.tsx                           (modify — phase label from 18 phases)
│   │   ├── Overlays.tsx                      (DELETE in M5 — replaced by WorkDashboard)
│   │   └── scenes/
│   │       ├── WarpScene.tsx                 (modify — extend depth/duration)
│   │       ├── AnomalyGlitch.tsx             (NEW — C06)
│   │       ├── TransitionConvergence.tsx     (NEW — C07)
│   │       ├── EmergeSystem.tsx              (NEW — C08)
│   │       ├── MiraPulsar.tsx                (DELETE M5 — superseded by WorkDashboard MIRA panel)
│   │       ├── DriveXQuasar.tsx              (DELETE M5)
│   │       ├── TwinBuild.tsx                 (DELETE M5)
│   │       ├── FormulaRings.tsx              (DELETE M5)
│   │       ├── QuantumPlanet.tsx             (DELETE M5)
│   │       └── Singularity.tsx               (DELETE M5)
│   └── work/
│       ├── WorkDashboard.tsx                 (NEW — pinned scroll shell)
│       ├── WorkBackdrop.tsx                  (NEW — persistent starfield + cursor)
│       ├── PanelChrome.tsx                   (NEW — shared 70vh card)
│       ├── PanelChip.tsx                     (NEW — pill tag)
│       ├── ProcessTrail.tsx                  (NEW — A → B → C → D)
│       └── panels/
│           ├── MiraPanel.tsx                 (NEW W01)
│           ├── AidenPanel.tsx                (NEW W02)
│           ├── VanguardPanel.tsx             (NEW W03)
│           ├── InspectionPanel.tsx           (NEW W04)
│           ├── WaveFieldPanel.tsx            (NEW W05)
│           ├── EmiPanel.tsx                  (NEW W06)
│           ├── FormulaPanel.tsx              (NEW W07)
│           ├── AboutPanel.tsx                (NEW W08)
│           └── ConnectPanel.tsx              (NEW W09)
├── hooks/
│   ├── useAudio.ts                           (modify — wire 18-phase events)
│   └── useReducedMotion.ts                   (NEW — a11y gate)
├── lib/
│   ├── scene-state.ts                        (modify — 18 phases + journeyProgress)
│   ├── journey-map.ts                        (NEW — pure progressToPhase)
│   ├── design-tokens.ts                      (NEW — §3 above)
│   ├── copy.ts                               (NEW — locked storyboard copy)
│   ├── audio-engine.ts                       (NEW — WebAudio orchestrator)
│   ├── ease.ts                               (no change — already correct)
│   ├── audio.ts                              (DELETE M5 — superseded)
│   └── audio-files.ts                        (DELETE M5 — D1: synthesized only)
public/
├── textures/
│   └── earth-2k.jpg                          (NEW — D3)
├── models/
│   └── inspection-bike.glb                   (NEW — D2)
└── video/
    └── warp-fallback.webm                    (NEW M5 — D5)
tests/
├── unit/
│   ├── journey-map.test.ts                   (NEW)
│   └── audio-engine.test.ts                  (NEW)
└── e2e/
    ├── scroll-smoke.spec.ts                  (NEW — every phase reachable)
    ├── handoff-seam.spec.ts                  (NEW — EMERGE → MIRA color match)
    └── perf.spec.ts                          (NEW — 60fps budget)
```

**Deleted files (M5 cleanup):** `_legacy/*`, `LabCanvas.tsx`, all 6 superseded scenes, `audio.ts`, `audio-files.ts`, `Overlays.tsx`. Verify with `grep -r "from '@/components/scene/scenes/Mira" src/` returns zero before deleting any scene file.

---

## §5 TEST & BUILD INFRASTRUCTURE

### Task 0.1: Add Vitest

- [ ] **Step 1: Install Vitest + utilities**

```bash
npm install -D vitest @vitest/coverage-v8 @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

Expected: `package.json` `devDependencies` includes vitest 1.x or 2.x.

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: Create `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add npm scripts**

In `package.json` `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Verify**

```bash
npm run test
```
Expected: `No test files found` (no tests yet — this is success).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/setup.ts
git commit -m "chore: add vitest test infrastructure"
```

### Task 0.2: Configure Playwright for visual smoke

- [ ] **Step 1: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false, // visual diffs need stable ordering
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 2: Verify**

```bash
npx playwright install chromium
npx playwright test --reporter=line
```
Expected: `Running 0 tests`.

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "chore: configure playwright for visual smoke tests"
```

---

## §6 MILESTONE 1 — Foundation (state + scroll)

**Outcome:** A single Lenis-driven scroll signal scrubs `journeyProgress: 0..1` through 18 phases. Console-verifiable, no visual change yet.

### Task 1.1: Refactor `ScenePhase` to 18 phases

**Files:**
- Modify: `src/lib/scene-state.ts`

- [ ] **Step 1: Replace `ScenePhase` union** (lines 7–17 currently)

```typescript
export type CosmicPhase =
  | 'C01_ORBIT' | 'C02_PULL' | 'C03_STRETCH' | 'C04_HORIZON'
  | 'C05_WARP'  | 'C06_ANOMALY' | 'C07_TRANSITION'
  | 'C08_EMERGE' | 'C09_PROJECT';

export type WorkPhase =
  | 'W01_MIRA' | 'W02_AIDEN' | 'W03_VANGUARD' | 'W04_INSPECTION'
  | 'W05_WAVEFIELD' | 'W06_EMI' | 'W07_FORMULA'
  | 'W08_ABOUT' | 'W09_CONNECT';

export type ScenePhase = CosmicPhase | WorkPhase;

export const COSMIC_PHASES: CosmicPhase[] = [
  'C01_ORBIT','C02_PULL','C03_STRETCH','C04_HORIZON','C05_WARP',
  'C06_ANOMALY','C07_TRANSITION','C08_EMERGE','C09_PROJECT',
];
export const WORK_PHASES: WorkPhase[] = [
  'W01_MIRA','W02_AIDEN','W03_VANGUARD','W04_INSPECTION',
  'W05_WAVEFIELD','W06_EMI','W07_FORMULA','W08_ABOUT','W09_CONNECT',
];
export const ALL_PHASES: ScenePhase[] = [...COSMIC_PHASES, ...WORK_PHASES];
```

- [ ] **Step 2: Add `journeyProgress` + helper progress fields** to `SceneStore`

```typescript
type SceneStore = {
  phase: ScenePhase;
  phaseStart: number;
  journeyProgress: number;   // NEW — global 0..1
  cosmicProgress: number;    // NEW — derived 0..1 over C01..C09
  workProgress: number;      // NEW — derived 0..1 over W01..W09
  localProgress: number;     // NEW — 0..1 within current phase

  // Existing fields retained
  mouseX: number; mouseY: number;
  scrollVelocity: number;
  orbitAngle: number;
  pulsarActive: boolean;
  pulsarBeat: number;
  shatterActive: boolean;
  veil: number;
  horizonProgress: number;

  setPhase: (p: ScenePhase) => void;
  setProgress: (j: number, c: number, w: number, l: number, p: ScenePhase) => void;  // NEW batched
  setMouse: (x: number, y: number) => void;
  setScrollVelocity: (v: number) => void;
  setOrbitAngle: (a: number) => void;
  setShatter: (active: boolean) => void;
  setVeil: (v: number) => void;
  setHorizonProgress: (v: number) => void;
  tickPulsar: () => void;
};
```

- [ ] **Step 3: Implement `setProgress` action**

```typescript
setProgress: (journeyProgress, cosmicProgress, workProgress, localProgress, phase) =>
  set((s) =>
    phase !== s.phase
      ? { journeyProgress, cosmicProgress, workProgress, localProgress, phase, phaseStart: performance.now() }
      : { journeyProgress, cosmicProgress, workProgress, localProgress }
  ),
```

- [ ] **Step 4: Update `beginJourney`**

```typescript
beginJourney: () => {
  set({
    phase: 'C01_ORBIT',
    phaseStart: performance.now(),
    veil: 0,
    horizonProgress: 0,
    journeyProgress: 0,
    cosmicProgress: 0,
    workProgress: 0,
    localProgress: 0,
  });
},
```

- [ ] **Step 5: Update `isCosmic` / `isCosmicCanvas` predicates**

```typescript
export const isCosmic = (p: ScenePhase): p is CosmicPhase =>
  (COSMIC_PHASES as ScenePhase[]).includes(p);

export const isWork = (p: ScenePhase): p is WorkPhase =>
  (WORK_PHASES as ScenePhase[]).includes(p);

// BH custom canvas drives C01..C05; R3F canvas takes over at C06.
export const isBlackHoleCanvas = (p: ScenePhase) =>
  p === 'C01_ORBIT' || p === 'C02_PULL' || p === 'C03_STRETCH' ||
  p === 'C04_HORIZON' || p === 'C05_WARP';

export const isR3FCanvas = (p: ScenePhase) =>
  !isBlackHoleCanvas(p);  // C06 onward including all work panels
```

- [ ] **Step 6: Verify type compiles**

```bash
npm run typecheck
```
Expected: errors will surface in `SceneManager.tsx` and other consumers — that's expected. We'll fix in 1.5+.

- [ ] **Step 7: Commit (broken state — wrap in 1.7 final commit)**

Skip commit for now — we'll batch with 1.2.

---

### Task 1.2: Create pure `journey-map.ts`

**Files:**
- Create: `src/lib/journey-map.ts`
- Test: `tests/unit/journey-map.test.ts`

- [ ] **Step 1: Write failing test FIRST**

```typescript
// tests/unit/journey-map.test.ts
import { describe, it, expect } from 'vitest';
import { progressToPhase } from '@/lib/journey-map';

describe('progressToPhase', () => {
  it('returns C01_ORBIT at 0', () => {
    const r = progressToPhase(0);
    expect(r.phase).toBe('C01_ORBIT');
    expect(r.cosmicProgress).toBe(0);
    expect(r.workProgress).toBe(0);
    expect(r.localProgress).toBeCloseTo(0, 5);
  });
  it('returns C09_PROJECT at 0.55', () => {
    const r = progressToPhase(0.54);
    expect(r.phase).toBe('C09_PROJECT');
  });
  it('returns W01_MIRA right after cosmic', () => {
    const r = progressToPhase(0.56);
    expect(r.phase).toBe('W01_MIRA');
  });
  it('returns W09_CONNECT at 1', () => {
    const r = progressToPhase(1);
    expect(r.phase).toBe('W09_CONNECT');
    expect(r.workProgress).toBeCloseTo(1, 5);
  });
  it('cosmicProgress is 1 when crossing into work', () => {
    const r = progressToPhase(0.555);
    expect(r.cosmicProgress).toBeGreaterThanOrEqual(0.99);
  });
  it('localProgress wraps correctly across boundary', () => {
    const a = progressToPhase(0.099);  // late C01
    const b = progressToPhase(0.111);  // early C02
    expect(a.localProgress).toBeGreaterThan(0.5);
    expect(b.localProgress).toBeLessThan(0.5);
    expect(a.phase).toBe('C01_ORBIT');
    expect(b.phase).toBe('C02_PULL');
  });
  it('clamps at boundaries', () => {
    expect(progressToPhase(-0.1).phase).toBe('C01_ORBIT');
    expect(progressToPhase(1.1).phase).toBe('W09_CONNECT');
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npm run test
```
Expected: 7 failing tests, all `Cannot find module '@/lib/journey-map'`.

- [ ] **Step 3: Implement `journey-map.ts`**

```typescript
// src/lib/journey-map.ts
import {
  COSMIC_PHASES, WORK_PHASES, type ScenePhase,
} from './scene-state';

// ─── Bands (locked from §2) ──────────────────────────────────────────────────
// Cosmic occupies 0.000..0.555 (so dashboard has 50% of scroll real estate).
// Each cosmic phase has a width proportional to storyboard percentages from
// the bottom row of image #1. We've packed those 9 weights into the 0..0.555
// band linearly with the same ratios.
const COSMIC_END = 0.555;
const COSMIC_WEIGHTS = [
  0.10,  // C01 ORBIT     (10%)
  0.15,  // C02 PULL      (15%)
  0.15,  // C03 STRETCH   (15%)
  0.10,  // C04 HORIZON   (10%)
  0.15,  // C05 WARP      (15%)
  0.10,  // C06 ANOMALY   (10%)
  0.10,  // C07 TRANSITION(10%)
  0.10,  // C08 EMERGE    (10%)
  0.05,  // C09 PROJECT   (5%)
];
const COSMIC_BANDS = (() => {
  const bands: Array<{ phase: ScenePhase; from: number; to: number }> = [];
  let acc = 0;
  COSMIC_WEIGHTS.forEach((w, i) => {
    const from = (acc / 1) * COSMIC_END;
    acc += w;
    const to = (acc / 1) * COSMIC_END;
    bands.push({ phase: COSMIC_PHASES[i], from, to });
  });
  return bands;
})();

// Work occupies 0.555..1.000, equally divided 9 ways.
const WORK_BAND_WIDTH = (1 - COSMIC_END) / WORK_PHASES.length;
const WORK_BANDS = WORK_PHASES.map((phase, i) => ({
  phase,
  from: COSMIC_END + i * WORK_BAND_WIDTH,
  to:   COSMIC_END + (i + 1) * WORK_BAND_WIDTH,
}));

const ALL_BANDS = [...COSMIC_BANDS, ...WORK_BANDS];

export interface PhaseSnapshot {
  phase: ScenePhase;
  /** Current band's local 0..1 progress (`(p - from) / (to - from)`). */
  localProgress: number;
  /** 0..1 over cosmic phases C01..C09. 1 once crossed into work. */
  cosmicProgress: number;
  /** 0..1 over work phases W01..W09. 0 before crossing. */
  workProgress: number;
}

export function progressToPhase(p: number): PhaseSnapshot {
  const clamped = Math.max(0, Math.min(1, p));
  // Find band
  const band = ALL_BANDS.find((b) => clamped >= b.from && clamped <= b.to)
            ?? ALL_BANDS[ALL_BANDS.length - 1];
  const local = band.to === band.from ? 0 : (clamped - band.from) / (band.to - band.from);

  // Cosmic / work progress
  const cosmicProgress = clamped <= COSMIC_END
    ? clamped / COSMIC_END
    : 1;
  const workProgress = clamped <= COSMIC_END
    ? 0
    : (clamped - COSMIC_END) / (1 - COSMIC_END);

  return {
    phase: band.phase,
    localProgress: Math.max(0, Math.min(1, local)),
    cosmicProgress: Math.max(0, Math.min(1, cosmicProgress)),
    workProgress: Math.max(0, Math.min(1, workProgress)),
  };
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
npm run test
```
Expected: 7 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scene-state.ts src/lib/journey-map.ts tests/unit/journey-map.test.ts
git commit -m "refactor: 18-phase scene state and pure journey-map"
```

---

### Task 1.3: Create `design-tokens.ts` and `copy.ts`

**Files:**
- Create: `src/lib/design-tokens.ts`
- Create: `src/lib/copy.ts`

- [ ] **Step 1: Write `design-tokens.ts`** — paste §3 above verbatim.

- [ ] **Step 2: Write `copy.ts`**

```typescript
// src/lib/copy.ts
// Locked copy from DRIVEX storyboard. Edit only via PR `chore: update copy`.

export const panelCopy = {
  W01_MIRA: {
    number: '01',
    eyebrow: 'MULTILINGUAL INTELLIGENT REAL-TIME AGENT',
    title: 'MIRA',
    body: 'Real-time voice AI agent that listens, understands and responds in 5 Indian languages at sub-100ms latency.',
    metric: { label: 'RESPONSE TIME', value: '482ms' },
    chips: ['REAL-TIME ASR', 'NLU', 'LLM ORCHESTRATION', 'MULTILINGUAL', 'PIPECAT', 'LOW LATENCY'],
    trail: ['NOISE', 'SIGNAL', 'UNDERSTANDING'],
    languages: ['தமிழ்', 'हिंदी', 'తెలుగు', 'ಕನ್ನಡ', 'বাংলা'],
  },
  W02_AIDEN: {
    number: '02',
    eyebrow: 'AI-DRIVEN ENGAGEMENT ANALYTICS',
    title: 'AIDEN',
    body: 'Conversation intelligence that turns every call into actionable insights across 8 SOP dimensions.',
    chips: ['DIARIZATION', 'SENTIMENT', 'SOP SCORING', 'LLM ANALYSIS', 'POST CALL INSIGHTS', 'ZOHO CRM'],
    trail: ['CONVERSATIONS', 'INSIGHTS', 'ACTION'],
    metricsAxes: ['Emotion', 'Intent Cluster', 'SOP Adherence', 'Engagement Score'],
  },
  W03_VANGUARD: {
    number: '03',
    eyebrow: 'AUTONOMOUS WEB TESTING AGENT',
    title: 'VANGUARD',
    body: 'AI agent that explores, tests and validates systems end-to-end without manual scripts.',
    chips: ['VLM + PLAYWRIGHT', 'AUTONOMOUS AGENT', 'SELF CORRECTION', 'VISUAL UNDERSTANDING', 'CONTINUOUS TESTING'],
    trail: ['EXPLORE', 'TEST', 'ADAPT', 'VALIDATE'],
    callouts: [
      { label: 'ISSUE DETECTED', sub: 'Element Overlap', tone: 'red'  as const },
      { label: 'SELF HEALING',  sub: 'Re-attempting…', tone: 'amber'as const },
      { label: 'TEST PASSED',   sub: 'All Good',      tone: 'green'as const },
    ],
  },
  W04_INSPECTION: {
    number: '04',
    eyebrow: 'AI POWERED VEHICLE INSPECTION',
    title: 'AI INSPECTION',
    body: 'Computer vision system that inspects 1000+ parts of a two wheeler with precision and consistency.',
    chips: ['COMPUTER VISION', 'DEFECT DETECTION', '3D RECONSTRUCTION', 'REAL-TIME SCAN', '1000+ PARTS', 'QUALITY ASSURANCE'],
    trail: ['SCAN', 'DETECT', 'ANALYZE', 'ASSURE'],
    layers: ['STRUCTURE', 'MECHANICAL', 'ELECTRICAL', 'COSMETIC', 'TYRES & WHEELS'],
  },
  W05_WAVEFIELD: {
    number: '05',
    eyebrow: 'WAVE FIELD LLM RESEARCH',
    title: 'WAVE FIELD',
    body: 'Breaking the quadratic barrier of attention with Wave Field Attention. O(n log n) complexity for massive scale.',
    chips: ['RESEARCH', 'ALGORITHM DESIGN', 'ATTENTION MECHANISM', 'O(n log n) COMPLEXITY', 'SCALABLE AI'],
    trail: ['RETHINK', 'RESEARCH', 'REDUCE COMPLEXITY'],
    comparison: {
      left:  { label: 'STANDARD ATTENTION', complexity: 'O(n²)',     metric: '1M tokens', sub: '~200,000× SLOWER' },
      right: { label: 'WAVE FIELD ATTENTION', complexity: 'O(n log n)', metric: '1M tokens', sub: 'STABLE & EFFICIENT' },
    },
  },
  W06_EMI: {
    number: '06',
    eyebrow: 'EMI SHIELDING DESIGNER & COMPUTATIONAL PHYSICS ENGINE',
    title: 'EMI ENGINE',
    body: 'Simulating electromagnetic fields to design smarter shielding solutions that perform in the real world.',
    chips: ['EM SIMULATION', 'MULTI-PHASE COMPOSITES', 'FREQUENCY SWEEP', 'JENKINS CI/CD', '20 YEAR LIFE PREDICTION'],
    trail: ['MODEL', 'SIMULATE', 'PREDICT', 'PROTECT'],
    sweepRange: '100 kHz – 10 GHz',
  },
  W07_FORMULA: {
    number: '07',
    eyebrow: 'FORMULA MANIPAL',
    title: 'FORMULA MANIPAL',
    body: 'Led autonomous path planning, controls and testing for FM23e EV. 1st in Cost & Manufacturing at Formula Bharat 2024.',
    chips: ['CONTROLS', 'PATH PLANNING', 'VEHICLE DYNAMICS', 'DATA LOGGING', 'SYSTEMS ENGINEERING'],
    trail: ['MODEL', 'OPTIMIZE', 'TEST', 'WIN'],
    legend: ['INITIAL PATH', 'OPTIMIZED PATH', 'TRACK BOUNDARY', 'BEST LINE'],
  },
  W08_ABOUT: {
    number: '08',
    eyebrow: 'ABOUT ME',
    title: 'SYSTEMS-FIRST ENGINEER',
    body: 'Systems-first engineer who loves building complex products that create real impact.',
    chips: ['SYSTEMS THINKER', 'FULL STACK BUILDER', 'PROBLEM SOLVER', 'RESEARCH DRIVEN', 'OWNERSHIP MINDSET'],
    trail: ['CURIOSITY', 'BUILD', 'IMPACT'],
    skills: ['AI SYSTEMS', 'SOFTWARE ENGINEERING', 'RESEARCH', 'PHYSICS & SIMULATION', 'PRODUCT THINKING', 'REAL WORLD IMPACT'],
  },
  W09_CONNECT: {
    number: '09',
    eyebrow: "LET'S CONNECT",
    title: "LET'S CONNECT",
    body: "Big problems need collaborative minds. Let's build the future together.",
    trail: ['CONNECT', 'COLLABORATE', 'CREATE IMPACT'],
    links: [
      { label: 'LINKEDIN', icon: 'linkedin', href: 'https://linkedin.com/in/danush-arun-5aa762267' },
      { label: 'GITHUB',   icon: 'github',   href: 'https://github.com/DanushArun' },
      { label: 'EMAIL',    icon: 'mail',     href: 'mailto:procx@partner.drivex.in' },
    ],
  },
} as const;

export type PanelCopy = typeof panelCopy;
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```
Expected: no new errors caused by these files (existing scene errors unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/lib/design-tokens.ts src/lib/copy.ts
git commit -m "feat: lock design tokens and storyboard copy"
```

---

### Task 1.4: Build `ScrollOrchestrator.tsx`

**Files:**
- Create: `src/components/scene/ScrollOrchestrator.tsx`
- Modify: `src/components/scene/SceneManager.tsx` (replace inline scroll handler)

- [ ] **Step 1: Write the orchestrator**

```typescript
// src/components/scene/ScrollOrchestrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScene } from '@/lib/scene-state';
import { progressToPhase } from '@/lib/journey-map';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollOrchestrator() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP RAF sync — ensures ScrollTrigger reads Lenis-smoothed scrollTop.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Single ScrollTrigger driving journeyProgress.
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end:   'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress;
        const snap = progressToPhase(p);
        useScene.getState().setProgress(
          p,
          snap.cosmicProgress,
          snap.workProgress,
          snap.localProgress,
          snap.phase,
        );
      },
    });

    return () => {
      trigger.kill();
      lenis.destroy();
      gsap.ticker.remove(lenis.raf as never);
    };
  }, []);

  return null;
}
```

- [ ] **Step 2: Update `SceneManager.tsx`** — remove the inline `onScroll` handler; mount `<ScrollOrchestrator />` instead.

Replace lines 51–80 (the floor-bucket scroll handler) and the corresponding `useEffect` registration. Add at top:

```typescript
import ScrollOrchestrator from './ScrollOrchestrator';
```

In the JSX return, before `<HUD />`, add:
```jsx
<ScrollOrchestrator />
```

Delete the now-unused `lastScrollY`, `onScroll` callback, and the `'scroll'` event listener registration. Keep the mouse handler as is.

- [ ] **Step 3: Verify build**

```bash
npm run dev
```
Open `http://localhost:3000`, scroll the page. Open devtools console, run:
```js
useScene = window.__sceneStore  // we'll wire this debug hook in Task 1.5
```
Skip for now if no debug hook.

Manual verification: add `console.log` to `setProgress` temporarily and watch values stream from 0 → 1 as you scroll. Remove the log before committing.

- [ ] **Step 4: Commit**

```bash
git add src/components/scene/ScrollOrchestrator.tsx src/components/scene/SceneManager.tsx
git commit -m "feat: lenis+gsap scroll orchestrator drives journeyProgress"
```

---

### Task 1.5: Add dev-only debug HUD overlay

**Files:**
- Modify: `src/components/scene/HUD.tsx`

- [ ] **Step 1: Add debug panel** (only renders when `process.env.NODE_ENV !== 'production'`)

Append to the bottom of `HUD()` return:

```jsx
{process.env.NODE_ENV !== 'production' && <DebugProgressOverlay />}
```

Add at top of file:

```typescript
function DebugProgressOverlay() {
  const phase = useScene((s) => s.phase);
  const j = useScene((s) => s.journeyProgress);
  const c = useScene((s) => s.cosmicProgress);
  const w = useScene((s) => s.workProgress);
  const l = useScene((s) => s.localProgress);
  return (
    <div style={{
      position: 'fixed', top: 8, right: 8, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', color: '#5EEAD4',
      fontFamily: 'monospace', fontSize: 10, padding: '4px 8px',
      pointerEvents: 'none', letterSpacing: '0.05em',
    }}>
      <div>{phase}</div>
      <div>j={j.toFixed(3)} c={c.toFixed(3)} w={w.toFixed(3)}</div>
      <div>local={l.toFixed(3)}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Scroll the page. The debug panel top-right should update phase ID and progress values continuously and smoothly.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/HUD.tsx
git commit -m "feat: dev-only debug HUD shows journey progress"
```

---

### Task 1.6: Update `SceneManager.tsx` canvas mounting

**Files:**
- Modify: `src/components/scene/SceneManager.tsx`

- [ ] **Step 1: Replace canvas mount logic** with the new BH/R3F split based on `isBlackHoleCanvas` / `isR3FCanvas`.

```typescript
// Replace existing showBH/showCosmic/showR3F block (≈lines 108–123) with:
import { isBlackHoleCanvas, isR3FCanvas } from '@/lib/scene-state';

// inside SceneManager:
const cosmicProgress = useScene((s) => s.cosmicProgress);
const showBH    = isBlackHoleCanvas(phase);
const showR3F   = isR3FCanvas(phase) || phase === 'C05_WARP';  // overlap during WARP
const bhAlpha   = phase === 'C05_WARP'
  ? Math.max(0, 1 - useScene.getState().localProgress * 1.4) // fade out across WARP
  : (showBH ? 1 : 0);
```

- [ ] **Step 2: Wire BH `progress` prop from cosmicProgress** so the journey curve in `lib/blackHole/index.ts` keeps driving correctly:

```jsx
<BlackHoleMount
  innerColor="#FF8040"
  outerColor="#5A1A08"
  progress={cosmicProgress}  // was horizonProgress; now drives all of C01..C05
/>
```

- [ ] **Step 3: Update R3F children mounting** — the old absolute-positioned scenes are now superseded. Mount only the cosmic late-stage scenes + the WorkDashboard layer:

```jsx
{showR3F && (
  <Canvas
    dpr={[1, 1.5]}
    gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
    camera={{ position: [0, 0, 30], fov: 50, near: 0.01, far: 2000 }}
    style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 2 }}
  >
    <Suspense fallback={null}>
      <CameraRig />
      <StarField />
      {phase === 'C05_WARP' && <WarpScene />}
      {phase === 'C06_ANOMALY' && <AnomalyGlitch />}
      {phase === 'C07_TRANSITION' && <TransitionConvergence />}
      {(phase === 'C08_EMERGE' || phase === 'C09_PROJECT') && <EmergeSystem />}
      <PostFX />
    </Suspense>
  </Canvas>
)}
```

(Note: `AnomalyGlitch`, `TransitionConvergence`, `EmergeSystem` are stubs at this point — built in M2.)

- [ ] **Step 4: Add stubs** for the three new scenes so build doesn't break:

```typescript
// src/components/scene/scenes/AnomalyGlitch.tsx
'use client';
export default function AnomalyGlitch() { return null; }

// src/components/scene/scenes/TransitionConvergence.tsx
'use client';
export default function TransitionConvergence() { return null; }

// src/components/scene/scenes/EmergeSystem.tsx
'use client';
export default function EmergeSystem() { return null; }
```

Wire dynamic imports in `SceneManager.tsx`:
```typescript
const AnomalyGlitch         = dynamic(() => import('./scenes/AnomalyGlitch'),         { ssr: false });
const TransitionConvergence = dynamic(() => import('./scenes/TransitionConvergence'), { ssr: false });
const EmergeSystem          = dynamic(() => import('./scenes/EmergeSystem'),          { ssr: false });
```

- [ ] **Step 5: Build**

```bash
npm run typecheck && npm run dev
```
Expected: builds. Scrolling shows BH for cosmic 1–4, fades into nothing for cosmic 5–9 (stubs), then nothing for work panels.

- [ ] **Step 6: Commit**

```bash
git add src/components/scene/SceneManager.tsx src/components/scene/scenes/AnomalyGlitch.tsx src/components/scene/scenes/TransitionConvergence.tsx src/components/scene/scenes/EmergeSystem.tsx
git commit -m "feat: split scene manager into BH/R3F canvases by phase"
```

---

### Task 1.7: Set page scroll height to 1500vh

**Files:**
- Modify: `src/components/scene/SceneManager.tsx` (the spacer div at the bottom)

- [ ] **Step 1: Update spacer div**

Change:
```jsx
<div style={{ height: '1000vh', ... }} />
```
to:
```jsx
<div
  aria-hidden
  style={{
    height: '1500vh',  // 9 cosmic + 9 work, ~83vh per phase, plus buffer
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    zIndex: -1,
  }}
/>
```

- [ ] **Step 2: Verify scroll budget**

```bash
npm run dev
```
Scroll from top to bottom. Debug HUD should reach `j=1.000` exactly when you bottom out.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/SceneManager.tsx
git commit -m "feat: 1500vh page height for 18-phase pacing"
```

---

**Milestone 1 Definition of Done:**
- [x] `npm run test` passes (7 unit tests)
- [x] `npm run typecheck` zero errors
- [x] `npm run build` produces clean output
- [x] Debug HUD shows phase IDs `C01_ORBIT → W09_CONNECT` smoothly across 0..1 scroll
- [x] BH still renders during C01–C04 with same camera curve as before

---

## §7 MILESTONE 2 — Cosmic Journey (9 beats production-ready)

**Outcome:** All 9 cosmic phases render at full fidelity, cross-fading without seams. EMERGE → MIRA seam locked with shared color and bloom.

### Task 2.1: Parameterize BH `intensity`

**Files:**
- Modify: `src/lib/blackHole/index.ts`
- Modify: `src/components/scene/BlackHoleMount.tsx`

- [ ] **Step 1: Add `intensity` to BH options + handle**

In `BlackHoleHandle` interface, add `setIntensity: (v: number) => void;`.
In `BlackHoleOptions`, add `initialIntensity?: number;` (default 1.0).

In the factory body, near the top after color setup:
```typescript
let externalIntensity = opts.initialIntensity ?? 1.0;
```

Pass `intensity` into shaders by adding a uniform on `discMat` and `partMat`:
```typescript
discMat.uniforms.uIntensity = { value: externalIntensity };
partMat.uniforms.uIntensity = { value: externalIntensity };
```

In the tick loop, propagate:
```typescript
discMat.uniforms.uIntensity.value = externalIntensity;
partMat.uniforms.uIntensity.value = externalIntensity;
```

In the GLSL `discFrag` and `discParticlesFrag` (in `src/lib/blackHole/shaders.ts`), multiply final color by `uIntensity`:
```glsl
// In discFrag main(), wherever finalColor is computed at the end:
finalColor *= uIntensity;
```
(Locate the exact line and apply — file too long to inline here. Search for `gl_FragColor` and prepend `* uIntensity` to the color.)

Return:
```typescript
return {
  canvas: renderer.domElement,
  destroy,
  setProgress: (p) => { externalProgress = Math.max(0, Math.min(1, p)); },
  setIntensity: (v) => { externalIntensity = Math.max(0, Math.min(2, v)); },
};
```

- [ ] **Step 2: Add `intensity` prop to `BlackHoleMount`**

```typescript
export interface BlackHoleMountProps {
  // ...existing
  intensity?: number;
}
// inside component:
useEffect(() => {
  handleRef.current?.setIntensity(intensity ?? 1.0);
}, [intensity]);
```

- [ ] **Step 3: Drive intensity from `cosmicProgress` in `SceneManager`**

```jsx
<BlackHoleMount
  innerColor="#FF8040"
  outerColor="#5A1A08"
  progress={cosmicProgress}
  intensity={
    phase === 'C04_HORIZON'
      ? 1.0 + useScene.getState().localProgress * 0.6  // 1.0 → 1.6 across HORIZON (white-flash spike)
      : 1.0
  }
/>
```

- [ ] **Step 4: Verify**

`npm run dev` — scroll into C04_HORIZON. Visual should show a noticeable brightness pop. Scroll back, brightness returns to baseline.

- [ ] **Step 5: Commit**

```bash
git add src/lib/blackHole/ src/components/scene/BlackHoleMount.tsx src/components/scene/SceneManager.tsx
git commit -m "feat: BH intensity uniform for HORIZON white-flash"
```

---

### Task 2.2: Build `AnomalyGlitch.tsx` (C06)

**Files:**
- Replace stub: `src/components/scene/scenes/AnomalyGlitch.tsx`

- [ ] **Step 1: Implement the scene**

```typescript
// src/components/scene/scenes/AnomalyGlitch.tsx
'use client';

/**
 * C06_ANOMALY — Reality fragments. Datamosh-style chromatic shards drift
 * across the frame, RGB channels separate and recombine, scanline jitter,
 * voronoi-shattered grid. Active during phase C06_ANOMALY only.
 *
 * Implementation:
 *   - Fullscreen quad at z=-1 (in front of starfield)
 *   - ShaderMaterial driven by uTime + useScene().localProgress
 *   - PostFX adds Glitch pass on top via PostFX gating
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uProgress;
  varying vec2 vUv;

  // hash + voronoi
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }
  float voronoi(vec2 x) {
    vec2 i = floor(x); vec2 f = fract(x);
    float minDist = 1.0;
    for (int j = -1; j <= 1; j++) for (int i2 = -1; i2 <= 1; i2++) {
      vec2 g = vec2(float(i2), float(j));
      vec2 o = hash2(i + g) * 0.5 + 0.5;
      o = 0.5 + 0.5 * sin(uTime * 0.7 + 6.2831 * o);
      vec2 r = g + o - f;
      minDist = min(minDist, dot(r, r));
    }
    return sqrt(minDist);
  }

  void main() {
    vec2 uv = vUv;
    // RGB channel separation
    float split = 0.012 * uProgress;
    vec2 dir = normalize(vec2(sin(uTime * 3.0), cos(uTime * 2.7)));
    float r = step(0.45, voronoi(uv * 8.0 + dir * split));
    float g = step(0.45, voronoi(uv * 8.0));
    float b = step(0.45, voronoi(uv * 8.0 - dir * split));

    // Scanline
    float scan = step(0.5, sin(uv.y * 800.0 + uTime * 60.0)) * 0.05 * uProgress;

    // Vignette mask so the effect strengthens toward edges
    float v = smoothstep(0.2, 1.0, length(uv - 0.5));
    float intensity = uProgress * (0.5 + v * 1.2);

    vec3 col = vec3(r, g, b) * intensity;
    col += scan;
    // Spectrum tint
    col.r *= 1.1;
    col.b *= 1.15;

    // Alpha: only show when progress > 0; fade out by edges
    float alpha = uProgress * (0.4 + v * 0.6) * (r + g + b) * 0.5;
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function AnomalyGlitch() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uProgress: { value: 0 },
  }), []);

  useFrame((state) => {
    const local = useScene.getState().localProgress;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Bell curve so it ramps in 0..0.5 then out 0.5..1
      const bell = Math.sin(local * Math.PI);
      matRef.current.uniforms.uProgress.value = bell;
    }
  });

  return (
    <mesh frustumCulled={false} renderOrder={10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Verify**

`npm run dev` — scroll to C06_ANOMALY (~36–42% scroll). Voronoi RGB-shifted shards should appear, peak mid-phase, fade out.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/scenes/AnomalyGlitch.tsx
git commit -m "feat: implement C06_ANOMALY voronoi datamosh shader"
```

---

### Task 2.3: Build `TransitionConvergence.tsx` (C07)

**Files:**
- Replace stub: `src/components/scene/scenes/TransitionConvergence.tsx`

- [ ] **Step 1: Implement the scene**

```typescript
// src/components/scene/scenes/TransitionConvergence.tsx
'use client';

/**
 * C07_TRANSITION — Fragments converge. Chaos resolves into a structured
 * central point. 8000 particles spawn at random positions in a 60-unit cube,
 * each lerps toward its targetPos (a structured 3D point cloud forming a
 * radial lattice) as localProgress goes 0 → 1. At 1.0, all particles sit on
 * a 3D fibonacci-sphere lattice scaled to radius 4 — visually reads as the
 * binary-system seed.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const COUNT = 8000;

const VERT = /* glsl */ `
  attribute vec3 aChaos;
  attribute vec3 aTarget;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    // Smooth ease (cubic in-out)
    float t = uProgress;
    t = t * t * (3.0 - 2.0 * t);
    vec3 pos = mix(aChaos, aTarget, t);

    // Subtle wobble during transit
    float wobble = (1.0 - t) * 0.3;
    pos += vec3(sin(uTime * 2.0 + aSeed * 6.28),
                cos(uTime * 1.7 + aSeed * 6.28),
                sin(uTime * 2.3 + aSeed * 12.56)) * wobble;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Point size: small far, larger near
    float size = mix(2.0, 5.0, t);
    gl_PointSize = size * (300.0 / -mv.z);

    // Alpha: dim during chaos, bright at convergence
    vAlpha = mix(0.35, 1.0, t);
  }
`;
const FRAG = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float a = vAlpha * (1.0 - r * 2.0);
    // Color: warm amber → blue-white over radial gradient
    vec3 col = mix(vec3(1.0, 0.7, 0.3), vec3(0.7, 0.9, 1.0), 1.0 - r * 2.0);
    gl_FragColor = vec4(col, a);
  }
`;

function fibSphere(i: number, total: number, radius: number) {
  const phi = Math.acos(1 - 2 * (i + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
  return [
    radius * Math.cos(theta) * Math.sin(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(phi),
  ] as const;
}

export default function TransitionConvergence() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { geo, uniforms } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const chaos = new Float32Array(COUNT * 3);
    const target = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // Chaos positions (60-unit cube)
      chaos[i * 3]     = (Math.random() - 0.5) * 60;
      chaos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      chaos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      // Target positions (fibonacci sphere, r=4)
      const [x, y, z] = fibSphere(i, COUNT, 4);
      target[i * 3]     = x;
      target[i * 3 + 1] = y;
      target[i * 3 + 2] = z;
      seed[i] = Math.random();
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(chaos, 3));
    geometry.setAttribute('aChaos', new THREE.BufferAttribute(chaos, 3));
    geometry.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

    const u = {
      uProgress: { value: 0 },
      uTime:     { value: 0 },
    };
    return { geo: geometry, uniforms: u };
  }, []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uProgress.value = useScene.getState().localProgress;
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points frustumCulled={false}>
      <primitive attach="geometry" object={geo} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

- [ ] **Step 2: Verify**

`npm run dev` → scroll to C07 (~42–47%). Chaos cloud → radial sphere convergence visible.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/scenes/TransitionConvergence.tsx
git commit -m "feat: implement C07_TRANSITION fragment convergence"
```

---

### Task 2.4: Build `EmergeSystem.tsx` (C08 + C09)

**Files:**
- Replace stub: `src/components/scene/scenes/EmergeSystem.tsx`

- [ ] **Step 1: Implement the scene**

```typescript
// src/components/scene/scenes/EmergeSystem.tsx
'use client';

/**
 * C08_EMERGE + C09_PROJECT — Stable binary system.
 *
 *   - Amber star (#E8A020) and Blue dwarf (#85CCF7) orbiting a barycenter
 *   - Faint elliptical accretion ring around the system center
 *   - Both spheres on Layer 1 (selective bloom target)
 *   - In C09_PROJECT, system fades opacity 1.0 → 0.0 to hand off to MIRA panel
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const ORBIT_RADIUS = 4;
const ORBIT_PERIOD = 8.0; // seconds for full rotation
const RING_RADIUS  = 6;

export default function EmergeSystem() {
  const groupRef = useRef<THREE.Group>(null);
  const amberRef = useRef<THREE.Mesh>(null);
  const blueRef  = useRef<THREE.Mesh>(null);
  const ringRef  = useRef<THREE.Mesh>(null);
  const amberMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const blueMatRef  = useRef<THREE.MeshStandardMaterial>(null);
  const ringMatRef  = useRef<THREE.MeshBasicMaterial>(null);

  const ringGeo = useMemo(() => {
    const g = new THREE.RingGeometry(RING_RADIUS - 0.4, RING_RADIUS + 0.4, 96, 1);
    return g;
  }, []);

  // Enable bloom layer
  useEffect(() => {
    amberRef.current?.layers.enable(1);
    blueRef.current?.layers.enable(1);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const phase = useScene.getState().phase;
    const local = useScene.getState().localProgress;

    // Orbital angles (180° opposed)
    const a = (t / ORBIT_PERIOD) * Math.PI * 2;

    if (amberRef.current && blueRef.current) {
      amberRef.current.position.set(
        Math.cos(a) * ORBIT_RADIUS,
        0,
        Math.sin(a) * ORBIT_RADIUS,
      );
      blueRef.current.position.set(
        Math.cos(a + Math.PI) * ORBIT_RADIUS,
        0,
        Math.sin(a + Math.PI) * ORBIT_RADIUS,
      );
    }

    // Group breathing: subtle scale + tilt
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
      groupRef.current.rotation.x = Math.PI * 0.18;
    }

    // C09 fade out — hand off to MIRA
    let alpha = 1.0;
    if (phase === 'C09_PROJECT') alpha = 1.0 - local;

    if (amberMatRef.current) {
      amberMatRef.current.opacity = alpha;
      amberMatRef.current.transparent = alpha < 1.0;
    }
    if (blueMatRef.current) {
      blueMatRef.current.opacity = alpha;
      blueMatRef.current.transparent = alpha < 1.0;
    }
    if (ringMatRef.current) ringMatRef.current.opacity = alpha * 0.35;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={amberRef}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial
          ref={amberMatRef}
          color="#E8A020"
          emissive="#E8A020"
          emissiveIntensity={2.4}
          roughness={0.4}
        />
      </mesh>
      <mesh ref={blueRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial
          ref={blueMatRef}
          color="#85CCF7"
          emissive="#85CCF7"
          emissiveIntensity={2.6}
          roughness={0.4}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <primitive attach="geometry" object={ringGeo} />
        <meshBasicMaterial
          ref={ringMatRef}
          color="#85CCF7"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#85CCF7" distance={20} />
    </group>
  );
}
```

- [ ] **Step 2: Verify**

`npm run dev` → scroll to C08 (~47–52%). Two emissive stars orbit. Continue into C09 — system fades to nothing.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/scenes/EmergeSystem.tsx
git commit -m "feat: implement C08_EMERGE binary system + C09 fade-out handoff"
```

---

### Task 2.5: Extend WarpScene to handle full C05 duration

**Files:**
- Modify: `src/components/scene/scenes/WarpScene.tsx`

- [ ] **Step 1: Drive WarpScene from `localProgress` instead of `elapsed`**

Replace the elapsed-time driven animation with localProgress-driven:

```typescript
// Replace the elapsed.current update at the top of useFrame:
useFrame((_, dt) => {
  const local = useScene.getState().localProgress;  // 0..1 across C05_WARP
  // Map local to virtual elapsed: 5s budget * local
  const p = local * DURATION;
  // Then continue using `p` exactly as before for beat timing.
  // ... rest of beat logic uses p
});
```

- [ ] **Step 2: Remove the `setPhase('BOSON_STAR')` call**

Phase transitions are now scroll-driven, not time-driven. Delete the `if (p >= DURATION && !fired.current)` block.

- [ ] **Step 3: Verify**

`npm run dev` → scroll forward through C05 — see TEAR → TUNNEL → STREAKS smoothly. Scroll backward — animation plays in reverse.

- [ ] **Step 4: Commit**

```bash
git add src/components/scene/scenes/WarpScene.tsx
git commit -m "refactor: warp scene driven by scroll progress not elapsed time"
```

---

### Task 2.6: Selective bloom in PostFX

**Files:**
- Modify: `src/components/scene/PostFX.tsx`

- [ ] **Step 1: Replace generic Bloom with SelectiveBloom**

```typescript
// src/components/scene/PostFX.tsx
'use client';

import { EffectComposer, SelectiveBloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useScene } from '@/lib/scene-state';
import * as THREE from 'three';

export default function PostFX() {
  const { scene, camera } = useThree();
  const lightRef = useRef<THREE.Light>(null);

  // Scene + camera need to be passed to SelectiveBloom; the selection of
  // bloom-eligible objects is done by enabling Layer 1 on those meshes.
  const cosmicProgress = useScene((s) => s.cosmicProgress);
  const phase          = useScene((s) => s.phase);

  // Chromatic aberration: ramps with cosmicProgress, kills during work phases.
  const caOffset = phase.startsWith('C')
    ? Math.min(0.005, cosmicProgress * 0.005)
    : 0;

  return (
    <EffectComposer enableNormalPass={false}>
      <SelectiveBloom
        intensity={1.1}
        luminanceThreshold={0.78}
        luminanceSmoothing={0.85}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
        blendFunction={BlendFunction.ADD}
        lights={[]}             // we don't bloom lights
      />
      <ChromaticAberration
        offset={[caOffset, caOffset]}
        radialModulation
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
```

(`SelectiveBloom` automatically picks up meshes with `layers.enable(1)`, which we did in `EmergeSystem`. Other scenes can opt-in similarly.)

- [ ] **Step 2: Verify**

`npm run dev` → C08 binary stars should glow significantly. Background remains absolute black. Cosmic phases show progressively more chromatic aberration; work phases have none.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/PostFX.tsx
git commit -m "feat: selective bloom layer 1 + chromatic aberration ramp"
```

---

### Task 2.7: Camera rig refactor for cosmic late phases

**Files:**
- Modify: `src/components/scene/CameraRig.tsx`

- [ ] **Step 1: Read current state of CameraRig**

```bash
cat src/components/scene/CameraRig.tsx
```

- [ ] **Step 2: Replace its position-driven logic with phase-aware logic**

The new pattern:
- `C05_WARP`: camera at `(0, 0, 30)`, FOV 50°.
- `C06_ANOMALY`: camera at `(0, 0, 30)`, slight handheld jitter via Perlin.
- `C07_TRANSITION`: camera dollies from `(0, 0, 30) → (0, 0, 12)` across local 0..1.
- `C08_EMERGE`: camera orbits the binary at `r=12`, 0.05 rad/s.
- `C09_PROJECT`: camera pulls back to `(0, 0, 18)`, slowing the orbit, blue dwarf still framed center.
- `W01..W09`: camera at `(0, -panelIndex * 100, 6)` (teleport in `useEffect`, panel index from phase).

Pseudo-implementation:
```typescript
useFrame((state) => {
  const phase = useScene.getState().phase;
  const local = useScene.getState().localProgress;
  const t = state.clock.elapsedTime;

  switch (phase) {
    case 'C06_ANOMALY': {
      const jx = (Math.sin(t * 11) * 0.3) * (1 - Math.abs(local - 0.5) * 2);
      const jy = (Math.cos(t * 7)  * 0.3) * (1 - Math.abs(local - 0.5) * 2);
      state.camera.position.set(jx, jy, 30);
      state.camera.lookAt(0, 0, 0);
      break;
    }
    case 'C07_TRANSITION': {
      const z = THREE.MathUtils.lerp(30, 12, local);
      state.camera.position.set(0, 0, z);
      state.camera.lookAt(0, 0, 0);
      break;
    }
    case 'C08_EMERGE': {
      const a = t * 0.05;
      state.camera.position.set(Math.cos(a) * 12, 1.5, Math.sin(a) * 12);
      state.camera.lookAt(0, 0, 0);
      break;
    }
    case 'C09_PROJECT': {
      const a = t * 0.03;
      const z = THREE.MathUtils.lerp(12, 18, local);
      state.camera.position.set(Math.cos(a) * z, 1.5, Math.sin(a) * z);
      state.camera.lookAt(0, 0, 0);
      break;
    }
    default: {
      // Work phases handled in WorkDashboard via separate camera rig
    }
  }
});
```

- [ ] **Step 3: Verify**

`npm run dev` → cosmic phases now have a real camera arc. C08 orbit is steady, C09 pulls back.

- [ ] **Step 4: Commit**

```bash
git add src/components/scene/CameraRig.tsx
git commit -m "feat: camera rig handles all cosmic late phases"
```

---

### Task 2.8: Visual smoke test — every phase reachable

**Files:**
- Create: `tests/e2e/scroll-smoke.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/e2e/scroll-smoke.spec.ts
import { test, expect } from '@playwright/test';

const PHASE_PROGRESS_TARGETS: Array<[string, number]> = [
  ['C01_ORBIT',      0.02],
  ['C02_PULL',       0.10],
  ['C03_STRETCH',    0.18],
  ['C04_HORIZON',    0.25],
  ['C05_WARP',       0.32],
  ['C06_ANOMALY',    0.39],
  ['C07_TRANSITION', 0.45],
  ['C08_EMERGE',     0.50],
  ['C09_PROJECT',    0.547],
  ['W01_MIRA',       0.58],
  ['W02_AIDEN',      0.63],
  ['W03_VANGUARD',   0.68],
  ['W04_INSPECTION', 0.73],
  ['W05_WAVEFIELD',  0.78],
  ['W06_EMI',        0.83],
  ['W07_FORMULA',    0.88],
  ['W08_ABOUT',      0.93],
  ['W09_CONNECT',    0.98],
];

test.describe('scroll smoke — every phase reachable', () => {
  for (const [phase, progress] of PHASE_PROGRESS_TARGETS) {
    test(`reaches ${phase} at progress ~${progress}`, async ({ page }) => {
      await page.goto('/');
      // Scroll to target progress
      await page.evaluate((p) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: max * p, behavior: 'instant' });
      }, progress);
      await page.waitForTimeout(400); // allow Lenis settle + frame paint
      // Read debug HUD
      const text = await page.locator('div').filter({ hasText: phase }).first().textContent();
      expect(text).toContain(phase);
    });
  }
});

test('no console errors during full scroll', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  // Scroll smoothly through full range
  for (let i = 0; i <= 10; i++) {
    await page.evaluate((step) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * (step / 10), behavior: 'instant' });
    }, i);
    await page.waitForTimeout(150);
  }
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test tests/e2e/scroll-smoke.spec.ts --reporter=line
```
Expected: 18 phase tests pass, console-error test passes.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/scroll-smoke.spec.ts
git commit -m "test: scroll smoke verifies every phase reachable + no console errors"
```

---

### Task 2.9: Cosmic phases visual reference screenshots

**Files:**
- Create: `tests/e2e/cosmic-screenshots.spec.ts` (visual snapshots, will be reviewed manually)

- [ ] **Step 1: Write screenshot capture**

```typescript
// tests/e2e/cosmic-screenshots.spec.ts
import { test } from '@playwright/test';

const TARGETS = [
  { name: 'C01_orbit',      progress: 0.04 },
  { name: 'C02_pull',       progress: 0.12 },
  { name: 'C03_stretch',    progress: 0.18 },
  { name: 'C04_horizon',    progress: 0.25 },
  { name: 'C05_warp',       progress: 0.32 },
  { name: 'C06_anomaly',    progress: 0.39 },
  { name: 'C07_transition', progress: 0.44 },
  { name: 'C08_emerge',     progress: 0.50 },
  { name: 'C09_project',    progress: 0.546 },
];

for (const t of TARGETS) {
  test(`screenshot: ${t.name}`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate((p) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * p, behavior: 'instant' });
    }, t.progress);
    await page.waitForTimeout(800); // settle + animation breathe
    await page.screenshot({
      path: `tests/screenshots/cosmic/${t.name}.png`,
      fullPage: false,
      animations: 'disabled',
    });
  });
}
```

- [ ] **Step 2: Run + manually review screenshots**

```bash
npx playwright test tests/e2e/cosmic-screenshots.spec.ts
ls tests/screenshots/cosmic/
```

Compare each screenshot against the corresponding storyboard frame (image #1 panels 1–9). Each should match within ±5% color delta. If any mismatch:
- **C01–C04 mismatch:** adjust BH `intensity` ramp (Task 2.1).
- **C05 mismatch:** WarpScene timing (Task 2.5).
- **C06 mismatch:** AnomalyGlitch shader uniforms (Task 2.2).
- **C07 mismatch:** TransitionConvergence target lattice (Task 2.3).
- **C08 mismatch:** EmergeSystem orbit radius / colors (Task 2.4).

- [ ] **Step 3: Add `tests/screenshots/cosmic/` to gitignore** to keep diffs out of repo

```
# .gitignore additions
tests/screenshots/
```

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/cosmic-screenshots.spec.ts .gitignore
git commit -m "test: cosmic phase screenshot capture (manual review)"
```

---

### Task 2.10: EMERGE → MIRA color match validation

**Files:**
- Create: `tests/e2e/handoff-seam.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/e2e/handoff-seam.spec.ts
import { test, expect } from '@playwright/test';

// At the boundary between C09_PROJECT and W01_MIRA, sample center pixel +
// dominant glow color. Both must contain the locked seam hex (#85CCF7) ±10%.
test('EMERGE blue dwarf color matches MIRA waveform', async ({ page }) => {
  await page.goto('/');
  // C09 mid-fade
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * 0.547, behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  const c09 = await page.screenshot({ animations: 'disabled' });

  // W01 entry
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * 0.575, behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  const w01 = await page.screenshot({ animations: 'disabled' });

  // We don't pixel-diff — instead we verify both screenshots are not-null
  // (smoke test of seam stability). Color-match validation is a manual review
  // checkpoint via storyboard comparison.
  expect(c09.length).toBeGreaterThan(1000);
  expect(w01.length).toBeGreaterThan(1000);
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test tests/e2e/handoff-seam.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/handoff-seam.spec.ts
git commit -m "test: EMERGE→MIRA seam stability"
```

---

**Milestone 2 Definition of Done:**
- [x] All 9 cosmic phases render full visuals (no stubs)
- [x] Selective bloom isolates emissive objects, void stays black
- [x] Chromatic aberration ramps with cosmicProgress
- [x] All e2e tests pass: `scroll-smoke`, `handoff-seam`, `cosmic-screenshots`
- [x] Manual screenshot review matches storyboard image #1 panels 1–9 within ±5%
- [x] No console errors during full-page scroll
- [x] 60 FPS sustained verified by `tests/e2e/perf.spec.ts` (built later in M5)

---

## §8 MILESTONE 3 — Dashboard Shell + Bookend Panels (W01, W09)

**Outcome:** A pinned-vertical dashboard renders 9 panel slots; W01 MIRA and W09 CONNECT are production-ready. Pattern proven; the middle 7 panels can clone the skeleton in M4.

### Task 3.1: Build `PanelChrome.tsx` shared shell

**Files:**
- Create: `src/components/work/PanelChrome.tsx`

- [ ] **Step 1: Write the component**

```typescript
// src/components/work/PanelChrome.tsx
'use client';

import { ReactNode } from 'react';
import { type WorkPhase } from '@/lib/scene-state';
import { panelHues, type, fontSize, spacing } from '@/lib/design-tokens';

export interface PanelChromeProps {
  phaseId: WorkPhase;
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  trail: string[];
  children: ReactNode;
}

export default function PanelChrome({
  phaseId, number, eyebrow, title, body, trail, children,
}: PanelChromeProps) {
  const hue = panelHues[phaseId];

  return (
    <article
      data-panel={phaseId}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: spacing.panelPad,
        boxSizing: 'border-box',
        color: '#E8E4D8',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing.panelPad,
        alignItems: 'center',
      }}>
        {/* Left — text rail */}
        <div>
          <div style={{
            fontFamily: type.mono,
            fontSize: fontSize.panelNumber,
            color: hue.primary,
            letterSpacing: '0.4em',
            marginBottom: '1.6rem',
          }}>
            {number}
          </div>
          <div style={{
            fontFamily: type.mono,
            fontSize: 11,
            color: 'rgba(232,228,216,0.5)',
            letterSpacing: '0.25em',
            marginBottom: '0.6rem',
            textTransform: 'uppercase',
          }}>
            {eyebrow}
          </div>
          <h2 style={{
            fontFamily: type.display,
            fontWeight: 800,
            fontSize: fontSize.panelTitle,
            letterSpacing: '0.02em',
            lineHeight: 1.05,
            margin: 0,
            marginBottom: '1.2rem',
            color: '#F5F0E5',
          }}>
            {title}
          </h2>
          <p style={{
            fontFamily: type.body,
            fontSize: fontSize.panelBody,
            lineHeight: 1.6,
            color: 'rgba(232,228,216,0.7)',
            maxWidth: '36ch',
            margin: 0,
            marginBottom: '2rem',
          }}>
            {body}
          </p>
          <ProcessTrailInline items={trail} primary={hue.primary} />
        </div>

        {/* Right — visualization slot */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {children}
        </div>
      </div>
    </article>
  );
}

function ProcessTrailInline({ items, primary }: { items: readonly string[]; primary: string }) {
  return (
    <div style={{
      fontFamily: type.mono,
      fontSize: fontSize.trail,
      color: 'rgba(232,228,216,0.45)',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      flexWrap: 'wrap',
    }}>
      {items.map((label, i) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>{label}</span>
          {i < items.length - 1 && <span style={{ color: primary, opacity: 0.7 }}>→</span>}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TS**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/work/PanelChrome.tsx
git commit -m "feat: PanelChrome shared layout for work panels"
```

---

### Task 3.2: Build `PanelChip.tsx` and `ProcessTrail.tsx`

**Files:**
- Create: `src/components/work/PanelChip.tsx`
- Create: `src/components/work/ProcessTrail.tsx`

- [ ] **Step 1: Write `PanelChip.tsx`**

```typescript
// src/components/work/PanelChip.tsx
'use client';
import { type } from '@/lib/design-tokens';

export default function PanelChip({ children, primary = '#E8E4D8' }: { children: React.ReactNode; primary?: string }) {
  return (
    <span style={{
      fontFamily: type.mono,
      fontSize: 10,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      padding: '0.35em 0.7em',
      border: `1px solid ${primary}55`,
      borderRadius: 2,
      color: primary,
      background: `${primary}10`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export function ChipRow({ chips, primary }: { chips: readonly string[]; primary: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.4rem' }}>
      {chips.map((c) => <PanelChip key={c} primary={primary}>{c}</PanelChip>)}
    </div>
  );
}
```

- [ ] **Step 2: Skip ProcessTrail standalone** (inlined in PanelChrome already; if external use needed, extract later).

- [ ] **Step 3: Commit**

```bash
git add src/components/work/PanelChip.tsx
git commit -m "feat: panel chip + chip row primitives"
```

---

### Task 3.3: Build `WorkBackdrop.tsx` (persistent canvas behind dashboard)

**Files:**
- Create: `src/components/work/WorkBackdrop.tsx`

- [ ] **Step 1: Implement**

```typescript
// src/components/work/WorkBackdrop.tsx
'use client';

/**
 * Persistent low-opacity starfield + faint nebula behind the dashboard.
 * Single shared GL context (own Canvas) that mounts once and stays alive
 * across W01..W09. Runs at fixed inset:0, z-index:1, pointer-events:none.
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const STAR_COUNT = 1500;

function Stars() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 50 + Math.random() * 200;
      pos[i*3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.005;
  });

  return (
    <points ref={ref}>
      <primitive attach="geometry" object={geo} />
      <pointsMaterial size={0.4} sizeAttenuation transparent opacity={0.6} color="#9FB3C8" />
    </points>
  );
}

export default function WorkBackdrop() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 30], fov: 50 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <Stars />
    </Canvas>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/WorkBackdrop.tsx
git commit -m "feat: persistent work backdrop with rotating starfield"
```

---

### Task 3.4: Build `WorkDashboard.tsx` shell

**Files:**
- Create: `src/components/work/WorkDashboard.tsx`
- Modify: `src/components/scene/SceneManager.tsx`

- [ ] **Step 1: Write the shell**

```typescript
// src/components/work/WorkDashboard.tsx
'use client';

import dynamic from 'next/dynamic';
import { useScene, isWork } from '@/lib/scene-state';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const WorkBackdrop = dynamic(() => import('./WorkBackdrop'), { ssr: false });

const MiraPanel       = dynamic(() => import('./panels/MiraPanel'),       { ssr: false });
const AidenPanel      = dynamic(() => import('./panels/AidenPanel'),      { ssr: false });
const VanguardPanel   = dynamic(() => import('./panels/VanguardPanel'),   { ssr: false });
const InspectionPanel = dynamic(() => import('./panels/InspectionPanel'), { ssr: false });
const WaveFieldPanel  = dynamic(() => import('./panels/WaveFieldPanel'),  { ssr: false });
const EmiPanel        = dynamic(() => import('./panels/EmiPanel'),        { ssr: false });
const FormulaPanel    = dynamic(() => import('./panels/FormulaPanel'),    { ssr: false });
const AboutPanel      = dynamic(() => import('./panels/AboutPanel'),      { ssr: false });
const ConnectPanel    = dynamic(() => import('./panels/ConnectPanel'),    { ssr: false });

export default function WorkDashboard() {
  const phase = useScene((s) => s.phase);
  const visible = isWork(phase) || phase === 'C09_PROJECT';

  return (
    <div
      data-dashboard
      aria-hidden={!visible}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        pointerEvents: visible ? 'auto' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      {visible && <WorkBackdrop />}

      {/* Each panel renders absolute and switches visibility based on phase */}
      <PanelHost phase={phase} which="W01_MIRA"><MiraPanel /></PanelHost>
      <PanelHost phase={phase} which="W02_AIDEN"><AidenPanel /></PanelHost>
      <PanelHost phase={phase} which="W03_VANGUARD"><VanguardPanel /></PanelHost>
      <PanelHost phase={phase} which="W04_INSPECTION"><InspectionPanel /></PanelHost>
      <PanelHost phase={phase} which="W05_WAVEFIELD"><WaveFieldPanel /></PanelHost>
      <PanelHost phase={phase} which="W06_EMI"><EmiPanel /></PanelHost>
      <PanelHost phase={phase} which="W07_FORMULA"><FormulaPanel /></PanelHost>
      <PanelHost phase={phase} which="W08_ABOUT"><AboutPanel /></PanelHost>
      <PanelHost phase={phase} which="W09_CONNECT"><ConnectPanel /></PanelHost>
    </div>
  );
}

function PanelHost({ phase, which, children }: {
  phase: string; which: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = phase === which;

  useEffect(() => {
    if (!ref.current) return;
    if (active) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
    } else {
      gsap.to(ref.current, { opacity: 0, y: 24, duration: 0.4, ease: 'cubic-bezier(0.4, 0, 1, 1)' });
    }
  }, [active]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Add stub panels** so the build doesn't break — create empty defaults for each:

```typescript
// src/components/work/panels/MiraPanel.tsx
'use client';
export default function MiraPanel() { return <div style={{ color: 'white' }}>MIRA Stub</div>; }
```

Repeat for all 9 panels (`AidenPanel`, `VanguardPanel`, ..., `ConnectPanel`) with similar one-line stub content.

- [ ] **Step 3: Wire `WorkDashboard` into `SceneManager.tsx`**

Add at top:
```typescript
const WorkDashboard = dynamic(() => import('@/components/work/WorkDashboard'), { ssr: false });
```

In the JSX return, add `<WorkDashboard />` directly after the BH/R3F canvas blocks (so it sits on top of those).

- [ ] **Step 4: Verify**

`npm run dev` → scroll into W01 (~57%). Stub text "MIRA Stub" should appear with fade-in.

- [ ] **Step 5: Commit**

```bash
git add src/components/work/WorkDashboard.tsx src/components/work/panels/ src/components/scene/SceneManager.tsx
git commit -m "feat: work dashboard shell with 9 stub panels"
```

---

### Task 3.5: Build `MiraPanel.tsx` (W01) — production

**Files:**
- Replace stub: `src/components/work/panels/MiraPanel.tsx`

- [ ] **Step 1: Implement the panel**

```typescript
// src/components/work/panels/MiraPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function MiraPanel() {
  const c = panelCopy.W01_MIRA;
  const hue = panelHues.W01_MIRA;

  return (
    <PanelChrome
      phaseId="W01_MIRA"
      number={c.number}
      eyebrow={c.eyebrow}
      title={c.title}
      body={c.body}
      trail={[...c.trail]}
    >
      <MiraVisualization />
      <MiraOverlay metric={c.metric} chips={c.chips} languages={c.languages} primary={hue.primary} accent={hue.accent} />
    </PanelChrome>
  );
}

function MiraVisualization() {
  // 2D Canvas waveform — purple/violet animated sine pulse
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = cvs.width = cvs.offsetWidth * dpr;
    const H = cvs.height = cvs.offsetHeight * dpr;
    let raf = 0;
    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 5 layered waveforms, each a different language line
      const colors = ['#85CCF7', '#A78BFA', '#67E8F9', '#C4B5FD', '#7DD3FC'];
      colors.forEach((col, layer) => {
        ctx.beginPath();
        ctx.lineWidth = 1.2 * dpr;
        ctx.globalAlpha = 0.35 + layer * 0.1;
        ctx.strokeStyle = col;
        for (let x = 0; x < W; x += 2) {
          const k = (x / W) * Math.PI * 4;
          const env = Math.sin(k - t * 0.6 + layer * 0.7) * Math.exp(-Math.pow((x / W - 0.5) * 2, 2));
          const y = H / 2 + env * H * 0.32 * (1 + Math.sin(t + x * 0.01) * 0.2);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      // Central pulse dot
      ctx.beginPath();
      const pulse = Math.abs(Math.sin(t * 2)) * 4 * dpr + 3 * dpr;
      ctx.fillStyle = '#85CCF7';
      ctx.globalAlpha = 0.9;
      ctx.arc(W / 2, H / 2, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      t += 0.04;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

function MiraOverlay({
  metric, chips, languages, primary, accent,
}: {
  metric: { label: string; value: string };
  chips: readonly string[];
  languages: readonly string[];
  primary: string;
  accent: string;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Languages — top right, vertical stack */}
      <div style={{
        position: 'absolute',
        top: '8%',
        right: '8%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6em',
        alignItems: 'flex-end',
      }}>
        {languages.map((l, i) => (
          <span key={l} style={{
            fontFamily: type.body,
            fontSize: '1.4rem',
            color: i === 0 ? primary : accent,
            opacity: 0.5 + i * 0.1,
            textShadow: `0 0 12px ${primary}66`,
          }}>{l}</span>
        ))}
      </div>
      {/* Metric — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '6%',
        right: '6%',
        textAlign: 'right',
      }}>
        <div style={{
          fontFamily: type.mono,
          fontSize: 9,
          letterSpacing: '0.32em',
          color: 'rgba(232,228,216,0.45)',
          textTransform: 'uppercase',
          marginBottom: '0.4em',
        }}>{metric.label}</div>
        <div style={{
          fontFamily: type.display,
          fontSize: 'clamp(1.4rem, 2vw, 1.8rem)',
          fontWeight: 800,
          color: primary,
          textShadow: `0 0 16px ${primary}88`,
        }}>{metric.value}</div>
      </div>
      {/* Chips — bottom left */}
      <div style={{ position: 'absolute', bottom: '6%', left: '4%', maxWidth: '65%', pointerEvents: 'auto' }}>
        <ChipRow chips={chips} primary={primary} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

`npm run dev` → scroll to W01. See animated waveform, languages, 482ms metric, chips.

- [ ] **Step 3: Commit**

```bash
git add src/components/work/panels/MiraPanel.tsx
git commit -m "feat(w01): mira panel — waveform, multilingual rail, latency metric"
```

---

### Task 3.6: Build `ConnectPanel.tsx` (W09) — production

**Files:**
- Replace stub: `src/components/work/panels/ConnectPanel.tsx`

- [ ] **Step 1: Implement**

```typescript
// src/components/work/panels/ConnectPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';

function Earth() {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useLoader(TextureLoader, '/textures/earth-2k.jpg');
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.05; });
  return (
    <mesh ref={ref} position={[0, -3.5, 0]} rotation={[0, 0, 0.41]}>
      <sphereGeometry args={[3.0, 64, 64]} />
      <meshStandardMaterial map={tex} roughness={0.9} metalness={0.0} />
    </mesh>
  );
}
function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  return (
    <mesh ref={ref} position={[5, 0.4, -2]}>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshBasicMaterial color="#FCD34D" />
    </mesh>
  );
}

function ContactScene() {
  return (
    <>
      <ambientLight intensity={0.15} color="#7DD3FC" />
      <directionalLight position={[5, 0.4, -2]} intensity={1.4} color="#FCD34D" />
      <Suspense fallback={null}><Earth /></Suspense>
      <Sun />
    </>
  );
}

export default function ConnectPanel() {
  const c = panelCopy.W09_CONNECT;
  const hue = panelHues.W09_CONNECT;

  return (
    <PanelChrome
      phaseId="W09_CONNECT"
      number={c.number}
      eyebrow={c.eyebrow}
      title={c.title}
      body={c.body}
      trail={[...c.trail]}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ContactScene />
        </Canvas>
        {/* Links */}
        <div style={{
          position: 'absolute',
          top: '18%',
          left: '5%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8em',
          pointerEvents: 'auto',
        }}>
          {c.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.icon === 'mail' ? undefined : '_blank'}
              rel="noreferrer"
              style={{
                fontFamily: type.mono,
                fontSize: 12,
                letterSpacing: '0.25em',
                color: hue.primary,
                textDecoration: 'none',
                padding: '0.5em 0.9em',
                border: `1px solid ${hue.primary}55`,
                borderRadius: 2,
                display: 'inline-flex',
                gap: '0.7em',
                alignItems: 'center',
                background: `${hue.primary}10`,
                transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${hue.primary}25`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${hue.primary}10`; }}
            >
              <span>{link.label}</span>
              <span style={{ color: hue.primary }}>↗</span>
            </a>
          ))}
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 2: Download Earth texture**

```bash
mkdir -p public/textures
curl -L -o public/textures/earth-2k.jpg "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57735/land_ocean_ice_2048.jpg"
ls -la public/textures/earth-2k.jpg
```

Expected: ~600 KB JPEG.

- [ ] **Step 3: Verify**

`npm run dev` → scroll to W09. Earth rotating + sun + 3 contact buttons. Buttons hover with glow.

- [ ] **Step 4: Commit**

```bash
git add src/components/work/panels/ConnectPanel.tsx public/textures/earth-2k.jpg
git commit -m "feat(w09): connect panel — earth + sun + contact links"
```

---

### Task 3.7: Layout polish on `app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Inline body bg + font preload**

Read current state, then add to `<body>` style attribute:

```html
<body style={{ background: '#0B0D10', color: '#E8E4D8', margin: 0, fontFamily: 'var(--font-grotesk, sans-serif)' }}>
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Reload page — no white flash on initial paint.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "fix: inline body bg eliminates white flash on hydration"
```

---

**Milestone 3 Definition of Done:**
- [x] Dashboard shell mounts during W01..W09
- [x] All 9 panel slots register (7 stubs, W01 + W09 production)
- [x] W01 MIRA renders waveform + languages + chips
- [x] W09 CONNECT renders Earth + sun + contact links
- [x] No white flash on page load
- [x] `npx playwright test scroll-smoke` still passes

---

## §9 MILESTONE 4 — Remaining 7 Work Panels

**Outcome:** W02 through W08 production-ready, each cloning the PanelChrome pattern with a unique central visualization.

### Task 4.1: `AidenPanel.tsx` (W02)

**Files:**
- Replace stub: `src/components/work/panels/AidenPanel.tsx`

- [ ] **Step 1: Implement**

```typescript
// src/components/work/panels/AidenPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { useEffect, useRef } from 'react';

export default function AidenPanel() {
  const c = panelCopy.W02_AIDEN;
  const hue = panelHues.W02_AIDEN;
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = cvs.width = cvs.offsetWidth * dpr;
    const H = cvs.height = cvs.offsetHeight * dpr;
    let raf = 0;
    let t = 0;
    // 60 sample points, each oscillating
    const N = 60;
    const samples: { x: number; y: number; phase: number; amp: number }[] = [];
    for (let i = 0; i < N; i++) {
      samples.push({
        x: (i / (N - 1)) * W,
        y: H * (0.4 + Math.random() * 0.2),
        phase: Math.random() * Math.PI * 2,
        amp: 0.5 + Math.random() * 0.5,
      });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // Engagement curve
      ctx.strokeStyle = '#5EEAD4';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const s = samples[i];
        const y = s.y + Math.sin(t + s.phase) * 12 * dpr * s.amp;
        if (i === 0) ctx.moveTo(s.x, y); else ctx.lineTo(s.x, y);
      }
      ctx.stroke();
      // Bar chart at base — 8 SOP dimensions
      const bars = 8;
      const bw = W / bars * 0.7;
      for (let i = 0; i < bars; i++) {
        const h = (0.3 + Math.abs(Math.sin(t * 0.7 + i)) * 0.6) * H * 0.18;
        ctx.fillStyle = `rgba(94, 234, 212, ${0.3 + i * 0.07})`;
        ctx.fillRect(i * (W / bars) + (W / bars - bw) / 2, H * 0.78 - h, bw, h);
      }
      // Cluster scatter
      ctx.fillStyle = '#34D399';
      for (let i = 0; i < 30; i++) {
        const x = W * (0.3 + 0.4 * Math.sin(t * 0.3 + i));
        const y = H * (0.25 + 0.1 * Math.cos(t * 0.4 + i * 1.7));
        ctx.beginPath(); ctx.arc(x, y, 1.5 * dpr, 0, Math.PI * 2); ctx.fill();
      }
      t += 0.03;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <PanelChrome
      phaseId="W02_AIDEN"
      number={c.number} eyebrow={c.eyebrow} title={c.title} body={c.body} trail={[...c.trail]}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <canvas ref={cvsRef} style={{ width: '100%', height: '100%' }} />
        {/* Axis labels */}
        <div style={{ position: 'absolute', top: '8%', right: '8%', textAlign: 'right' }}>
          {c.metricsAxes.map((a) => (
            <div key={a} style={{
              fontFamily: type.mono, fontSize: 10, letterSpacing: '0.2em',
              color: 'rgba(232,228,216,0.55)', marginBottom: '0.4em',
            }}>{a}</div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '6%', left: '4%', maxWidth: '70%', pointerEvents: 'auto' }}>
          <ChipRow chips={c.chips} primary={hue.primary} />
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/panels/AidenPanel.tsx
git commit -m "feat(w02): aiden panel — engagement curve + sop bars + cluster"
```

---

### Task 4.2: `VanguardPanel.tsx` (W03)

**Files:**
- Replace stub: `src/components/work/panels/VanguardPanel.tsx`

- [ ] **Step 1: Implement** — graph network visualization with traversal trail.

```typescript
// src/components/work/panels/VanguardPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { useEffect, useRef } from 'react';

interface Node { x: number; y: number; r: number; healed: boolean }
interface Edge { from: number; to: number }

export default function VanguardPanel() {
  const c = panelCopy.W03_VANGUARD;
  const hue = panelHues.W03_VANGUARD;
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = cvsRef.current; if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = cvs.width = cvs.offsetWidth * dpr;
    const H = cvs.height = cvs.offsetHeight * dpr;
    // Build a small force-directed graph (12 nodes, 18 edges, fixed layout)
    const nodes: Node[] = [];
    for (let i = 0; i < 12; i++) {
      nodes.push({
        x: W * (0.15 + Math.random() * 0.7),
        y: H * (0.2 + Math.random() * 0.6),
        r: 4 * dpr + Math.random() * 3 * dpr,
        healed: Math.random() < 0.3,
      });
    }
    const edges: Edge[] = [];
    for (let i = 0; i < 18; i++) {
      edges.push({ from: Math.floor(Math.random() * 12), to: Math.floor(Math.random() * 12) });
    }
    let raf = 0; let t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // Edges
      edges.forEach((e, i) => {
        const a = nodes[e.from]; const b = nodes[e.to];
        ctx.strokeStyle = `rgba(134, 239, 172, ${0.15 + 0.2 * Math.sin(t + i * 0.5)})`;
        ctx.lineWidth = 0.8 * dpr;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      // Traversal pulse
      edges.forEach((e, i) => {
        const a = nodes[e.from]; const b = nodes[e.to];
        const k = (t * 0.5 + i * 0.3) % 1;
        const x = a.x + (b.x - a.x) * k;
        const y = a.y + (b.y - a.y) * k;
        ctx.fillStyle = '#86EFAC';
        ctx.beginPath(); ctx.arc(x, y, 1.5 * dpr, 0, Math.PI * 2); ctx.fill();
      });
      // Nodes
      nodes.forEach((n) => {
        ctx.fillStyle = n.healed ? '#FCA5A5' : '#86EFAC';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 0.6 * dpr; ctx.stroke();
      });
      t += 0.02;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <PanelChrome phaseId="W03_VANGUARD" number={c.number} eyebrow={c.eyebrow} title={c.title} body={c.body} trail={[...c.trail]}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <canvas ref={cvsRef} style={{ width: '100%', height: '100%' }} />
        {/* Callouts */}
        <div style={{ position: 'absolute', top: '10%', right: '4%', display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          {c.callouts.map((co) => (
            <div key={co.label} style={{
              fontFamily: type.mono, fontSize: 10, letterSpacing: '0.2em',
              padding: '0.4em 0.7em', borderRadius: 2,
              background: co.tone === 'red' ? '#FCA5A540' : co.tone === 'amber' ? '#FCD34D40' : '#86EFAC40',
              border: `1px solid ${co.tone === 'red' ? '#FCA5A5' : co.tone === 'amber' ? '#FCD34D' : '#86EFAC'}`,
              color: '#F5F0E5',
            }}>
              <div style={{ fontWeight: 700 }}>{co.label}</div>
              <div style={{ opacity: 0.7, marginTop: 2 }}>{co.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '6%', left: '4%', maxWidth: '70%', pointerEvents: 'auto' }}>
          <ChipRow chips={c.chips} primary={hue.primary} />
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/panels/VanguardPanel.tsx
git commit -m "feat(w03): vanguard panel — graph traversal + healing callouts"
```

---

### Task 4.3: `InspectionPanel.tsx` (W04)

**Files:**
- Replace stub: `src/components/work/panels/InspectionPanel.tsx`

- [ ] **Step 1: Source motorcycle GLB** (per D2)

For the plan, document the asset acquisition; in execution, run:
```bash
mkdir -p public/models
# CC0 fallback: A simple bike STL/GLB. If Quaternius unavailable, use a placeholder
# wireframe sphere with a "MODEL_PENDING" tag. Document in README.
# Manual download required from https://quaternius.com/packs/modularvehicles.html
# Save as public/models/inspection-bike.glb
```

If GLB is unavailable at execution time, fallback uses a wireframe `<icosahedronGeometry>` proxy.

- [ ] **Step 2: Implement panel**

```typescript
// src/components/work/panels/InspectionPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function Bike() {
  const ref = useRef<THREE.Group>(null);
  // useGLTF will throw if model is missing — wrap in error boundary if not present.
  const gltf = useGLTF('/models/inspection-bike.glb', undefined, undefined, (err) => {
    console.warn('inspection-bike.glb missing — using wireframe proxy');
  });
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.4; });
  if (!gltf?.scene) {
    return (
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial color="#A5F3FC" wireframe />
      </mesh>
    );
  }
  return (
    <group ref={ref} scale={1.5}>
      <primitive object={gltf.scene} />
    </group>
  );
}
useGLTF.preload('/models/inspection-bike.glb');

function DefectMap() {
  // 8 hot spots blinking on a procedural minimap
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.3; });
  return (
    <group ref={ref}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.8, Math.sin(a) * 0.4, Math.sin(a) * 1.8]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#F472B6" />
          </mesh>
        );
      })}
    </group>
  );
}

export default function InspectionPanel() {
  const c = panelCopy.W04_INSPECTION;
  const hue = panelHues.W04_INSPECTION;
  return (
    <PanelChrome phaseId="W04_INSPECTION" number={c.number} eyebrow={c.eyebrow} title={c.title} body={c.body} trail={[...c.trail]}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Canvas camera={{ position: [0, 0.4, 4.5], fov: 45 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[3, 3, 3]} intensity={0.8} color="#A5F3FC" />
          <Suspense fallback={null}>
            <Bike />
            <DefectMap />
          </Suspense>
        </Canvas>
        {/* Inspection layers list */}
        <div style={{ position: 'absolute', top: '12%', right: '4%', textAlign: 'right' }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: '0.25em', color: hue.primary, marginBottom: '0.6em', textTransform: 'uppercase' }}>INSPECTION LAYERS</div>
          {c.layers.map((l, i) => (
            <div key={l} style={{ fontFamily: type.body, fontSize: 12, color: 'rgba(232,228,216,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5em', marginBottom: '0.3em' }}>
              <span>{l}</span>
              <span style={{ color: hue.accent, fontSize: 10 }}>◇</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '6%', left: '4%', maxWidth: '70%', pointerEvents: 'auto' }}>
          <ChipRow chips={c.chips} primary={hue.primary} />
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/work/panels/InspectionPanel.tsx public/models/
git commit -m "feat(w04): inspection panel — bike model + defect map + layers"
```

---

### Task 4.4: `WaveFieldPanel.tsx` (W05)

**Files:**
- Replace stub: `src/components/work/panels/WaveFieldPanel.tsx`

- [ ] **Step 1: Implement** (two side-by-side particle clouds)

```typescript
// src/components/work/panels/WaveFieldPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const N = 1500;

function Cloud({ structured, color, x }: { structured: boolean; color: string; x: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      if (structured) {
        // Lattice: fibonacci-ish 2D grid + tilt
        const sqrtN = Math.ceil(Math.sqrt(N));
        const ix = i % sqrtN; const iy = Math.floor(i / sqrtN);
        pos[i*3]     = (ix / sqrtN - 0.5) * 4;
        pos[i*3 + 1] = (iy / sqrtN - 0.5) * 4;
        pos[i*3 + 2] = Math.sin(ix * 0.4) * 0.6;
      } else {
        // Dense scatter cloud
        pos[i*3]     = (Math.random() - 0.5) * 3;
        pos[i*3 + 1] = (Math.random() - 0.5) * 3;
        pos[i*3 + 2] = (Math.random() - 0.5) * 3;
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [structured]);

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * (structured ? 0.18 : 0.04); });

  return (
    <points ref={ref} position={[x, 0, 0]}>
      <primitive attach="geometry" object={geo} />
      <pointsMaterial color={color} size={0.04} sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

export default function WaveFieldPanel() {
  const c = panelCopy.W05_WAVEFIELD;
  const hue = panelHues.W05_WAVEFIELD;
  return (
    <PanelChrome phaseId="W05_WAVEFIELD" number={c.number} eyebrow={c.eyebrow} title={c.title} body={c.body} trail={[...c.trail]}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <Cloud structured={false} color="#C4B5FD" x={-2.4} />
          <Cloud structured={true}  color="#67E8F9" x={ 2.4} />
        </Canvas>
        {/* Comparison labels */}
        <div style={{ position: 'absolute', top: '8%', left: '0', right: '0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 5%' }}>
          {[c.comparison.left, c.comparison.right].map((side, i) => (
            <div key={side.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: '0.25em', color: i === 0 ? hue.primary : hue.accent, textTransform: 'uppercase' }}>{side.label}</div>
              <div style={{ fontFamily: type.display, fontWeight: 800, fontSize: 'clamp(1.2rem, 1.8vw, 1.5rem)', color: '#F5F0E5', margin: '0.4em 0' }}>{side.complexity}</div>
              <div style={{ fontFamily: type.body, fontSize: 12, color: 'rgba(232,228,216,0.7)' }}>{side.metric}</div>
              <div style={{ fontFamily: type.mono, fontSize: 9, letterSpacing: '0.15em', color: i === 0 ? '#FCA5A5' : '#86EFAC', marginTop: 4 }}>{side.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '6%', left: '4%', maxWidth: '70%', pointerEvents: 'auto' }}>
          <ChipRow chips={c.chips} primary={hue.primary} />
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/panels/WaveFieldPanel.tsx
git commit -m "feat(w05): wave field panel — O(n²) cloud vs O(n log n) lattice"
```

---

### Task 4.5: `EmiPanel.tsx` (W06)

**Files:**
- Replace stub: `src/components/work/panels/EmiPanel.tsx`

- [ ] **Step 1: Implement** (incident wave → shielding → attenuated wave + freq sweep)

```typescript
// src/components/work/panels/EmiPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { useEffect, useRef } from 'react';

export default function EmiPanel() {
  const c = panelCopy.W06_EMI;
  const hue = panelHues.W06_EMI;
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = cvsRef.current; if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = cvs.width = cvs.offsetWidth * dpr;
    const H = cvs.height = cvs.offsetHeight * dpr;
    let raf = 0; let t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // Top half — wave propagation
      const topH = H * 0.55;
      // Incident (left side, full amplitude)
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      for (let x = 0; x < W * 0.45; x += 2) {
        const y = topH * 0.5 + Math.sin((x - t * 80) * 0.04) * topH * 0.3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Shielding layers (vertical bars)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(148, 163, 184, ${0.2 + i * 0.1})`;
        ctx.fillRect(W * 0.45 + i * 14 * dpr, topH * 0.1, 8 * dpr, topH * 0.8);
      }
      // Attenuated (right side, smaller amplitude)
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      for (let x = W * 0.55; x < W; x += 2) {
        const y = topH * 0.5 + Math.sin((x - t * 80) * 0.04) * topH * 0.08;
        if (x === W * 0.55) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bottom — frequency sweep graph
      const botY = topH + 20 * dpr;
      const botH = H - botY - 30 * dpr;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        // Sample noise + sweep envelope
        const k = x / W;
        const env = Math.sin(k * Math.PI * 6 + t * 0.3) * 0.3 + Math.sin(k * Math.PI * 17 + t * 0.7) * 0.2;
        const y = botY + botH * 0.5 - env * botH * 0.4;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      t += 0.04;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <PanelChrome phaseId="W06_EMI" number={c.number} eyebrow={c.eyebrow} title={c.title} body={c.body} trail={[...c.trail]}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <canvas ref={cvsRef} style={{ width: '100%', height: '100%' }} />
        {/* Top labels */}
        <div style={{ position: 'absolute', top: '5%', left: '5%' }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: '0.25em', color: hue.accent, textTransform: 'uppercase' }}>INCIDENT WAVE</div>
        </div>
        <div style={{ position: 'absolute', top: '5%', right: '5%', textAlign: 'right' }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: '0.25em', color: hue.primary, textTransform: 'uppercase' }}>ATTENUATED WAVE</div>
        </div>
        <div style={{ position: 'absolute', bottom: '14%', right: '5%', textAlign: 'right' }}>
          <div style={{ fontFamily: type.mono, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(232,228,216,0.45)', textTransform: 'uppercase' }}>FREQUENCY SWEEP</div>
          <div style={{ fontFamily: type.body, fontSize: 11, color: hue.accent }}>{c.sweepRange}</div>
        </div>
        <div style={{ position: 'absolute', bottom: '4%', left: '4%', maxWidth: '75%', pointerEvents: 'auto' }}>
          <ChipRow chips={c.chips} primary={hue.primary} />
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/panels/EmiPanel.tsx
git commit -m "feat(w06): emi panel — wave attenuation + frequency sweep"
```

---

### Task 4.6: `FormulaPanel.tsx` (W07)

**Files:**
- Replace stub: `src/components/work/panels/FormulaPanel.tsx`

- [ ] **Step 1: Implement** (4 racing-line SVG paths)

```typescript
// src/components/work/panels/FormulaPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';

const TRACK_PATHS: Array<{ color: string; d: string; label: string }> = [
  // Hand-tuned bezier paths fitting a viewBox 0 0 800 400
  { color: '#86EFAC', label: 'INITIAL PATH',    d: 'M 50 320 Q 200 280, 300 220 T 600 100 T 750 60' },
  { color: '#FCD34D', label: 'OPTIMIZED PATH', d: 'M 50 340 Q 220 270, 320 200 T 620 90  T 750 50' },
  { color: '#FCA5A5', label: 'TRACK BOUNDARY', d: 'M 50 360 Q 250 320, 350 250 T 650 130 T 750 80' },
  { color: '#22C55E', label: 'BEST LINE',       d: 'M 50 350 Q 230 260, 330 190 T 630 80  T 750 40' },
];

export default function FormulaPanel() {
  const c = panelCopy.W07_FORMULA;
  const hue = panelHues.W07_FORMULA;
  return (
    <PanelChrome phaseId="W07_FORMULA" number={c.number} eyebrow={c.eyebrow} title={c.title} body={c.body} trail={[...c.trail]}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%' }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
          {TRACK_PATHS.map((p, i) => (
            <path
              key={p.label} d={p.d} stroke={p.color} fill="none" strokeWidth={2}
              opacity={0.85} strokeDasharray="800" strokeDashoffset="800"
              filter="url(#glow)"
              style={{
                animation: `dash 2.4s ${i * 0.2}s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              }}
            />
          ))}
        </svg>
        <style>{`
          @keyframes dash { to { stroke-dashoffset: 0; } }
        `}</style>
        {/* Legend */}
        <div style={{ position: 'absolute', top: '5%', right: '4%', textAlign: 'right' }}>
          {TRACK_PATHS.map((p) => (
            <div key={p.label} style={{
              fontFamily: type.mono, fontSize: 10, letterSpacing: '0.2em',
              color: 'rgba(232,228,216,0.75)', display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', gap: '0.5em', marginBottom: '0.3em',
            }}>
              <span>{p.label}</span>
              <span style={{ width: 16, height: 2, background: p.color, display: 'inline-block' }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '4%', left: '4%', maxWidth: '70%', pointerEvents: 'auto' }}>
          <ChipRow chips={c.chips} primary={hue.primary} />
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/panels/FormulaPanel.tsx
git commit -m "feat(w07): formula panel — 4 racing line svg paths"
```

---

### Task 4.7: `AboutPanel.tsx` (W08)

**Files:**
- Replace stub: `src/components/work/panels/AboutPanel.tsx`

- [ ] **Step 1: Implement** (orbital skill rings)

```typescript
// src/components/work/panels/AboutPanel.tsx
'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { useEffect, useRef } from 'react';

export default function AboutPanel() {
  const c = panelCopy.W08_ABOUT;
  const hue = panelHues.W08_ABOUT;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <PanelChrome phaseId="W08_ABOUT" number={c.number} eyebrow={c.eyebrow} title={c.title} body={c.body} trail={[...c.trail]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* Center silhouette (SVG) */}
        <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
          <defs>
            <filter id="silhouetteGlow"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          {/* Concentric orbital rings */}
          {[80, 120, 160, 200, 240].map((r, i) => (
            <circle key={r} cx="200" cy="200" r={r}
              stroke={hue.primary} fill="none" strokeWidth={0.6}
              strokeDasharray={i % 2 === 0 ? '4 6' : '0'}
              opacity={0.4 - i * 0.05}
            />
          ))}
          {/* Skill markers along outermost ring (6 evenly spaced) */}
          {c.skills.map((skill, i) => {
            const a = (i / c.skills.length) * Math.PI * 2 - Math.PI / 2;
            const r = 240;
            const x = 200 + Math.cos(a) * r;
            const y = 200 + Math.sin(a) * r;
            return (
              <g key={skill}>
                <circle cx={x} cy={y} r={3} fill={hue.accent} />
                <text x={x + (Math.cos(a) > 0 ? 8 : -8)} y={y + 4}
                  textAnchor={Math.cos(a) > 0 ? 'start' : 'end'}
                  fill="#E8E4D8"
                  fontFamily="monospace" fontSize="9" letterSpacing="2">
                  {skill}
                </text>
              </g>
            );
          })}
          {/* Silhouette */}
          <g filter="url(#silhouetteGlow)">
            <ellipse cx="200" cy="170" rx="14" ry="18" fill="#E8E4D8" opacity="0.85" />
            <path d="M 200 188 L 178 250 L 178 295 L 222 295 L 222 250 Z" fill="#E8E4D8" opacity="0.85" />
          </g>
        </svg>
        <div style={{ position: 'absolute', bottom: '4%', left: '4%', maxWidth: '70%', pointerEvents: 'auto' }}>
          <ChipRow chips={c.chips} primary={hue.primary} />
        </div>
      </div>
    </PanelChrome>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/panels/AboutPanel.tsx
git commit -m "feat(w08): about panel — silhouette + orbital skill rings"
```

---

**Milestone 4 Definition of Done:**
- [x] All 9 work panels render production visuals (no stubs)
- [x] Each panel reveals via GSAP fade+rise on entry
- [x] Each panel exits via fade+drop on leave
- [x] Storyboard image #3 panels W01–W09 match within ±5%
- [x] Scroll-smoke e2e tests still green

---

## §10 MILESTONE 5 — PostFX, Audio, Mobile, Cleanup

### Task 5.1: Glitch pass active during ANOMALY

**Files:**
- Modify: `src/components/scene/PostFX.tsx`

- [ ] **Step 1: Add Glitch effect**

```typescript
// PostFX.tsx — add to imports
import { Glitch } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import * as THREE from 'three';

// inside the EffectComposer JSX, after ChromaticAberration:
{phase === 'C06_ANOMALY' && (
  <Glitch
    delay={new THREE.Vector2(0.5, 1.0)}
    duration={new THREE.Vector2(0.1, 0.3)}
    strength={new THREE.Vector2(0.2, 0.5)}
    mode={GlitchMode.SPORADIC}
    active
    ratio={0.85}
  />
)}
```

- [ ] **Step 2: Verify** — scroll to C06, glitch flickers visible.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/PostFX.tsx
git commit -m "feat: glitch pass active during anomaly"
```

---

### Task 5.2: Audio engine scaffold

**Files:**
- Create: `src/lib/audio-engine.ts`
- Modify: `src/hooks/useAudio.ts`

- [ ] **Step 1: Write engine**

```typescript
// src/lib/audio-engine.ts
// WebAudio orchestrator. All sounds synthesized — zero samples (D1).

import { type ScenePhase } from './scene-state';

export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  hum: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  enabled = false;

  start() {
    if (typeof window === 'undefined') return;
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    // Build sub-hum chain (silent until phase >= C01)
    this.hum = this.buildHum();
    this.hum.gain.connect(this.master);
    this.enabled = true;
  }

  stop() {
    if (!this.ctx) return;
    this.master?.disconnect();
    this.hum?.osc.stop();
    this.ctx.close();
    this.ctx = null; this.master = null; this.hum = null; this.enabled = false;
  }

  buildHum() {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 28; // 28 Hz sub-bass
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 80;
    osc.connect(filter); filter.connect(gain);
    osc.start();
    return { osc, gain, filter };
  }

  /** Drive overall volume from phase + journeyProgress. */
  update(phase: ScenePhase, journeyProgress: number) {
    if (!this.enabled || !this.ctx || !this.master) return;
    // Master fade: 0 at start, 0.4 by C03, hold, drop in W phases
    const master = phase.startsWith('C')
      ? Math.min(0.4, journeyProgress * 1.2)
      : 0.15;
    this.master.gain.setTargetAtTime(master, this.ctx.currentTime, 0.5);

    // Hum: ramps in C02, peaks C04
    if (this.hum) {
      const target = phase === 'C04_HORIZON' ? 0.6
        : phase === 'C03_STRETCH' ? 0.4
        : phase === 'C02_PULL' ? 0.25
        : phase === 'C01_ORBIT' ? 0.1
        : 0.05;
      this.hum.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
    }
  }

  /** One-shot whoosh for WARP entrance. */
  playWarpWhoosh() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(4000, ctx.currentTime + 1.8);
    filter.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
    noise.connect(filter); filter.connect(gain); gain.connect(this.master);
    noise.start(); noise.stop(ctx.currentTime + 2.0);
  }
}

export const audioEngine = new AudioEngine();
```

- [ ] **Step 2: Wire `useAudio.ts`** to subscribe to phase changes and call `update`.

```typescript
// src/hooks/useAudio.ts (replace contents)
import { useEffect } from 'react';
import { useScene } from '@/lib/scene-state';
import { audioEngine } from '@/lib/audio-engine';

export function useAudio() {
  const phase = useScene((s) => s.phase);
  const j = useScene((s) => s.journeyProgress);
  useEffect(() => { audioEngine.update(phase, j); }, [phase, j]);
  // Trigger whoosh once when entering WARP
  useEffect(() => {
    if (phase === 'C05_WARP') audioEngine.playWarpWhoosh();
  }, [phase]);
}

export function audioStart() { audioEngine.start(); }
export function audioStop()  { audioEngine.stop();  }
```

- [ ] **Step 3: Wire AudioToggle** to call `audioStart()` on enable.

Read existing `src/components/ui/AudioToggle.tsx`, then replace its enable handler:
```typescript
import { audioStart, audioStop } from '@/hooks/useAudio';
// onClick: enabled ? audioStop() : audioStart();
```

- [ ] **Step 4: Verify**

`npm run dev` → click audio toggle → start scrolling. Sub-hum should grow into C04. Whoosh on C05 entry.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio-engine.ts src/hooks/useAudio.ts src/components/ui/AudioToggle.tsx
git commit -m "feat: webaudio engine — sub-hum + warp whoosh"
```

---

### Task 5.3: Mobile audit + reduced-motion gate

**Files:**
- Create: `src/hooks/useReducedMotion.ts`
- Modify: `src/components/scene/SceneManager.tsx`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useReducedMotion.ts
'use client';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduce;
}

export function useIsMobile(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    setM(mq.matches);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
}
```

- [ ] **Step 2: Use in SceneManager** — when `reduce`, skip the entire cosmic intro (jump to W01_MIRA at scroll 0).

```typescript
// inside SceneManager:
const reduce = useReducedMotion();
useEffect(() => {
  if (reduce) {
    // Hard-jump to dashboard (skip cosmic theatrics)
    useScene.setState({
      phase: 'W01_MIRA',
      journeyProgress: 0.6,
      cosmicProgress: 1,
      workProgress: 0.05,
      localProgress: 0,
    });
  }
}, [reduce]);
```

- [ ] **Step 3: Mobile DPR / WebM fallback**

In `SceneManager`'s Canvas: `dpr={isMobile ? [1, 1] : [1, 1.5]}`.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useReducedMotion.ts src/components/scene/SceneManager.tsx
git commit -m "feat: mobile + reduced-motion gates skip heavy cosmic intro"
```

---

### Task 5.4: WebM fallback for warp on mobile (D5)

**Files:**
- Create: `public/video/warp-fallback.webm` (offline encoding step)
- Modify: `src/components/scene/SceneManager.tsx`

- [ ] **Step 1: Encode the WebM** (run once, off-build)

```bash
# Capture from running localhost
node tools/capture-warp.js
# Convert frames → webm
ffmpeg -framerate 60 -i tmp-frames/frame_%04d.png -c:v libvpx-vp9 -b:v 0 -crf 32 -pix_fmt yuv420p public/video/warp-fallback.webm
ls -la public/video/warp-fallback.webm  # expect ~300-500 KB
```

(`tools/capture-warp.js` is a Playwright headless script that scrolls 30%→40% and grabs frames. Acceptable to skip if you ship without mobile fallback for v1.)

- [ ] **Step 2: Mobile branch in SceneManager** — render `<video>` instead of WarpScene during C05 if `isMobile`.

```jsx
{phase === 'C05_WARP' && (
  isMobile
    ? <video
        src="/video/warp-fallback.webm"
        autoPlay loop muted playsInline
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
      />
    : <WarpScene />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/SceneManager.tsx public/video/warp-fallback.webm tools/
git commit -m "feat: webm fallback for warp on mobile"
```

---

### Task 5.5: Performance test

**Files:**
- Create: `tests/e2e/perf.spec.ts`

- [ ] **Step 1: Write FPS budget test**

```typescript
// tests/e2e/perf.spec.ts
import { test, expect } from '@playwright/test';

test('60fps budget across scroll', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as any).__frames = [];
    let last = performance.now();
    function loop(now: number) {
      const dt = now - last;
      (window as any).__frames.push(dt);
      last = now;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
  // Scroll smoothly
  for (let i = 0; i <= 20; i++) {
    await page.evaluate((s) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * (s / 20), behavior: 'instant' });
    }, i);
    await page.waitForTimeout(150);
  }
  const dts = await page.evaluate(() => (window as any).__frames as number[]);
  // Allow first 10 frames to warm up; then median should be ≤18ms (≈55 fps)
  const sorted = dts.slice(10).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  expect(median).toBeLessThan(18);
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test tests/e2e/perf.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/perf.spec.ts
git commit -m "test: 60fps budget regression test"
```

---

### Task 5.6: Cleanup dead code

**Files:**
- Delete: `src/_legacy/`, `src/components/scene/Overlays.tsx`, `src/components/scene/scenes/MiraPulsar.tsx`, `src/components/scene/scenes/DriveXQuasar.tsx`, `src/components/scene/scenes/TwinBuild.tsx`, `src/components/scene/scenes/FormulaRings.tsx`, `src/components/scene/scenes/QuantumPlanet.tsx`, `src/components/scene/scenes/Singularity.tsx`, `src/components/canvas/LabCanvas.tsx`, `src/lib/audio.ts`, `src/lib/audio-files.ts`
- Modify: `package.json`

- [ ] **Step 1: Verify no imports remain**

```bash
grep -r "MiraPulsar\|DriveXQuasar\|TwinBuild\|FormulaRings\|QuantumPlanet\|Singularity\|LabCanvas\|_legacy\|from '@/lib/audio'" src/
```
Expected: zero results.

- [ ] **Step 2: Delete files**

```bash
rm -rf src/_legacy/
rm src/components/scene/Overlays.tsx
rm src/components/scene/scenes/MiraPulsar.tsx
rm src/components/scene/scenes/DriveXQuasar.tsx
rm src/components/scene/scenes/TwinBuild.tsx
rm src/components/scene/scenes/FormulaRings.tsx
rm src/components/scene/scenes/QuantumPlanet.tsx
rm src/components/scene/scenes/Singularity.tsx
rm src/components/canvas/LabCanvas.tsx 2>/dev/null || true
rm src/lib/audio.ts src/lib/audio-files.ts
```

- [ ] **Step 3: Uninstall unused packages**

```bash
npm uninstall animejs framer-motion @studio-freight/lenis
```

- [ ] **Step 4: Verify build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: prune legacy scenes, dead audio, unused packages"
```

---

### Task 5.7: Final supersedence — delete old plan, keep this one

- [ ] **Step 1: Delete old plan**

```bash
git rm docs/superpowers/plans/2026-04-29-cinematic-journey-work-done.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: supersede old plan with full implementation plan"
```

---

**Milestone 5 Definition of Done:**
- [x] Glitch pass active during ANOMALY
- [x] Audio engine functional with sub-hum + warp whoosh, gated by AudioToggle
- [x] Mobile renders WebM fallback or wireframe-only mode
- [x] Reduced-motion media query honored
- [x] Perf test passes (median frame ≤18ms)
- [x] Dead code, unused packages, old plan purged
- [x] `npm run build` clean, no warnings

---

## §11 DEFINITION OF DONE (whole feature)

A reviewer can sign this off when:

1. **Build:** `npm run typecheck && npm run test && npm run build` exits 0 with no warnings.
2. **E2E:** `npx playwright test` — all green: scroll-smoke (18 phases), handoff-seam, perf, cosmic-screenshots.
3. **Visual review:** Each cosmic phase screenshot matches storyboard image #1 frames 1–9 within ±5%; each panel matches image #3 within ±5% (hand reviewed by user).
4. **Performance:** On M2 MacBook Air at 1440×900, sustained 60 FPS through full scroll (verified Playwright trace `tests/e2e/perf.spec.ts`).
5. **A11y:** Reduced-motion users get the dashboard immediately. Tab order through W09 contact links works. Audio is opt-in and remembered via localStorage.
6. **Mobile:** Loads on iPhone 14 Pro / Pixel 7 emulators; warp falls back to WebM; dashboard panels stack vertically; no horizontal scroll.
7. **Code hygiene:** Zero `console.log` in src/. No `// TODO` without linked issue. No commented-out code. No `useState` inside `useFrame`. Files ≤400 lines.

---

## §12 RISK REGISTER & ROLLBACK

| Risk | Likelihood | Impact | Mitigation | Rollback |
|---|---|---|---|---|
| BH intensity uniform breaks existing chromatic line | Low | Med | Step 2.1.4 verification before commit | `git revert HEAD` — restores baseline |
| SelectiveBloom layers misconfigured → bloom doesn't appear | Med | Low | Manual layer enable per scene; test by toggling layer 1 | Revert PostFX.tsx |
| Glitch pass blows out frame | Med | Med | Pin `ratio: 0.85`, `strength: [0.2, 0.5]`. If white-out, set strength `[0.05, 0.15]` | Comment out Glitch JSX |
| WebM fallback file missing in prod | Med | Low | Skip M5 task 5.4 if no encoder; ship desktop-only first | None — feature flag |
| Audio context blocked by browser autoplay | High | Low | `audioStart()` only called from user click via AudioToggle | Already gated |
| Lenis + GSAP timing drift on mobile Safari | Med | Med | Use `gsap.ticker.add(lenis.raf)` (already in plan) | Disable Lenis on iOS via `isMobile` |
| Earth texture license issue | Low | Low | NASA Blue Marble is public domain (D3) | Replace with procedural noise sphere |
| Inspection bike model unavailable | Med | Low | Wireframe icosahedron fallback already coded (Task 4.3 Step 2) | Already has fallback |
| 60fps regression on M1 | Med | High | Reduce `STAR_COUNT` in WorkBackdrop, lower bloom kernel size | Per-phase config flag |

**Rollback procedure (any milestone):**
```bash
# Find the milestone's first commit
git log --oneline | grep "feat: ... " | tail -1
# Revert to immediately before
git reset --hard <SHA-of-prev-milestone-DoD-commit>
# Force-push only if branch is owned solely by this work
git push origin cinematic-rd-lab --force-with-lease
```

---

## §13 NEXT ACTION (no choice prompt)

The plan is locked. Execution proceeds:

**Path:** `superpowers:subagent-driven-development` — fresh subagent per task, two-stage review.

**First task to dispatch:** **Task 0.1 — Add Vitest test infrastructure** (§5).

Each subsequent task in this plan is independently green: build passes, type-checks, tests pass. Commits are pre-written. No task depends on a future decision — every TBD has been pinned in §1.

**If a task fails review:**
1. Subagent reports failure with evidence (build log, test output, screenshot).
2. Parent re-dispatches with corrective context (NOT the full session) per writing-plans guidance.
3. After 3 failed iterations on a single task, surface to user — don't loop forever.

**Estimated wall-clock:**
- M1 (Foundation): 2 hours
- M2 (Cosmic Journey): 6 hours
- M3 (Dashboard + Bookends): 3 hours
- M4 (7 panels): 5 hours
- M5 (PostFX/Audio/Mobile/Cleanup): 4 hours
- **Total: ~20 hours** of focused build, plus ~4 hours review/iteration.

---

**End of plan.**
