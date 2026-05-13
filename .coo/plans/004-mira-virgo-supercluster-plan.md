# MIRA Virgo Supercluster — Implementation Plan

> **For agentic workers:** Use the `subagent-driven-development` pattern — dispatch a fresh specialist per task, review between tasks. Steps are bite-sized (2–5 min each). Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `.coo/jobs/004-mira-virgo-supercluster.md` (11 ACs, reviewer-approved iter 2).

**Goal:** Replace the pulsing-plasma-sphere + Aizawa-attractor MIRA scene with a 5-knot Virgo Supercluster: diffuse blue gas cloud, five red galaxy-cluster knots (one per language EN/HI/TA/KN/TE), curling particle plumes that emit from the active knot and reincorporate to accrete density.

**Architecture:** Three R3F sub-components composed inside `MiraScene`. State + cycle controller lives in a zustand slice (`mira-state.ts`). Visual quality measured against the BBC/Planck Shapley reference image — every visual task ends with a side-by-side screenshot comparison. GPGPU plume reuses the ping-pong FBO pattern already proven in the deleted `MiraAttractor.tsx`. Mobile fallback profile auto-engages below 768px.

**Tech Stack:** React 19, Next.js 15 (App Router), TypeScript strict, React Three Fiber, three.js, GLSL, zustand, vitest (unit), Playwright (e2e + visual), @react-three/test-renderer.

**Quality bar (non-negotiable):** Every visual task includes a `visual-verifier` checkpoint that compares the rendered output to the reference image in `.coo/jobs/004/refs/`. A task is not complete until the render reads as photographic, not as debug primitives. Specifically: no plain spheres without shader glow, no flat-shaded particles, no missing bloom, no posterised colour bands.

---

## File structure

**Create:**
- `src/lib/mira-state.ts` — zustand slice: `KNOT_TABLE`, active language, densities, cycle controller, quality profile, debug surface.
- `src/components/scene/scenes/MiraSupercluster.tsx` — diffuse blue gas point cloud (~30k high / 8k low).
- `src/components/scene/scenes/MiraKnots.tsx` — 5 fixed-position cluster cores (sphere + halo billboard, X-ray glow shader).
- `src/components/scene/scenes/MiraPlume.tsx` — GPGPU plume (ping-pong FBO, curl-noise out/in trajectory).
- `tests/unit/mira-state.test.ts` — unit tests for the state slice.
- `tests/e2e/mira-cycle.spec.ts` — language cycle assertion.
- `tests/e2e/mira-growth.spec.ts` — density accretion assertion.
- `tests/e2e/mira-reduced-motion.spec.ts` — reduced-motion freeze assertion.

**Rewrite:**
- `src/components/scene/scenes/MiraScene.tsx` — compose Supercluster + Knots + Plume, preserve the existing 4-phase reveal envelope verbatim.
- `src/components/work/panels/MiraPanel.tsx` — DOM overlay: sync language labels with `activeLang`, replace static `RESPONSE TIME 482ms` with `LIVE · <LANG> · 482ms` + `TRAINING SIGNAL · +2.0% / call` sub-line.

**Modify:**
- `src/lib/copy.ts` — replace `'বাংলা'` with `'ENGLISH'` in `panelCopy.W01_MIRA.languages`; reorder to match the cycle order; update the body string.

**Delete:**
- `src/components/scene/scenes/MiraPlasma.tsx`
- `src/components/scene/scenes/MiraAttractor.tsx`

---

## Reference loading (do this once before Task 1)

- [ ] **Read the spec** in full: `.coo/jobs/004-mira-virgo-supercluster.md`. Internalise the 11 ACs and the 5 Decisions.
- [ ] **Read the standards:** `.coo/standards.md`. The hard limits (files ≤ 400 lines, functions ≤ 40 lines, `any` requires a `// reason:` comment) are enforced by `code-reviewer` at PR time.
- [ ] **Read the reduced-motion contract:** `src/lib/motion/contract.md`. AC9 must comply.
- [ ] **Read the existing reveal envelope** at `src/components/scene/scenes/MiraScene.tsx:30-39` — reproduce verbatim in the rewrite.
- [ ] **Inspect the to-be-deleted `MiraAttractor.tsx`** for the ping-pong FBO pattern, the state-save/restore around `renderer.render()`, and the `__miraDebug` exposure approach. The plume in Task 9 reuses this pattern.
- [ ] **Open the reference image** at `.coo/jobs/004/refs/shapley.png` (deposited by `deep-researcher` in Task 0). Pin it next to the dev browser for every visual task.

---

## Task 0 — Reference research (dispatch deep-researcher)

**Files:**
- Create: `.coo/jobs/004/refs/research.md`
- Create: `.coo/jobs/004/refs/shapley.png` + 3–6 other reference images
- Create: `.coo/jobs/004/refs/cosmic-web-shadertoys.md` (URL list + license notes)

This task is a **dispatch**, not direct work. Brief in spec Plan step 1. The 3d-graphics-engineer does not start Task 1 until this deliverable lands.

- [ ] **Step 1 — Dispatch `deep-researcher`** with the brief in `.coo/jobs/004-mira-virgo-supercluster.md` Plan step 1.
- [ ] **Step 2 — Wait for the memo** at `.coo/jobs/004/refs/research.md`. Verify it contains: visual reference grid, evaluation of `angeluriot/Galaxy_simulation` (with the honest verdict on what's portable), 2–3 web-native cosmic-web references with licenses.
- [ ] **Step 3 — Commit the refs:**
```bash
git add .coo/jobs/004/refs/
git commit -m "docs(job-004): add Shapley + cosmic-web visual references"
```

---

## Task 1 — Fix the language array in copy.ts

**Files:**
- Modify: `src/lib/copy.ts:5-14` (the `W01_MIRA` entry)
- Create: `tests/unit/copy-mira.test.ts`

- [ ] **Step 1 — Write the failing test** at `tests/unit/copy-mira.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { panelCopy } from '@/lib/copy';

describe('panelCopy.W01_MIRA', () => {
  it('lists the 5 product-supported languages in cycle order', () => {
    expect(panelCopy.W01_MIRA.languages).toEqual([
      'ENGLISH', 'हिंदी', 'தமிழ்', 'ಕನ್ನಡ', 'తెలుగు',
    ]);
  });

  it('describes the language coverage accurately in the body', () => {
    expect(panelCopy.W01_MIRA.body).toMatch(/English and 4 South Indian/);
  });
});
```

- [ ] **Step 2 — Run it, confirm failure:** `npm run test -- tests/unit/copy-mira.test.ts`. Expect: 2 failed assertions (Bangla in array, old body string).

- [ ] **Step 3 — Apply the fix** to `src/lib/copy.ts:9` (body) and `:13` (languages):
```ts
body: 'Real-time voice AI agent that listens, understands and responds in 5 languages — English and 4 South Indian regional languages — at sub-100ms latency.',
// ...
languages: ['ENGLISH', 'हिंदी', 'தமிழ்', 'ಕನ್ನಡ', 'తెలుగు'],
```

- [ ] **Step 4 — Run tests, confirm green:** `npm run test -- tests/unit/copy-mira.test.ts`. Expect: 2 passed.

- [ ] **Step 5 — Commit:**
```bash
git add src/lib/copy.ts tests/unit/copy-mira.test.ts
git commit -m "fix(copy): correct MIRA language set to EN+HI+TA+KN+TE"
```

---

## Task 2 — Create `mira-state.ts` with KNOT_TABLE constant

**Files:**
- Create: `src/lib/mira-state.ts`
- Create: `tests/unit/mira-state.test.ts`

This task creates the typed `KNOT_TABLE` and the zustand slice scaffold. The cycle controller, density logic, and debug surface come in Tasks 3–5.

- [ ] **Step 1 — Write the failing test:**
```ts
import { describe, it, expect } from 'vitest';
import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';

describe('KNOT_TABLE', () => {
  it('contains exactly 5 entries in EN→HI→TA→KN→TE order', () => {
    const langs: MiraLang[] = KNOT_TABLE.map((k) => k.lang);
    expect(langs).toEqual(['EN', 'HI', 'TA', 'KN', 'TE']);
  });

  it('makes the English knot the largest', () => {
    const en = KNOT_TABLE.find((k) => k.lang === 'EN')!;
    const smallest = Math.min(...KNOT_TABLE.map((k) => k.relativeScale));
    expect(en.relativeScale / smallest).toBeGreaterThanOrEqual(1.4);
  });

  it('keeps all entries within asymmetric supercluster bounds', () => {
    for (const k of KNOT_TABLE) {
      expect(Math.hypot(...k.position)).toBeLessThanOrEqual(3.5);
    }
  });
});
```

- [ ] **Step 2 — Run, confirm failure** (module does not exist).

- [ ] **Step 3 — Implement the table:**
```ts
// src/lib/mira-state.ts
export type MiraLang = 'EN' | 'HI' | 'TA' | 'KN' | 'TE';

export interface KnotSpec {
  lang: MiraLang;
  position: readonly [number, number, number];
  relativeScale: number;
  hue: string;
}

// Hand-tuned for screen composition. Inspired by Shapley's asymmetric web,
// not traced from it. English central + largest; regionals scattered.
export const KNOT_TABLE: readonly KnotSpec[] = [
  { lang: 'EN', position: [ 0.00,  0.20,  0.00], relativeScale: 1.40, hue: '#FF6B4A' },
  { lang: 'HI', position: [-1.80,  0.55, -0.40], relativeScale: 1.10, hue: '#FF8A3C' },
  { lang: 'TA', position: [ 1.55, -0.65,  0.30], relativeScale: 1.20, hue: '#FF5A6E' },
  { lang: 'KN', position: [-1.10, -0.80,  0.55], relativeScale: 1.05, hue: '#FFB347' },
  { lang: 'TE', position: [ 1.95,  0.35, -0.25], relativeScale: 1.00, hue: '#FF7B5A' },
] as const;
```

- [ ] **Step 4 — Run, confirm green.**

- [ ] **Step 5 — Commit:**
```bash
git add src/lib/mira-state.ts tests/unit/mira-state.test.ts
git commit -m "feat(mira): add typed KNOT_TABLE for the 5-knot cluster"
```

---

## Task 3 — Cycle controller (zustand slice + auto-advance)

**Files:**
- Modify: `src/lib/mira-state.ts`
- Modify: `tests/unit/mira-state.test.ts`

- [ ] **Step 1 — Add failing tests:**
```ts
import { renderHook, act } from '@testing-library/react';
import { useMiraState, advanceCycle, resetMiraStateForTest } from '@/lib/mira-state';

beforeEach(() => resetMiraStateForTest());

describe('mira cycle controller', () => {
  it('starts on EN at cycleIndex 0', () => {
    const { result } = renderHook(() => useMiraState((s) => s));
    expect(result.current.activeLang).toBe('EN');
    expect(result.current.cycleIndex).toBe(0);
  });

  it('advances EN→HI→TA→KN→TE→EN on advanceCycle()', () => {
    const order = ['EN', 'HI', 'TA', 'KN', 'TE', 'EN'] as const;
    const { result } = renderHook(() => useMiraState((s) => s.activeLang));
    expect(result.current).toBe(order[0]);
    for (let i = 1; i < order.length; i++) {
      act(() => advanceCycle());
      expect(result.current).toBe(order[i]);
    }
  });
});
```

- [ ] **Step 2 — Run, confirm failure** (functions don't exist).

- [ ] **Step 3 — Implement the slice:**
```ts
// Append to src/lib/mira-state.ts
import { create } from 'zustand';

type Density = Record<MiraLang, number>;
const INITIAL_DENSITY: Density = { EN: 0.20, HI: 0.20, TA: 0.20, KN: 0.20, TE: 0.20 };

interface MiraState {
  activeLang: MiraLang;
  density: Density;
  cycleIndex: number;
  cycleStartMs: number;
}

export const useMiraState = create<MiraState>(() => ({
  activeLang: 'EN',
  density: { ...INITIAL_DENSITY },
  cycleIndex: 0,
  cycleStartMs: typeof performance !== 'undefined' ? performance.now() : 0,
}));

const ORDER: readonly MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE'];

export function advanceCycle(): void {
  useMiraState.setState((s) => {
    const next = ORDER[(s.cycleIndex + 1) % ORDER.length];
    return {
      activeLang: next,
      cycleIndex: s.cycleIndex + 1,
      cycleStartMs: performance.now(),
    };
  });
}

export function resetMiraStateForTest(): void {
  useMiraState.setState({
    activeLang: 'EN',
    density: { ...INITIAL_DENSITY },
    cycleIndex: 0,
    cycleStartMs: 0,
  });
}
```

- [ ] **Step 4 — Run, confirm green.**

- [ ] **Step 5 — Commit:**
```bash
git add src/lib/mira-state.ts tests/unit/mira-state.test.ts
git commit -m "feat(mira): add cycle controller + zustand slice"
```

---

## Task 4 — Density accretion on ingestion

**Files:**
- Modify: `src/lib/mira-state.ts`
- Modify: `tests/unit/mira-state.test.ts`

The ingestion event fires when a plume completes its return trajectory (Task 9 wires it up). For now we expose the `ingestForLang(lang)` action and test the math in isolation.

- [ ] **Step 1 — Add failing tests:**
```ts
import { ingestForLang } from '@/lib/mira-state';

describe('mira density accretion', () => {
  it('starts every language at 0.20', () => {
    const d = useMiraState.getState().density;
    expect(d.EN).toBe(0.20);
    expect(d.TE).toBe(0.20);
  });

  it('grows density by +0.020 per ingestion, capped at 1.00', () => {
    act(() => ingestForLang('EN'));
    expect(useMiraState.getState().density.EN).toBeCloseTo(0.22, 5);
    for (let i = 0; i < 50; i++) act(() => ingestForLang('EN'));
    expect(useMiraState.getState().density.EN).toBe(1.00);
  });

  it('isolates per-language growth (same-knot only)', () => {
    act(() => ingestForLang('EN'));
    const d = useMiraState.getState().density;
    expect(d.EN).toBeCloseTo(0.22, 5);
    expect(d.HI).toBe(0.20);
    expect(d.TA).toBe(0.20);
  });
});
```

- [ ] **Step 2 — Run, confirm failure.**

- [ ] **Step 3 — Implement `ingestForLang`:**
```ts
const DENSITY_STEP = 0.020;
const DENSITY_CAP = 1.00;

export function ingestForLang(lang: MiraLang): void {
  useMiraState.setState((s) => ({
    density: { ...s.density, [lang]: Math.min(DENSITY_CAP, s.density[lang] + DENSITY_STEP) },
  }));
}
```

- [ ] **Step 4 — Run, confirm green.**

- [ ] **Step 5 — Commit:**
```bash
git add src/lib/mira-state.ts tests/unit/mira-state.test.ts
git commit -m "feat(mira): add per-language density accretion (+0.020 capped at 1.00)"
```

---

## Task 5 — Quality profile + debug surface

**Files:**
- Modify: `src/lib/mira-state.ts`
- Modify: `tests/unit/mira-state.test.ts`

- [ ] **Step 1 — Add failing tests:**
```ts
import { detectQualityProfile, exposeMiraDebug } from '@/lib/mira-state';

describe('quality profile', () => {
  it('returns "low" for viewport ≤ 768px wide', () => {
    expect(detectQualityProfile({ width: 768, search: '' })).toBe('low');
    expect(detectQualityProfile({ width: 500, search: '' })).toBe('low');
  });

  it('returns "high" for desktop viewports', () => {
    expect(detectQualityProfile({ width: 1440, search: '' })).toBe('high');
  });

  it('respects ?quality=low override on desktop', () => {
    expect(detectQualityProfile({ width: 1440, search: '?quality=low' })).toBe('low');
  });
});

describe('debug surface', () => {
  it('exposes window.__miraDebug in non-production envs', () => {
    const win: Record<string, unknown> = {};
    exposeMiraDebug(win as unknown as Window);
    expect(win.__miraDebug).toBeDefined();
    const dbg = (win as { __miraDebug: { activeLang: string } }).__miraDebug;
    expect(dbg.activeLang).toBe('EN');
  });
});
```

- [ ] **Step 2 — Run, confirm failure.**

- [ ] **Step 3 — Implement quality detection + debug surface:**
```ts
export type QualityProfile = 'high' | 'low';

export interface QualityProbe { width: number; search: string }

export function detectQualityProfile(probe: QualityProbe): QualityProfile {
  if (probe.search.includes('quality=low')) return 'low';
  if (probe.width <= 768) return 'low';
  return 'high';
}

export interface MiraDebug {
  readonly activeLang: MiraLang;
  readonly density: Readonly<Density>;
  readonly cycleIndex: number;
  readonly cycleStartMs: number;
  readonly reveal: number;
  readonly qualityProfile: QualityProfile;
}

export function exposeMiraDebug(target: Window): void {
  if (process.env.NODE_ENV === 'production') return;
  Object.defineProperty(target, '__miraDebug', {
    configurable: true,
    get(): MiraDebug {
      const s = useMiraState.getState();
      return {
        activeLang: s.activeLang,
        density: s.density,
        cycleIndex: s.cycleIndex,
        cycleStartMs: s.cycleStartMs,
        reveal: (window as unknown as { __miraReveal?: number }).__miraReveal ?? 0,
        qualityProfile: detectQualityProfile({
          width: window.innerWidth,
          search: window.location.search,
        }),
      };
    },
  });
}
```

- [ ] **Step 4 — Run, confirm green.**

- [ ] **Step 5 — Commit:**
```bash
git add src/lib/mira-state.ts tests/unit/mira-state.test.ts
git commit -m "feat(mira): add quality profile detection + window.__miraDebug surface"
```

---

## Task 6 — Build `MiraKnots.tsx`

**Files:**
- Create: `src/components/scene/scenes/MiraKnots.tsx`

Each knot = a sphere with an X-ray-glow shader + a soft halo billboard. Active knot brightens, idle knots dim. Density drives core brightness and halo size.

- [ ] **Step 1 — Pin the reference image.** Open `.coo/jobs/004/refs/shapley.png` side-by-side with the dev browser. Quality bar: each knot must read as a hot X-ray hotspot embedded in gas, not a flat sphere.

- [ ] **Step 2 — Implement the file:**

The component takes `reveal` (0..1) and reads `activeLang` + `density` from `useMiraState`. Use `MeshStandardMaterial`? No — use a `ShaderMaterial` for the X-ray core (fragment outputs HDR-boosted radial falloff using the knot's hue), plus an additive-blended sprite billboard for the soft halo. Reuse the `NOISE_GLSL` from the deleted `MiraPlasma.tsx` — copy it into a shared file `src/components/scene/scenes/_shaders.ts` and import.

Critical shader requirements (so this does not read as flat):
- Core fragment: `vec3 col = mix(hue * 0.6, hue * 3.0, smoothstep(0.0, 0.4, glow))`, fed into bloom.
- Halo: large quad billboard with radial alpha falloff `exp(-r*r*4.0)`, additive blend, scale tied to `density`.
- Active knot: multiply core HDR by `1.0 + activeBoost * pulse(time)` where `activeBoost = 0.55` and `pulse` is a 482ms gaussian (re-use from `MiraPlasma`'s heartbeat).
- Idle knot: HDR baseline at `0.45 * (0.4 + density * 0.6)`.

Keep file ≤ 250 lines. If the shader strings exceed that, hoist into `_shaders.ts`.

- [ ] **Step 3 — Wire into `MiraScene.tsx` temporarily** so it renders in `W01_MIRA`. Skip the rest of the scene for now; just render `<MiraKnots reveal={1} />`.

- [ ] **Step 4 — Visual checkpoint:** `npm run dev`, scroll to MIRA panel, screenshot at 1440×900. Open the screenshot next to `.coo/jobs/004/refs/shapley.png`. **Reject the render and iterate** if any of: knots look like plain spheres, glow is bands not smooth, English isn't visually largest, halos absent. Save the accepted screenshot to `.coo/jobs/004/screenshots/01-knots.png`.

- [ ] **Step 5 — Lint + typecheck:** `npm run lint && npx tsc --noEmit`. Fix any issues.

- [ ] **Step 6 — Commit:**
```bash
git add src/components/scene/scenes/MiraKnots.tsx src/components/scene/scenes/_shaders.ts .coo/jobs/004/screenshots/01-knots.png
git commit -m "feat(mira): add MiraKnots — 5 X-ray-glow cluster cores"
```

---

## Task 7 — Build `MiraSupercluster.tsx` (diffuse blue gas)

**Files:**
- Create: `src/components/scene/scenes/MiraSupercluster.tsx`

- [ ] **Step 1 — Decide particle distribution.** Use a deterministic seeded-noise distribution: ~30,000 particles in high quality, ~8,000 in low. Position via Perlin-noise-sculpted density field — particles cluster around the 5 knot positions (so the gas "halos" the knots), with falloff. Implement the density field in CPU at component mount time (one-shot, not per-frame) — store positions in a `Float32Array`.

- [ ] **Step 2 — Particle shader.** Vertex shader sets `gl_PointSize` from camera distance + a per-particle scale jitter. Fragment shader: circular splat with smooth alpha falloff `1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5))`, additive blend, colour ramps blue→cyan via per-particle noise. No flat squares, no banding.

- [ ] **Step 3 — Subscribe to quality profile:**
```ts
const quality = useMemo(() => detectQualityProfile({
  width: window.innerWidth, search: window.location.search,
}), []);
const count = quality === 'low' ? 8000 : 30000;
```

- [ ] **Step 4 — Visual checkpoint.** Render together with Knots from Task 6. Compare to reference. **Reject and iterate** if: gas looks like a uniform fog, no internal structure visible, gas masks the knots completely, colour is monochrome blue instead of cyan-blue gradient. Save accepted to `.coo/jobs/004/screenshots/02-gas+knots.png`.

- [ ] **Step 5 — Lint + typecheck + commit:**
```bash
npm run lint && npx tsc --noEmit
git add src/components/scene/scenes/MiraSupercluster.tsx .coo/jobs/004/screenshots/02-gas+knots.png
git commit -m "feat(mira): add MiraSupercluster — diffuse cyan-blue gas cloud"
```

---

## Task 8 — Build `MiraPlume.tsx` (GPGPU emit→return)

**Files:**
- Create: `src/components/scene/scenes/MiraPlume.tsx`

This is the most complex task. The plume is a GPGPU ping-pong FBO system, structurally identical to the deleted `MiraAttractor.tsx`, but with different per-particle dynamics: particles spawn from the active knot's position, follow a curl-noise outward velocity for ~1.4s, then return along an inverse field, reincorporating into the same knot.

- [ ] **Step 1 — Re-read `MiraAttractor.tsx` (still in git history; `git show HEAD~3:src/components/scene/scenes/MiraAttractor.tsx`) for the save/restore renderer state pattern.** This pattern is **non-negotiable** — without it, the GPGPU texture leaks onto the canvas. Reuse it verbatim.

- [ ] **Step 2 — Compute shader (`computeFrag`).** Per-particle state in RGBA texture: `RGB = position`, `A = life ∈ [0..1]`. On `uFrame === 0`, spawn from the active knot's position. Each step:
  - `life += uDelta * (1.0 / 1.4)` — full life cycle in 1.4s.
  - If `life < 0.5`: outward phase. Velocity = `curlNoise(pos * 0.8 + uTime * 0.4) * 1.8`.
  - If `life ≥ 0.5`: return phase. Velocity = `-curlNoise(pos * 0.8 + uTime * 0.4) * 1.8 + (knotPos - pos) * 3.0` (curl-noise-tinted gravity back to the knot).
  - At `life ≥ 1.0`: fire ingestion event (next step), then respawn at knot position with `life = 0`.

- [ ] **Step 3 — Wire ingestion events.** Each frame, before the compute pass, check how many particles crossed `life ≥ 1.0` this frame (sample a subset, or accumulate fractional reincorporations as one "event" per cycle). When the cycle completes (timer hits `cycleStartMs + 3000ms`), call `ingestForLang(activeLang)` from Task 4, then `advanceCycle()`.

- [ ] **Step 4 — Render shader.** Vertex samples position from the FBO; size scales with `1.0 - abs(life - 0.5) * 2.0` (peaks mid-flight, fades at spawn/ingest). Colour from `KNOT_TABLE.find(k => k.lang === activeLang).hue`, blended additively. Fragment is a soft circular splat (same shape as Task 7 gas).

- [ ] **Step 5 — Quality profile gate.** If `quality === 'low'`, do not render the GPGPU pass at all. Instead, render an additive pulse on the active knot's halo (a per-frame brightness oscillation tied to `cycleStartMs`).

- [ ] **Step 6 — Visual checkpoint.** Watch through 3 full language cycles. **Reject and iterate** if: plumes look straight (curl noise too weak), particles don't visibly return (return-phase math off), wrong knot is emitting, no per-cycle ingestion pulse visible on the receiving knot.

Save 3 screenshots to `.coo/jobs/004/screenshots/`: `03-plume-en.png`, `04-plume-hi.png`, `05-plume-te.png` (catch three different active knots).

- [ ] **Step 7 — Commit:**
```bash
npm run lint && npx tsc --noEmit
git add src/components/scene/scenes/MiraPlume.tsx .coo/jobs/004/screenshots/
git commit -m "feat(mira): add MiraPlume — GPGPU emit/return plume with ingestion events"
```

---

## Task 9 — Rewrite `MiraScene.tsx` (compose all three)

**Files:**
- Rewrite: `src/components/scene/scenes/MiraScene.tsx`

- [ ] **Step 1 — Preserve the reveal envelope verbatim.** Copy lines 30–39 of the existing file exactly. Do not adjust the thresholds.

- [ ] **Step 2 — Compose:**
```tsx
export default function MiraScene() {
  const phase = useScene((s) => s.phase);
  const local = useScene((s) => s.localProgress);
  const reveal = computeReveal(phase, local);

  // Expose reveal for the debug surface.
  if (typeof window !== 'undefined') {
    (window as unknown as { __miraReveal?: number }).__miraReveal = reveal;
  }

  return (
    <group>
      {reveal >= 0.20 && <MiraSupercluster reveal={reveal} />}
      {reveal >= 0.50 && <MiraKnots reveal={reveal} />}
      {reveal >= 0.85 && <MiraPlume reveal={reveal} />}
    </group>
  );
}
```

- [ ] **Step 3 — Install the debug surface.** Add a `useEffect` in the scene-mounting boundary (e.g., `SceneManager.tsx` or here) that calls `exposeMiraDebug(window)` once on first mount.

- [ ] **Step 4 — Visual checkpoint across 4 reveal points.** Scroll to each of:
  - p ≈ start of C07_TRANSITION local 0.45 (reveal ≈ 0.0 → 0.40 ramp begins)
  - p ≈ start of C08_EMERGE (reveal ≈ 0.40)
  - p ≈ start of C09_PROJECT (reveal ≈ 0.80)
  - p ≈ mid-W01_MIRA (reveal === 1.00)

  Screenshot each; verify scene gates fire in order (gas → knots → plume). Save to `.coo/jobs/004/screenshots/06-reveal-{020,040,080,100}.png`.

- [ ] **Step 5 — Commit:**
```bash
git add src/components/scene/scenes/MiraScene.tsx .coo/jobs/004/screenshots/
git commit -m "feat(mira): compose MiraScene with reveal-gated supercluster/knots/plume"
```

---

## Task 10 — Update `MiraPanel.tsx` DOM overlay

**Files:**
- Rewrite: `src/components/work/panels/MiraPanel.tsx` (the `MiraOverlay` function within)

- [ ] **Step 1 — Subscribe to `useMiraState` for `activeLang`.** Each language label brightens when its index matches the active language.

- [ ] **Step 2 — Replace the static metric block.** New layout:
  - Top line: `LIVE · <LANG> · 482ms` (mono, primary hue, larger)
  - Sub line: `TRAINING SIGNAL · +2.0% / call` (mono, accent, smaller)

  The `LIVE · <LANG>` portion updates from `activeLang`. The `482ms` stays static (it represents the system's typical response time).

- [ ] **Step 3 — Visual checkpoint.** Capture 3 consecutive cycles in screenshots; confirm label brightness tracks the active knot. Save `07-panel-cycle-{en,hi,ta}.png`.

- [ ] **Step 4 — A11y check.** Verify contrast on idle (dimmed) labels is still ≥ 4.5:1 against the cosmic backdrop. If not, lift idle opacity to 0.55 (from 0.45). Standards `6.3`.

- [ ] **Step 5 — Commit:**
```bash
git add src/components/work/panels/MiraPanel.tsx .coo/jobs/004/screenshots/
git commit -m "feat(mira): sync MiraPanel labels + LIVE ticker with active language"
```

---

## Task 11 — Delete the dead files + reduced-motion handling

**Files:**
- Delete: `src/components/scene/scenes/MiraPlasma.tsx`
- Delete: `src/components/scene/scenes/MiraAttractor.tsx`
- Modify: `src/lib/mira-state.ts` (reduced-motion gate)

- [ ] **Step 1 — Verify nothing imports the doomed files:**
```bash
grep -rn "MiraPlasma\|MiraAttractor" src/
```
Expected: zero matches (the previous tasks have already swapped imports in `MiraScene.tsx`).

- [ ] **Step 2 — Delete:**
```bash
git rm src/components/scene/scenes/MiraPlasma.tsx src/components/scene/scenes/MiraAttractor.tsx
```

- [ ] **Step 3 — Add reduced-motion gate** in `mira-state.ts`:
```ts
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

  In `MiraScene.tsx`, gate the cycle controller (the `setInterval` or `useFrame` timer that calls `advanceCycle`) behind `!isReducedMotion()`. When reduced motion is on: cycle does not advance, `activeLang` stays on `EN`, plume disabled.

- [ ] **Step 4 — Verify with DevTools.** Open DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce". Scroll to MIRA. Watch for 10 seconds. `activeLang` stays `EN`, no plume animation, gas cloud holds still.

- [ ] **Step 5 — Lint + typecheck:**
```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 6 — Commit:**
```bash
git add -A
git commit -m "chore(mira): remove dead Plasma/Attractor files; add reduced-motion gate"
```

---

## Task 12 — E2E test: cycle order + cadence

**Files:**
- Create: `tests/e2e/mira-cycle.spec.ts`

- [ ] **Step 1 — Write the failing test:**
```ts
import { test, expect } from '@playwright/test';

test('MIRA language cycle visits EN→HI→TA→KN→TE in order', async ({ page }) => {
  await page.goto('/');
  // Scroll to W01_MIRA panel. Helper depends on app's scroll API.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
  await page.waitForFunction(() => (window as any).__miraDebug?.activeLang === 'EN');

  const seen: string[] = [];
  const start = Date.now();
  while (Date.now() - start < 18_000 && seen.length < 6) {
    const lang = await page.evaluate(() => (window as any).__miraDebug.activeLang);
    if (seen[seen.length - 1] !== lang) seen.push(lang);
    await page.waitForTimeout(150);
  }

  expect(seen.slice(0, 6)).toEqual(['EN', 'HI', 'TA', 'KN', 'TE', 'EN']);
});

test('MIRA cycle cadence is 3.0s ± 0.1s', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
  await page.waitForFunction(() => (window as any).__miraDebug?.activeLang === 'EN');

  const t0 = await page.evaluate(() => (window as any).__miraDebug.cycleStartMs);
  await page.waitForFunction((prev) => (window as any).__miraDebug.cycleStartMs > prev, t0);
  const t1 = await page.evaluate(() => (window as any).__miraDebug.cycleStartMs);

  const delta = (t1 - t0) / 1000;
  expect(delta).toBeGreaterThanOrEqual(2.9);
  expect(delta).toBeLessThanOrEqual(3.1);
});
```

- [ ] **Step 2 — Run, expect green:** `npm run test:e2e -- tests/e2e/mira-cycle.spec.ts`.

- [ ] **Step 3 — Commit:**
```bash
git add tests/e2e/mira-cycle.spec.ts
git commit -m "test(mira): e2e — cycle order + cadence"
```

---

## Task 13 — E2E test: density accretion

**Files:**
- Create: `tests/e2e/mira-growth.spec.ts`

- [ ] **Step 1 — Write the failing test:**
```ts
import { test, expect } from '@playwright/test';

test('EN density grows to [0.22, 0.26] over 30s', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
  await page.waitForFunction(() => (window as any).__miraDebug?.activeLang === 'EN');

  const start = await page.evaluate(() => (window as any).__miraDebug.density.EN);
  expect(start).toBeCloseTo(0.20, 2);

  await page.waitForTimeout(30_000);
  const end = await page.evaluate(() => (window as any).__miraDebug.density.EN);
  expect(end).toBeGreaterThanOrEqual(0.22);
  expect(end).toBeLessThanOrEqual(0.26);
});
```

- [ ] **Step 2 — Run, expect green.**

- [ ] **Step 3 — Commit:**
```bash
git add tests/e2e/mira-growth.spec.ts
git commit -m "test(mira): e2e — EN density grows +0.04 over 30s"
```

---

## Task 14 — E2E test: reduced-motion freeze

**Files:**
- Create: `tests/e2e/mira-reduced-motion.spec.ts`

- [ ] **Step 1 — Write the failing test:**
```ts
import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test('MIRA cycle freezes on EN when prefers-reduced-motion is set', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
  await page.waitForFunction(() => (window as any).__miraDebug?.activeLang);

  const t0 = await page.evaluate(() => (window as any).__miraDebug.activeLang);
  expect(t0).toBe('EN');
  await page.waitForTimeout(10_000);
  const t1 = await page.evaluate(() => (window as any).__miraDebug.activeLang);
  expect(t1).toBe('EN');

  await context.close();
});
```

- [ ] **Step 2 — Run, expect green.**

- [ ] **Step 3 — Commit:**
```bash
git add tests/e2e/mira-reduced-motion.spec.ts
git commit -m "test(mira): e2e — cycle freezes on EN under prefers-reduced-motion"
```

---

## Task 15 — Performance verification + mobile profile screenshots

**Files:**
- Create: `.coo/jobs/004/perf/desktop.trace.json`
- Create: `.coo/jobs/004/perf/mobile.trace.json`
- Create: `.coo/jobs/004/perf/report.md`

Dispatch to `performance-engineer`. Brief in spec Plan step 5.

- [ ] **Step 1 — Desktop profile:** open Chrome DevTools Performance panel at 1440×900, record one full 15s language cycle, save trace.
- [ ] **Step 2 — Mobile profile:** repeat with 4× CPU throttling + 768px viewport; verify `qualityProfile === 'low'` is active via `__miraDebug`.
- [ ] **Step 3 — Verify AC8 budgets:**
  - Desktop median ≥ 55 FPS (≤ 18ms median frame time)
  - Desktop p95 ≥ 45 FPS (≤ 22ms p95 frame time)
  - Mobile median ≥ 30 FPS (≤ 33ms median frame time)
  - GPU particle count ≤ 80k peak
- [ ] **Step 4 — Capture mobile screenshot** at 768×800 viewport via Playwright + save to `.coo/jobs/004/screenshots/08-mobile.png`. Verify it reads as a coherent cosmic-web scene (not a broken low-detail render).
- [ ] **Step 5 — Write `report.md`** with the numbers + verdict.
- [ ] **Step 6 — Commit:**
```bash
git add .coo/jobs/004/perf/ .coo/jobs/004/screenshots/08-mobile.png
git commit -m "perf(mira): capture desktop + mobile profiles for job 004"
```

---

## Task 16 — Final quality gates

- [ ] **Step 1 — Dispatch `code-reviewer`.** Brief: read the full diff for job 004; confirm AC compliance, file/function size limits, no `any` without `// reason:`, no `console.log`, no commented-out code, no orphaned imports.
- [ ] **Step 2 — Dispatch `visual-verifier`.** Brief: capture the full screenshot set per spec Plan step 4. Side-by-side compare with `.coo/jobs/004/refs/shapley.png`. Subjective pass: "does this read as photographic, or as a debug scene?"
- [ ] **Step 3 — Dispatch `accessibility-auditor`.** Brief: WCAG 2.2 AA on the DOM overlay changes; verify reduced-motion behaviour.
- [ ] **Step 4 — Run the full suite locally:**
```bash
npm run lint && npx tsc --noEmit && npm run test && npm run test:e2e
```
All four must exit 0 (or unchanged baseline of pre-existing failures).

- [ ] **Step 5 — Update job status** in `.coo/jobs/004-mira-virgo-supercluster.md`: change `status: spec` → `status: review`.

- [ ] **Step 6 — COO sign-off** when all quality agents have approved. Append the `[COO-SIGNOFF]` block per `.coo/formats.md`.

---

## Risks during execution

- **GPGPU state leak (Task 8):** if the save/restore renderer state pattern from the deleted `MiraAttractor.tsx` is not preserved verbatim, the plume FBO will composite onto the canvas as a grey rectangle. This was a known bug fixed once; do not regress.
- **Bloom over-blowing the knots:** the global `<Bloom>` post-process has a luminanceThreshold of ~0.6. Knots will get bloomed; if they HDR too hard, they read as featureless white blobs. Tune knot fragment output to peak near 2.5–3.0, not higher.
- **Particle count creep:** TASK 7's CPU-sculpted density field can balloon if you over-sample. Cap at 30k high / 8k low and verify in DevTools.
- **Cycle drift on tab-throttling:** browsers throttle `requestAnimationFrame` on background tabs. The cycle controller should use `performance.now()` deltas and gracefully accept any single frame's `dt` up to ~100ms.

---

## Commit policy

- One commit per task minimum. Subject in imperative mood, ≤ 72 chars.
- Body explains *why*, not *what*.
- No bundling unrelated changes.
