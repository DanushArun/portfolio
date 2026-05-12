# Build plan — Danush Arun portfolio (Job 002)

Date: 2026-05-12
Author: website-builder (via general-purpose fallback)
Predecessor inputs: gap analysis, script v1, motion brief v1, audit, references.

## Critical path
Each step blocks subsequent steps.

1. **Job 003 — System foundations.** M. frontend-engineer (lead) + ux-researcher. Typography pinned (Cormorant/Instrument/JetBrains), `design-tokens.ts` synced with `layout.tsx`, palette consolidated (`#08070a`/`#FFA85C`/`#F0E4D2`), `prefers-reduced-motion` context, cursor fix (`globals.css:90` scoped to C04), HUD scaffold, keyboard skeleton. **Blocks all phase work.**
2. **Job 004 — Audio engine.** M. library-evaluator → animation-engineer + frontend-engineer. AudioContext init on first gesture, singleton at `lib/audio/engine.ts`, ambient-orchestral bed, per-phase SFX API, mute on reduced-motion, AudioToggle in HUD.
3. **Job 005 — MIRA Canvas-2D removal.** S. frontend-engineer + code-reviewer. Delete `src/app/mira/page.tsx` + `MiraPanel.tsx` + any Canvas-2D helpers. Grep confirms zero `/mira` references. Clears W01 rebuild.
4. **Job 006 — L00 Glitch loader.** M. frontend-engineer (lead) + animation-engineer + visual-verifier. DOM-only loader to script timing, first-scroll detonation → C01, reduced-motion path ≤0.4s, LCP impact ≤ baseline.
5. **Job 007 — Cosmic re-direct C06–C09.** L. 3d-graphics-engineer (lead) + animation-engineer + frontend-engineer + visual-verifier. C06 RGB-split shader replaces cubes; C07 token swap + title; C08 twin Suns replaced with 9 pinpricks + bloom flare; C09 display-serif title card.
6. **Job 008 — W01 MIRA Pulsar Station.** L. 3d-graphics-engineer (lead) + animation-engineer + frontend-engineer + qa-engineer + visual-verifier. WebGL pulsar with 5 language waveform beams, drag-to-switch, real samples, spin 1.243 Hz, reduced-motion still gallery, ≥60 FPS iPhone 12. **Sign-off documents W-phase scaffold contract (`onEnter`/`onTick`/`onExit`) reused by Jobs 010–017.**

## Parallel tracks

**Track A — Cosmic polish (after Job 003)**
- Job 009 — C01–C05 copy + telemetry (S). Subtitle, telemetry binding, white flash, display title, two warp lines, `WarpScene.tsx` cylinder cleanup.

**Track B — W-places (after Job 008 scaffold)**
- Job 010 — W02 AIDEN Observatory (L)
- Job 011 — W03 Vanguard Sentinel (L)
- Job 012 — W04 Veronica Dry-dock + FuryX caption (L)
- Job 013 — W05 Wave Field Research Station (L, quality-toggle)
- Job 014 — W06 EMI Engine Shielded Forge (L, quality-toggle)
- Job 015 — W07 Formula Manipal Race Line (L)
- Job 016 — W08 The Engineer Control Room + Tescom footnote (M)
- Job 017 — W09 Connect Signal Antenna (M)

**Track C — Cross-cutting after W's land**
- Job 018 — E00 Outro + CV download (S)
- Job 019 — Performance pass + quality toggle (M)
- Job 020 — Full a11y audit + fixes (M)
- Job 021 — Awwwards submission prep (S)

## Sequencing diagram
```
Job 003 (foundations) ─┐
Job 004 (audio) ───────┼──> Job 005 (MIRA cleanup) ─> Job 008 (W01 MIRA)
                       │                                    │
                       │                                    ├─> Jobs 010–017 (W02–W09 parallel)
                       ├──> Job 006 (L00 loader)            │
                       │                                    ▼
                       └──> Job 007 (C06–C09 redirect)  Job 018 (E00)
                                                            │
                                                            ▼
                                                    Job 019 (perf) + Job 020 (a11y)
                                                            │
                                                            ▼
                                                    Job 021 (Awwwards submission)
                                                            │
                                                            ▼
                                                    SHIP CANDIDATE
```

## Per-follow-on-job spec preview

### Job 003 — System foundations
- Shape: feature; Priority: P1
- Specialists: frontend-engineer (lead), ux-researcher
- AC: typography pinned (Cormorant + Instrument + JetBrains); `design-tokens.ts:33-38` synced with `layout.tsx:12-40`; palette consolidated; `prefers-reduced-motion` context exposed via hook + threaded into GSAP timelines; `globals.css:90` global `cursor: none` scoped to C04; HUD scaffold renders; keyboard handler skeleton bound to Lenis.

### Job 004 — Audio engine
- Shape: feature; Priority: P1
- Specialists: library-evaluator → animation-engineer + frontend-engineer
- AC: AudioContext init on L00 first scroll; singleton at `lib/audio/engine.ts`; ambient-orchestral bed plays; `playSfx(phase, key)` API; respects reduced-motion; AudioToggle in HUD; `fd514c7` recovered only as reference.

### Job 005 — MIRA Canvas-2D removal
- Shape: chore; Priority: P1
- Specialists: frontend-engineer + code-reviewer
- AC: `src/app/mira/page.tsx` + `MiraPanel.tsx` + Canvas-2D-only helpers deleted; grep confirms zero internal `/mira` references; tests + typecheck pass.

### Job 006 — L00 Glitch loader
- Shape: feature; Priority: P1
- Specialists: frontend-engineer (lead), animation-engineer, visual-verifier
- AC: DOM-only loader renders 7 fragments per script timing (~120ms each); Instrument Serif italic final line; tape-stop tick + LF rumble; first-scroll detonates to C01; reduced-motion final-line-only ≤0.4s; LCP impact ≤ baseline.

### Job 007 — Cosmic re-direct C06–C09
- Shape: feature; Priority: P1
- Specialists: 3d-graphics-engineer (lead), animation-engineer, frontend-engineer, visual-verifier
- AC: C06 cubes in `AnomalyGlitch.tsx:73-83` replaced with screen-space RGB-split on starfield, `uChromaIntensity` driven by animator; C07 hard-coded hex swapped for tokens + "nine systems. one engineer." lands; C08 Suns replaced with 9 pinpricks + additive bloom flare + per-W accent seed; C09 display-serif title with documented letter-spacing exception.

### Job 008 — W01 MIRA Pulsar Station
- Shape: feature; Priority: P1
- Specialists: 3d-graphics-engineer (lead), animation-engineer, frontend-engineer, qa-engineer, visual-verifier
- AC: WebGL pulsar + 5 superimposed Doppler-pitched waveform beams; click-to-slow-time + per-language sample (Tamil/Hindi/Telugu/Kannada/Bengali); drag-to-switch reshapes waveforms live; spin 1.243 Hz; **W-phase scaffold contract documented**; reduced-motion still gallery; ≥60 FPS iPhone 12.

### Job 009 — C01–C05 copy + telemetry
- Shape: feature; Priority: P1
- Specialists: frontend-engineer + animation-engineer + 3d-graphics-engineer
- AC: C01 subtitle + hint + h1; C02 telemetry digit-strip bound to scrollVelocity + `uDiscBloom` plumbed; C03 telemetry colour-flip + flicker + tidal-stretch vertex shader; C04 white flash overlay + display title + silence beat; C05 two mono lines + `WarpScene.tsx` cylinders removed + veil crossfade wired.

### Job 010 — W02 AIDEN Observatory
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + animation-engineer + frontend-engineer
- AC: 8-faced polyhedron + per-face SOP shaders; diarization dual-colour; drag-face-to-expand; reuses W01 scaffold.

### Job 011 — W03 Vanguard Sentinel
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + animation-engineer + frontend-engineer
- AC: sentinel craft + planet shader (red→amber→green state per `copy.ts:31-35`); click-inject-fault + VLM-reasoning tile.

### Job 012 — W04 Veronica + FuryX caption
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + animation-engineer + performance-engineer + frontend-engineer
- AC: two-wheeler + 5 ring sweep matching `copy.ts:44` layers; defect counter + timeline scrubber; FuryX caption line; quality-toggle high/low.

### Job 013 — W05 Wave Field
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + animation-engineer + performance-engineer + frontend-engineer
- AC: volumetric curves + token slider 1K→1M; camera-lock-at-1M + scroll-up affordance; audio asymmetry; quality-toggle.

### Job 014 — W06 EMI Engine
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + animation-engineer + performance-engineer
- AC: chamber + slab + dial 100 kHz→10 GHz; 3D field-line viz; hover dB tooltip; quality-toggle.

### Job 015 — W07 Formula Manipal
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + animation-engineer + frontend-engineer
- AC: track ribbon + EV silhouette; INITIAL/OPTIMIZED path overlays per `copy.ts:74`; click-EV side-panel.

### Job 016 — W08 Engineer Control Room
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + frontend-engineer + scriptwriter
- AC: console + orbiting chip rings; hover-recompile state; journey-progress-mirror shader; **`copy.ts:80` rewritten to voice contract** (no "love"); Tescom footnote.

### Job 017 — W09 Connect Antenna
- Shape: feature; Priority: P1; Specialists: 3d-graphics-engineer + animation-engineer + frontend-engineer
- AC: antenna + cursor-tracking IK + 3 beam shaders + hover-lock; display-serif "let's build." CTA; **`copy.ts:94` email corrected to `growth@partner.drivex.in`**; reduced-motion uses keyboard focus.

### Job 018 — E00 Outro + CV
- Shape: feature; Priority: P1; Specialists: frontend-engineer + animation-engineer
- AC: display-serif closing line; CTA + contact row + Download CV (PDF); technique-credit footer; starfield drift 0.02 px/s; all copy immediate under reduced-motion.

### Job 019 — Performance pass
- Shape: chore; Priority: P1; Specialists: performance-engineer + frontend-engineer + 3d-graphics-engineer
- AC: FPS monitor per phase; baseline on iPhone 12 / Pixel 6 / desktop; mobile DPR cap; quality toggle in HUD (high/low) with per-phase preset; W04/W05/W06 under budget at low; Lighthouse perf ≥ 90.

### Job 020 — Full a11y audit
- Shape: chore; Priority: P1; Specialists: accessibility-auditor + frontend-engineer
- AC: WCAG 2.2 AA; semantic landmarks on `/`; focus styles; skip link; ARIA on copy reveals; reduced-motion alt text; keyboard parity verified; Lighthouse a11y ≥ 95.

### Job 021 — Awwwards submission prep
- Shape: chore; Priority: P1; Specialists: frontend-engineer + product-strategist + visual-verifier
- AC: Chrome/Safari/Firefox × desktop+mobile matrix; zero console errors; zero broken links; submission copy; reference shots per phase; SOTD/SOTM/SOTY eligibility.

## Risks and mitigations

1. **W-phase build order causes integration drift.** Job 008 ships the scaffold contract documented in sign-off; Jobs 010–017 must reuse it. COO blocks dispatches of 010–017 until 008 documentation is visible.
2. **Audio re-introduction churns reverted files.** `git show fd514c7` recovers earlier engine as reference only; library-evaluator picks fresh against perf budget + mobile autoplay policy + bundle size.
3. **Perf degrades as W-phases stack.** Job 019 is non-negotiable pre-ship. Quality toggle from motion brief. W04/W05/W06 perf checked per build, not at end.
4. **Direction-package gaps surface mid-implementation.** Each W-job may re-dispatch scriptwriter / animator for per-phase refinement. v1 docs are drafts.
5. **Asset pipeline blocks W01 + E00.** Parallel asset-sourcing inside Job 004 (audio bed) + Job 018 (CV). Founder delivers 5 MIRA samples by Job 008 week 1 or W01 ships with placeholders + swap-in.
6. **Cursor regression breaks UX during foundation transition.** Job 003 ships the fix in the same commit as the rule removal; visual-verifier confirms across phases on sign-off.

## Estimated effort

- Critical path (Jobs 003–008): ~3–4 weeks agent + human-review cycles.
- Parallel tracks (Jobs 009–017): ~6–10 weeks dispatched in parallel where independent. Track B is the longest pole; 8 L-effort builds sequential is ~8 weeks, parallel-dispatched compresses to ~6.
- Cross-cutting (Jobs 018–021): ~2 weeks.
- **Total: ~10–14 weeks calendar**, assuming prompt founder reviews and on-schedule assets.

## Submission to Awwwards.com
- Window: after Jobs 019 + 020 sign-off.
- Targets: Site of the Day → Site of the Month → Site of the Year.
- Pre-submission checklist (Job 021): Lighthouse perf ≥ 90, a11y ≥ 95, SEO basics, zero console errors, zero broken links, all 21 phases tested across Chrome/Safari/Firefox × desktop + mobile, reduced-motion verified, audio + a11y toggles verified.

## Open questions for founder
1. **Hard ship date / target Awwwards submission week.** Drives whether Track B compresses to parallel dispatch (faster, more agent cost) or sequential (cheaper, ~2 weeks longer).
2. **Founder asset delivery dates** — 5 MIRA language samples, CV PDF, preferred ambient-orchestral bed. Late assets delay Jobs 008 and 018.
3. **W04/W05/W06 quality-toggle policy** — founder veto on shipping a "low" preset, or trust performance-engineer's Job 019 call?
