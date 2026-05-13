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

- [ ] **AC2 — Five-knot language mapping.** Each knot has a stable identity bound to one language (`EN`, `HI`, `TA`, `KN`, `TE`). English knot is the largest (≥1.4× radius of the smallest regional knot); the four regional knots vary 1.0×–1.25× by relative call volume (placeholder distribution OK). Knot positions are stable across frames (no random drift between cycles). Verified by `qa-engineer` reading the position table in `src/lib/mira-state.ts` and confirming each is a named constant, not a per-frame random.

- [ ] **AC3 — Active-knot cycle.** When the panel is in view (phase `W01_MIRA`), a controller advances the active language every 2.8–3.2s, looping `EN → HI → TA → KN → TE → EN…`. The active knot brightens by ≥40% relative to idle knots; the others remain dim. Exactly one knot is active at any moment (matches the agent's no-mixing rule). Verified by `qa-engineer` Playwright test that polls `window.__miraDebug?.activeLang` over 18s and asserts it cycles through all 5 in order.

- [ ] **AC4 — Outbound plume.** Within ~0.3s of a knot becoming active, a particle plume (~6k–10k particles) begins emitting from that knot's position. Particles travel outward following a curl-noise-shaped velocity field for ~1.2–1.6s, reaching an apogee at ~3–4× knot radius, then curve back along return paths and reincorporate into the same knot. Plume colour matches the language hue assigned in `panelHues.W01_MIRA` (warm core → cool tail). Verified visually and by source review.

- [ ] **AC5 — Accretive growth.** After each full emit→return cycle, the originating knot's `density` value increases by `+0.02` (capped at `1.00`, starting at `0.20`). Density drives core brightness, halo size, and emitted-plume opacity per knot. Over the first 30 seconds of dwell time the English knot grows from `0.20 → 0.42` (visible as a clear core-brightness increase). When the user scrolls away from `W01_MIRA` and back, density is preserved in the controller (no reset). Verified by `qa-engineer` reading exposed `window.__miraDebug.density.EN` before/after a 30s loop.

- [ ] **AC6 — DOM/scene sync.** The existing language script labels in `MiraPanel.tsx` (தமிழ் / हिंदी / తెలుగు / ಕನ್ನಡ / বাংলা — and English/Bangla per current copy) brighten in lockstep with the active knot. The `RESPONSE TIME 482ms` readout is replaced by a live ticker showing `LIVE · <LANG> · <ms>` plus a sub-line `TRAINING SIGNAL +<n>% / call`. Verified by `visual-verifier` capturing 3 consecutive cycles and confirming the labelled language matches the brightest knot in each frame.

- [ ] **AC7 — Reveal envelope continuity.** The existing scroll-driven reveal mapping in `MiraScene.tsx` (C07_TRANSITION 0.45+ → W01_MIRA 1.0) is preserved. At `reveal=0` the supercluster is invisible; at `reveal=0.4` the gas cloud is faintly visible with no plume activity; at `reveal=1.0` full cycle runs. Plume emission only fires when `reveal ≥ 0.85`. Verified by `visual-verifier` at four scroll positions through C07 → W01.

- [ ] **AC8 — Performance.** Total GPU particle count ≤ 80k at peak (gas + active plume combined — current implementation runs ~65k). Render budget on a Retina MBP M1 stays ≥ 55 FPS in dev build at 1440×900, ≥ 45 FPS during plume emission peaks. Verified by `performance-engineer` running Chrome DevTools Performance profile across one full cycle, attaching trace.

- [ ] **AC9 — Reduced-motion contract.** When `prefers-reduced-motion: reduce` is set, the cycle controller is disabled (active language defaults to `EN`), plume particles do not animate (knots show static density halos instead), gas cloud holds still. The 25%-rotation black-hole exception does not apply here — MIRA is fully static in reduced-motion. Verified by `accessibility-auditor` toggling the media query and confirming no perceptible animation persists.

- [ ] **AC10 — Cleanup + standards.** `MiraPlasma.tsx` and `MiraAttractor.tsx` are deleted (their techniques don't survive into this scene). All new files ≤ 400 lines, all functions ≤ 40 lines, no `any` types, no `console.log` left behind. `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:e2e` exit 0 (or unchanged baseline of pre-existing failures from prior jobs).

## Out of scope

- Real-time integration with the live Mira agent backend (no WebSocket, no actual call data — the cycle is a deterministic demo loop).
- Other W-phase scenes (Job 005+).
- Multilingual font hinting / IndicScript shaping audit (Job 009 territory).
- HUD `01/18` → `01/23` phase-count refactor (Job 006).
- A camera fly-through animation on scroll-in (defer — current static framing is fine for now).

## Plan

1. **`deep-researcher`** (15 min budget) — collect 4–6 reference images of Shapley/Virgo superclusters in Planck-ROSAT composite style (red X-ray cluster overlays on diffuse blue gas) and 2–3 reference images of curl-noise particle plume systems. Save links + thumbnails to `.coo/jobs/004/refs/`. Deliverable: a one-page memo with the visual reference grid that the 3d-graphics-engineer will work from.

2. **`3d-graphics-engineer`** — primary implementation. Files to create/modify:
   - **CREATE** `src/components/scene/scenes/MiraSupercluster.tsx` — diffuse gas cloud (instanced particle field, ~30–40k particles, smoothed-kernel falloff, blue-cyan additive blending, irregular Perlin-noise-sculpted boundary).
   - **CREATE** `src/components/scene/scenes/MiraKnots.tsx` — five fixed-position galaxy-cluster cores; each is a small sphere with a shader-driven X-ray glow + soft halo billboard. Reads active-language and density state from `mira-state`.
   - **CREATE** `src/components/scene/scenes/MiraPlume.tsx` — GPGPU plume system (ping-pong FBO, same pattern as current MiraAttractor but with emit→return trajectory, not strange attractor). Spawns from active knot position, follows curl-noise velocity field outward, returns along inverse field.
   - **CREATE** `src/lib/mira-state.ts` — zustand slice or plain hook holding `{ activeLang, knotPositions, densities, lastIngestT }`. Auto-cycle controller: `useEffect` driven by phase, ticks language every ~3s. Exposes `window.__miraDebug` (dev-only) for tests.
   - **REWRITE** `src/components/scene/scenes/MiraScene.tsx` — compose Supercluster + Knots + Plume, preserve existing reveal envelope.
   - **UPDATE** `src/components/work/panels/MiraPanel.tsx` — DOM overlay: sync language label brightness with `activeLang`; replace static `RESPONSE TIME 482ms` with the LIVE ticker + training-signal sub-line.
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

## Risks / open questions

- **Risk — supercluster reads as "blob" without enough internal structure.** Mitigation: gas cloud uses Perlin-sculpted boundary + per-particle alpha variation; 5 knots have distinct shapes (not 5 identical spheres). Reference images from deep-researcher will set the bar.
- **Risk — plume return path looks like particles "falling back" rather than "data returning" (could read as failure / collapse).** Mitigation: return path is along a curl-noise inverse field, not straight gravity; particles brighten as they reincorporate (the "ingest" pulse), so the return reads as constructive deposition not collapse.
- **Risk — five simultaneous knot positions over-fit Shapley's actual geometry and look kitsch.** Mitigation: position table is hand-tuned for screen composition, not a literal Shapley scrape. Inspired by, not traced from.
- **Risk — performance regression from new GPGPU pass.** Mitigation: AC8 sets a hard FPS budget verified by `performance-engineer`. If exceeded, fall back to a CPU-driven 4k-particle plume (visually similar at lower density).
- **Open** — should the active knot's plume reincorporate into _only_ its own knot, or distribute a small fraction into _all_ knots (modelling shared backbone learning)? Current spec: same-knot only (cleaner readability). Revisit after first visual round if the metaphor feels too narrow.

## Sign-off

_pending_
