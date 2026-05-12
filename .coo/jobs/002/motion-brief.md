# Motion direction brief — Danush Arun portfolio (Job 002, v1)

Date: 2026-05-12
Animator: animator (via general-purpose fallback)
Status: v1 — pending founder review

## Motion language (project-wide)

**Personality:** Gravity-led — long inhales, snap-on-arrival, silence between moves; every motion is the universe doing physics.

**Principle:** If the move would still happen with the camera off, it earns its place; if it only exists when watched, cut it.

**Easing palette:**

| Name | Curve | Use |
|---|---|---|
| `gravity-arrival` | `cubic-bezier(0.16, 1, 0.3, 1)` | Anything landing — plates, place arrivals, copy resolves |
| `event-horizon` | `cubic-bezier(0.87, 0, 0.13, 1)` | Phase crossfades, copy exits, color resets |
| `pulsar` | `linear` 0.8s cycles | Periodic beats — pulsar tick, antenna sweep, hint pulse |
| `tidal` | `cubic-bezier(0.7, 0, 0.84, 0)` | Acceleration into singularity (C02/C03), W-departure compression |
| `accretion` | `cubic-bezier(0.45, 0.05, 0.55, 0.95)` | Orbital drift, disc ambience, idle autoRotate |
| `cut` | `steps(1)` | Glitch fragments (L00, C06), telemetry flicker — no smoothing |
| `breath` | 4s sine loop 1.0→0.92→1.0 | Pre-scroll idle on hints, waiting states |

**Pacing:** 0.8–1.2s inhale, 0.2–0.3s snap exhale, 0.4–0.6s held silence. Cosmic on inhales. W-arrivals snap then breathe. Silence at C04 and every W→W gap.

**Spatial hierarchy:**
- **Foreground (full budget):** the one 3D place in scene — BH C01–C05, anomalous starfield C06–C09, one W-place at a time.
- **Mid (subtle only):** DOM overlay — plates, telemetry, captions. Opacity, transform ≤12px, RGB-split ≤6px. No layout-thrashing.
- **Background:** starfield always present. Drift 0.05–0.15 px/s, parallax 0.08 vs camera.

**Scroll-mapping:**
- **C01–C09 scrubbed.** Preserve existing 5-phase BH camera curve (`blackHole/index.ts:617-697` — Phase A `r=R₀·e^(−λp)`, Phase B horizon dive, Phase C+D wormhole). C06–C09 scrub R3F camera on `progressToPhase().localProgress`. NO GSAP on camera C01–C05.
- **W01–W09 pinned with sub-scroll.** Each W-band (~11% global ≈ 165vh) pins; internal split 30% arrival / 40% held interactive / 30% departure. Pinning chosen because viewer must *use* the hook (drag slider, click beam); free-scroll would let them fly past the work. Pin = `position: fixed`, no layout cloning, perf-cheap.
- **Keyboard parity:** Page Down/Up = ±1 phase; arrows = ±0.33 local; Home/End = L00/E00; Space = pause scrub.

**Reduced-motion contract (fixes audit's zero-handling gap):**
- Scrubbed cosmic motion → instant cut to phase end-state + 0.2s opacity fade.
- Idle motion (orbits, drift, breath) → frozen at t=0; geometry stays visible.
- Glitch (L00, C06, flicker) → single static frame; no RGB-split, no scanline.
- Motion-tied audio (Doppler, granular grit) → muted; orchestral bed optional via AudioToggle.
- Cursor parallax (W09 antenna) → keyboard focus + click only.
- Users get a still-image gallery with full copy, full keyboard nav, optional audio.

---

## Per-phase choreography

### L00 — Glitch Loader
**Intent:** Cold-start. Each fragment a clean click.
- [t=0.00s] `BOOT` opacity 0→1 (60ms), RGB-split 3px, `cut`.
- [t=0.12s] Swap → `LOCATING OBSERVER`. 200ms tape-stop tick audio.
- [t=0.24s] Swap → `CALIBRATING HORIZON`.
- [t=0.36s] Swap → `MASS = 4.3 × 10⁶ M☉`.
- [t=0.48s] Swap → `c = 299,792,458 m/s`.
- [t=0.60s] Swap → `OK`. Flicker 200ms on / 100ms off / 200ms on, `cut`.
- [t=1.00s] Final line `the universe is ready when you are.` opacity 0→1 / translateY 8→0 (600ms), Instrument Serif italic, no RGB-split, `gravity-arrival`.
- [t=1.60s] Hold; idle `breath` loop.

**Hierarchy:** DOM only, no Canvas. **Scroll:** pre-scroll; first scroll detonates → final line dissolves to GPU dust (60 particles, 400ms, `event-horizon`), Canvas mounts → C01. **Perf:** DOM only for fastest LCP; tape-stop audio ≤30 KB lazy. **Reduced-motion:** skip fragments; final line only with 0.3s fade in; total ≤0.4s.

### C01 — Orbit
**Intent:** Hero (BH) + author (Danush Arun) in vast quiet.
- [scroll=0.005, +600ms after particles resolve at `index.ts:258`] Subtitle `systems-first AI engineer` opacity 0→1 / translateY 12→0 (600ms), `gravity-arrival`.
- [scroll=0.005, +1200ms] Hint `scroll` opacity 0→1 (400ms); idle 0.4Hz opacity 1.0→0.6→1.0, `pulsar`.
- [scroll=0.000→0.056] First scroll: autoRotate decouples; existing curve drives camera.

**Hierarchy:** BH Canvas / DOM subtitle + hint / starfield in BH canvas. **Scroll:** scrubbed by existing curve; NO GSAP on camera. **Perf:** DPR `min(devicePixelRatio,2)` existing; no new particles. **Reduced-motion:** BH still frame mid-orbit; subtitle + hint immediate; autoRotate off.

### C02 — Pull
**Intent:** Scrolling feels like gravity.
- [scroll=0.056→0.139] Existing exponential `r=R₀·e^(−λp)` drives. Untouched.
- [scroll=0.056, +200ms] Top-left `gravitational pull engaged` opacity 0→1 (400ms), RGB-split 1px peaks at 0.10 then settles to 0 by 0.139, `gravity-arrival`.
- [scroll=0.056→0.139] Right-side telemetry `r=R₀·e^(−λp)` — equation immediate; numeric `r` ticks per scroll, 30Hz throttled, `transform: translateY()` on pre-rendered digit strips (no `innerText`, no reflow).
- [scroll≥0.10] Disc edge RGB shift bloom — animator drives shader uniform `uDiscBloom` with progress.

**Hierarchy:** BH Canvas / DOM telemetry. **Scroll:** scrubbed; numerals bound to `scene-state.scrollVelocity`. **Perf:** telemetry transform-only, no reflow. **Reduced-motion:** camera holds mid-pull frame; telemetry shows final value, no per-frame tick; no RGB-split.

### C03 — Stretch
**Intent:** Spaghettification.
- [scroll=0.139→0.222] Existing FOV 45°→95° (`index.ts:629`) drives. Untouched.
- [scroll=0.139, +100ms] Telemetry → `tidal stress = critical`, color → `#FFA85C`. RGB-split 2→6→2px (800ms), `cut`.
- [scroll=0.18] `do not look away` — 200ms on / 600ms off / repeat ×2, `cut`. Top-third mono caps.
- [scroll=0.139→0.222] Telemetry CSS `transform: scaleY(1→1.4)`, `tidal`.

**Hierarchy:** BH Canvas (FOV widening) / stretched telemetry + flicker. **Scroll:** scrubbed. **Perf:** `transform: scaleY()` only. **Reduced-motion:** FOV holds at 70° midpoint; no flicker — `do not look away` visible 1.5s then fades; telemetry static.

### C04 — Horizon
**Intent:** The crossing. Silent, weightless.
- [scroll=0.222→0.278] Existing dive to z=−100 drives (`:633-655`). Untouched.
- [scroll=0.222] All audio fades to silence over 200ms.
- [scroll=0.235] Mono `c reached` opacity 0→1→0 over 300ms, `cut`. Lower-third.
- [scroll=0.245] **White flash** (missing per audit): full-viewport DOM div bg `#F0E4D2`, opacity 0→1 over 80ms then 1→0 over 320ms. Triggered when camera z crosses 0.
- [scroll=0.245→0.265] Display serif `event horizon` opacity 0→1 (200ms), hold 1.2s, opacity 1→0 (200ms). Cormorant Garamond ~88px cream. `gravity-arrival` in, `event-horizon` out.
- [scroll=0.265] Sub-bass `woosh` 350ms peaking at flash midpoint.
- [scroll=0.270] C05 synth pad bed begins at −18dB.

**Hierarchy:** BH Canvas / display title / white flash overlay. **Scroll:** scrubbed; flash + title scroll-anchored. **Perf:** single full-viewport div. **Reduced-motion:** no flash; `event horizon` immediate for full C04 band; silence preserved (it's a beat).

### C05 — Warp
**Intent:** Tone of the universe before any place exists.
- [scroll=0.278→0.361] Existing wormhole transit FOV 150° (`:656-682` + 32-ring tunnel) drives. Untouched.
- [scroll=0.278, +400ms] Audio pad swells −18dB → 0dB (600ms). Doppler pitch −2 semitones → 0 over band.
- [scroll=0.30] `you are no longer outside the system.` opacity 0→1 / translateY 8→0 (400ms), hold 1.4s, fade out 400ms. Mono caps centered.
- [scroll=0.34] `the work lives here.` enter / hold 1.2s / exit, ending at 0.355.
- [scroll=0.35→0.361] Veil crossfade `scene-state.veil` 0→1 over 200ms (raw-3JS → R3F handoff per `SceneManager.tsx:130-140`).
- [scroll=0.361] Veil 1→0 over 200ms revealing R3F starfield. **Coordinate removal of `WarpScene.tsx` cylinders with 3d-graphics-engineer** (audit flagged redundant).

**Hierarchy:** wormhole / DOM copy / veil overlay. **Scroll:** scrubbed. **Perf:** veil = full-viewport div, pure opacity over `#08070a`, no backdrop-filter. **Reduced-motion:** camera at C05 end-state still; both lines immediate; veil crossfade → 100ms instant cut.

### C06 — Anomaly
**Intent:** Refuse the "normal solar system" cliché.
- [scroll=0.361] R3F sole renderer. Starfield drifts `accretion`.
- [scroll=0.361→0.417] **RGB-split shader on starfield** (replaces cubes in `AnomalyGlitch.tsx:73-83`). Uniform `uChromaIntensity` stepwise 0→0.3→0.5→0.7→0.5→0.3→0 in seven 80ms steps, `cut`. Colors from `design-tokens.cosmicHues.glitchA/B/C`.
- [scroll=0.37] Top-left `signal acquired` opacity 0→1 over 200ms, RGB-split 4px, stepwise jitter holds, `cut`.
- [scroll=0.39] Centered `something is here.` opacity 0→1 over 100ms (`cut`), RGB-split 6px peak, hold 800ms, exit 200ms.
- [scroll=0.40+] Stars drift toward focal point (sets up C07) via `useFrame` interpolation.
- [scroll=0.361→0.417] Existing camera jitter (`CameraRig.tsx:17-23`) coordinated with `uChromaIntensity`.

**Hierarchy:** starfield + chroma / telemetry + center line. **Scroll:** scrubbed. **Perf:** screen-space post-process pass on existing starfield, ~0.4ms iPhone 12; no new geometry. **Reduced-motion:** no RGB-split; starfield static; both copy lines plain mono.

### C07 — Transition
**Intent:** Chaos resolving to the 9 places.
- [scroll=0.417→0.472] Existing chaos→orbit + 3 rings drive (`TransitionConvergence.tsx:98-148`). Swap hard-coded `#38BDF8`/`#EA580C` for tokens (`void`, `accretion`).
- [scroll=0.42, +100ms] Centered `nine systems. one engineer.` opacity 0→1 / translateY 8→0 (600ms), `gravity-arrival`. Holds to 0.465.
- [scroll=0.465→0.472] Opacity 1→0 (200ms), `event-horizon`.
- [scroll=0.45] Audio pad resolves (grit drops, sustained chord opens).

**Hierarchy:** converging particles + rings / single line. **Scroll:** scrubbed. **Perf:** no additions — retiming only. **Reduced-motion:** camera at C07 end-state still (rings collapsed); copy immediate.

### C08 — Emerge
**Intent:** Universe as inhabited. 9 locations as distant lights.
- [scroll=0.472] Procedural twin Suns REPLACED — coordinate with 3d-graphics-engineer for "9 distant pinpricks" geometry.
- [scroll=0.472→0.528] Existing orbital path (`CameraRig.tsx:30-35`) retimed: radius 12→18, Y +0→+4, `gravity-arrival`. Animator drives (R3F, not the locked BH curve).
- [scroll=0.48] **Pinprick reveal:** 9 points stagger over 1.4s, W01 first (brightest, frame-edge), then W02–W09 in script order. Per point: opacity 0→1 (200ms) + additive bloom flare uniform 0→1.4→1.0, `gravity-arrival`.
- [scroll=0.50] Bottom-center `welcome to the universe.` opacity 0→1 / translateY 8→0 (600ms), `gravity-arrival`. Holds to 0.522.
- [scroll=0.522→0.528] Opacity 1→0 (200ms).

**Hierarchy:** pinpricks + camera / single line / starfield (chroma settled). **Scroll:** scrubbed; stagger mapped to sub-scroll 0.48→0.508. **Perf:** 9 point sprites + 1 additive uniform per sprite — trivial. **Reduced-motion:** end-state still (9 pinpricks resolved); no stagger; copy immediate.

### C09 — Project intro
**Intent:** Title card for the next chapter.
- [scroll=0.528] Camera pulls back to z=18 (existing `CameraRig.tsx:36-41`), animator retimes.
- [scroll=0.528, +200ms] Display serif `Selected work.` opacity 0→1 / translateY 12→0 / letter-spacing 0.04em→0.01em over 700ms, `gravity-arrival`. Cormorant Garamond ~96px cream. Letter-spacing is the one CSS exception — single 700ms beat, once per session.
- [scroll=0.535, +200ms after title] Mono `nine places. each one is a system that ships.` opacity 0→1 (400ms), `gravity-arrival`.
- [scroll=0.545] Hint `scroll to enter the first.` opacity 0→1 (400ms); idle 2.5s `pulsar` loop.
- [scroll=0.528] One bell tone on title reveal; ambient bed continues.
- [scroll=0.552→0.556] All C09 copy fades over 300ms. W01 pinprick grows to ~60% of frame via dolly + scale.

**Hierarchy:** pinpricks + W01 growing / title + caption + hint. **Scroll:** scrubbed. **Perf:** letter-spacing exception documented. **Reduced-motion:** title + caption immediate, no transform/letter-spacing; hint static; camera at end-state still.

### W01–W09 — Per-place template
9 W-places execute one template against their ~11% global band (~165vh pinned). Per-place specifics live in script.md W01–W09. Internal split: arrival (first 30% local) → held interactive (middle 40%) → departure (last 30%).

**Arrival:**
- [local=0.00→0.30] Pinprick translates from background depth to foreground anchor. Scale 0.02→1.0, `gravity-arrival`.
- [local=0.05→0.20] Per-W accent lerps lighting environment from `#FFA85C` toward the W's accent (e.g. sodium-yellow MIRA, signal-cyan AIDEN) over 600ms, `event-horizon`. **Returns to `#FFA85C` when no scene is foreground** (palette discipline).
- [local=0.15] Plate (e.g. `MIRA — Pulsar Station`) opacity 0→1 / translateY 12→0 over 500ms, `gravity-arrival`.
- [local=0.20] Outcome line opacity 0→1 over 500ms with 100ms stagger between digit groups (flip-board feel).
- [local=0.25] Caption opacity 0→1 over 400ms.
- [local=0.30] Interactive hint opacity 0→1 over 300ms; idle `breath`.

**Held:** 3d-graphics-engineer owns per-place hook timeline. Animator constraints: feedback ≤400ms input → visible response; idle ambient motion on `pulsar` or `accretion`; audio responds to interaction (click MIRA beam → one language sample).

**Departure:**
- [local=0.70] Interactive locks to final state (W01 pulsar to last-selected language; W05 slider at 1M).
- [local=0.85→1.00] Place scale 1.0→0.02 over 600ms, `tidal`. Accent lerps back to `#FFA85C`. Copy fades over 300ms.
- [local=0.95 → next 0.05] **Travel transition** fires (below).

**Hierarchy:** place model / chrome / starfield + lensed BH-implication. **Scroll:** pinned; sub-scroll drives arrival/held/departure. **Perf:** foreground tris ≤80k mobile; background ≤5k; DPR ≤2; max one post-process pass per phase. **Quality-toggle candidates:** W04 (5 ring sweeps + heatmap), W05 (volumetric curves at 1M tokens), W06 (3D field-line viz) — 3d-graphics-engineer confirms; if over budget, ships high/low toggle. **Reduced-motion:** pin disabled; page becomes vertical scroll of stills (hero still + plate + outcome + caption + screenshot with alt text); per-place accent set instantly; interactive hooks → "press Enter to step through states" keyboard interaction swapping stills.

### E00 — Outro / contact
**Intent:** Convert impression to action. The only sentimental beat allowed.
- [scroll=0.995, +200ms after W09 antenna locks] Canvas lighting intensity 1.0→0.4 (600ms), `event-horizon`. Starfield drift → 0.02 px/s.
- [scroll=0.995, +400ms] Display serif `the universe is yours when you're ready to build inside it.` opacity 0→1 / translateY 16→0 (900ms), `gravity-arrival`. Cormorant Garamond ~64px cream centered.
- [scroll=0.997, +600ms after closing line] CTA `growth@partner.drivex.in` opacity 0→1 (400ms). Mono caps. Hover: accretion underline draws L→R (300ms).
- [scroll=0.998, +200ms after CTA] Contact row `LinkedIn · GitHub · Email · Download CV (PDF)` opacity 0→1 (400ms).
- [scroll=0.999, +400ms] Technique footer `Rendered with WebGL. Raymarched accretion disc. GPU-instanced starfield. Schnittman Doppler shader. Built solo.` opacity 0→1 (600ms).
- Idle: starfield continues `accretion` drift; closing line + CTA hold.

**Hierarchy:** dimmed universe / closing stack. **Scroll:** held past 1.000. **Perf:** lighting lerp + DOM fades only. **Reduced-motion:** all E00 copy immediate at 0.995; no fades; Canvas dim instant.

---

## Transitions between W-phases (travel feel)
All 8 W→W boundaries, ~1.6s scrubbed:
- **Compress (0.4s):** outgoing place scale 1.0→0.02, opacity 1→0, `tidal`. Camera holds.
- **Travel (0.6s):** camera pulls back; radial warp-blur shader pass on starfield (uniform `uWarp` 0→0.4→0, `event-horizon`); Doppler hue stretch elongates stars; audio Doppler pitch +1 semitone then back.
- **Emerge (0.6s):** incoming pinprick scale 0.02→1.0, opacity 0→1, `gravity-arrival`. Camera settles. Accent lerps from `#FFA85C` to incoming.

**Audio:** sub-bass swell on compress, ~200ms silence at warp midpoint (makes next place hit harder), swell on emerge.

**Reduced-motion:** instant cut at boundary; 0.3s opacity crossfade between stills. No warp-blur, no Doppler stretch, no pitch-shift.

---

## Hero camera direction (cross-cutting)
The black hole IS always present, but during W01–W09 it is **implied by gravity-lensing of the starfield only, not visible at the frame corner**. Each W-place is a real location in the universe; the BH is the gravitational center, off-axis. A tiny visible BH at every corner would (a) compete with the W foreground breaking spatial hierarchy, (b) read as page-decoration — the pattern references.md flagged as a winner-killer.

Every W-phase starfield carries radial distortion uniform `uGravLens ≈ 0.05`, anchored to a different frame edge per W-place (implying different positions relative to the singularity). Viewers don't consciously notice; the universe feels real because the math persists. BH returns to full visibility at C01–C05 and is silhouetted deep-background in E00 (~5% of frame). Satisfies "one signature 3D protagonist" — BH present via its physics in every phase, not just its silhouette.

---

## Open coordination items

**For 3d-graphics-engineer:**
- C06 RGB-split shader on starfield (replaces `AnomalyGlitch.tsx:73-83` cubes). Animator owns `uChromaIntensity` timeline.
- C08 9 pinpricks: point sprites + additive bloom flare uniform per sprite.
- W-phase scaffolds: each place exposes `onEnter(localProgress)` / `onTick(localProgress)` / `onExit(localProgress)` callbacks.
- C01–C05 camera curve: NO GSAP overlay. Document veil handoff: veil=1.0 at scroll=0.358 (BH covered), veil=0.0 at 0.363 (R3F revealed) via `SceneManager.tsx:130-140`.
- Starfield `uGravLens` background uniform (baseline 0.05, frame-edge anchor varies per W).

**For frontend-engineer:**
- DOM overlay CSS variable hooks: `--phase-accent`, `--phase-rgb-split`, `--phase-opacity`. Animator drives via `gsap.to(":root", ...)`.
- Keyboard handlers: Page Down/Up = ±1 phase; arrows = ±0.33 local; Home/End = L00/E00; Space = pause. All respect `prefers-reduced-motion`.
- `prefers-reduced-motion` centrally managed: React context, passed to every GSAP timeline as `reducedMotion: boolean`.

**For website-builder:**
- Pinning confirmed for W-phases. Validate against perf budget — pin uses `position: fixed`, no layout cloning; profile under load.
- AudioContext created after first user gesture (browser policy). Create in L00 first-scroll handler. Singleton at `lib/audio/engine.ts` (revive from `fd514c7`). Orchestral bed = always-on; per-place SFX = sub-layers crossfading per phase.
- Audit's `body { cursor: none }` regression: `cursor: auto` by default; `cursor: none` only inside C04 where `GravityCursor.tsx` owns the visual cursor.

---

## Awwwards-bar checks
- [x] Motion budget exceeds visual-design budget — 23 phases choreographed; visual is two colors + per-W accent.
- [x] Every move serves a script beat — each line traces to script.md or a bar checkpoint.
- [x] Easing palette opinionated, not default — 7 named eases.
- [x] Reduced-motion has a designed fallback for every phase.
- [x] Keyboard parity for every scroll-driven beat.
- [x] 60 FPS on mid-tier mobile per phase — W04/W05/W06 flagged as quality-toggle candidates.

## Open questions for founder
1. **Per-W accent colors:** lock now (e.g. MIRA sodium-yellow `#FFD96B`, AIDEN signal-cyan `#7FE8E0`) or defer to follow-on color job? Recommendation: defer unless any locked in mind.
2. **W→W travel audio:** brief specifies sub-bass swell + 200ms silence + swell. Confirm — or prefer silent travel (per-place audio crossfades only) so each place arrives into its own audio world without a "travel sting"?
3. **Pinning vs free-scroll W-phases:** brief picks pinning (~165vh each, viewer drives interactive). Pin = credibility; free-scroll = momentum. Recommendation: pin + "skip to next" affordance for skimmers. Confirm.
