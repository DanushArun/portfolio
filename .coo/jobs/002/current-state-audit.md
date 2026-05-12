# Current state audit — portfolio direction (Job 002)

Date: 2026-05-12
Auditor: website-builder (via general-purpose fallback)
Scope: All 18 journey phases + cross-cutting systems.

## TL;DR
- **Strong:** Raw-Three.js black hole + 5-phase camera curve (`src/lib/blackHole/index.ts:581-697`) is production-grade; phase machinery (`journey-map.ts`, `scene-state.ts`) clean and testable; design tokens + easings authored.
- **Weak:** 8 of 9 work panels are 1-line stubs; R3F cosmic scenes C06–C09 are placeholder wireframes/procedural Suns; HUD is dev-only debug overlay.
- **Missing:** No on-screen narrative copy in cosmic phases, no project deep-dives past `/mira`, no audio (`useAudio.ts` is a 2-line stub), no `prefers-reduced-motion`, no keyboard/nav model.

## Architecture summary
Dual-canvas with phase-gated mounting. `SceneManager.tsx:90-127` conditionally renders raw Three.js black hole (`BlackHoleMount` → `createBlackHole`) for C01–C05, or an R3F `<Canvas>` (CameraRig + StarField + per-phase scene) from C06 onward. WARP overlaps both canvases with manual alpha fade (`SceneManager.tsx:67-70`). Work phases mount DOM `WorkDashboard` plus a second R3F `WorkBackdrop` canvas. Scroll → phase is a single ScrollTrigger driving `progressToPhase()` (`ScrollOrchestrator.tsx:47-62` → `journey-map.ts:55-76`); Lenis provides smooth wheel. Phase state in Zustand (`scene-state.ts:65-127`). Page wrapper is 1500vh spacer (`SceneManager.tsx:149`).

## Per-phase inventory

### C01_ORBIT (0.000–0.056)
- **Files:** `src/lib/blackHole/index.ts:74-238` (scene/disc/particles), `:617-632` (Phase-A math); `BlackHoleMount.tsx`; mounted via `SceneManager.tsx:92-108`.
- **State:** complete (visual), partial (no copy beat).
- **Works:** 50k disc particles + 50k stars + Doppler-beamed disc (`shaders.ts:86-93`); OrbitControls autoRotate (`index.ts:92-93`); "Danush Arun" text particles (`index.ts:239-358`).
- **Weak:** "INITIALISING SINGULARITY" loader (`VoidPrologue.tsx:132`) is generic.
- **Missing:** Title typography reveal, narrative line, scroll affordance, semantic h1.
- **Copy:** "INITIALISING SINGULARITY" (`VoidPrologue.tsx:132`); "Danush Arun" as GPU particles (`index.ts:258`).
- **Motion:** GSAP/Lenis scrubbed; raw rAF + autoRotate.

### C02_PULL (0.056–0.139)
- **Files:** Same BH scene; Phase-A math (`blackHole/index.ts:617-632`). No dedicated component.
- **State:** partial — continuous with C01, no narrative inflection.
- **Works:** Exponential r=R₀e^(−λp) (`:615,621`); pull sensation real.
- **Weak/Missing:** Reads as more orbit; no headline; no scroll-velocity tint.
- **Copy:** None.
- **Motion:** Scroll-scrubbed exponential decay.

### C03_STRETCH (0.139–0.222)
- **Files:** Same BH scene; Phase-A math continues.
- **State:** partial — name implies spaghettification but no stretch shader.
- **Works:** FOV ramp 45°→95° (`:629`); RGB shift grows (`:630`); text particles pulled (`:317`).
- **Weak/Missing:** No tidal-stretch shader; no copy.
- **Copy:** None.
- **Motion:** Continuous Phase A.

### C04_HORIZON (0.222–0.278)
- **Files:** `blackHole/index.ts:633-655` (Phase B); `GravityCursor.tsx` (active only here); `SceneManager.tsx:77-82` (intensity spike).
- **State:** partial.
- **Works:** Dive into origin (`:646`), look-target glides to z=−100 (`:651`), intensity bias (`SceneManager.tsx:81`). Gravitational cursor lag (`GravityCursor.tsx:30-65`) is genuinely strong.
- **Weak/Missing:** No white-flash crossing; no title card "Event Horizon."
- **Copy:** None.
- **Motion:** Smoothstep over local; raw cursor rAF.

### C05_WARP (0.278–0.361)
- **Files:** `blackHole/index.ts:656-682` (Phase C+D wormhole); `scenes/WarpScene.tsx` (R3F instanced cylinders); `SceneManager.tsx:67-70,120` (canvas overlap crossfade).
- **State:** complete (visual transit), partial (R3F overlay generic).
- **Works:** 32-ring tunnel + 4000 streak shader (`index.ts:369-450`); FOV 150° (`:663,678`); Doppler peaks.
- **Weak:** R3F `WarpScene.tsx:35-75` 2000 instanced cylinders may double up on BH tunnel.
- **Missing:** Narrative beat, audio sync.
- **Copy:** None.
- **Motion:** Keyframed Three.js + `useFrame` mesh stretching.

### C06_ANOMALY (0.361–0.417)
- **Files:** `scenes/AnomalyGlitch.tsx`; `CameraRig.tsx:17-23` (jitter).
- **State:** stubbed.
- **Works:** Hookup only.
- **Weak:** Cyan wireframe cubes (`AnomalyGlitch.tsx:73-83`) — 2014-Codrops aesthetic; no real chromatic-split shader despite `design-tokens.cosmicHues.glitchA/B/C` (`design-tokens.ts:14-16`).
- **Missing:** RGB-split shader, narrative ("Something doesn't fit"), distinct identity.
- **Copy:** None.
- **Motion:** `useFrame` procedural jitter (`:31-68`).

### C07_TRANSITION (0.417–0.472)
- **Files:** `scenes/TransitionConvergence.tsx`; `CameraRig.tsx:24-28` (z 30→12).
- **State:** partial.
- **Works:** Chaos→orbit convergence + 3 intersecting rings (`:98-148`) — most thoughtful R3F scene besides BH.
- **Weak:** Hard-coded `#38BDF8`/`#EA580C` not from tokens.
- **Missing:** Title beat "Convergence."
- **Copy:** None.
- **Motion:** Smoothstep `t=local²(3−2·local)` (`:102-119`).

### C08_EMERGE (0.472–0.528)
- **Files:** `scenes/EmergeSystem.tsx`; `CameraRig.tsx:30-35` (orbital).
- **State:** stubbed (procedural).
- **Works:** Custom `SunMaterial` (`:11-113`) simplex+fresnel — shippable; binary sun-pair + accretion disks (`:209-233`).
- **Weak/Missing:** "Shader demo" aesthetic; no bridge copy ("Welcome to the work"); no reduced-motion.
- **Copy:** None.
- **Motion:** `useFrame` uTime + Y rotation.

### C09_PROJECT (0.528–0.556)
- **Files:** `EmergeSystem.tsx` continues; `CameraRig.tsx:36-41` (pull back to z=18); `WorkDashboard.tsx:22` (begins fade-in here).
- **State:** partial — pure transition.
- **Works:** Smooth cosmic→dashboard handoff (`WorkDashboard.tsx:31-34`).
- **Missing:** "Selected Work" title card, nav affordance.
- **Copy:** None.
- **Motion:** Opacity fade on dashboard.

### W01_MIRA (0.556–0.605)
- **Files:** `work/panels/MiraPanel.tsx` (197 lines Canvas-2D viz); `work/PanelChrome.tsx`; copy `lib/copy.ts:5-14`; full case study `src/app/mira/page.tsx` (207 lines).
- **State:** complete — the only complete work panel.
- **Works:** 8000-particle volumetric cloud + EKG heartbeat with traveling dot (`:41-156`); chrome with number/eyebrow/title/body/trail/chips/metric; 5 Indian-language callouts (`copy.ts:13`); dedicated `/mira` route.
- **Weak/Missing:** Canvas-2D not GPU; no audio; no in-panel scroll micro-interactions.
- **Copy:** "MIRA" / "Real-time voice AI agent that listens, understands and responds in 5 Indian languages at sub-100ms latency." / metric "RESPONSE TIME 482ms" / eyebrow "MULTILINGUAL INTELLIGENT REAL-TIME AGENT" / trail "NOISE → SIGNAL → UNDERSTANDING" (`copy.ts:5-14`).
- **Motion:** GSAP fromTo on enter (`WorkDashboard.tsx:62-70`); Canvas-2D rAF.

### W02_AIDEN (0.605–0.654)
- **Files:** `AidenPanel.tsx` — literal `return <div>Stub</div>`.
- **State:** stubbed.
- **Copy (source only):** title "AIDEN", body "Conversation intelligence that turns every call into actionable insights across 8 SOP dimensions.", metricsAxes ["Emotion","Intent Cluster","SOP Adherence","Engagement Score"] (`copy.ts:15-23`).
- **Missing:** Entire panel + visualization.
- **Motion:** None.

### W03_VANGUARD (0.654–0.704)
- **Files:** `VanguardPanel.tsx` stub.
- **State:** stubbed.
- **Copy (source only):** title "VANGUARD", trail EXPLORE→TEST→ADAPT→VALIDATE, callouts (ISSUE DETECTED/SELF HEALING/TEST PASSED) (`copy.ts:24-36`).
- **Missing:** Entire panel + 3-state callout choreography.

### W04_INSPECTION (0.704–0.753)
- **Files:** `InspectionPanel.tsx` stub.
- **State:** stubbed.
- **Copy (source only):** title "AI INSPECTION", layers STRUCTURE/MECHANICAL/ELECTRICAL/COSMETIC/TYRES & WHEELS (`copy.ts:37-45`).
- **Missing:** Entire panel + 5-layer scan viz.

### W05_WAVEFIELD (0.753–0.803)
- **Files:** `WaveFieldPanel.tsx` stub.
- **State:** stubbed.
- **Copy (source only):** title "WAVE FIELD", comparison O(n²) vs O(n log n), "~200,000× SLOWER" (`copy.ts:46-57`).
- **Missing:** Entire panel + complexity comparison viz.

### W06_EMI (0.803–0.852)
- **Files:** `EmiPanel.tsx` stub.
- **State:** stubbed.
- **Copy (source only):** title "EMI ENGINE", sweepRange "100 kHz – 10 GHz" (`copy.ts:58-66`).
- **Missing:** Entire panel + frequency-sweep field viz.

### W07_FORMULA (0.852–0.901)
- **Files:** `FormulaPanel.tsx` stub.
- **State:** stubbed.
- **Copy (source only):** title "FORMULA MANIPAL", body "Led autonomous path planning, controls and testing for FM23e EV. 1st in Cost & Manufacturing at Formula Bharat 2024." (`copy.ts:67-75`).
- **Missing:** Entire panel + race-line optimisation viz.

### W08_ABOUT (0.901–0.951)
- **Files:** `AboutPanel.tsx` stub.
- **State:** stubbed.
- **Copy (source only):** title "SYSTEMS-FIRST ENGINEER", skills list (`copy.ts:76-84`).
- **Missing:** Entire panel + portrait/skill treatment.

### W09_CONNECT (0.951–1.000)
- **Files:** `ConnectPanel.tsx` stub.
- **State:** stubbed.
- **Copy (source only):** links LinkedIn / GitHub / mailto procx@partner.drivex.in (`copy.ts:85-97`).
- **Missing:** Entire CTA + outbound links + closing beat.

## Cross-cutting systems

### Scroll orchestration
`ScrollOrchestrator.tsx:13-70`. Lenis 1.3.23 + GSAP ScrollTrigger via `gsap.ticker.add(lenisRaf)` (`:29`). Single ScrollTrigger spans 1500vh (`SceneManager.tsx:149`); progress through `progressToPhase()`. Exposes test handle `window.__setJourneyProgress` (`:33-43`). Quality: clean single source of truth.

### Camera / scene transitions
Two camera systems. BH-canvas: 5-phase hand-keyframed curve (`blackHole/index.ts:591-697`). R3F: phase-switch (`CameraRig.tsx:10-50`) — C06 jitter, C07 z-lerp 30→12, C08 orbit, C09 pull-back. No smooth handoff math between them; `veil` (`SceneManager.tsx:130-140`) is the only crossfade primitive and is unused (0).

### HUD / overlay
Dev-only debug telemetry (`HUD.tsx:5-23`) showing phase/progress. **No production HUD.** `VoidPrologue.tsx:132` "INITIALISING SINGULARITY" is the only persistent surface text outside MiraPanel.

### Shaders
- `blackHole/shaders.ts` — disc/particles/stars/distortion/final composite (with Schnittman Doppler `:335-342`)/noise (Gustavson Perlin 3D). Bruno Simon verbatim.
- `EmergeSystem.tsx:11-113` — simplex sun + fresnel.
- Inline: text particles (`blackHole/index.ts:307-350`), tunnel streaks (`:417-447`), pulsar beam (`:477-484`).
- `src/lib/shaders/noise.ts` — defined but **orphaned**, no imports.

### Asset pipeline
Zero 3D models. Zero textures (procedural Perlin rendered to RT at startup, `blackHole/index.ts:108-130`). Fonts via `next/font/google` (`layout.tsx:12-40`): Cormorant Garamond, Instrument Serif, JetBrains Mono, Syncopate. Audio: `public/audio/README.md` lists 7 required WebM/Ogg — **none present**. `public/` otherwise has default Next.js SVGs only.

### Performance state (observed)
- BH DPR `min(max(devicePixelRatio,1),2)` (`blackHole/index.ts:54`); R3F DPR `[1,1.5]` (`SceneManager.tsx:112`).
- BH antialias true; R3F antialias false.
- Two render targets at 2× and 0.5× (`:96-104`).
- No quality toggles, no FPS monitor, no adaptive DPR.
- Mouse-move rAF-throttled (`SceneManager.tsx:36-46`).
- Geometries/materials dispose on unmount (`:858-902`).

### Accessibility state
- `aria-hidden` on decorative canvases; `aria-label` on AudioToggle. No other ARIA.
- **No `prefers-reduced-motion` anywhere** (grep returns zero).
- **`body { cursor: none }`** (`globals.css:90`) — keyboard users get no cursor, mouse users get no cursor outside C04. Regression.
- No semantic landmarks on `/` (the page is one `<SceneManager>` div). `/mira` does use `<main>`.
- No focus trap / keyboard traversal of work panels.

## Strong points to preserve
- BH simulation end-to-end (`blackHole/index.ts`, `blackHole/shaders.ts:11-201`) — the centerpiece.
- 5-phase mathematically-continuous camera curve (`blackHole/index.ts:581-697`).
- Doppler-beamed disc (`shaders.ts:86-93`) — EHT-faithful.
- Gravitational cursor lag (`GravityCursor.tsx:38-65`).
- Phase/progress state model (`scene-state.ts`, `journey-map.ts`) + test handle.
- Single Lenis + ScrollTrigger driver (`ScrollOrchestrator.tsx:46-62`).
- Design tokens + 6 named easings (`design-tokens.ts`, `ease.ts`).
- Mira full case study (`app/mira/page.tsx`) + Mira panel (`work/panels/MiraPanel.tsx`) — template for W02–W09.

## Pain points / risks
- 8 of 9 work panels are 1-line stubs — entire right half of journey unbuilt.
- Cosmic C06–C09 R3F scenes are placeholder quality.
- VoidPrologue (`VoidPrologue.tsx:78-90`) hard-vanishes at 3.8s — collides with BH startup.
- `body { cursor: none }` breaks default UX outside C04 with no replacement.
- Audio stubbed in two layers (`useAudio.ts:1-3`, `AudioToggle.tsx:13-20`); engine reverted in commit `aa13c7c`.
- `src/lib/shaders/noise.ts` orphaned.
- No production HUD: no logo/nav/progress/skip-to-content.
- Typography mismatch: `layout.tsx` declares Cormorant/Instrument/JetBrains/Syncopate; `design-tokens.ts:33-38` references Syne/Space Grotesk/Space Mono.
- 1500vh / 18 phases ≈ 850px/phase on 1080p. Tight for the work half.
- No mobile/touch story; OrbitControls + DPR-2 — risk on tablet.

## Open questions for COO / founder
- `WorkBackdrop` (`work/WorkBackdrop.tsx`) — intentional second R3F canvas during work?
- `src/lib/shaders/noise.ts` orphan — keep or delete? Same for unused panel copy (defined in `copy.ts`, never rendered except MIRA).
- Revive cinematic script v2 from tag `pre-cleanup-2026-05-12`, or start fresh?
- Typography canon: `layout.tsx` set or `design-tokens.ts` set?
- Is `MiraPanel`'s Canvas-2D the visual ceiling for W02–W09, or should those be WebGL?
- `useAudio` was a working state machine 4 commits ago (`fd514c7`) then reset to a stub. Revive or replan?
