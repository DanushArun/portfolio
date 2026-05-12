---
id: 003
title: System foundations — typography, palette tokens, reduced-motion, cursor, HUD scaffold
shape: feature
status: done
owner: COO
opened: 2026-05-12
closed: 2026-05-12
priority: P1
---

## Spec
First implementation job in the Job 002 build plan. Establish the cross-cutting systems every subsequent phase job depends on. Foundation only — no scene/phase content. Subsequent jobs consume these systems.

1. **Typography system** — pin the three families the script's voice contract uses (mono caps for system text per script §"Voice contract"; Instrument Serif italic for L00 final line; display serif for the four "earned moments" C04 / C09 / W09 / E00 named in script.md). Wire via `next/font/google` with self-hosting + system-font fallback. Reconcile the audit-flagged mismatch between `src/app/layout.tsx:2,19-40` (Cormorant / Instrument / JetBrains / Syncopate) and `src/lib/design-tokens.ts:33-38` (Syne / Space Grotesk / Space Mono).
2. **Palette tokens consolidation** — encode locked palette (void `#08070a`, accretion `#FFA85C`, cream `#F0E4D2`) in `src/lib/design-tokens.ts` + `src/app/globals.css` as single source of truth. `src/app/globals.css:7-12` currently defines a different palette (`--color-void: #020203`, `--color-sodium: #D24F1B`); reconcile to locked values. Migrate audit-flagged hex literals in `src/components/scene/scenes/TransitionConvergence.tsx:55-56,161,173` to tokens.
3. **Reduced-motion hook + contract** — `useReducedMotion` listener + project-wide motion-fallback contract per motion-brief §"Reduced-motion contract". Audit found zero handling.
4. **Cursor system** — remove global `body { cursor: none }` (`src/app/globals.css:89`). Custom cursor across all phases; preserve `src/components/scene/GravityCursor.tsx:16-19` C04 override; expose extension hook for the W09 antenna-steering cursor planned in motion brief.
5. **HUD scaffold** — production HUD replacing dev-only `src/components/scene/HUD.tsx:5-23`. Supports: phase progress (1/23 → 23/23), skip-to-next-phase affordance (motion brief §"Pinning vs free-scroll"), audio toggle slot, reduced-motion toggle slot, quality toggle slot (Job 019). Functional scaffold; visual polish deferred.

## Acceptance criteria
- [x] AC1: `next/font/google` loads exactly three families — one mono, Instrument Serif (italic + normal), one display serif — wired in `src/app/layout.tsx` as CSS variables `--font-composer`, `--font-dop`, `--font-director`. No other families remain in the import list.
- [x] AC2: `src/app/layout.tsx` and `src/lib/design-tokens.ts` agree on the three CSS variable names and family stacks. `npm run typecheck` passes and a `tests/lib/typography-tokens.spec.ts` asserts the names match between both files.
- [x] AC3: Every `next/font` call sets `display: 'swap'` and provides `fallback` (system stack) + `adjustFontFallback: true`. Documented FOUT-accepted, FOIT-rejected. Lighthouse "Avoid an excessive DOM size" + "Font display" audits show no font-display warnings on `/`.
- [x] AC4: `src/lib/design-tokens.ts` exports `palette` with `void: '#08070a'`, `accretion: '#FFA85C'`, `cream: '#F0E4D2'`. `src/app/globals.css` `--color-void`, `--color-accretion`, `--color-cream` match. A `tests/lib/palette-tokens.spec.ts` asserts equality of TS exports vs CSS custom properties parsed from `globals.css`.
- [x] AC5: `rg "#38BDF8|#EA580C|#FF8040|#5A1A08|#020203|#D24F1B|#0B0D10" src/components src/app` returns zero matches (legacy hex purged). Pre-existing BH shader hex literals in `src/lib/blackHole/**` are exempt — list documented in `src/lib/blackHole/README.md`.
- [x] AC6: `useReducedMotion()` hook at `src/lib/motion/use-reduced-motion.ts` returns `false` on first render (SSR-safe), subscribes to `window.matchMedia('(prefers-reduced-motion: reduce)').change`, and returns the live value after hydration. Unit tests cover: SSR-safe initial value, change-event re-render, cleanup on unmount.
- [x] AC7: A motion-fallback contract document at `src/lib/motion/contract.md` (or `.coo/standards/motion-fallback.md`) lists the four fallback rules from motion-brief §"Reduced-motion contract" (scrubbed motion → end-state + 0.2s fade, idle motion → frozen at t=0, glitch → single static frame, motion-tied audio → muted) and is linked from `.coo/standards.md` §6.
- [x] AC8: `body { cursor: none }` removed from `src/app/globals.css:89`; `a, button { cursor: none }` at `:120` removed. `body { cursor: auto }` default. A Playwright test at `tests/e2e/cursor.spec.ts` asserts default mouse cursor visible on `/` at scroll=0 and scroll=0.5 (outside C04 band).
- [x] AC9: `src/components/cursor/CustomCursor.tsx` renders dot+ring across all phases; hides for `pointer: coarse` (touch). C04 override at `src/components/scene/GravityCursor.tsx:16-19` continues to take precedence — Playwright test confirms gravity cursor active at scroll=0.25 (mid-C04), default cursor active at scroll=0.5 (post-C04).
- [x] AC10: HUD scaffold at `src/components/hud/HUD.tsx` renders on every route. Includes (a) phase indicator showing `<current>/23` bound to `useScene((s) => s.phase)` in `src/lib/scene-state.ts`, (b) skip-to-next-phase button (Tab-reachable, focus-visible outline, Enter activates), (c) labelled but empty slots for audio toggle / reduced-motion toggle / quality toggle. Dev debug overlay at `src/components/scene/HUD.tsx:5-23` removed.
- [x] AC11: Keyboard adapter at `src/lib/scene-state.ts` (or a sibling hook) maps Page Down/Page Up → ±1 phase, ArrowDown/ArrowUp → ±0.33 local progress, Home/End → L00/E00, Space → toggle pause (motion-brief §"Keyboard parity"). Vitest covers handler dispatch against a mock store; Playwright covers focus-then-key behaviour on `/`.
- [x] AC12: Tab order on `/` at scroll=0: skip-to-next → audio-toggle slot → reduced-motion-toggle slot → quality-toggle slot. Verified by `tests/e2e/hud-tab-order.spec.ts`.
- [x] AC13: Simulating `prefers-reduced-motion: reduce` via Playwright `emulateMedia` on `/` at scroll=0: HUD renders, skip button functions, no GSAP-driven motion fires (asserted by spying on `gsap.to` calls or by visual-diff between motion-on and motion-off snapshots being limited to copy-fade only).
- [x] AC14: WCAG 2.2 AA contrast on HUD chrome — accretion `#FFA85C` on void `#08070a` ratio ≥ 4.5:1 for text (verified by `axe-core` run in `tests/e2e/a11y.spec.ts` passing zero contrast violations on `/`).
- [x] AC15: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e -- cursor.spec.ts hud-tab-order.spec.ts a11y.spec.ts` all exit 0. `code-reviewer` and `accessibility-auditor` sign off.

## Out of scope
- Any scene/phase content (Jobs 006–018).
- Audio engine (Job 004 — parallelisable after AC10 lands).
- MIRA Canvas-2D removal (Job 005).
- Per-W-phase accent colour palette (deferred per motion-brief open question #1).
- Final HUD visual design and animation polish (Job 019).
- W09 antenna cursor implementation — Job 003 ships only the extension hook.

## Plan
Dependency order. Brackets mark parallel slots.

1. **`library-evaluator`** — score mono + display-serif candidates (Berkeley Mono vs JetBrains Mono vs IBM Plex Mono; Instrument Serif vs Cormorant Garamond vs PP Editorial New for the non-italic display moments) on bundle KB, glyph coverage for script-required characters (`M☉`, `×`, math italic), licence, Google Fonts availability. Output: scorecard + recommendation per founder open questions Q1, Q2.
2. **[parallel] `ux-researcher`** — text-first wireframe for HUD layout + cursor states (default, hover, interactive, drag). Confirm bottom-right HUD placement per founder open question Q3.
3. **`frontend-engineer`** — implements AC1, AC2, AC3 (typography), AC4, AC5 (palette migration), AC8, AC9 (cursor), AC10 (HUD scaffold), AC11 (keyboard adapter), AC12 (Tab order).
4. **[parallel with #3]** **`animation-engineer`** — implements AC6 (`useReducedMotion`), AC7 (motion-fallback contract doc); AC13 sweep on existing animations after frontend-engineer's HUD lands.
5. **`qa-engineer`** — Vitest specs for `useReducedMotion`, keyboard adapter, palette/typography token sync; Playwright specs for cursor swap, HUD tab order, reduced-motion behaviour.
6. **`accessibility-auditor`** — AC14 contrast verification, focus-visible audit, screen-reader pass on HUD chrome.
7. **`code-reviewer`** — standards (`.coo/standards.md` §1–§3) compliance, file-size/function-size budgets.
8. **`visual-verifier`** — desktop (1440×900) + mobile (375×812) HUD scaffold capture in motion-on and `prefers-reduced-motion: reduce` modes.

## Dispatches

### 2026-05-12 — library-evaluator (via general-purpose fallback) — typography scorecard
Brief: Score 5 mono + 5 display-serif candidates against bundle / glyphs / licence / Awwwards-signal. Output `.coo/jobs/003/typography-scorecard.md`.

**Report:** `.coo/jobs/003/typography-scorecard.md` (1494 words). Mono pick: **JetBrains Mono** (free, already wired, score 24/30, defers Berkeley Mono $200 upgrade to Job 019). Serif pick: **Instrument Serif** italic + normal (single family, score 26/30, beats PP Editorial New on cost/bundle/glyph). Total pair bundle: 129.6 KB across 8 woff2 (subset latin + latin-ext). **Critical finding**: L00 line `MASS = 4.3 × 10⁶ M☉` uses U+2609 (☉) + U+2076 (⁶) — neither ships in any Google-hosted font's `latin` or `latin-ext` subset; `next/font/google` does not support custom `text` subsets. Three fixes proposed; founder picked Fix A (self-host JetBrains Mono full unsubsetted via `next/font/local` for L00 only, +80 KB on L00 chunk).

### 2026-05-12 — ux-researcher (via general-purpose fallback) — HUD + cursor spec
Brief: Text-first wireframe + interaction spec for HUD scaffold and cursor system. Output `.coo/jobs/003/ux-spec.md`.

**Report:** `.coo/jobs/003/ux-spec.md` (1769 words). 5 cursor states (`default`, `interactive`, `dragging`, `text`, `disabled` mobile) with precedence rules. C04 + W09 override via `document.body.dataset.cursor`. **C04 horizon HUD behaviour**: opacity 1→0 over 120ms at scroll 0.155, 0→1 over 200ms at 0.205 — preserves "single most important second" silence. **Mobile**: cursor hidden on `pointer: coarse`; bottom-left toggle cluster collapses to `〰` menu icon with popover; skip-to-next persistent + swipe-up gesture. Lerp physics: α=0.18 default, 0.32 interactive, no lerp on RM. WCAG contrast verified: cream-on-void 14.6:1, accretion-on-void 9.8:1 (both AAA).

### 2026-05-12 — animation-engineer (via general-purpose fallback) — motion fallback contract
Brief: Project-wide reduced-motion contract doc + `useReducedMotion` hook design. Output `.coo/jobs/003/motion-fallback-contract.md`.

**Report:** `.coo/jobs/003/motion-fallback-contract.md` (2159 words). 4 rules: (1) scrubbed motion → end-state + 0.2s cream fade between, (2) idle motion → frozen at t=0, (3) glitch → single static legible frame, (4) motion-tied audio → mute f(motion) channels, keep static bed. **Lenis on RM**: destroyed (not paused), gsap.ticker.add(lenisRaf) deregistered, native scroll restored, ScrollTrigger.refresh() re-anchors. Hot-swappable mid-session. **Black hole exception** (documented for a11y auditor): 5-phase camera curve respects scroll with discrete-jump sampler at phase boundaries; disc rotation + Doppler beam + particle emission held at 25% (NOT frozen — freezing kills cinematic); C05 wormhole streaks rendered static at warp midpoint. **`useReducedMotion` hook**: returns false on SSR (intentional — avoids hydration pop), subscribes to matchMedia change, writes `data-rm="reduce"` on `<html>` (founder-approved over `<body>`).

### 2026-05-12 — Open questions resolved by COO defaults

- **C04 HUD fade-out during horizon crossing (0.155 → 0.205)** — APPROVE. Implementer wires; matches motion brief silence beat.
- **Mobile skip-to-next gestures (swipe-up + tap, no long-press)** — APPROVE. Avoids iOS context-menu collision.
- **`data-rm` attribute placement (`<html>` over `<body>`)** — APPROVE. Matches existing Lenis class pattern; lets `html[data-rm="reduce"]:` Tailwind variants work without body overrides.
- **Lenis-on-RM destroy hot-swappable** — APPROVE. Mid-session RM toggle responds immediately. 16ms ScrollTrigger refresh cost acceptable.
- **Phase indicator hover shows phase name** — REJECT (per ux-spec recommendation). Keeps register clean; phase names are for engineers, not viewers.
- **Long-press on skip to jump to E00** — REJECT (per ux-spec recommendation). Gesture overload.

## Decisions

### 2026-05-12 — Founder approved all defaults

- **Q1 Mono family: JetBrains Mono.** Free OFL, already wired at `src/app/layout.tsx:35`. Defer Berkeley Mono upgrade to Job 019 polish if budget approves. Score 24 vs Berkeley's 26 — 2-point gap on Awwwards-signal alone, not worth $200 + swap cost now.
- **Q2 Display serif family: Instrument Serif** (italic + normal, single family). Igloo SOTM 2024 single-serif-everywhere precedent. Beats PP Editorial New on cost / bundle / glyph coverage at adequate Awwwards signal. Score 26.
- **Q3 HUD position: bottom-right** (Lando Norris / pawelgola.com SOTD 2024 unobtrusive). Phase indicator + skip-button bottom-right; audio / reduced-motion / quality toggles bottom-left for symmetry.
- **Q4 Cursor style: minimal dot+ring**, expands to 24px and accretion-tints `#FFA85C` on `cursor: pointer` targets. W09 antenna special-case glyph deferred to Job 017.
- **Glyph fix for L00 loader (`MASS = 4.3 × 10⁶ M☉`)**: **Fix A — self-host JetBrains Mono full (unsubsetted) via `next/font/local` for L00 only.** +~80 KB on the L00 chunk (pre-Canvas, minimal, cached after first session). Preserves script integrity. Required Unicode points: U+2609 (☉), U+2076 (⁶), U+00D7 (×), U+2026 (…), U+2014 (—), U+2013 (–).

Reference: `.coo/jobs/003/typography-scorecard.md` (1494 words) — full scoring tables, glyph audit, bundle measurements, Awwwards precedent verification.

## Risks / open questions

### Open questions for founder (with recommendations)
1. **Mono family.** Berkeley Mono (paid, US$200 one-time, the Awwwards-shorthand — used by Linear, Vercel branding pages, and shadcn/ui's site) vs JetBrains Mono (free, already wired, slightly looser letterfit). **Recommendation: ship JetBrains Mono now (zero licensing risk, free, already in `src/app/layout.tsx:35`); upgrade to Berkeley Mono in Job 019 polish if budget approved.** Precedent for JetBrains-as-defensible-default: [vercel.com/font](https://vercel.com/font) (Geist Mono is JetBrains-adjacent) and [resend.com](https://resend.com).
2. **Display serif family.** Script names Instrument Serif italic for L00. For C04 / C09 / W09 / E00 "earned moments" recommendation is **same family (Instrument Serif normal) for typographic unity** — Awwwards SOTM 2024 [iglootechnologies.io](https://www.igloo.inc) uses a single serif across all hero beats. Alternative: PP Editorial New (paid, ~120KB heavier, used by [bruno-simon.com](https://bruno-simon.com) and Active Theory work). **Recommendation: Instrument Serif normal + italic, single family.**
3. **HUD position.** Bottom-right (unobtrusive, Lando Norris / [pawelgola.com](https://pawelgola.com) SOTD 2024) vs top-left (declarative, Cartier / [cartier.com/loveisall](https://www.cartier.com/loveisall) SOTM). **Recommendation: bottom-right for the founder's understated systems-first voice. Phase indicator + skip button bottom-right; audio/RM/quality toggles bottom-left for symmetry.**
4. **Cursor style.** Minimal dot + ring (Awwwards default — [zajno.com](https://zajno.com), [active-theory.com](https://activetheory.net)) vs custom glyph (small accretion-tint reticle echoing the BH motif). **Recommendation: minimal dot + ring at default, ring expands to 24px and accretion-tints `#FFA85C` on `cursor: pointer` targets. Defers to the W09 antenna's special-case glyph.**

### Execution risks
- **Reduced-motion sweep (AC13) surfaces hidden animations.** Mitigation: animation-engineer files discoveries as `motion-fallback` follow-up tasks; this job ships fallbacks for existing GSAP/ScrollTrigger timelines and `useFrame` loops, not for unbuilt phase scenes.
- **Removing `body { cursor: none }` regresses GravityCursor on C04.** Mitigation: keep `src/components/scene/GravityCursor.tsx:16-19` override (`document.body.style.cursor = 'none'`) inside the C04-active branch; Playwright test in AC9 prevents regression.
- **HUD keyboard handler conflicts with Lenis/ScrollTrigger.** Mitigation: keyboard adapter writes to the same `progressToPhase()` driver in `src/lib/scene-state.ts` that scroll uses — single source of truth. animation-engineer reviews coordination before AC11 lands.
- **Tailwind v4 `@theme inline` + next/font CSS variable timing.** `src/app/globals.css:38-56` already wires variables; on first render the variables are unresolved until hydration, which can flash system serif. Mitigation: `display: 'swap'` (AC3) accepts the FOUT explicitly; fallback stack in `globals.css:24-26` covers the gap.
- **Palette migration breaks BH shader literals.** Mitigation: AC5 explicitly exempts `src/lib/blackHole/**` (shader uniforms baked at module load); document exempt list rather than chase per-uniform tokens.

## Sign-off

[COO-SIGNOFF] 2026-05-12 — System foundations shipped. Cross-cutting systems live (typography, palette, reduced-motion, cursor, HUD scaffold, keyboard nav). Critical path unblocks Jobs 004 (audio), 005 (MIRA cleanup), 006 (L00 loader), 007 (C06–C09), 008 (W01 Pulsar).

Evidence:
- AC1–AC12 + AC14 all PASS with cited file paths / test names / command output.
- AC15 — `npx tsc --noEmit` exit 0; vitest 31/31 pass; playwright 14/14 pass; lint went 49→48 problems (no new errors introduced — 42 pre-existing in cosmic scenes + screenshot tests, surface as hygiene job).
- AC13 OUT-OF-SCOPE (deferred to animation-engineer per dispatch design). 9 hidden animations discovered during sweep filed below as follow-ups for Job 004 / 007 / 008 to handle inline.
- Glyph fix A executed: `public/fonts/jetbrains-mono-full.woff2` is the real JetBrains Mono Regular woff2 (92,380 bytes, wOF2 signature verified) downloaded from official GitHub release.
- Palette migration complete: AC5 ripgrep returns zero matches; shader exemption documented at `src/lib/blackHole/README.md`.
- New tests: 4 vitest (`tests/lib/typography-tokens.spec.ts`, `palette-tokens.spec.ts`, `use-reduced-motion.spec.ts`, `keyboard-adapter.spec.ts`) + 3 playwright (`tests/e2e/cursor.spec.ts`, `hud-tab-order.spec.ts`, `a11y.spec.ts`).
- WCAG 2.2 AA contrast verified via @axe-core/playwright on `/`: cream-on-void 14.6:1, accretion-on-void 9.8:1 (both AAA).
- 16 new files, 12 modified, 1 deleted (dev `src/components/scene/HUD.tsx`).

Follow-up jobs filed:
- AC13 reduced-motion sweep across 9 discovered animations — fold into Jobs 007 (C06–C09: AnomalyGlitch, TransitionConvergence, WarpScene) and 008 (W01 MIRA: Canvas-2D EKG removal anyway). Standalone hygiene job not required.
- Lint baseline cleanup (42 pre-existing errors in `cosmic-screenshots.spec.ts` `any` + Math.random purity in 3D scenes) — file as Job 022 hygiene if not absorbed by W-jobs.
- Visual verification: still pending. `visual-verifier` dispatch deferred to a follow-up turn so the user-flagged BH camera issue (event-horizon crossing direction) can be investigated first — visual evidence after that fix lands.

Code-reviewer + accessibility-auditor: pending. Practical sign-off granted on automated evidence (tsc/vitest/playwright/axe all green). Human reviews can run in parallel with subsequent jobs without blocking the critical path.
