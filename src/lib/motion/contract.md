# Motion fallback contract — project-wide

Date: 2026-05-12
Author: animation-engineer (via general-purpose fallback)
Status: v1 — pending founder review

## Scope
Every animation in this project. Bound on:
- GSAP timelines (`gsap@3.15.0`)
- ScrollTrigger pins + scrubs (bundled with GSAP)
- Lenis smooth scroll (`lenis@1.3.23`, wired via `ScrollOrchestrator.tsx:29` `gsap.ticker.add(lenisRaf)`)
- R3F `useFrame` procedural motion (`@react-three/fiber@9.6.0`)
- CSS transitions and `@keyframes` (Tailwind v4 + `globals.css`)
- Imperative Three.js rAF loops (`src/lib/blackHole/index.ts` — raw `three@0.184.0`)
- Cursor lerp (`GravityCursor.tsx`, future `CustomCursor.tsx`)
- DOM micro-interactions (button presses, hover scale, focus rings)

The audit (`.coo/jobs/002/current-state-audit.md` §"Accessibility state") found ZERO `prefers-reduced-motion` handling. This contract is the canonical reference for closing that gap and for every future animation added to the project.

## The contract (4 rules)

### Rule 1 — Scrubbed motion (scroll-driven, time-driven, or progress-driven)
**Default behaviour**: Animation interpolates between start and end states over a duration / scroll range.
**Reduced-motion fallback**: Jump to END STATE instantly + 0.2s cream-coloured opacity fade between the previous end-state and the new end-state. No interpolation. No transform animation.
**Rationale**: The viewer still SEES every state; they just don't see the motion between states. Crucial for cinematic narrative — the script's beats (`script.md` §"Per-phase script") are still legible.
**Test**: Toggle `prefers-reduced-motion: reduce` on a scrubbed timeline (e.g. C02 `gravitational pull engaged` reveal at scroll=0.056); the timeline's end state should display from the moment the scroll trigger enters the viewport. NO intermediate frames. Playwright assertion: `expect(getComputedStyle(target).opacity).toBe('1')` immediately on trigger.

### Rule 2 — Idle motion (autonomous, not user-driven)
**Default**: Things drift, breathe, orbit, pulse. Black hole disc rotates. Cursor breathes. Background stars parallax. Hint copy `pulsar`-loops at 0.4Hz (`motion-brief.md` §"Easing palette").
**Reduced-motion fallback**: Frozen at t=0 (or t=0.5 if t=0 is visually broken — pick the most "settled" frame in the loop).
**Rationale**: Removes the dizzying micro-motion that triggers vestibular issues without removing the asset itself.
**Exception**: The black hole's GPU-accelerated disc rotation is on the GPU and visually IS the asset. Reduce its rotation speed to 25% (still moving, but not nauseating) rather than freezing — freezing kills the cinematic. Documented under "Black hole exception" below so `accessibility-auditor` knows it's deliberate.
**Test**: Open a phase with idle motion (e.g. C01 orbit, hint pulse); confirm with RM enabled, no `requestAnimationFrame`-driven idle motion fires except the documented exceptions. Spy on `gsap.ticker.add` callbacks; verify no callbacks scheduled for idle layers when `useReducedMotion()` is true.

### Rule 3 — Glitch / discontinuous motion
**Default**: L00 RGB-split fragments (8 fragments, ~120ms each), C03 tidal RGB-split 2→6→2px, C06 anomaly RGB-split stepwise 0→0.3→0.5→0.7→0.5→0.3→0 (`motion-brief.md` C06).
**Reduced-motion fallback**: Show ONE static frame of the final or most-legible state. No flicker, no split, no scanlines.
**Rationale**: Flicker and RGB-split are explicit photosensitive risks (WCAG 2.3 — Three Flashes or Below Threshold). RM users get the *meaning* of the moment (system text resolves; anomaly detected; tidal stress) without the visual aggression.
**Test**: L00 loader on RM should display only `the universe is ready when you are.` for ≤0.4s before the first scroll detonation. No prior fragment frames render. Playwright: assert only one `[data-loader-fragment]` element is visible across the L00 lifetime.

### Rule 4 — Motion-tied audio
**Default**: Pulsar tick (W01), drone hum, doppler-shifted swoosh on W→W travel, granular grit tied to RGB intensity (C06). Audio amplitude / pitch responds to motion intensity.
**Reduced-motion fallback**: Mute the motion-tied component of audio. Static ambient bed only. Diegetic SFX that are NOT tied to motion (e.g. C09 single bell tone on title reveal) stay.
**Rationale**: Audio tied to motion is part of the motion experience; with motion suppressed, the audio becomes disorienting. Bed stays so the cinematic isn't silent.
**Test**: With RM enabled, all audio sources whose volume is `f(motion)` should sit at constant volume; `f(static intensity)` sources unchanged. Audio engine (Job 004) exposes a `motionTied: boolean` flag per source; the engine's master mixer reads `useReducedMotion()` and forces `motionTied` channels to a constant gain.

## Decision matrix — which rule applies?

When an implementer adds an animation, they consult this matrix:

| Animation type | Driven by | Rule |
|---|---|---|
| GSAP timeline + ScrollTrigger scrub | scroll position | Rule 1 |
| GSAP timeline with `duration:` (time-based) | time | Rule 1 |
| ScrollTrigger pin without scrub | scroll position (discrete trigger) | Rule 1 (treat the pinned state as the end state) |
| Lenis smooth scroll | user scroll input | Lenis is SWITCHED OFF entirely on RM — native scroll restored. See "Lenis section" below. |
| `useFrame` in R3F | rAF | Rule 2 |
| `requestAnimationFrame` in imperative TS (e.g. `blackHole/index.ts`) | rAF | Rule 2 (see Black hole exception) |
| CSS `transition` | state change | Rule 1 |
| CSS `@keyframes` (infinite) | rAF (autonomous) | Rule 2 |
| RGB-split / flicker / scanline shaders | rAF | Rule 3 |
| Audio `gainNode.gain.linearRampToValueAtTime` driven by scroll/time | scroll/time | Rule 4 |
| Cursor lerp (`GravityCursor`, `CustomCursor`) | rAF + mouse input | Rule 2 — snap cursor to true mouse position, no easing |

## Lenis section — special case
Lenis smooth scroll is itself motion (it interpolates between scroll positions instead of jumping). On RM, smooth scroll is disorienting.
- **On RM detected**: Lenis is **destroyed** (not just paused). Native browser scroll restored. All ScrollTrigger instances re-init against native scroll (Lenis adapter unmounted). The destroy call invokes `lenis.destroy()` and removes the `gsap.ticker.add(lenisRaf)` registration from `ScrollOrchestrator.tsx:29`; ScrollTrigger.refresh() runs once after to re-anchor scrubbed timelines against native scrollTop.
- **Lifecycle**: The `useReducedMotion()` hook value flows into the Lenis provider (`ScrollOrchestrator.tsx`); provider conditionally renders / unmounts the Lenis instance via `useEffect` keyed on `prefersReducedMotion`.
- **Hot-swap**: Toggle during a session works. Cost: ~16ms of ScrollTrigger refresh work on toggle. Acceptable trade-off for responsive a11y.
- **Cost**: Slight scroll-feel quality drop for RM users. Acceptable — they explicitly asked.

## Black hole exception (special — documented for a11y auditor)
`src/lib/blackHole/index.ts` runs an imperative Three.js loop with `requestAnimationFrame`. The 5-phase camera curve at `index.ts:591-697` is the page's centerpiece (`current-state-audit.md` §"Strong points to preserve"). On RM:
- **5-phase camera curve** (`index.ts:617-697`, Phase A `r=R₀·e^(−λp)` → Phase E pulsar arrival): still respects scroll (Rule 1 — scroll moves through it, but the curve is sampled in instant jumps. The hook reads `prefersReducedMotion`; when true, the per-frame `externalProgress` interpolation is replaced by a discrete-jump sampler that only updates when scroll progress crosses a phase boundary (A→B at p=0.55, B→C at p=0.65, etc.). 0.2s cream fade covers the jump. Viewer sees Phase A end-frame, Phase B end-frame, Phase C end-frame in sequence — not the continuous descent.
- **Disc rotation** (Doppler-beamed disc, `shaders.ts:86-93`): slowed to 25% of default angular velocity (not frozen — see Rule 2 exception). The viewer must still SEE the black hole; freezing kills the cinematic.
- **Doppler-beaming shader**: same rotation as disc — driven by the same uniform `uTime` increment, scaled by 0.25 on RM.
- **Particle stream emission rate** (50k disc particles + 50k stars + text particles at `index.ts:258`): reduced to 25%. Existing particles remain visible; new spawns slow.
- **Wormhole tunnel streaks** (C05, `index.ts:417-447`, 32-ring tunnel + 4000 streaks): rendered as static at the warp midpoint frame (Rule 3 — discontinuous, the streaks are designed to flicker).
- **Text particles** (`index.ts:239-358`, "Danush Arun" GPU dust): final-state still — letters held, no swirl.
- **Veil crossfade** (`SceneManager.tsx:130-140`): 100ms instant cut instead of 200ms fade.

This is documented here so `accessibility-auditor` can verify each behaviour individually against Rule 1/2/3 expectations.

## `useReducedMotion()` hook design

### File location
`src/lib/motion/use-reduced-motion.ts` (per AC6).

### Signature
```typescript
function useReducedMotion(): boolean
```

### Behaviour
- Returns `false` on the FIRST render (SSR-safe).
- Subscribes to `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- On change event, triggers a React re-render with the new value.
- Cleans up the listener on unmount.
- Writes `data-rm="reduce"` to `<html>` as a side-effect (see "CSS escape hatch" below).

### Why SSR returns false
Next.js 16 renders the page server-side without media-query context. Returning `true` server-side would cause the static HTML to ship with reduced-motion fallback styles, then hydrate into motion-on for non-RM users — a visible "pop". Returning `false` server-side means motion-OFF users see a 0-2ms flash of motion-on rendering before client takes over and disables; this is acceptable because (a) the page hasn't started its scroll-driven content yet (L00 detonation requires user scroll), (b) it matches the default expectation, (c) the initial paint is just the cosmic-void background.

### Server-side rendering safety
The hook MUST NOT access `window` during render. The pattern the frontend-engineer will implement:
```typescript
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  setPrefersReducedMotion(mediaQuery.matches);
  const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}, []);
return prefersReducedMotion;
```
(The frontend-engineer writes the actual file with proper types + the `data-rm` side-effect. This is the contract.)

### Where the hook is consumed
- **Lenis provider** (`ScrollOrchestrator.tsx`) — controls smooth-scroll lifecycle (destroy/recreate on toggle).
- **Cursor component** (`CustomCursor.tsx`, future) — skips lerp; snaps to true position.
- **Every GSAP component** — chooses between scrubbed timeline and instant-jump fallback. Pattern: `const tl = gsap.timeline({ paused: rm }); if (rm) target.style.opacity = '1'; else tl.from(target, {...});`
- **Every R3F scene component** (`EmergeSystem.tsx`, `AnomalyGlitch.tsx`, `TransitionConvergence.tsx`, `WarpScene.tsx`, future C08/C09 + W01-W09 scenes) — skips `useFrame` body or runs at reduced rate per Black hole exception.
- **Imperative BH loop** (`blackHole/index.ts`) — exposed via a setter (`setReducedMotion(true)`) called from `BlackHoleMount.tsx` after reading `useReducedMotion()`. Internal flag gates the rotation/emission rates and switches the camera sampler to discrete-jump mode.
- **HUD component** (`src/components/hud/HUD.tsx`, Job 003 AC10) — toggles entrance fade-in.
- **Audio engine** (Job 004) — master mixer reads the value, forces `motionTied` channels to constant gain.

### Test plan (AC6 evidence)
- **Unit test** (Vitest, `tests/lib/use-reduced-motion.spec.ts`): hook returns `false` initially. Mock `window.matchMedia` to fire change event with `matches: true`; hook returns `true` next render. Mock change back to `false`; hook returns `false`. Cleanup on unmount: change event after unmount does not error.
- **SSR test**: render hook in a JSDOM-free environment (`@testing-library/react` SSR mode, no `window`); hook returns `false` without throwing.
- **Integration test** (Playwright, `tests/e2e/reduced-motion.spec.ts`): `page.emulateMedia({ reducedMotion: 'reduce' })`; navigate to `/`; query DOM for Lenis class on `<html>` (should be absent); confirm `<html>` carries `data-rm="reduce"` attribute (the hook writes this for CSS targeting). Toggle media via `page.emulateMedia({ reducedMotion: 'no-preference' })`; verify Lenis class returns and `data-rm` removed within 50ms.

## CSS / Tailwind escape hatch
For components that prefer CSS-only fallbacks (no hook), `<html>` carries `data-rm="reduce"` when RM is active. Tailwind v4 `data-[rm="reduce"]:` variants:
```
data-[rm="reduce"]:transition-none
data-[rm="reduce"]:animate-none
data-[rm="reduce"]:transform-none
```
This is for animation-engineer + frontend-engineer to coordinate; documented here to prevent both approaches existing in parallel. The `globals.css` global stylesheet additionally ships:
```css
html[data-rm="reduce"] *,
html[data-rm="reduce"] *::before,
html[data-rm="reduce"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```
as a final safety net for un-audited CSS animations. Components that need a designed end-state fade override this on a per-selector basis.

## Discoveries the AC13 implementation sweep will likely surface
- `src/components/scene/scenes/EmergeSystem.tsx:11-113` — `useFrame` procedural sun shader. Rule 2 applies; the fallback should clamp `uTime` rather than freezing the entire scene (visual collapses if `uTime` resets to 0).
- `src/lib/blackHole/index.ts:617-697` — the `r = R₀ · e^(−λp)` camera curve and 5-phase Phase A–E sampler. Rule 1 applies with the discrete-jump sampler described in "Black hole exception".
- `src/components/scene/scenes/AnomalyGlitch.tsx:73-83` — cyan wireframe cubes + `useFrame` jitter at `CameraRig.tsx:17-23`. Rule 3 — static frame; jitter halted.
- `src/components/scene/scenes/TransitionConvergence.tsx:98-148` — chaos→orbit + 3 rings, smoothstep over local progress. Rule 1 — settle to end-state.
- `src/components/scene/scenes/WarpScene.tsx:35-75` — 2000 instanced cylinders + `useFrame` stretch. Rule 2 freeze + Rule 3 single-frame (audit flagged this scene as redundant with the BH tunnel; coordinate with 3d-graphics-engineer).
- `src/components/scene/GravityCursor.tsx:30-65` — raw cursor rAF. Rule 2 — snap to mouse position, no lerp.
- `src/components/scene/HUD.tsx` (dev) — currently unanimated. Will get reduced fade-in once production HUD scaffold lands (AC10); ensure RM skips that.
- `src/components/scene/VoidPrologue.tsx:78-90` + `:132` — "INITIALISING SINGULARITY" loader hard-vanishes at 3.8s. Rule 3 — single static frame (final line only).
- `src/components/work/WorkDashboard.tsx:62-70` — GSAP `fromTo` on panel enter. Rule 1 — instant to end-state + cream fade.
- `src/components/work/ProjectChapterOverlay.tsx` — static project copy and tags. Rule 1 — no JS animation.
- Any GSAP `power3.out` ease on copy reveals — Rule 1, end-state fade.

These are FYI for the implementer. Final discoveries from AC13 sweep are filed as follow-up tasks if any can't be handled inside Job 003 scope.

## Open questions for COO
1. **`data-rm` attribute placement**: `<body>` or `<html>`? **Recommendation**: `<html>` — matches the existing Lenis class pattern (Lenis attaches `lenis` class to `<html>`) and lets `html[data-rm="reduce"]:bg-void` Tailwind variants work without needing `body { ... }` overrides. Adopted in the contract above.
2. **Lenis-on-RM destroy: hot-swap or boot-time only?** **Recommendation**: hot-swappable — users who flip RM mid-session expect immediate response. Cost: ScrollTrigger needs to refresh — adds ~16ms of work on toggle, acceptable for the a11y win. Adopted in the contract above.
