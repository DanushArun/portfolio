# Gap analysis — Danush Arun portfolio (Job 002)

Date: 2026-05-12
Author: website-builder (via general-purpose fallback)
Inputs: script v1, motion brief v1, audit, references.

## Summary table

| Phase | State | Effort | Owner specialists | Blocks |
|---|---|---|---|---|
| L00 | missing | M | frontend-engineer + animation-engineer | C01 entry feel |
| C01_ORBIT | strong — copy | S | frontend-engineer | — |
| C02_PULL | strong — telemetry copy | S | frontend-engineer + animation-engineer | — |
| C03_STRETCH | partial — stretch shader + flicker | M | 3d-graphics-engineer + animation-engineer | — |
| C04_HORIZON | partial — flash + title card | M | 3d-graphics-engineer + animation-engineer | C05 silence |
| C05_WARP | partial — copy + cylinder cleanup | M | 3d-graphics-engineer + animation-engineer | C06 veil |
| C06_ANOMALY | weak — placeholder | L | 3d-graphics-engineer + animation-engineer | C07–C09 |
| C07_TRANSITION | partial — tokens + title | S | frontend-engineer + animation-engineer | C08 |
| C08_EMERGE | weak — procedural Suns reject | L | 3d-graphics-engineer + animation-engineer | C09 + W01 |
| C09_PROJECT | partial — title card | S | frontend-engineer + animation-engineer | W01 entry |
| W01_MIRA | rejected Canvas-2D — full rebuild | L | 3d-graphics-engineer + animation-engineer + frontend-engineer + qa-engineer | W02–W09 scaffold |
| W02_AIDEN | stubbed | L | 3d-graphics-engineer + animation-engineer + frontend-engineer | — |
| W03_VANGUARD | stubbed | L | 3d-graphics-engineer + animation-engineer + frontend-engineer | — |
| W04_INSPECTION | stubbed (+ FuryX caption) | L | 3d-graphics-engineer + animation-engineer + performance-engineer | — |
| W05_WAVEFIELD | stubbed (quality-toggle) | L | 3d-graphics-engineer + animation-engineer + performance-engineer | — |
| W06_EMI | stubbed (quality-toggle) | L | 3d-graphics-engineer + animation-engineer + performance-engineer | — |
| W07_FORMULA | stubbed | L | 3d-graphics-engineer + animation-engineer + frontend-engineer | — |
| W08_ABOUT | stubbed (+ Tescom footnote) | M | 3d-graphics-engineer + frontend-engineer | — |
| W09_CONNECT | stubbed (antenna cursor) | M | 3d-graphics-engineer + animation-engineer + frontend-engineer | E00 |
| E00 | missing | S | frontend-engineer + animation-engineer | ship |

## Per-phase detail

### L00 — Glitch Loader
- **Vision:** DOM-layer 2–3s loader. 7 mono caps fragments (`BOOT` → `OK`×3), Instrument Serif italic resolved line. Tape-stop tick + LF rumble. First scroll detonates into GPU dust → C01. Reduced-motion: instant final line ≤0.4s.
- **Current state:** `VoidPrologue.tsx:78-90` hard-vanishes at 3.8s with generic "INITIALISING SINGULARITY". Audit flags as collision with BH startup.
- **Gap:** DOM glitch component (stepped fragment swap `cut` 120ms, RGB-split 3px, scanline noise), AudioContext init hookup, first-scroll detonation, reduced-motion branch.
- **Effort:** M. **Owner:** frontend-engineer (lead) + animation-engineer + performance-engineer (LCP guard).
- **Blocks:** C01 entry feel; AudioContext creation (browser first-gesture policy).

### C01_ORBIT
- **Vision:** Hero (BH) + author. Subtitle mono caps "systems-first AI engineer". Hint pulses at 0.4 Hz. autoRotate decouples on first scroll.
- **Current state:** Production-grade (`blackHole/index.ts:74-238,258`). Title plate ships. Subtitle / hint / h1 missing.
- **Gap:** DOM subtitle + hint timing, semantic h1, autoRotate-decouple wiring.
- **Effort:** S. **Owner:** frontend-engineer + animation-engineer.

### C02_PULL
- **Vision:** "gravitational pull engaged" + telemetry `r = R₀·e^(−λp)` ticks per scroll. Disc-bloom shader uniform.
- **Current state:** Math (`blackHole/index.ts:621`) ships. No copy / telemetry / `uDiscBloom`.
- **Gap:** Telemetry digit-strip widget bound to `scene-state.scrollVelocity` (transform-only, no reflow); `uDiscBloom` uniform plumbed.
- **Effort:** S. **Owner:** frontend-engineer + animation-engineer + 3d-graphics-engineer (uniform).

### C03_STRETCH
- **Vision:** Spaghettification. Glitching telemetry → "tidal stress = critical"; "do not look away" flicker × 2; tidal-stretch vertex shader on text particles.
- **Current state:** FOV ramp 45°→95° (`:629`) + RGB shift + text-particle pull (`:317`) ship. No tidal shader, no copy.
- **Gap:** Tidal-stretch vertex displacement on text-particle material; DOM telemetry colour-flip + flicker timing.
- **Effort:** M. **Owner:** 3d-graphics-engineer (lead) + animation-engineer + frontend-engineer.

### C04_HORIZON
- **Vision:** ~600ms held silence, mono `c reached`, **white flash** on z=0, display-serif "event horizon" 1.2s hold, sub-bass woosh, C05 pad pre-roll −18dB.
- **Current state:** Phase B dive ships (`:633-655`). `GravityCursor.tsx` correct. **No flash, no title, no silence beat.**
- **Gap:** Full-viewport `#F0E4D2` flash overlay (80ms in / 320ms out) on z=0 crossing; Cormorant Garamond ~88px title; audio fade-to-silence helper.
- **Effort:** M. **Owner:** 3d-graphics-engineer (flash trigger) + animation-engineer + frontend-engineer.
- **Blocks:** C05 — silence beat is the runway for C05 pad swell.

### C05_WARP
- **Vision:** Doppler-pitched synth pad. Two mono caps lines. Veil crossfade 0.358→0.363 hands off to R3F. Remove redundant `WarpScene.tsx` cylinders.
- **Current state:** Wormhole transit production-grade (`:656-682`). `WarpScene.tsx:35-75` cylinders redundant per audit. Veil primitive (`SceneManager.tsx:130-140`) exists but unused.
- **Gap:** Wire veil crossfade, remove duplicate cylinders, two mono lines `gravity-arrival` in / `event-horizon` out.
- **Effort:** M. **Owner:** 3d-graphics-engineer (lead) + animation-engineer + frontend-engineer.

### C06_ANOMALY
- **Vision:** RGB-split shader on R3F starfield. `uChromaIntensity` stepwise 0→0.7→0 in seven 80ms steps. "signal acquired" + "something is here."
- **Current state:** Cyan wireframe cubes (`AnomalyGlitch.tsx:73-83`) — audit flagged as 2014-Codrops, unworthy of bar. `design-tokens.cosmicHues.glitchA/B/C` defined but unused.
- **Gap:** Replace cubes with screen-space RGB-split pass on starfield; camera jitter (`CameraRig.tsx:17-23`) re-coordinated with chroma timeline; two copy lines `cut` easing.
- **Effort:** L. **Owner:** 3d-graphics-engineer (lead) + animation-engineer + frontend-engineer.
- **Blocks:** C07–C09 (R3F universe begins here; cap on whole right half).

### C07_TRANSITION
- **Vision:** Chaos→orbit + 3 rings (the strongest R3F scene besides BH). Centred mono "nine systems. one engineer."
- **Current state:** Convergence math (`TransitionConvergence.tsx:98-148`) ships. Hard-coded `#38BDF8` / `#EA580C` per audit. No copy.
- **Gap:** Swap hex for tokens (`void`, `accretion`); DOM copy with `gravity-arrival`; audio resolve hook.
- **Effort:** S. **Owner:** frontend-engineer + animation-engineer.

### C08_EMERGE
- **Vision:** 9 distant pinpricks at distinct distances/colours — each a W-phase. "welcome to the universe." Camera lift.
- **Current state:** Procedural twin Suns + `SunMaterial` (`EmergeSystem.tsx:11-113,209-233`) — audit flagged as "shader demo" aesthetic.
- **Gap:** Replace twin-Sun scene with 9 GPU-additive point sprites, stagger reveal across sub-scroll 0.48→0.508, additive bloom flare uniform per sprite, per-W accent seed.
- **Effort:** L. **Owner:** 3d-graphics-engineer (lead) + animation-engineer + frontend-engineer.
- **Blocks:** C09 + W01 entry.

### C09_PROJECT
- **Vision:** Display-serif "Selected work." caption "nine places…" hint "scroll to enter the first." One bell tone. Camera pull-back; nearest pinprick grows to 60% frame.
- **Current state:** Camera pull-back ships (`CameraRig.tsx:36-41`); dashboard fade-in (`WorkDashboard.tsx:22`). No title / caption / hint.
- **Gap:** Display-serif title with documented letter-spacing exception (0.04em→0.01em over 700ms); caption + hint; bell-tone cue; camera lerp retimed.
- **Effort:** S. **Owner:** frontend-engineer + animation-engineer.

### W01_MIRA — Pulsar Station
- **Vision:** Rotating pulsar emitting 5 superimposed Doppler-pitched waveforms (one per Indian language). 482ms latency hard-rendered as 1.243 Hz spin. Click to slow time + hear greeting; drag to switch language.
- **Current state:** **Rejected.** `work/panels/MiraPanel.tsx` (197 lines Canvas-2D) + `src/app/mira/page.tsx` (207 lines) must be deleted before rebuild.
- **Gap:** Delete `/mira` + Canvas-2D panel. Build WebGL pulsar as R3F scene: 5 waveform beam shaders, language drag, real audio samples, pulsar-tick driver. **Defines W-phase scaffold contract (`onEnter`/`onTick`/`onExit`) every subsequent W-phase reuses.**
- **Effort:** L. **Owner:** 3d-graphics-engineer (lead) + animation-engineer + frontend-engineer + qa-engineer + visual-verifier.
- **Blocks:** W02–W09.

### W02_AIDEN — Observatory
- **Vision:** 8-faced polyhedron, each face one SOP dimension lit by live data. Diarization waveform dual-colour. Drag-face-to-expand → SOP scoring chart on call timeline.
- **Current state:** `AidenPanel.tsx` returns `<div>Stub</div>`. Copy in `copy.ts:15-23`.
- **Gap:** R3F observatory scene + drag-to-expand + diarization shader. Reuse W01 scaffold.
- **Effort:** L. **Owner:** 3d-graphics-engineer + animation-engineer + frontend-engineer.

### W03_VANGUARD — Sentinel
- **Vision:** Compact craft + off-camera planet. Surface flickers red→amber→green per `copy.ts:31-35`. Click-inject-fault → drone self-heals; VLM-reasoning tile.
- **Current state:** Stub.
- **Gap:** Sentinel geometry + planet shader + orbit trail + click handler + state machine.
- **Effort:** L. **Owner:** 3d-graphics-engineer + animation-engineer + frontend-engineer.

### W04_INSPECTION — Dry-dock (Veronica + FuryX caption)
- **Vision:** Two-wheeler + 5 concentric rings (matches `copy.ts:44` layers) sweep laying heatmap. Defect counter climbs. FuryX folds into caption.
- **Current state:** Stub.
- **Gap:** Two-wheeler model + 5-ring sweep shader + defect particle accumulation + timeline scrubber. Quality-toggle candidate.
- **Effort:** L. **Owner:** 3d-graphics-engineer + animation-engineer + performance-engineer + frontend-engineer.

### W05_WAVEFIELD — Research Station
- **Vision:** Two volumetric curves. Slider 1K→1M. At 1M, wall is 200,000× taller; camera locks; viewer scrolls up.
- **Current state:** Stub.
- **Gap:** Curve geometry + slider + camera-lock logic + audio asymmetry. Quality-toggle candidate.
- **Effort:** L. **Owner:** 3d-graphics-engineer + animation-engineer + performance-engineer + frontend-engineer.

### W06_EMI — Shielded Forge
- **Vision:** Chamber + composite slab + frequency dial 100 kHz→10 GHz + 3D EM field-line viz showing bending/scattering/absorbing. Hover for dB.
- **Current state:** Stub.
- **Gap:** Chamber + slab geometry + EM field-line shader + dial interaction + hover tooltip. Quality-toggle candidate.
- **Effort:** L. **Owner:** 3d-graphics-engineer + animation-engineer + performance-engineer.

### W07_FORMULA — Race Line
- **Vision:** Closed-loop ribbon. INITIAL (red, wider) + OPTIMIZED (white, tight to apex) paths. EV silhouette runs optimized line on loop. Click-EV → path-planning side panel.
- **Current state:** Stub. Legend in `copy.ts:74`.
- **Gap:** Track ribbon geometry + EV silhouette + path overlay shaders + side-panel UI.
- **Effort:** L. **Owner:** 3d-graphics-engineer + animation-engineer + frontend-engineer.

### W08_ABOUT — The Engineer (Control Room)
- **Vision:** Spare console floating in space. Stack-chips orbit in concentric rings. Console screen reflects journey-progress. Hover-chip → recompiles to one project. Tescom one-line footnote.
- **Current state:** Stub. **`copy.ts:80` violates voice contract** ("loves building" — forbidden words).
- **Gap:** Console geometry + orbiting chip-text + hover-recompile state + journey-progress-mirror shader. Voice-contract copy rewrite.
- **Effort:** M. **Owner:** 3d-graphics-engineer + frontend-engineer + scriptwriter (copy fix).

### W09_CONNECT — Signal Antenna
- **Vision:** Antenna tracks cursor. 3 beams: LinkedIn, GitHub, Email. Hover locks; chosen beam brightens. Only object that sees the viewer.
- **Current state:** Stub. **`copy.ts:94` email `procx@partner.drivex.in` must change to `growth@partner.drivex.in`** per memory.
- **Gap:** Antenna geometry + cursor-tracking IK + 3 beam shaders + hover-lock + link dispatch. Display-serif "let's build." CTA. Email correction.
- **Effort:** M. **Owner:** 3d-graphics-engineer + animation-engineer + frontend-engineer.
- **Blocks:** E00.

### E00 — Outro / contact
- **Vision:** Display-serif closing line. CTA `growth@partner.drivex.in`. Contact row + Download CV (PDF). Technique-credit footer. Starfield drifts 0.02 px/s.
- **Current state:** Missing.
- **Gap:** DOM-only outro pinned past 1.000; CV PDF in `public/`; technique-credit copy.
- **Effort:** S. **Owner:** frontend-engineer + animation-engineer.

## Cross-cutting gaps

### Audio engine
- **Vision:** Ambient-orchestral bed (Interstellar-family) + diegetic SFX. AudioContext init on first user gesture.
- **Current state:** `useAudio.ts` 2-line stub. Engine reverted in `aa13c7c`; working state machine lived at `fd514c7`.
- **Gap:** Re-introduce singleton at `lib/audio/engine.ts`. library-evaluator picks lib (Web Audio hand-roll vs Howler vs Tone). Per-phase sub-layer crossfade. Mute on `prefers-reduced-motion`.
- **Effort:** M. **Owner:** library-evaluator → animation-engineer + frontend-engineer.
- **Blocks:** every audio cue (all 21 phases).

### Reduced-motion system
- **Vision:** Explicit fallback per phase. Still-image gallery + keyboard nav.
- **Current state:** Zero handling — grep returns nothing.
- **Gap:** React context + per-component branches; passed to every GSAP timeline.
- **Effort:** M. **Owner:** animation-engineer + frontend-engineer + accessibility-auditor.

### Cursor system
- **Vision:** Default cursor visible; `cursor: none` only inside C04 (owned by `GravityCursor.tsx`). Antenna cursor on W09.
- **Current state:** `globals.css:90` sets `body { cursor: none }` globally — regression per audit.
- **Gap:** Remove global rule; scope to C04; W09 antenna module.
- **Effort:** S. **Owner:** frontend-engineer.

### Typography system
- **Vision:** Mono caps (system) + Instrument Serif italic (narrative pivots) + Cormorant Garamond display serif (C04, C09, W09, E00).
- **Current state:** `layout.tsx` declares Cormorant/Instrument/JetBrains/Syncopate; `design-tokens.ts:33-38` references Syne/Space Grotesk/Space Mono. Mismatched.
- **Gap:** Pin Cormorant + Instrument + JetBrains. Sync `design-tokens.ts` to `layout.tsx`. Delete unused families.
- **Effort:** S. **Owner:** frontend-engineer.

### HUD / nav / scroll affordance
- **Vision:** Minimal HUD — phase index, skip-to-next, audio toggle, reduced-motion toggle, quality toggle. No logo competing with universe.
- **Current state:** Dev-only debug (`HUD.tsx:5-23`). No production surface.
- **Gap:** Minimal production HUD; ux-researcher briefs affordance.
- **Effort:** M. **Owner:** ux-researcher + frontend-engineer + animation-engineer.

### Keyboard parity
- **Vision:** Page Down/Up = ±1 phase; arrows = ±0.33 local; Home/End = L00/E00; Space = pause.
- **Current state:** Scroll-only.
- **Gap:** Keyboard handler bound to Lenis + ScrollTrigger; respects `prefers-reduced-motion`.
- **Effort:** M. **Owner:** frontend-engineer + animation-engineer.

### MIRA cleanup
- **Current state:** `src/app/mira/page.tsx` + `MiraPanel.tsx` exist (Canvas-2D, rejected).
- **Gap:** Delete both + any helpers; grep confirms no `/mira` references.
- **Effort:** S. **Owner:** frontend-engineer + code-reviewer.
- **Blocks:** W01 rebuild.

### Performance budget
- **Vision:** 60 FPS on iPhone 12 / Pixel 6; LCP < 2.5s; quality toggle for W04/W05/W06.
- **Current state:** No FPS monitor; no quality toggle; no adaptive DPR; BH DPR `min(devicePixelRatio,2)`, R3F DPR `[1,1.5]`.
- **Gap:** Instrument + baseline + mobile DPR cap + quality toggle.
- **Effort:** M. **Owner:** performance-engineer + frontend-engineer + 3d-graphics-engineer.

### Accessibility
- **Vision:** WCAG 2.2 AA. Focus visible. ARIA on dynamic content. Skip links. Semantic landmarks.
- **Current state:** `aria-hidden` on canvases only. No landmarks on `/`. No focus trap. No skip link.
- **Gap:** Landmarks, focus styles, skip-link, ARIA on copy reveals, alt text on reduced-motion stills.
- **Effort:** M. **Owner:** accessibility-auditor + frontend-engineer.

### Asset pipeline
- **Vision:** 7 audio files (per `public/audio/README.md`), CV PDF, 5 MIRA language samples, license-clear ambient bed.
- **Current state:** Zero audio files. No CV. `public/` has default Next.js SVGs only.
- **Gap:** Founder-sourced CV + samples; license-clear bed; loader plumbing.
- **Effort:** M. **Owner:** product-strategist + dependency-manager + frontend-engineer.

## Strong points to preserve
- `blackHole/index.ts` 5-phase camera curve (C01–C05) and `r=R₀·e^(−λp)` math.
- Doppler-beaming shader (`shaders.ts:86-93`, Schnittman `:335-342`) — EHT-faithful.
- Gravitational cursor lag (`GravityCursor.tsx:38-65`).
- Zustand + ScrollTrigger + Lenis stack + test handle.
- Phase/progress state model (`scene-state.ts`, `journey-map.ts`).
- Design tokens + 6 named easings (extend to 7 per motion brief).
- TransitionConvergence chaos→orbit math (`TransitionConvergence.tsx:98-148`).
- Veil crossfade primitive (`SceneManager.tsx:130-140`) — ready for C05→C06 handoff.
