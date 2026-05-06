# MASTER PROMPT — DANUSH ARUN PORTFOLIO

You are an expert front-end engineer and creative WebGL game developer. Recreate the website shown in the attached storyboard with **pixel-perfect accuracy**.

The storyboard is the only source of truth. Do not redesign, simplify, or reinterpret any element. All typography, colors, spacing, proportions, and timing must match exactly. This is a **WebGL real-time game whose only input is scroll position** — not a website with 3D elements.

---

## RULES

- The storyboard is the only source of truth. Do not redesign or reinterpret.
- 60 FPS at 1440×900 DPR 1.5 on a 2021 M1 MacBook Air.
- Single source of truth: scroll → progress → uniforms. No imperative animations.
- Every frame is a deterministic function of `(scrollProgress, time, mouseX, mouseY)`.
- Dispose every geometry, material, texture, render target on unmount.
- No placeholders. No `// TODO`. No stub functions. Every function works on first run.
- Zero body copy. Zero paragraphs. ≤ 7 words per UI element.

---

## STACK

```
next 16.2.4 (Turbopack) · react 19.2.4 · typescript
@react-three/fiber 9.6.0 · @react-three/drei 10.7.7 · @react-three/postprocessing 3.0.4
three 0.184.0 · three-custom-shader-material 6.4.0
gsap 3.15.0 · @gsap/react 2.1.2 · lenis 1.3.23
zustand 5.0.12 · maath 0.10.8 · postprocessing 6.39.1
tailwindcss 4
```

---

## DESIGN SYSTEM

- **Background:** `#000000` true black
- **Body text:** Space Mono 9–11px, tracking 0.25em, `#E8E4D8` 38–62% opacity
- **Achievements:** Space Mono with `#B8FF3C` 80%
- **Scene titles:** Syne 800, tracking -0.03em, `#E8E4D8`
- **Hero serif:** Instrument Serif italic 400 at 240px (BH name particles)
- **Easing everywhere:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Transitions:** hard cut OR 800ms dissolve-through-black. Nothing else.

---

## THE JOURNEY — 18 STAGES (1500vh tall, single page)

### Part I — Cosmic Journey (scroll 0.000 → 0.555)

| # | Stage | Scroll | Spec |
|---|---|---|---|
| 01 | ORBIT | 0–10% | Camera orbits Schwarzschild BH at r=R₀, autorotate. "Danush Arun" Instrument Serif italic 240px as 3500 luminous particles arcing above disc. 50k disc particles + 50k stars. Doppler beaming on disc azimuth. |
| 02 | PULL | 10–25% | Camera dollies inward exponentially. Name particles drift toward singularity. Disc Doppler intensifies (1.7× approach / 0.2× recede). Sub-bass drops 2 semitones. |
| 03 | STRETCH | 25–40% | Chromatic aberration `uRGBShiftRadius` ramps 0.00001 → 0.02. Forward Doppler boost 0 → 0.8. Stars smear radially. |
| 04 | HORIZON | 40–50% | Camera reaches r=0.5, dives past origin to z=-2. **200ms full-black flash** at crossing. Vignette 0.72 → 0.95 → 0.72. **1.0s total silence.** |
| 05 | WARP | 50–65% | 32 torus rings z=-6→-167, hue cyan→amber. 4000 streak particles. FOV 150° → 75°. D♭ piano enters from silence. |
| 06 | ANOMALY | 65–75% | `<Glitch>` from `@react-three/postprocessing`, strength = `useScene().scrollVelocity`. Cube-sprite particles drift. |
| 07 | TRANSITION | 75–80% | Five cosmic bodies converge from edges. Hard cut on convergence. |
| 08 | EMERGE | 80–85% | Pulsar appears dead-center. Electric blue-white beam, deep amber star. **92ms metronome activates.** |
| 09 | PROJECT | 85–100%↘ | Pulsar recedes. 92ms persists for entire remainder. First work materializes from the pulse. |

### Part II — The Work (scroll 0.555 → 1.000, 9 panels equal-width)

| # | Stage | Hero | Tags / Big number | Color | Flow |
|---|---|---|---|---|---|
| 10 | MIRA | Multilingual voice AI, 5 Indian languages, sub-100ms | `RESPONSE TIME 4.82ms` · ASR · NLU · LLM ORCHESTRATION · MULTILINGUAL · PIPECAT · LOW LATENCY | Magenta/purple waveforms | NOISE → SIGNAL → UNDERSTANDING |
| 11 | AIDEN | Conversation intelligence across 8 SOP dimensions | DURATION · SENTIMENT · SOP SCORES · LLM ANALYSIS · POST CALL INSIGHTS · ZOOM CCR | Cool cyan + deep blue | CONVERSATIONS → INSIGHTS → ACTION |
| 12 | VANGUARD | Autonomous web testing agent | 🔴 ISSUE DETECTED · 🟡 SELF HEALING · 🟢 TEST PASSED · VLM+PLAYWRIGHT · AUTONOMOUS AGENT · SELF CORRECTION · VISUAL UNDERSTANDING | Electric blue paths + red/green semantic | EXPLORE → TEST → ADAPT → VALIDATE |
| 13 | AI INSPECTION | Computer vision, 1000+ parts of two-wheelers | STRUCTURAL · MECHANICAL · ELECTRICAL · COSMETIC · TYRES & WHEELS · COMPUTER VISION · DEFECT DETECTION · 3D RECONSTRUCTION · 1000+ PARTS · REAL-TIME SCAN · QUALITY ASSURANCE | Clinical white wireframe | SCAN → DETECT → ANALYZE → ASSURE |
| 14 | WAVE FIELD LLM | Wave Field Attention, O(n log n) for 10k context | STANDARD O(n²) ~200,000× SLOWER vs WAVE FIELD O(n log n) STABLE & EFFICIENT · RESEARCH · ALGORITHM DESIGN · ATTENTION MECHANISM | Icy blue interference | RETHINK → RESEARCH → REDUCE COMPLEXITY |
| 15 | EM ENGINE | EMI shielding designer + computational physics | Frequency sweep 100kHz→10GHz · EM SIMULATION · ALTERNATOR GEOMETRIES · PREDICTIVE SHIELDING · JENKINS CI/CD | Math gold + nebula purple | MODEL → SIMULATE → PREDICT → PROTECT |
| 16 | FORMULA MANIPAL | Autonomous EV path planning, 1st place Formula Bharat 2024 | INITIAL PATH (green) · OPTIMIZED PATH (purple) · TRACK BOUNDARY (orange) · BEST LINE (red) · CONTROLS · PATH PLANNING · VEHICLE DYNAMICS · DATA LOGGING · SYSTEMS ENGINEERING | Telemetry green `#B8FF3C` dominant | MODEL → OPTIMIZE → TEST → WIN |
| 17 | ABOUT ME | B.Tech Manipal · Exec PG IIT Roorkee · DriveX Technical APM + SWE 2025→ | — | Cream `#E8E4D8` | — |
| 18 | LET'S CONNECT | Big problems need collaborative minds | LinkedIn · GitHub · Email · Phone +91 9901148254 · Bengaluru | Earth-on-horizon orbital paths | CONNECT → COLLABORATE → CREATE IMPACT |

---

## INTERACTION

- Scroll = Lenis smooth scroll, GSAP ScrollTrigger 1:1 scrub
- Mouse during HORIZON warps spacetime: x ±25° observer, y disc inclination, cursor gravity in 40% radius
- Spacebar fires manual pulse during MIRA
- Drag-to-orbit during VANGUARD/INSPECTION reveal panels
- Click contact link in CONNECT

---

## ARCHITECTURE

```
src/app/page.tsx
  └── SceneManager.tsx
      ├── BlackHoleMount.tsx          ← drives 01..05 (custom canvas, multi-pass)
      ├── <Canvas> (R3F)              ← drives 05 overlap + 06..18
      ├── ScrollOrchestrator.tsx      ← Lenis + ScrollTrigger
      ├── WorkDashboard.tsx           ← W01..W09 panels
      ├── HUD.tsx                     ← Space Mono debug overlay
      └── VoidPrologue.tsx            ← 3.5s autonomous opener
```

State: `useScene` (zustand) — `journeyProgress`, `cosmicProgress`, `workProgress`, `localProgress`, `phase`, `mouseX`, `mouseY`, `scrollVelocity`, `pulsarBeat`.

BH renders via Bruno Simon multi-pass: `spaceRT` (2× resolution) + `distortionRT` (0.5× RedFormat float) + final composite. R3F takes over at C05_WARP crossfade.

---

## PERFORMANCE

- ≤ 200k triangles per phase
- ≤ 4 active render targets
- ≤ 3 simultaneous PostFX effects
- Particle counts: 250k desktop, 60k mobile (`dpr < 2`)
- Determinism: no `Math.random()` per frame, no `Date.now()`. Use `state.clock` + zustand store.

---

## SURGICAL ITERATION RULES

When fixing a visual gap, respond in this exact format:

```
DIAGNOSIS: [one sentence — what is wrong, file:line]
FIX: [one sentence — what you will change]
SCOPE: [exhaustive list of files you will touch]
PROOF: [command/screenshot that confirms the fix]
```

If a fix would touch a file outside SCOPE, **stop and report**. Do not widen.

---

## OUTPUT FORMAT

1. One-line summary of what was done.
2. Files changed: bullets `path:lineRange — change`.
3. Verification: exact commands run, exact result.
4. Visual evidence: Playwright screenshot path if UI changed.
5. Risks: anything that might regress.

No prose. No "I hope this helps." No emojis.

---

END
