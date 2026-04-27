# DANUSH ARUN PORTFOLIO — COMPLETE DESIGN FLOW
## Canonical Design Specification v1.0
### 2026-04-27

---

## THROUGH-LINE

One cosmology. Every physical phenomenon a metaphor for how one mind works.

The visitor witnesses a universe whose physics mirror Danush's thinking: gravitational (everything has mass), orbital (all systems interconnect), precise (92ms between heartbeats). By the final frame, they do not want to hire him — they want to fold his mind into their infrastructure.

**The film has one direction: forward. There is no back.**

---

## MOTION GRAMMAR

These rules apply to every element in every phase. No exceptions.

| Rule | Specification |
|---|---|
| Entry | Emerge from black. Never fly in from side. Never scale up from zero. |
| Exit | Compress toward a point. Never slide off screen. |
| Hard cut | 0ms transition — used TWIN_BUILD → FORMULA_RINGS only |
| Dissolve | 800ms through absolute black — all other scene advances |
| UI reveal easing | `cubic-bezier(0.16, 1, 0.3, 1)` — fast out, extremely slow settle |
| Snap events | Zero easing, zero duration — Pulsar beam, card reveals, data lines |
| Bounce | Forbidden. Everything has mass. |
| Parallax | Forbidden. This is physics, not decoration. |
| Bounce springs | Forbidden. |
| Reduced motion | All animation collapses to instant crossfades. No motion removed — just instantaneous. |

---

## VISUAL SYSTEM

### Color by Phase

| Phase | Primary | Accent | Void |
|---|---|---|---|
| VOID | — | — | `#0B0D10` |
| EVENT_HORIZON | Amber disk `#E8A020` | Gold ring `#FFD060` | `#0B0D10` |
| DESCENT | White equation `#FFFFFF` | — | `#0B0D10` |
| MIRA_PULSAR | Electric blue-white `#85CCF7` | Amber star `#E8A020` | `#0B0D10` |
| DRIVEX_QUASAR | Cold blue `#6AAAE8` | Warm amber `#E8A83C` | `#0B0D10` |
| TWIN_BUILD | UI blue `#6AAAE8` | Clinical white `#EFEFEF` | `#0B0D10` |
| FORMULA_RINGS | Silver `#ADADB5` → White `#FFFFFF` | Lime `#B8FF3C` | `#0B0D10` |
| QUANTUM_PLANET | Nebula purple-blue `#7057D4` | Math gold `#D4B857` | `#0B0D10` |
| SINGULARITY | All prior colors → cream `#E8E4D8` | — | `#0B0D10` |

### Lime `#B8FF3C` usage budget — exactly 6 instances across the entire experience:
1. MIRA_PULSAR: `RESULT: SUB-100MS · PRODUCTION GRADE`
2. FORMULA_RINGS: `PATH PLANNING ACCURACY: +40%`
3. FORMULA_RINGS: `FORMULA BHARAT 2024: 1ST PLACE`
4. FORMULA_RINGS: `COST & MANUFACTURING: 1ST PLACE`
5. FORMULA_RINGS: `SPONSORSHIP: ₹60 LAKH`
6. QUANTUM_PLANET: `70% ACCELERATION`

No other element uses `#B8FF3C`. It marks achievement metrics only.

### Typography

| Role | Font | Size | Weight | Tracking | Opacity |
|---|---|---|---|---|---|
| Narrative display | Syne | 11px–28px | 800 | `-0.03em` | 100% |
| HUD telemetry | Space Mono | 9px | 400 | `0.25em` | 38% |
| Data labels | Space Mono | 9px | 400 | `0.15em` | 70% |
| Achievement metrics | Space Mono | 9px | 700 | `0.15em` | 100% + `#B8FF3C` |
| Equations | Space Mono | 11px | 400 | `0.1em` | 85% |

Zero body copy. Zero paragraphs. Every word is either telemetry, an equation, or an achievement.

---

## AUDIO ARCHITECTURE

Audio is not background music. Audio is physics made audible.

### Sound Library

| ID | Description | Format | Duration | Notes |
|---|---|---|---|---|
| `sub-28hz` | 28Hz subsonic sine | WebM/OGG | looped | Felt in chest, not heard clearly |
| `pulsar-click` | Mechanical relay snap | WebM/OGG | 80ms | Plays every 92ms exactly |
| `descent-piano` | Single D♭3 piano note | WebM/OGG | 8s sustained | Struck at Descent arrival, decays naturally |
| `quasar-left` | Structured arpeggiated sequence | WebM/OGG | 4s looped | Cold, digital — left jet only |
| `quasar-right` | Warm organic pad | WebM/OGG | 4s looped | Warm, human — right jet only |
| `twin-flywheel` | Large bearing under load | WebM/OGG | looped | Mechanical weight, TWIN_BUILD only |
| `rings-strings` | Zimmer rising phrase, strings only | WebM/OGG | 12s | Starts at FORMULA_RINGS entry, not looped |
| `crystal-glass` | Sustained crystal glass resonance, slightly dissonant | WebM/OGG | looped | QUANTUM_PLANET only |
| `singularity-organ` | D♭2 organ, then D♭2+A♭2, then full chord | WebM/OGG | 20s | Does not swell — materializes |

### Audio State Machine

```
VOID:           sub-28hz START (volume 0→0.7 over 2s)
EVENT_HORIZON:  sub-28hz SUSTAIN + doppler-shimmer layer (volume 0→0.3 as horizonProgress increases)
DESCENT:        sub-28hz pitch shift -2 semitones over 1.6s → SILENCE at 1.6s → descent-piano at 2.6s
MIRA_PULSAR:    descent-piano fade out over 4s + pulsar-click START (every 92ms, forever)
DRIVEX_QUASAR:  quasar-left + quasar-right START (balanced stereo, left=left, right=right)
                pulsar-click CONTINUES at -12dB under mix
TWIN_BUILD:     quasar sounds fade → twin-flywheel START
                pulsar-click CONTINUES at -15dB
FORMULA_RINGS:  twin-flywheel fade → rings-strings START
                At high scroll velocity: pulsar-click volume +6dB (EV motor = pulsar beat)
QUANTUM_PLANET: rings-strings END → SILENCE (weaponized) → crystal-glass fades in over 3s
                pulsar-click at -18dB, barely audible
SINGULARITY:    ALL audio cuts simultaneously (absolute silence, 3.0s)
                At 3.0s: spatial hum (ambient room tone, -20dB)
                At 5.5s: descent-piano note returns once (echo of crossing)
                At ~10s: singularity-organ materializes (not swells)
```

### Audio Implementation Requirements
- All audio via Web Audio API (`AudioContext`) — not HTML `<audio>` elements
- `AudioContext` must be created on first user gesture (browser policy)
- `GainNode` per track for independent volume control
- `BiquadFilterNode` on `sub-28hz` (highpass at 40Hz for speakers that cannot reproduce 28Hz — preserves intent on capable hardware)
- Pulsar click scheduling: `AudioContext.currentTime` scheduling with `source.start(nextBeatTime)` — not `setInterval` (drift accumulates over time)
- All audio files: dual format WebM (primary) + OGG (fallback)
- Muted by default — unmute toggle in top-right HUD (single icon, Space Mono label `AUDIO ON / OFF`)

---

## PHASE SPECIFICATIONS

### PHASE 0 — HTML SHELL
**Trigger**: URL hit, before JavaScript**  
**Duration**: Until JS hydration**

The browser renders the HTML skeleton before React loads. Currently this produces a white flash.

Required: `<style>html,body{background:#0B0D10;margin:0}</style>` inlined in `<head>`. This ensures the user sees absolute black from the first byte. The experience begins from the first HTTP response, not from JavaScript.

No loader percentage. No spinner. No skeleton screen. Black is the correct state.

---

### PHASE 1 — VOID
**Trigger**: JS hydration complete  
**Duration**: 3.5 seconds, autonomous, non-interactive

#### Visual Timeline

| Time | Event |
|---|---|
| `0.0–1.2s` | Absolute black. Nothing. |
| `1.2–2.0s` | Stars crystallize from darkness. Not fade — crystallize. Each star forms as if space itself is being rendered for the first time. Use `THREE.Points` with 50,000 particles on sphere `r=400`. Each star has a random `aSeed` attribute [0,1]. Star becomes visible when `uCrystalProgress > aSeed * 0.7`. Size: `mix(0.0, 1.2 + aSeed * 0.8, starProgress)`. |
| `2.0–2.8s` | Gravitational lensing warps the star field outward from center. The black hole presence is felt before it is seen. Implement as radial UV distortion on the stars render target: offset each star's screen position away from center by `k / dist²` where `k` scales 0→0.08 over 0.8s. |
| `2.8–3.5s` | Black hole reveals. Sequence: (1) accretion disk amber glow bleeds in from equatorial plane, (2) photon ring materializes, (3) shadow is present — not drawn, it is the absence of light. |

**AI Video candidate**: The star crystallization (1.2–2.0s) and gravitational warp (2.0–2.8s) can be a single pre-rendered 1.6s WebM. Prompt: *"Stars emerging from absolute black deep space, crystallizing like frost forming on glass, astrophotography quality, static camera, no camera movement, 4K, HDR, loopless sequence."* Benefit: astrophotography-grade imagery at zero GPU computation. File size target: under 3MB at 1080p.

#### Typography
Terminal text appears at `t=2.0s`. Types character-by-character. Space Mono 9px, `#E8E4D8` at 38% opacity. Bottom-left, `20px 24px` from edges.

```
> SCHWARZSCHILD METRIC — INITIALIZED
> OBSERVER CONFIRMED AT r = 30 Rs
> GRAVITY FIELD DETECTED
> CAUTION: EVENT HORIZON AT r = 2GM/c²
```

Character delay: 28ms. Line gap: 180ms after each line completes.

#### Audio
- `t=0.0s`: Silence.
- `t=1.2s`: `sub-28hz` begins. Volume ramps 0→0.7 over 2.0s.
- `t=3.5s`: Sustains into EVENT_HORIZON.

#### Transition
Automatic at `t=3.5s`. VoidPrologue overlay `opacity 1→0` over 200ms. Black hole canvas becomes interactive.

---

### PHASE 2 — EVENT HORIZON
**Trigger**: Auto from VOID  
**Duration**: User-controlled via scroll

#### Visual State
Full-screen physics-accurate black hole. No navigation. No page chrome. HUD strips only.

**Black hole rendering** uses four shader passes:
1. **Noise pass** (one-shot at init): `128×128` `WebGLRenderTarget`. Perlin noise texture seeding the accretion disk turbulence. Computed once, never recomputed.
2. **Distortion pass** (`0.5×DPR`): Renders the gravitational lensing geometry — a disc mesh around the shadow that samples and bends the space render target. UV offset magnitude: `shadowRadius² / dist²` per fragment, where `dist` is distance from shadow center in screen space.
3. **Space pass** (`2×DPR`): Black hole shadow (absence of geometry), accretion disk (50k particles in spiral on torus-like path), photon ring (thin tube geometry), 50k background stars.
4. **Composite pass** (full res): Combines passes, applies chromatic aberration (RGB channel split scaled by `horizonProgress`), applies Doppler-boosted brightness on the approaching side of the disk.

**Accretion disk visual**:
- Color: inner edge `rgb(1.0, 0.85, 0.3)` (hot white-amber), outer edge `rgb(0.9, 0.35, 0.05)` (deep orange-red)
- Approaching side (determined by observer angle) is up to `2.8×` brighter at maximum `horizonProgress`
- Disk turbulence driven by noise texture UV-scrolling at `0.05 units/second`
- Disk inclination: face-on at `mouseY = top`, edge-on at `mouseY = bottom`. Edge-on view reveals extreme photon ring bending.

**HUD** (always visible in this phase):
```
BOTTOM-LEFT (Space Mono 9px, 38% opacity):
DA · OBS-25 · SAGITTARIUS A★
SCHWARZSCHILD RADIUS: 1.0 Rs
DISK INCLINATION: [live value, integer]°

BOTTOM-RIGHT (Space Mono 9px, 38% opacity):
DANUSH ARUN
SYSTEMS ARCHITECT · PHYSICS ENGINE
```

**Threshold text** (appears when `horizonProgress > 0.6`):
- Syne 800, 11px, letter-spacing 0.25em
- Center screen
- Fade in over 800ms with `cubic-bezier(0.16, 1, 0.3, 1)`
- Text: `CROSS THE EVENT HORIZON`
- No button. No underline. Scroll is the verb.

#### Interaction Model

| Input | Shader Uniform Updated | Visual Effect |
|---|---|---|
| `mousemove.clientX` | `uObserverAngle = lerp(current, target, 0.08)` mapped to `[-0.436, +0.436]` radians | Observer angle shifts ±25°. Doppler response. |
| `mousemove.clientY` | `uDiskInclination = lerp(current, target, 0.08)` mapped to `[0.087, 1.396]` radians | Disk inclination 5°–80°. Edge-on shows extreme lensing. |
| `wheel.deltaY` | `horizonProgress += deltaY / JOURNEY_WHEEL_PX` clamped to `[0, 1]` | Camera moves on path `r = 30 · e^{-2.3 · p}` toward event horizon |
| Cursor position | CSS `cursor: none`. Custom 1px crosshair div follows mouse. | Within 40% of viewport center: crosshair position lags mouse, bends toward screen center. Lag coefficient: `0.06` per frame. |

All uniform updates happen in `useFrame` via `ref.current` mutation. No React state updates during mouse or scroll handling — zero re-renders per frame.

#### Audio
- `sub-28hz` sustained from VOID
- Doppler shimmer layer: a high-frequency sine wave (8kHz) at volume `horizonProgress × 0.15`. Appears as `horizonProgress` increases. Simulates audible Doppler shift.

#### Transition
At `horizonProgress = 1.0`, DESCENT phase begins automatically.

---

### PHASE 3 — DESCENT
**Trigger**: `horizonProgress = 1.0`  
**Duration**: 3.2 seconds, non-skippable. User input ignored.

#### Visual Timeline

| Window | Visual |
|---|---|
| `0.0–0.8s` | Accretion disk uniform `uFillProgress` drives disk scale from fit-to-screen to `2.5×` oversized. Photon ring `uRingAlpha` goes `0.6→1.0`. Shadow expands until it covers the entire viewport. |
| `0.8–1.2s` | Einstein field equation materializes over the black frame in Space Mono 11px, white `#FFFFFF`, centered. Equation: `Rμν − ½gμνR + Λgμν = 8πG/c⁴ · Tμν`. Fade in over 0.2s using `cubic-bezier(0.16, 1, 0.3, 1)`. |
| `1.2–1.6s` | Equation holds. 0.4s of it simply existing. |
| `1.6s` | Equation dissolves character-by-character into white static. Each character independently randomizes through ASCII [33–126] at 40ms per frame, then disappears. Order: left to right. Duration per character: 3 frames × 16.7ms. Total equation dissolution: ~1.0s. |
| `1.6–2.6s` | Total darkness. A single amber point of light (`#E8A020`, 2px) at screen center. It grows: `radius = 2 + (t - 1.6) * 12` pixels. At `t=2.6s` it fills approximately 40px diameter. |
| `2.6–3.2s` | WARP SEQUENCE (see AI video note below). |

**AI video — strongest candidate**: The warp tunnel sequence (2.6–3.2s) consists of: a spacetime tear, a tunnel with FBM warping, 6000 relativistic streak particles, and an anamorphic horizontal lens flare. The real-time GLSL implementation is GPU-expensive and visually inconsistent across GPU vendors (AMD/NVIDIA/Apple Silicon produce different turbulence patterns). Replace with a pre-rendered 0.6s WebM:

Prompt: *"POV flying through a relativistic spacetime wormhole tunnel, Einstein ring stretching to horizontal light streaks, intense chromatic aberration, anamorphic horizontal lens flare, absolute black void transitioning through luminous amber to blinding white light, ultra-cinematic 4K, Greig Fraser cinematography style, loopless."*

Delivery: WebM (VP9), muted, 1080p, loopless. Target file size: under 2MB. Preloaded during VOID phase while 28Hz hum plays.

#### Audio Timeline

| Time | Audio Event |
|---|---|
| `0.0s` | `sub-28hz` pitch shift begins: 2 semitones down over 1.6s. Implemented via `AudioContext.createOscillator` frequency ramp. |
| `1.6s` | ALL audio cuts. `GainNode.gain.setTargetAtTime(0, currentTime, 0.001)`. The silence IS the design. |
| `2.6s` | `descent-piano` plays. Single struck D♭3. Not faded in — struck. |
| `3.2s` | Piano sustains naturally into MIRA_PULSAR. |

#### Transition
At `t=3.2s`: `useScene.setPhase('MIRA_PULSAR')`. Black veil overlay `opacity 1→0` over 800ms.

---

### PHASE 4 — MIRA PULSAR
**Trigger**: Descent complete  
**Duration**: User-controlled

The 28Hz void hum is gone. The piano decays. What arrives is a click every 92ms. This is the new heartbeat of the experience. It does not stop until the final frame.

#### Visual State

**Neutron star**: `THREE.SphereGeometry(1.2, 32, 32)` with `THREE.MeshStandardMaterial`. Color: `#C89040` (amber, dense). `roughness: 0.7, metalness: 0.3`. Rotates on Y-axis at `0.4 rad/s`.

**Pulsar beam**: `THREE.PlaneGeometry(20, 0.04)` (wide thin quad, extends both directions from star). `THREE.ShaderMaterial` with additive blending, no depth write. The beam intensity uniform `uBeamIntensity` is set to `1.0` on each 92ms tick and decays as `e^{-t × 8}` in `useFrame` where `t` is seconds since last tick. Color: white center `#FFFFFF` to electric blue-white edge `#85CCF7`.

**Data lines**: 6 lines of Space Mono 9px text. Each line is hidden until its corresponding pulse. On pulse N, line N snaps into place — zero easing, zero fade. Mechanical counter-flip. Lines are absolutely positioned DOM elements overlaid on canvas.

```
Line 1: SYSTEM: MIRA — VOICE AI AGENT
Line 2: LATENCY: 92ms · END TO END
Line 3: STACK: PIPECAT · WEBSOCKETS · FASTAPI
Line 4: FUNCTION: REAL-TIME LEAD CONVERSION
Line 5: FUNCTION: FINANCE APPOINTMENT BOOKING
Line 6: RESULT: SUB-100MS · PRODUCTION GRADE    [color: #6a00ecff]
```

#### Pulsar Beat Scheduling
Using `AudioContext` for drift-free scheduling (not `setInterval`):

```typescript
// Schedules next beat relative to AudioContext clock — no drift
function scheduleBeat(audioCtx: AudioContext, nextBeatTime: number, bpm92ms: number) {
  const source = audioCtx.createBufferSource();
  source.buffer = pulsarClickBuffer;
  source.connect(audioCtx.destination);
  source.start(nextBeatTime);
  return nextBeatTime + bpm92ms / 1000;
}
```

The visual beam flash and data line reveal happen in `useFrame` by comparing `performance.now()` against the last beat timestamp — not in the audio scheduler.

#### Interaction
- Spacebar or pointer click: fires manual pulse (`pulsarManualFire = true` → handled in `useFrame`)
- On scroll advance: pulsar scene doesn't end — pulsar RECEDES. `uPulsarScale` shrinks from `1.0→0.15` over 1s. Pulsar remains visible in background of all subsequent scenes.

#### Audio
- `descent-piano` fades out over 4s (`GainNode` ramp)
- `pulsar-click` AudioContext scheduling begins immediately at phase entry
- Click continues for the remainder of the experience

#### Transition
Scroll advances. Hard cut through 200ms black. → DRIVEX_QUASAR.

---

### PHASE 5 — DRIVEX QUASAR
**Trigger**: Scroll from PULSAR  
**Duration**: User-controlled

#### Visual State

An invisible central point. Two relativistic jets erupting from it.

**Geometry**: `THREE.Points` with `THREE.BufferGeometry`. 3000 particles per jet, 6000 total. Each particle has attributes: `aAngle` (spiral seed), `aRadius` (distance from jet axis), `aSpeed` (individual speed variance `[0.8, 1.2]`), `aSeed` (random `[0,1]`).

**Jet motion**: Each particle orbits outward along the jet axis. Lifecycle `t = (uTime × aSpeed + aSeed) mod 1.0`. Position at lifecycle fraction `t`:
- Along jet axis: `t × 8.0` world units
- Perpendicular: `sin/cos(aAngle + uTime) × aRadius × (1.0 - t × 0.5)` — tightening spiral

**Left jet** (cold blue, technical): particles rendered with `#6AAAE8`. Ordered spiral, tight helix. Represents structured architecture.

**Right jet** (warm amber, human): particles rendered with `#E8A83C`. Looser helix, more radius variance. Represents organic business impact.

**Point size**: `mix(1.5, 0.5, t)` — smaller as particle accelerates outward. Additive blending, no depth write.

**Cursor zone detection**: Continuous check in `useFrame`. If `normalizedMouseX < -0.4`, left zone active. If `normalizedMouseX > 0.4`, right zone active. Uniform `uLeftActivation` and `uRightActivation` lerp toward `[0,1]` at rate `0.06/frame`.

**Cards condense from jet material**: When `uLeftActivation > 0`, two DOM overlay cards fade in with `cubic-bezier(0.16, 1, 0.3, 1)` over 600ms:
```
JET ALPHA — TECHNICAL
Architecting Agentic AI systems
High-scale automation · DriveX 2025

JET BETA — IMPACT
Conversion pipelines · Lead qualification
Webhook architecture
```
Cards are positioned at the jet zones, Space Mono 9px, `#E8E4D8`.

**Cursor crossing center**: When `abs(normalizedMouseX) < 0.05`, both jets converge at cursor position for 0.5s. Both `uConvergeStrength` uniforms pulse to `1.0` then decay.

#### Audio
- `quasar-left` loop on left speaker channel
- `quasar-right` loop on right speaker channel
- Both fade in over 1.5s on phase entry
- At cursor crossing center: both gain nodes briefly duck then rise together (0.3s)
- `pulsar-click` at -12dB underneath

#### Transition
Scroll. 800ms dissolve through black. → TWIN_BUILD.

---

### PHASE 6 — TWIN BUILD — BINARY MAGNETAR
**Trigger**: Dissolve from QUASAR  
**Duration**: User-controlled, drag-gated

#### Visual State

Two neutron stars in tight orbit. Full revolution period: 11 seconds.

**FuryX star** (left): `THREE.SphereGeometry(0.9, 32, 32)`. `MeshBasicMaterial({ color: '#6AAAE8' })`. Interface panels orbit it on a small ellipse — 4 plane geometries, gridline pattern shaders, semi-transparent. Panels oscillate slightly (shader `uTime` driven sine offset).

**Veronica star** (right): `THREE.SphereGeometry(0.9, 32, 32)`. `MeshBasicMaterial({ color: '#EFEFEF' })`. Vehicle schematics orbit it — 3 torus geometries (`TubeGeometry` along elliptical path), thin wireframe style with dashed material.

**Orbital positions**: Both stars orbit scene center. At time `t`:
```
furyX.position = { x: cos(t × 2π/11) × 2.5, z: sin(t × 2π/11) × 2.5 }
veronica.position = { x: -furyX.position.x, z: -furyX.position.z }
```

**Data bridges**: Two `THREE.TubeGeometry` along `THREE.CatmullRomCurve3` paths between the stars. `ShaderMaterial` with flowing pulse: `uPulseOffset` increments 0→1 each 2s, creating a visible pulse traveling star-to-star bidirectionally.

**Magnetic field lines** (circuit traces): Six `THREE.TubeGeometry` arc paths between the stars, visible only when `orbitAngle` (drag rotation) is between 135°–225° (rear view). `uRearViewBlend` uniform: `smoothstep(135, 180, orbitAngleDeg) × smoothstep(225, 180, orbitAngleDeg)`. Field line material: thin semi-transparent blue `#6AAAE8`.

**View band → card snap**:
| orbitAngle range | View label | Card snap |
|---|---|---|
| -45° to +45° | FRONT | Integrated overview — both stars labeled |
| +45° to +135° | FURYX | FuryX card snaps in (zero easing, zero duration) |
| +135° to +225° | REAR | Magnetic field traces appear, no card |
| +225° to +315° | VERONICA | Veronica card snaps in |

Cards content:
```
FURYX:    Chrome Extension · Strapi CMS · Automated News · Bidirectional Feedback
VERONICA: 1,047+ Components · Automated QA · AI Inspection · Manual Inspection Deprecated
```

**Drag progress indicator** (DOM overlay, center-bottom, Space Mono 9px, 55% opacity):
`ROTATE TO EXPLORE — [live integer]° / 180°`
Visible until drag reaches 180°. Then fades out permanently.

#### Interaction
- `onPointerDown` / `onPointerMove` / `onPointerUp` on a transparent overlay div covering the canvas
- `onTouchStart` / `onTouchMove` / `onTouchEnd` for mobile
- `deltaX` on move → `orbitAngle += deltaX × 0.4` (degrees per pixel)
- Scene rotates: entire scene `THREE.Group` Y-rotation = `orbitAngle` in radians
- Scroll advance gated: only allowed when `Math.abs(orbitAngle) >= 180`

#### Audio
- `quasar-left` and `quasar-right` fade out over 1s on entry
- `twin-flywheel` loop fades in over 2s
- `pulsar-click` at -15dB
- At drag completion (180°): `twin-flywheel` gain drops to 0 over 0.5s. Brief silence (0.3s). Then scroll is allowed.

#### Transition
After 180° drag complete, scroll triggers: HARD CUT, 0ms. → FORMULA_RINGS.

---

### PHASE 7 — FORMULA RINGS
**Trigger**: Hard cut from TWIN_BUILD (most violent transition)  
**Duration**: User-controlled

The hard cut is intentional violence. The user was inside mechanical weight. Now they are inside velocity.

#### Visual State

Camera positioned inside the ring plane, looking along the ring axis. Rings extend on both sides of camera. Claustrophobic and exhilarating.

**Geometry**: `THREE.BufferGeometry` with 8000 points. Per-particle attributes:
- `aAngle` (Float32Array): uniform random `[0, 2π]`
- `aRadius` (Float32Array): one of 5 values `[1.2, 1.8, 2.5, 3.3, 4.2]` (5 concentric rings, 1600 particles each)
- `aSpeed` (Float32Array): random `[0.25, 0.45]` — orbital speed variance
- `aSeed` (Float32Array): random `[0, 1]` — phase and size seed

**Orbital motion** in vertex shader: `currentAngle = aAngle + uTime × aSpeed`. Position: `(cos(currentAngle) × aRadius, sin(aSeed × 2π) × 0.04, sin(currentAngle) × aRadius)`. Slight vertical scatter (`0.04` scale) prevents perfect flat rings.

**Scroll velocity → ring speed**: `scrollVelocity` from Zustand store, smoothed with `smoothedSpeed = lerp(smoothedSpeed, abs(scrollVelocity) / 800, 0.12)` in `useFrame`. Clamped to `[0, 1]`. Written to `uScrollSpeed` uniform directly via `materialRef.current.uniforms.uScrollSpeed.value = smoothedSpeed`. No React state update.

**Point size**: `2.0 + smoothedSpeed × 16.0`. At rest: 2px dots. At full speed: 18px elongated streaks.

**Fragment shader anisotropic stretch**: `gl_PointCoord` stretched along X axis by factor `1.0 + uScrollSpeed × 7.0`. Creates horizontal streaks at speed, round dots at rest. Color: `mix(silver #ADADB5, white #FFFFFF, uScrollSpeed)`.

**Data points**: Ring particles carry data. At `smoothedSpeed < 0.15`, show Space Mono 9px overlay labels near the 5 rings (absolutely positioned DOM). At `smoothedSpeed > 0.3`, labels fade out.

Ring labels (Space Mono 9px, `#E8E4D8` at 70%):
```
Ring 1: FM23e ELECTRIC VEHICLE · MOTOR: KV-80 · 500 RPM/V
Ring 2: OPERATIONS LEAD · FORMULA MANIPAL 2022–2024
Ring 3: PATH PLANNING ACCURACY: +40%           [#B8FF3C]
Ring 4: FORMULA BHARAT 2024: 1ST PLACE         [#B8FF3C]
Ring 5: COST & MANUFACTURING: 1ST PLACE · SPONSORSHIP: ₹60 LAKH  [#B8FF3C]
```

#### Audio
- Phase entry: `rings-strings` audio begins
- Zimmer rising phrase — 12s, does not loop
- At `smoothedSpeed > 0.4`: `pulsar-click` volume rises from -18dB to -8dB. The EV motor rhythm matches the pulsar beat. Same frequency.
- `rings-strings` peaks at ~8s, then the phrase ends naturally. After it ends: silence approaching.

#### Transition
Scroll. Hard cut to silence and stillness. → QUANTUM_PLANET. The contrast is the transition.

---

### PHASE 8 — QUANTUM PLANET
**Trigger**: Hard cut from FORMULA_RINGS  
**Duration**: User-controlled

Stillness after velocity. The silence after the string swell is itself a design element.

#### Visual State

**Planet**: `THREE.SphereGeometry(1.4, 64, 64)`. `MeshStandardMaterial({ color: '#E8E4D8', roughness: 0.85, metalness: 0.0 })`. Drifts rightward at `0.08` world-units/second. No rotation.

**Atmosphere**: Second sphere `SphereGeometry(1.55, 64, 64)`, back-face rendered (`side: THREE.BackSide`). `ShaderMaterial` with additive blending. Fragment: rim glow intensity = `1.0 - dot(normalize(vNormal), normalize(vViewDir))`, raised to power 3. Color: nebula purple-blue `#7057D4`. This sphere has no depth write.

**Nebula background**: CSS `radial-gradient(ellipse at 35% 50%, rgba(112, 87, 212, 0.18) 0%, transparent 65%)` applied as a `div` behind the canvas. Zero GPU cost.

**Equation trail**: 6 DOM text elements follow the planet in screen space (calculated from `planet.position` projected to screen via `camera.project()`). Each equation drifts at the planet's speed, staggered behind it:
```
Schelkunoff: ∇²E + k²E = 0
Maxwell: ∇×B = μ₀J + μ₀ε₀∂E/∂t  
Quantum state: |ψ⟩ = α|0⟩ + β|1⟩
Monte Carlo: E[f(X)] ≈ (1/N)Σf(xᵢ)
Variational: min⟨ψ|H|ψ⟩/⟨ψ|ψ⟩
Schrödinger: iℏ∂|ψ⟩/∂t = H|ψ⟩
```
Font: Space Mono 11px, `#D4B857` (math gold), 85% opacity. Each equation `pointer-events: auto`.

**Equation hover**: `onMouseEnter` on equation → equation stops drifting. After 200ms hover: frosted glass panel expands from the equation position with `cubic-bezier(0.16, 1, 0.3, 1)` over 500ms.

Panel content by equation:
```
Schelkunoff  → "EM shielding simulation · vectorized physics engine · published"
Maxwell      → "Maxwell's equations solver · antenna simulation · 3D field visualization"
Quantum state → "Qiskit circuit design · state vector simulation · variational algorithms"
Monte Carlo  → "70% acceleration · quantum options pricing · Qiskit"  [70% in #B8FF3C]
Variational  → "VQE implementation · Qiskit · gradient descent optimization"
Schrödinger  → "Time evolution simulation · Hamiltonian design · quantum dynamics"
```

Panel style: `backdrop-filter: blur(12px) saturate(140%)`, `background: rgba(11, 13, 16, 0.75)`, `border: 1px solid rgba(232, 228, 216, 0.1)`, `border-radius: 2px`.

**Draggable panels**: Each expanded panel is freely draggable anywhere on screen via `onMouseDown` + `mousemove` on `document`. Position stored in local state. No snap. No bounds. No physics. Research has no fixed path.

**Monte Carlo click**: `onClick` on Monte Carlo equation. Fires `useScene.setShatterActive(true)`. Visual:
1. `0–400ms`: 8000 `THREE.Points` (separate `BufferGeometry`) scatter from planet center outward. Each particle: `velocity = normalize(randomDirection()) × random(2, 8)`. Position: `basePosition + velocity × (t/0.4)`. Alpha: `1.0 → 0.0` over 400ms.
2. `400–800ms`: particles reverse. Position: `velocity × (1.0 - (t-0.4)/0.4)`. Alpha: `0.0 → 1.0`. Converge back to origin.
3. `t=800ms`: particles hidden. Scene reassembled. `shatterActive = false`.

Shatter uses `THREE.Points` inside the R3F canvas — not DOM divs. This ensures GPU acceleration.

#### Audio
- Phase entry: All prior audio already silent (from FORMULA_RINGS end).
- `crystal-glass` loop fades in over 3s from 0 volume. Single sustained note, slightly dissonant.
- `pulsar-click` at -18dB. Barely perceptible. Still marking time.

#### Transition
Scroll. 800ms dissolve through black. All audio `GainNode` values set to 0 simultaneously (no ramp — cut). → SINGULARITY.

---

### PHASE 9 — SINGULARITY
**Trigger**: Dissolve from QUANTUM_PLANET  
**Duration**: 10s autonomous sequence, then interactive

#### Visual Timeline

| Time | Event |
|---|---|
| `0–3.0s` | Black. Silence. Absolute. Do not reduce this. |
| `3.0s` | Five cosmic orbs (`SphereGeometry(0.25, 16, 16)`, `MeshBasicMaterial`) begin traveling from screen edges to center on orbital arc paths. Colors: Pulsar `#85CCF7`, Quasar `#E8A83C`, Magnetar `#6AAAE8`, Rings `#ADADB5`, Planet `#E8E4D8`. Travel duration: 2.5s. Easing: `cubic-bezier(0.16, 1, 0.3, 1)`. |
| `5.5s` | Orbs arrive. Monolith materializes from black: `BoxGeometry(2.0, 3.2, 0.08)`. Scale animates `0.94→1.0` over 600ms using instrument easing. `MeshBasicMaterial({ color: '#0D0F12' })`. CSS overlay div handles frosted glass sheen: `backdrop-filter: blur(16px)`, `border: 1px solid rgba(232, 228, 216, 0.06)`. |
| `5.5–6.1s` | Monolith surface text materializes. Each character individually transitions from a random ASCII character `[33–126]` to its correct character over 600ms. Rate: 2 random chars per frame, then locks to correct char. Order: character by character left to right. Text: `> INITIALIZE CONTACT` in Space Mono 11px, `#E8E4D8`. |
| `6.1s` | Contact lines stagger in. Each line arrives from the direction of its associated body (CSS `transform: translate` from directional offset to `0, 0`). Stagger: 280ms between lines. Each line: `opacity 0→1` + `translate` over 600ms with `cubic-bezier(0.16, 1, 0.3, 1)`. |
| `~10s` | D♭2 organ note materializes. Not a fade — it appears at full volume, as if it was always there. Second note (A♭2, a fifth above) 4s later. Full chord (D♭2 + A♭2 + D♭3) 4s after that. Chord does not swell. It simply exists. |
| Final | Crosshair cursor blinks once (150ms on, 150ms off, then steady). Holds. Five orbs continue slow orbital drift in background forever. Monolith is still. |

Contact lines with directional origins:
```
Email:    danusharun999@gmail.com       [arrives from top-right — Pulsar direction]
Phone:    +91 9901148254               [arrives from right — Quasar direction]
LinkedIn: linkedin.com/in/danush-arun  [arrives from bottom-right — Magnetar direction]
GitHub:   github.com/DanushArun        [arrives from bottom — Rings direction]
Location: Bengaluru · India            [arrives from left — Planet direction]
```

#### Audio
| Time | Event |
|---|---|
| `0–3.0s` | Total silence. The most active sound in the experience. |
| `3.0s` | Room tone: ambient sine at 80Hz, volume -25dB. Barely audible. Spatial presence only. |
| `5.5s` | D♭3 piano (from Descent) plays once more — echo of the crossing. Single strike. |
| `6.1s` | Each contact line arrival: a quiet proximity tone (50ms sine burst) pitched to its scene's audio palette color. |
| `~10s` | D♭2 organ materializes (no attack, no fade — present). |
| `+4s` | A♭2 joins. |
| `+8s` | Full D♭ minor chord. Held indefinitely. |

---

## RENDER ARCHITECTURE

### Three.js Setup (Black Hole Canvas)

```typescript
// Initialized once for VOID → EVENT_HORIZON → DESCENT → MIRA_PULSAR phases
const renderer = new THREE.WebGLRenderer({
  canvas: bhCanvas,
  antialias: false,            // Custom chromatic aberration replaces MSAA
  alpha: false,                // Opaque canvas — no compositing with DOM
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;   // Manual clear per pass

// Render targets
const noiseRT = new THREE.WebGLRenderTarget(128, 128, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});

const spaceRT = new THREE.WebGLRenderTarget(
  window.innerWidth * Math.min(window.devicePixelRatio, 2),
  window.innerHeight * Math.min(window.devicePixelRatio, 2),
  { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }
);

const distortionRT = new THREE.WebGLRenderTarget(
  window.innerWidth * Math.min(window.devicePixelRatio, 2) * 0.5,  // Half resolution
  window.innerHeight * Math.min(window.devicePixelRatio, 2) * 0.5,
  { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }
);

// Context loss handling — required
bhCanvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  cancelAnimationFrame(rafId);
});

bhCanvas.addEventListener('webglcontextrestored', () => {
  // Rebuild all render targets and materials
  initBHRenderer();
});

// Disposal on phase exit
function destroyBHRenderer() {
  noiseRT.dispose();
  spaceRT.dispose();
  distortionRT.dispose();
  diskGeometry.dispose();
  diskMaterial.dispose();
  starsGeometry.dispose();
  renderer.dispose();
}
```

### R3F Canvas Setup (Cosmic Scenes)

```typescript
// Single R3F canvas, mounted when phase enters DRIVEX_QUASAR
// Scene components swap via phase state — no canvas remount
<Canvas
  gl={{
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,  // Allow software fallback rather than blank screen
  }}
  dpr={[1, 2]}
  camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 200 }}
  onCreated={({ gl }) => {
    gl.setClearColor('#0B0D10', 1);
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }}
>
  <Suspense fallback={null}>
    {phase === 'DRIVEX_QUASAR' && <DriveXQuasar />}
    {phase === 'TWIN_BUILD' && <TwinBuild />}
    {phase === 'FORMULA_RINGS' && <FormulaRings />}
    {phase === 'QUANTUM_PLANET' && <QuantumPlanet />}
    {phase === 'SINGULARITY' && <Singularity />}
  </Suspense>
</Canvas>
```

### Performance Contracts

| Scene | GPU Target | Draw Calls | Particle Count | Disposals Required |
|---|---|---|---|---|
| EVENT_HORIZON | < 8ms/frame | 5 | 100,000 | All 3 render targets on exit |
| DESCENT warp | 0ms (AI video) | 0 | 0 | — |
| MIRA_PULSAR | < 1ms/frame | 2 | 0 | Star + beam geom on exit |
| DRIVEX_QUASAR | < 3ms/frame | 2 | 6,000 | Both jet geometries on exit |
| TWIN_BUILD | < 12ms/frame | 8 | 0 | All 8 geometries + materials |
| FORMULA_RINGS | < 2ms/frame | 1 (instanced) | 8,000 | Ring geometry on exit |
| QUANTUM_PLANET | < 2ms/frame | 3 | 8,000 (shatter) | Shatter geometry on idle |
| SINGULARITY | < 1ms/frame | 6 | 0 | — |

All scene components must call geometry and material `.dispose()` in their React `useEffect` cleanup function.

---

## AI VIDEO INTEGRATION

### Candidate Sequences

| Sequence | Phase | Duration | Current State | AI Video Benefit |
|---|---|---|---|---|
| Star crystallization | VOID `1.2–2.0s` | 0.8s | Real-time Three.js particles | Astrophotography-grade imagery |
| Gravitational warp star field | VOID `2.0–2.8s` | 0.8s | UV distortion shader | Physically accurate lens simulation |
| Warp tunnel | DESCENT `2.6–3.2s` | 0.6s | Multi-shader GLSL | Consistent cross-GPU, cinematic quality |

### Preloading Strategy
All AI video WebM files are preloaded during the VOID phase while the 28Hz hum plays:

```typescript
// Triggered at JS hydration, before VoidPrologue begins
async function preloadCinematicVideos() {
  const urls = [
    '/video/stars-crystallize.webm',
    '/video/warp-descent.webm',
  ];
  
  await Promise.all(urls.map(url => {
    return new Promise<void>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      video.oncanplaythrough = () => resolve();
      video.onerror = () => resolve(); // Graceful failure — fall back to real-time
    });
  }));
}
```

### Fallback
If video files are unavailable or fail to load, fall back to real-time Three.js implementations for each sequence. The experience degrades gracefully — no white screen, no error state.

### Video Delivery Specs
- Format: WebM (VP9) primary, MP4 (H.264) fallback
- Resolution: 1920×1080 (scales to all devices)
- Audio: None (muted — audio handled by Web Audio API)
- Loop: false (loopless, play once)
- Target size: < 2MB per clip at 1080p

---

## MISSING — REQUIRED FOR SOTY

### 1. Case Study Route `/mira`

After Singularity, the Pulsar orb must be clickable. Click triggers:
- Pulsar orb scale `0.25 → 2.5` over 600ms (shared element)
- Blue light floods viewport
- Route transition to `/mira`
- On `/mira`: Pulsar visual persists as page header. Below it: full case study (problem, solution, stack, results, links).

Minimum viable case study content for SOTY: one route, one project, fully detailed. Mira is the strongest candidate (92ms latency metric, production deployment, measurable result).

### 2. Mobile Experience

TWIN_BUILD drag interaction and EVENT_HORIZON precise mouse physics require simplified touch versions:
- `TWIN_BUILD`: Touch drag works (already implemented). Reduce required arc from 180° to 90° for mobile.
- `EVENT_HORIZON`: Mouse X/Y physics disabled on touch. Replace with DeviceOrientation API (tilt phone to shift observer angle). Fallback: auto-animate at slow speed.
- `FORMULA_RINGS`: Touch scroll velocity coupling works natively.
- All other scenes: Touch scroll advances normally.

Mobile breakage is the most common Awwwards SOTY disqualifier. Test on physical iOS Safari and Android Chrome before submission.

### 3. Audio toggle

Single icon in top-right corner. Present on all phases. Space Mono 9px. Toggles between `AUDIO ON` and `AUDIO OFF`. Defaults to OFF (browser policy). Clicking ON starts AudioContext and begins audio for current phase.

---

## DESIGN LAWS SUMMARY

1. Everything has weight. Nothing bounces.
2. Silence is weaponized. Its absence after a scene is the scene's final beat.
3. The visitor always moves forward. There is no back.
4. Entry: emerge from black. Exit: compress toward a point.
5. Lime (#B8FF3C) marks achievements. Six instances. No more.
6. Every word is telemetry, an equation, or an achievement. No prose.
7. Interactive sequences use real-time GPU. Cinematic sequences use pre-rendered video.
8. Audio is physics made audible. Not background music.
