---
id: 004
title: MIRA — Virgo Supercluster scene (5 language nodes, plume return, accretive growth)
shape: feature
status: spec
owner: COO
opened: 2026-05-13
closed:
priority: P1
---

## Spec

Replace MIRA's current pulsing-plasma-sphere + Aizawa-attractor visualization with a **Virgo Supercluster-style cosmic-web structure**: a diffuse blue volumetric gas cloud holding **five distinct red galaxy-cluster knots**, each representing one of the agent's supported languages (English, Hindi, Tamil, Kannada, Telugu). At any moment one knot is "active" — it brightens, emits a curling **particle plume** of voice data outward into space, then the plume **curves back and reincorporates** into the same knot, depositing density. After each ingestion cycle the knot's core grows slightly brighter/denser, visualising "the model speaks this language better than before."

Why this concept (vs. the prior plasma sphere): the supercluster captures three system truths the planet did not — (1) **multi-node multilingual architecture** as a single bound structure, (2) **bidirectional dataflow per call** (outbound voice → return as training signal), (3) **learning over time** (cumulative accretion). The visual reference is the ESA Planck + ROSAT composite of the Shapley supercluster: diffuse cyan gas with red X-ray hotspots in an asymmetric web. Astronomically credible to specialists; emotionally legible to casual viewers.

Why this is a metaphor and where it bends honestly: the real Mira agent does not run live RLHF during a call — training is offline batch. The visual claim is **information accretion at the program level** (every call produces data that later improves the model), not a literal gradient-descent animation. The geometry reads as **data lineage**, which is fair. We do not label the visual "live training."

## Acceptance criteria

- [ ] **AC1 — Structural fidelity.** When `phase === 'W01_MIRA'` and `reveal === 1.0`, the rendered scene shows: (a) an irregular diffuse blue-cyan gas cloud occupying ~55–65% of the viewport width, (b) exactly 5 red hotspot "knots" embedded asymmetrically within the gas, (c) a starfield backdrop. No spherical planet, no Aizawa attractor present. Verified by `visual-verifier` screenshot at scroll position p_W01_MIRA mid-panel, 1440×900.

- [ ] **AC2 — Five-knot language mapping.** Each knot has a stable identity bound to one language: `EN` (English), `HI` (Hindi), `TA` (Tamil), `KN` (Kannada), `TE` (Telugu). This 5-set matches the actual product (Mira agent supports English + 4 regional Indian languages — see Decisions). English knot is the largest (≥1.4× radius of the smallest knot); the four regional knots vary 1.0×–1.25× by relative call volume (placeholder distribution OK, but the table must be a **named constant `KNOT_TABLE`** in `mira-state.ts` — not a runtime random, not inline magic numbers in `MiraKnots.tsx`). `code-reviewer` rejects the PR if the table is not a single source of truth. Knot positions and per-knot scales are stable across frames. Verified by `qa-engineer` reading `KNOT_TABLE` and confirming each entry is a typed constant `{ lang: MiraLang; position: [x,y,z]; relativeScale: number; hue: string }`.

- [ ] **AC3 — Active-knot cycle.** When the panel is in view (phase `W01_MIRA`), a controller advances the active language every 3.0s ± 0.1s, looping `EN → HI → TA → KN → TE → EN…`. The active knot brightens by ≥40% relative to idle knots; the others remain dim. Exactly one knot is active at any moment (matches the agent's no-mixing rule). Verified by `qa-engineer` Playwright test that polls `window.__miraDebug?.activeLang` over 18s and asserts it cycles through all 5 in order with cycle duration in `[2.9s, 3.1s]`.

- [ ] **AC4 — Outbound plume.** Within ~0.3s of a knot becoming active, a particle plume (~6k–10k particles) begins emitting from that knot's position. Particles travel outward following a curl-noise-shaped velocity field for ~1.2–1.6s, reaching an apogee at ~3–4× knot radius, then curve back along return paths and reincorporate into the **same** originating knot (locked per Decisions — no cross-knot distribution). Plume colour matches the language hue assigned in `panelHues.W01_MIRA` (warm core → cool tail). Verified visually and by source review.

- [ ] **AC5 — Accretive growth.** After each full emit→return cycle, the originating knot's `density` value increases by `+0.020` (capped at `1.00`, starting at `0.20`). Density drives core brightness, halo size, and emitted-plume opacity per knot. At cycle cadence of 3.0s and the language loop visiting EN once every 15s, EN sees 2 ingestions per 30s of dwell time → density grows `0.20 → 0.24` (predictable, modest). The test assertion is therefore: at t=30s, `density.EN` is in `[0.22, 0.26]` (window covers timing jitter and one-cycle skew). For a 5× longer hands-free demo (t=150s), `density.EN` reaches `[0.38, 0.42]`. When the user scrolls away from `W01_MIRA` and back, density is preserved in the controller (no reset). Verified by `qa-engineer` reading exposed `window.__miraDebug.density.EN` before/after a 30s loop.

- [ ] **AC6 — DOM/scene sync.** `panelCopy.W01_MIRA.languages` is updated in `src/lib/copy.ts` to reflect the actual product's 5-language set — replace `'বাংলা'` (Bangla, not supported) with `'ENGLISH'`. New array: `['ENGLISH', 'हिंदी', 'தமிழ்', 'ಕನ್ನಡ', 'తెలుగు']` (ordered to match the cycle EN → HI → TA → KN → TE). The body copy stays "5 Indian languages" → updated to "5 languages — English and 4 South Indian regional languages." Each label brightens in lockstep with the active knot (the brightening rule: `opacity 1.0 + 0 0 18px hue` when active, `opacity 0.45` when idle). The `RESPONSE TIME 482ms` readout is replaced by a live ticker showing `LIVE · <LANG> · 482ms` plus a sub-line `TRAINING SIGNAL · +2.0% / call`. Verified by `visual-verifier` capturing 3 consecutive cycles and confirming the labelled language matches the brightest knot in each frame.

- [ ] **AC7 — Reveal envelope continuity.** The full existing 4-phase reveal mapping in `MiraScene.tsx:30-39` is preserved verbatim:
  - `C07_TRANSITION` local < 0.45 → `reveal = 0`
  - `C07_TRANSITION` local 0.45..1.00 → `reveal` ramps 0.00 → 0.40
  - `C08_EMERGE` local 0..1 → `reveal` ramps 0.40 → 0.80
  - `C09_PROJECT` local 0..1 → `reveal` ramps 0.80 → 0.95
  - `W01_MIRA` → `reveal = 1.00`
  Scene gates: at `reveal < 0.20` everything invisible; at `0.20 ≤ reveal < 0.50` gas cloud fades in (no knots, no plume); at `0.50 ≤ reveal < 0.85` knots fade in at idle brightness (still no plume); at `reveal ≥ 0.85` cycle controller fires and plume emission begins. Verified by `visual-verifier` at four named scroll positions matching the four ramp points (reveal = 0.20, 0.40, 0.80, 1.00).

- [ ] **AC8 — Performance.** Two targets per standards `5.4`:
  - **Desktop (Retina MBP M1, dev build, 1440×900):** Total GPU particle count ≤ 80k at peak (gas + active plume combined). Median frame time ≤ 18ms (≥ 55 FPS); p95 frame time ≤ 22ms during plume emission peaks (≥ 45 FPS).
  - **Mobile (mid-tier Android / iPhone 12-class, dev build, viewport ≤ 768px wide):** Render at ≥ 30 FPS median. To meet this, the scene auto-detects `window.matchMedia('(max-width: 768px)')` and switches to a `lowQuality` profile that (a) caps gas particles at 8k (down from 30–40k desktop), (b) disables the plume GPGPU pass entirely (knots show static density halos with a brightness pulse instead), (c) reduces knot halo billboard resolution. A manual `?quality=low` URL query toggles the same profile for desktop debugging. Both verified by `performance-engineer`: Chrome DevTools Performance profile on desktop, real-device profile (or Lighthouse mobile throttling at 4× CPU slowdown) for mobile. Traces attached to `.coo/jobs/004/perf/`.

- [ ] **AC9 — Reduced-motion contract.** When `prefers-reduced-motion: reduce` is set, the cycle controller is disabled (active language defaults to `EN`), plume particles do not animate (knots show static density halos instead), gas cloud holds still. The 25%-rotation black-hole exception does not apply here — MIRA is fully static in reduced-motion. Verified by `accessibility-auditor` toggling the media query and confirming no perceptible animation persists.

- [ ] **AC10 — Cleanup + standards.** `MiraPlasma.tsx` and `MiraAttractor.tsx` are deleted (their techniques don't survive into this scene). All new files ≤ 400 lines, all functions ≤ 40 lines per standards `1.1`. No `any` without a `// reason:` comment per standards `1.2`. No `console.log` left behind. `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:e2e` exit 0 (or unchanged baseline of pre-existing failures from prior jobs).

- [ ] **AC11 — Debug surface contract.** A typed dev-only debug surface is exported as `window.__miraDebug` with the following exact shape (locks field names so qa-engineer and 3d-graphics-engineer can't drift):
  ```ts
  type MiraLang = 'EN' | 'HI' | 'TA' | 'KN' | 'TE';
  interface MiraDebug {
    activeLang: MiraLang;
    density: Record<MiraLang, number>;     // 0..1 per language
    cycleIndex: number;                     // monotonic, increments each language change
    cycleStartMs: number;                   // performance.now() at last language change
    reveal: number;                         // current 0..1 reveal envelope value
    qualityProfile: 'high' | 'low';         // mobile fallback + ?quality=low override
  }
  ```
  Gated behind `process.env.NODE_ENV !== 'production'` so it does not ship in prod builds. Verified by `code-reviewer` reading the export declaration in `mira-state.ts`.

## Out of scope

- Real-time integration with the live Mira agent backend (no WebSocket, no actual call data — the cycle is a deterministic demo loop).
- Other W-phase scenes (Job 005+).
- Multilingual font hinting / IndicScript shaping audit (Job 009 territory).
- HUD `01/18` → `01/23` phase-count refactor (Job 006).
- A camera fly-through animation on scroll-in (defer — current static framing is fine for now).

## Plan

1. **`deep-researcher`** (30 min budget) — three deliverables:
   - **Visual references:** 4–6 reference images of Shapley/Virgo superclusters in Planck-ROSAT composite style (red X-ray cluster overlays on diffuse blue gas) + 2–3 reference images of curl-noise particle plume systems.
   - **Existing implementations to port (per founder preference for porting over from-scratch — see memory `feedback_use_existing_implementations.md`):**
     - Evaluate `github.com/angeluriot/Galaxy_simulation` (MIT, C++ / OpenGL / OpenCL). Founder flagged it — confirm the honest conclusion: the N-body engine is **not** portable to web and is the wrong tool for a static cosmic web. Identify *only* the GLSL fragments worth porting (point-splat dust shader, HDR/bloom curves if cleaner than our current `<Bloom>` tuning). Cite file paths and line numbers in the source repo.
     - Find 2–3 **web-native** reference implementations of cosmic-web / supercluster / galaxy point-cloud rendering. Starting points: Bruno Simon's "Three.js Journey — Galaxy" shader-galaxy demo (R3F-adjacent), Shadertoy "cosmic web" or "large scale structure" shaders, any open-source WebGL renderer for SDSS/BOSS large-scale structure data. Each result needs: repo URL, license, what we'd port, what we'd skip.
   - **Output:** one-page memo at `.coo/jobs/004/refs/research.md` with the visual grid + a recommendation table (technique → source repo → license → portability verdict). The 3d-graphics-engineer works from this memo only.

2. **`3d-graphics-engineer`** — primary implementation. Files to create/modify:
   - **CREATE** `src/components/scene/scenes/MiraSupercluster.tsx` — diffuse gas cloud (instanced particle field, ~30–40k particles, smoothed-kernel falloff, blue-cyan additive blending, irregular Perlin-noise-sculpted boundary).
   - **CREATE** `src/components/scene/scenes/MiraKnots.tsx` — five fixed-position galaxy-cluster cores; each is a small sphere with a shader-driven X-ray glow + soft halo billboard. Reads active-language and density state from `mira-state`.
   - **CREATE** `src/components/scene/scenes/MiraPlume.tsx` — GPGPU plume system (ping-pong FBO, same pattern as current MiraAttractor but with emit→return trajectory, not strange attractor). Spawns from active knot position, follows curl-noise velocity field outward, returns along inverse field.
   - **CREATE** `src/lib/mira-state.ts` — zustand slice or plain hook holding `{ activeLang, knotPositions, densities, lastIngestT }`. Auto-cycle controller: `useEffect` driven by phase, ticks language every ~3s. Exposes `window.__miraDebug` (dev-only) for tests.
   - **REWRITE** `src/components/scene/scenes/MiraScene.tsx` — compose Supercluster + Knots + Plume, preserve existing reveal envelope.
   - **UPDATE** `src/components/work/panels/MiraPanel.tsx` — DOM overlay: sync language label brightness with `activeLang`; replace static `RESPONSE TIME 482ms` with the LIVE ticker + training-signal sub-line.
   - **UPDATE** `src/lib/copy.ts` — replace `'বাংলা'` with `'ENGLISH'` in `panelCopy.W01_MIRA.languages`; reorder array to `['ENGLISH', 'हिंदी', 'தமிழ்', 'ಕನ್ನಡ', 'తెలుగు']`; update body string from "5 Indian languages" to "5 languages — English and 4 South Indian regional languages." (See AC6, Decisions.)
   - **DELETE** `src/components/scene/scenes/MiraPlasma.tsx`, `src/components/scene/scenes/MiraAttractor.tsx`.
   Run `npm run lint`, `npx tsc --noEmit`, `npm run test` and report exit codes.

3. **`qa-engineer`** — write the regression tests:
   - `tests/e2e/mira-cycle.spec.ts`: scroll to W01_MIRA, poll `window.__miraDebug.activeLang` over 18s, assert cycles through all 5 in `EN → HI → TA → KN → TE` order.
   - `tests/e2e/mira-growth.spec.ts`: scroll to W01_MIRA, sample `window.__miraDebug.density.EN` at t=0 and t=30s, assert delta ≥ 0.18 and ≤ 0.30.
   - `tests/e2e/mira-reduced-motion.spec.ts`: emulate `prefers-reduced-motion: reduce`, scroll to W01_MIRA, sample `activeLang` at t=0 and t=10s, assert both equal `'EN'` (no cycling).
   - Unit tests for the position table and density-cap math.

4. **`visual-verifier`** — capture screenshots at:
   - p = mid-C07 (reveal ~0.30, gas faintly visible, no plume)
   - p = mid-W01, t = 0s (English knot active, plume emitting)
   - p = mid-W01, t = 4s (Hindi knot active)
   - p = mid-W01, t = 13s (Telugu knot active)
   - p = mid-W01, t = 30s (English knot visibly denser than at t=0s — side-by-side comparison)
   Save to `.coo/jobs/004/screenshots/`.

5. **`performance-engineer`** — Chrome DevTools Performance profile across one full 15s cycle. Report median + p95 frame time, GPU memory delta, particle count peak. Attach trace.

6. **`code-reviewer`** — read the diff. Confirm AC compliance, file/function size limits, no `any`, no dead code (the two deleted files cleanly removed, not just orphaned).

7. **`accessibility-auditor`** — verify AC9 (reduced-motion) and confirm no new contrast/legibility regressions in the DOM overlay changes.

8. **COO sign-off** — append `[COO-SIGNOFF]` block with evidence pointers.

## Dispatches

_pending — deep-researcher dispatches first; 3d-graphics-engineer waits on refs._

## Decisions

### 2026-05-13 — Concept locked: Virgo Supercluster (not Mira Ceti, not stellar engine)

Three concepts were brainstormed:
- **Mira Ceti (the variable star)** — rejected: pulsation timescale (332-day) mismatches phone-call rhythm; the star emits, doesn't converse; metaphor is name-coincidence not structural truth.
- **Stellar engine + structured exchange** — captures one call but misses learning-over-time.
- **Virgo Supercluster (chosen)** — captures multi-node multilingual architecture + bidirectional dataflow + cumulative accretion in one structure. Astronomically iconic via ESA Planck/ROSAT imagery. Founder-proposed.

### 2026-05-13 — Cycle is a deterministic demo loop, not live-data driven

The 5-language cycle runs on a fixed timer regardless of the real backend. Rationale: this panel is a portfolio reveal, not the live product. Hooking live call data would require WebSocket plumbing and a public endpoint — out of scope and adds complexity for marginal visual gain. The demo loop reads identically to the casual viewer.

### 2026-05-13 — Density preserved across scroll out/back (within session)

If the user scrolls past W01_MIRA and returns, densities are not reset — the cluster "remembers" the prior visits. Rationale: matches the accretion narrative ("the model has been learning"). Reset only on full page reload. Cap at 1.0 prevents indefinite growth.

### 2026-05-13 — 5-language set: EN + HI + TA + KN + TE (drop Bangla)

The current `panelCopy.W01_MIRA.languages` array in `src/lib/copy.ts:13` lists Bangla (`'বাংলা'`). The actual product (per founder confirmation, see also the Mira backend description on the resume: "Multilingual: English, Hindi, Tamil, Kannada, Telugu — instant switching, no mixing") does **not** support Bangla. The visual must match the product, not the wrong copy. AC6 corrects the copy as part of this job. The 5-set is locked: `EN, HI, TA, KN, TE`. No Bangla knot.

### 2026-05-13 — Plume distribution: same-knot only

Resolving the prior "open question." When the EN knot is active and its plume returns, particles reincorporate into **only the EN knot** — not distributed across all 5. Rationale: (a) the metaphor "every call improves the language that was spoken" is cleaner and matches operational truth (per-language fine-tuning data), (b) cross-knot distribution would visually scatter the "ingestion pulse" and weaken the reading, (c) we can revisit if a future product change (e.g., shared-backbone multilingual training) makes the broader claim true. Lock now; reopen via RFC if the model architecture changes.

### 2026-05-13 — Mobile fallback: disable plume + reduce gas

Per standards `5.4`, 3D scenes must hit 60 FPS on mid-tier mobile OR document the floor and add a quality toggle. We document a 30 FPS mobile floor and add a `lowQuality` profile that disables the GPGPU plume pass and caps gas particles at 8k. The metaphor survives intact at low quality — the active knot still pulses on density-ingestion, just without the curling plume trajectory. Manual override via `?quality=low` URL query for desktop debugging.

## Risks / open questions

- **Risk — supercluster reads as "blob" without enough internal structure.** Mitigation: gas cloud uses Perlin-sculpted boundary + per-particle alpha variation; 5 knots have distinct shapes (not 5 identical spheres). Reference images from deep-researcher will set the bar.
- **Risk — plume return path looks like particles "falling back" rather than "data returning" (could read as failure / collapse).** Mitigation: return path is along a curl-noise inverse field, not straight gravity; particles brighten as they reincorporate (the "ingest" pulse), so the return reads as constructive deposition not collapse.
- **Risk — five simultaneous knot positions over-fit Shapley's actual geometry and look kitsch.** Mitigation: position table is hand-tuned for screen composition, not a literal Shapley scrape. Inspired by, not traced from.
- **Risk — performance regression from new GPGPU pass.** Mitigation: AC8 sets a hard FPS budget verified by `performance-engineer`. If exceeded, fall back to a CPU-driven 4k-particle plume (visually similar at lower density).
- _(Resolved 2026-05-13 — see Decisions: plume distribution locked to same-knot only.)_

## Sign-off

_pending_
