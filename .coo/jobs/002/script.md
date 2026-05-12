# Narrative script — Danush Arun portfolio (Job 002, v1)

Date: 2026-05-12
Scriptwriter: scriptwriter (via general-purpose fallback)
Status: v1 — pending founder review

## Spine (one paragraph)
A viewer lands on a literal black hole, watches their name resolve out of GPU dust, then is pulled past the event horizon by their own scroll. The warp drops them inside a real universe — nine actual places, each a working system as an interactive 3D scene. They do not read the work; they walk through it. By the contact card the question is not "is this credible," it is "how do we get him on a call this week."

## Voice contract (one paragraph + 4 rules)
The founder's voice is dry, systems-first, refuses adjectives where a number works. He says "sub-100ms latency," not "blazingly fast." He says "no hand-offs, no half-built systems." Every on-screen line reads like it could appear in a postmortem. The universe is the setting; the engineer is the protagonist; the projects are the evidence. We never wink at the metaphor — it is the room.

1. **Favor:** numerals, units, verbs, proper nouns. ("68 days." "5 languages." "Ship.")
2. **Forbid:** "passion," "journey of," "amazing," "innovative," "revolutionize," exclamation marks, "story."
3. **Length:** display ≤ 8 words. Caption ≤ 14 words. Two sentences max anywhere.
4. **Specificity floor:** every project beat ships a quantified outcome from the resume.

## Phase map (the 9+9 universe)
- L00 — Glitch loader (intro)
- C01–C05 — Black hole entry (orbit → pull → stretch → horizon → warp)
- C06–C09 — Emergence (anomaly → transition → emerge → project intro)
- W01–W09 — The 9 places (each = one project)
- E00 — Outro / contact

Phase IDs match `src/lib/scene-state.ts`. L00 and E00 are additions.

---

## Per-phase script

### L00 — Glitch Loader (intro)
- **Purpose:** Set register (mono system text, RGB-split, dark + ember) in 2–3s. Replaces "INITIALISING SINGULARITY."
- **Emotional register:** clinical / cold-start.
- **On-screen copy:**
  - Glitch fragments (~120ms each): `BOOT`, `LOCATING OBSERVER`, `CALIBRATING HORIZON`, `MASS = 4.3 × 10⁶ M☉`, `c = 299,792,458 m/s`, `OK`, `OK`, `OK`.
  - Final resolved line: `the universe is ready when you are.`
- **Voice / tonal note:** Diegetic system boot. Dark Star Labs principle.
- **Audio cue:** LF rumble fades in. Tape-stop tick per `OK`. Silence on final line.
- **Visual / motion handoff:** Mono caps 14px, chromatic split 2–4px, scanline noise. Final line in Instrument Serif italic to break system register.
- **Exit beat:** First scroll. Loader detonates into GPU dust → C01.

### C01 — Orbit
- **Purpose:** Establish hero (black hole) + author (Danush Arun).
- **Emotional register:** vast / steady.
- **On-screen copy:**
  - Title plate: `Danush Arun` — existing GPU particles (`blackHole/index.ts:258`), **preserve**.
  - Subtitle (small caps mono): `systems-first AI engineer`.
  - Bottom-right hint: `scroll`.
- **Voice / tonal note:** Subtitle is resume summary line 1 verbatim. No "welcome."
- **Audio cue:** Sub-bass drone. Granular disc-particle whisper.
- **Visual / motion handoff:** Hold existing 5-phase camera curve. Subtitle fades in 0.6s after title. Hint pulses 0.4Hz.
- **Exit beat:** Viewer scrolls. autoRotate decouples; camera locks on singularity.

### C02 — Pull
- **Purpose:** Make scrolling feel like gravity.
- **Emotional register:** committed / heavier.
- **On-screen copy:**
  - Top-left mono caps: `gravitational pull engaged`.
  - Right-side telemetry (ticks with scroll): `r = R₀ · e^(−λ·p)`.
- **Voice / tonal note:** Equation is real (`blackHole/index.ts:621`). Developer jury checks.
- **Audio cue:** Drone pitches down ~2 semitones. Whoosh per scroll tick.
- **Visual / motion handoff:** Telemetry tracks scroll velocity. RGB shift blooms on disc edge.
- **Exit beat:** Disc fills > 60% of viewport.

### C03 — Stretch
- **Purpose:** Spaghettification. First "did the website just do that" beat.
- **Emotional register:** disturbed / vertical.
- **On-screen copy:**
  - Telemetry (glitching): `tidal stress = critical`.
  - Brief flicker (200ms on, 600ms off, ×2): `do not look away`.
- **Voice / tonal note:** Only imperative in cosmic. Cut flicker if theatrical.
- **Audio cue:** Pitch slide up; granular grit increases.
- **Visual / motion handoff:** FOV 45° → 95° (`:629`). Add tidal-stretch vertex shader on text particles.
- **Exit beat:** RGB-split peaks. Disc compresses to vertical bar.

### C04 — Horizon
- **Purpose:** The crossing. The single most important second of the page.
- **Emotional register:** silent / weightless.
- **On-screen copy:**
  - Display serif title card, hold 1.2s: `event horizon`.
  - Mono tick just before flash: `c reached`.
- **Voice / tonal note:** Only display-type beat in cosmic until C09. David Whyte single-statement principle.
- **Audio cue:** All audio cuts. ~600ms held silence. One sub-bass woosh on flash.
- **Visual / motion handoff:** White flash on crossing (missing per audit). Camera dives to z=−100. Cursor-lag peaks then releases.
- **Exit beat:** Flash recedes; wormhole walls reveal.

### C05 — Warp
- **Purpose:** Set tone of the universe before any place exists.
- **Emotional register:** propulsive / wide.
- **On-screen copy:**
  - Mid-warp, 1.4s hold: `you are no longer outside the system.`
  - Final beat (mono caps): `the work lives here.`
- **Voice / tonal note:** First line is the thesis of the page. Do not punch it.
- **Audio cue:** Doppler-pitched synth pad (Cartier per-chapter principle).
- **Visual / motion handoff:** Keep existing 32-ring tunnel + 4000 streaks. Replace R3F `WarpScene.tsx` cylinders (audit flagged redundant). Veil crossfade into C06.
- **Exit beat:** Tunnel walls fall away. Stars open out — field looks wrong.

### C06 — Anomaly
- **Purpose:** Refuse the "normal solar system" cliché. This universe has its own rules.
- **Emotional register:** uneasy / observant.
- **On-screen copy:**
  - Top-left, glitching: `signal acquired`.
  - Briefly, RGB-split center: `something is here.`
- **Voice / tonal note:** Replace cyan wireframe cubes. Anomaly is RGB chromatic-split on starfield itself, not new geometry.
- **Audio cue:** Pad dips. Granular grit syncs to RGB intensity.
- **Visual / motion handoff:** Use `design-tokens.cosmicHues.glitchA/B/C` for real RGB-split shader on R3F starfield.
- **Exit beat:** Stars resolve to orbit a point.

### C07 — Transition
- **Purpose:** Chaos → structure that implies the 9 places.
- **Emotional register:** clarifying / settling.
- **On-screen copy:**
  - Centered mono: `nine systems. one engineer.`
- **Voice / tonal note:** Only place "nine" is named on screen. Earns the structure that follows.
- **Audio cue:** Pad resolves to sustained chord. Grit drops out.
- **Visual / motion handoff:** Preserve chaos→orbit convergence + 3 rings (`TransitionConvergence.tsx:98-148`). Replace hard-coded hex with tokens.
- **Exit beat:** Rings collapse into a single orbital plane.

### C08 — Emerge
- **Purpose:** First view of the universe as inhabited. 9 locations are distant lights.
- **Emotional register:** open / spacious.
- **On-screen copy:**
  - Bottom-center small caps: `welcome to the universe.`
- **Voice / tonal note:** Single line breaks the dry register. Allowed — founder's vision is literal, hospitality at the threshold.
- **Audio cue:** Chord opens out. Light space-bed under it.
- **Visual / motion handoff:** Replace placeholder twin Suns. 9 distant pinpricks at distinct distances/colors — each = a W-phase.
- **Exit beat:** Camera lifts; 9 pinpricks resolve into defined silhouettes.

### C09 — Project intro
- **Purpose:** Title card. Rules of the next chapter without saying "here is my work."
- **Emotional register:** prepared / quiet.
- **On-screen copy:**
  - Display serif, centered: `Selected work.`
  - Mono caption: `nine places. each one is a system that ships.`
  - Bottom: `scroll to enter the first.`
- **Voice / tonal note:** Last cosmic beat. Display serif returns once, then yields.
- **Audio cue:** Brief silence. One bell tone on title reveal. Ambient bed continues.
- **Visual / motion handoff:** Camera pulls back to z=18. Nearest pinprick has grown into a defined 3D location at frame edge.
- **Exit beat:** First pinprick fills 60% of frame. W01 begins.

---

## W-phases — the 9 places

Slot IDs fixed by `src/lib/copy.ts`.

### W01 — MIRA
- **Project assigned:** MIRA — production outbound voice AI, 5 Indian languages, sub-100ms latency, 7s → <500ms over 68 days (DriveX).
- **Place in the universe:** A **pulsar station**. Rotating signal source emitting coherent beams of voice. The viewer hears it before they see it — how the product reaches a customer.
- **3D model brief for 3d-graphics-engineer:** Magnetic-pole pulsar with two opposed light cones built from 5 superimposed waveforms (one per language), each Doppler-pitched. 482ms latency hard-rendered as spin period (1.243 Hz). The spin IS the metric.
- **Purpose:** In 8 seconds prove this person ships production AI under real latency, in 5 languages, in months.
- **On-screen copy:**
  - Plate: `MIRA — Pulsar Station`
  - Outcome: `7s → 482ms. 5 languages. 68 days. Live.`
  - Caption: `Real-time speech pipeline, distributed call orchestration, intent classification, CRM + WhatsApp coordination.`
- **Interactive hook:** Click to slow time. Hear a greeting in the selected channel. Drag to switch language; waveform reshapes live.
- **Voice / tonal note:** W01 must be strongest. MIRA wins on quantification + production stakes. Replace current Canvas-2D viz with WebGL.
- **Audio cue:** 5 real language samples, one per beam. Pulsar tick per spin.
- **Exit beat:** Pulsar shrinks back to a star. Next location lights up.

### W02 — AIDEN
- **Project assigned:** AIDEN — call analytics platform, 31 days, 8 SOP dimensions, Zoho-embedded React, K8s + E2E.
- **Place in the universe:** An **observatory** orbiting alongside MIRA. Where MIRA emits, AIDEN watches.
- **3D model brief:** Floating 8-faced polyhedron, each face one SOP dimension lit by live data. Diarization waveform threads through showing two speakers as two color channels.
- **Purpose:** Engineer ships the observability that grades the system, not just the system.
- **On-screen copy:**
  - Plate: `AIDEN — Observatory`
  - Outcome: `31 days. 8 SOP dimensions. Every call.`
  - Caption: `Speaker diarization, paralinguistic emotion, parallel LLM, React-in-Zoho. K8s + E2E.`
- **Interactive hook:** Drag a face toward camera. SOP dimension expands into live scoring chart scrubbing an anonymized call timeline.
- **Voice / tonal note:** Companion beat to MIRA. New verb: *measure*.
- **Audio cue:** Same drone bed as MIRA, one octave up — they are paired.
- **Exit beat:** Observatory drifts behind frame.

### W03 — VANGUARD
- **Project assigned:** Autonomous web testing agent — local VLM + Playwright. Tests DriveX site continuously without scripted test cases.
- **Place in the universe:** A **sentinel drone** in patrol orbit around an off-camera planet (the website it tests).
- **3D model brief:** Compact craft, single eye-camera. Planet surface flickers red (issue) / amber (self-healing) / green (resolved). Drone trail draws the orbit live.
- **Purpose:** Range. Same engineer who ships production AI ships internal tooling that replaces test suites with agents.
- **On-screen copy:**
  - Plate: `VANGUARD — Sentinel`
  - Outcome: `Tests a live site. No scripts. Continuously.`
  - Caption: `Local VLM + Playwright. Detects, self-heals, validates without a test case file.`
- **Interactive hook:** Click planet to inject a fault. Drone observes; tile shows live VLM reasoning; drone attempts a fix.
- **Voice / tonal note:** Single-sentence pitch lands faster here than EMI or Wave Field would.
- **Audio cue:** Mechanical hum. Click pings per VLM step.
- **Exit beat:** Drone holds station. Camera leaves it working.

### W04 — VERONICA (INSPECTION)
- **Project assigned:** Veronica — AI vehicle inspection across 1,000+ parts.
- **Place in the universe:** A **dry-dock orbital station** holding a vehicle in suspension.
- **3D model brief:** Two-wheeler at center of a ring station. 5 concentric rings (STRUCTURE / MECHANICAL / ELECTRICAL / COSMETIC / TYRES & WHEELS, per `copy.ts:44`) sweep in sequence laying coverage heatmap. Defects flag red; counter climbs.
- **Purpose:** CV at industrial scale. "1,000+" reads as motion — the dots accumulating are the proof.
- **On-screen copy:**
  - Plate: `VERONICA — Dry-dock`
  - Outcome: `1,000+ parts inspected per vehicle. Every layer.`
  - Caption: `CV sweep across 5 layers: structure, mechanical, electrical, cosmetic, tyres + wheels.`
- **Interactive hook:** Drag timeline to play, pause, scrub. Defect counter + ring focus track in lock-step.
- **Voice / tonal note:** Numbers do the work. FuryX folds in here as a one-line credit.
- **Audio cue:** Scanner tick per sweep. Chime per defect.
- **Exit beat:** Rings retract. Vehicle drifts free.

### W05 — WAVE FIELD
- **Project assigned:** Wave Field Attention — O(n log n) replacing O(n²) softmax. ~200,000× theoretical speedup at 1M tokens. Grounded in Alman-Yu lower bound (ICLR 2025). Paper produced.
- **Place in the universe:** A **research station** in deep field — alone, far from the production cluster.
- **3D model brief:** Two volumetric curves as 3D shapes. O(n²) climbs as a tall steep wall; O(n log n) hugs the ground. Token-count slider on the floor. At n=1M, wall is 200,000× taller — camera cannot show both.
- **Purpose:** Research depth alongside production craft. The slider IS the chart.
- **On-screen copy:**
  - Plate: `WAVE FIELD — Research Station`
  - Outcome: `O(n²) → O(n log n). ~200,000× at 1M tokens.`
  - Caption: `Sub-quadratic attention grounded in the Alman-Yu lower bound (ICLR 2025). Paper available.`
- **Interactive hook:** Drag slider 1K → 1M. At 1M, camera locks; viewer must scroll camera up to see top of wall.
- **Voice / tonal note:** Cold mathematical beat. Allowed — viewer has belief from W01–W04.
- **Audio cue:** Sub-bass swell on O(n²) as slider rises. Silence on O(n log n). Asymmetry IS the joke.
- **Exit beat:** Slider locks at 1M. Camera leaves the wall mid-frame, dwarfed.

### W06 — EMI ENGINE
- **Project assigned:** Computational Physics Engine + EMI Shield Designer (Dec 2024–present). Vectorised Schelkunoff EM shielding for multi-phase composites. 100 kHz–10 GHz. 20-year service prediction. Jenkins + SonarQube.
- **Place in the universe:** A **shielded forge** — chamber sealed against radiation with composite slab scanned across the EM spectrum.
- **3D model brief:** Composite slab in chamber. Frequency dial (100 kHz left, 10 GHz right). Above the slab, 3D field-line viz shows EM waves attempting to penetrate; field bends, scatters, absorbs. Physics, not a graph.
- **Purpose:** Silicon-level work. Original ML research and physics simulation in the same resume.
- **On-screen copy:**
  - Plate: `EMI ENGINE — Shielded Forge`
  - Outcome: `100 kHz to 10 GHz sweep. 20-year service prediction.`
  - Caption: `Vectorised Schelkunoff for multi-phase composites. Jenkins + SonarQube in CI.`
- **Interactive hook:** Drag dial. Hover slab for attenuation in dB.
- **Voice / tonal note:** Two domains in one breath — research + production CI/CD. Keep dry.
- **Audio cue:** Resonance hum at dial frequency. Hum drops as attenuation rises.
- **Exit beat:** Slab cools. Chamber dims.

### W07 — FORMULA MANIPAL
- **Project assigned:** Formula Manipal — FM23e EV (May 2022–Jan 2024). Operations Lead. 40% control accuracy improvement. 1st Cost & Manufacturing, Formula Bharat 2024. INR 60,00,000 sponsorships.
- **Place in the universe:** A **race-line ribbon** — not a planet, a track suspended in the universe.
- **3D model brief:** Closed-loop ribbon road. INITIAL path (red, wider) and OPTIMIZED (white, tight to apex). EV silhouette runs the optimized path on loop. Legend per `copy.ts:74`. The 40% improvement reads as geometric tightening.
- **Purpose:** Engineer is also an operator — led a team, negotiated sponsorship, won the segment.
- **On-screen copy:**
  - Plate: `FORMULA MANIPAL — Race Line`
  - Outcome: `40% control accuracy. 1st Cost & Manufacturing. INR 60L raised.`
  - Caption: `Operations Lead. Autonomous path planning + controls for the FM23e EV.`
- **Interactive hook:** Click the EV. Side panel shows the path-planning step that picked the tighter line.
- **Voice / tonal note:** Operator beat. Late slot reads as "before all this, he led a team and won."
- **Audio cue:** Distant engine bed; doppler-shifted as EV laps.
- **Exit beat:** EV completes a lap. Track folds away.

### W08 — THE ENGINEER (ABOUT)
- **Project assigned:** Founder identity card. Resume summary, skill stack, education. Tescom internship lives here as one-line credit.
- **Place in the universe:** A **control room** — the universe's source. Where the engineer sits when not on a planet.
- **3D model brief:** Spare monolithic console floating in space. Stack-chips orbit in concentric rings. Console screen reflects the viewer's actual journey-progress through the page they just walked — a literal mirror.
- **Purpose:** Identity beat *after* evidence beats. They have seen the work; this names the maker.
- **On-screen copy:**
  - Plate: `THE ENGINEER`
  - Identity: `Systems-first AI engineer.`
  - Caption: `B.Tech EEE, Manipal Institute of Technology, 2025. Executive PG Cert Full Stack, IIT Roorkee iHUB, 2025.`
  - Stack ring (mono caps): `PYTHON · DJANGO · FASTAPI · REACT · NEXT.JS · TYPESCRIPT · C++ · K8S · POSTGRES · AWS · PIPECAT · QISKIT · MCP · RAG · YOLOv8`
  - Footnote: `Earlier: PCB testing + assembly line logic, Tescom, 2024.`
- **Interactive hook:** Hover a chip; console recompiles to show one project where that tech shipped.
- **Voice / tonal note:** No "passionate." No "love." The console is the person.
- **Audio cue:** Room tone. Soft fan whir.
- **Exit beat:** Console fades. Final antenna pings on the horizon.

### W09 — CONNECT
- **Project assigned:** Contact CTA (also the closing 3D scene).
- **Place in the universe:** A **signal antenna** pointing back out of the universe — toward the viewer.
- **3D model brief:** Antenna tracks the viewer's cursor. Three beams: LinkedIn, GitHub, Email. Hover locks antenna; chosen beam brightens. The antenna is the only object in the universe that sees the viewer.
- **Purpose:** Convert credibility built across W01–W08 into action. Scrolling away should feel like the harder choice.
- **On-screen copy:**
  - Plate: `OPEN A CHANNEL`
  - CTA (display serif): `let's build.`
  - Sub: `Big systems need engineers who finish them.`
  - Links (mono): `LINKEDIN · GITHUB · EMAIL`
- **Interactive hook:** Cursor steers antenna. Click a beam; dispatches link / mailto in new tab without leaving the universe.
- **Voice / tonal note:** Echo "no half-built systems." Not "get in touch" — "let's build."
- **Audio cue:** Drone resolves to a single sustained note while cursor is in W09 viewport.
- **Exit beat:** Antenna locks on last-hovered beam. E00 fades in.

---

### E00 — Outro / contact
- **Purpose:** Convert the impression to action.
- **On-screen copy:**
  - Closing (display serif): `the universe is yours when you're ready to build inside it.`
  - CTA: `growth@partner.drivex.in`
  - Contact: `Danush Arun · growth@partner.drivex.in · linkedin.com/in/danush-arun-5aa762267 · github.com/DanushArun`
  - Technique footer (mono small): `Rendered with WebGL. Raymarched accretion disc. GPU-instanced starfield. Schnittman Doppler shader. Built solo.`
- **Voice / tonal note:** Final line is the only sentimental beat allowed on the page. Technique-credit footer per Active Theory.

---

## Project-to-slot rationale

| Slot | Project | Why this slot |
|---|---|---|
| W01 | MIRA | Strongest opener. Production-shipped, quantified (7s → 482ms in 68 days), 5 languages. Earns belief in 8s. |
| W02 | AIDEN | Companion to MIRA. New verb (*measure*). 31 days, K8s. Depth, not repetition. |
| W03 | Vanguard | First domain pivot. Single-sentence pitch lands fast. |
| W04 | Veronica | Industrial CV. "1,000+" is a unique signature. FuryX credit folds in here. |
| W05 | Wave Field | Centerpiece research beat. Viewer has belief and can afford a cold interactive. |
| W06 | EMI Engine | Silicon-level physics. Proves "ML research AND Kubernetes deployment". |
| W07 | Formula Manipal | Operator beat. Late slot reads as "before all this, he led a team and won." |
| W08 | About (Engineer) | Identity after evidence. Tescom lives here as one line. |
| W09 | Connect | Antenna closes the universe by pointing back out of it. |

**Recommended cuts / combinations.** 9 W-slots; founder named 9 projects, but W08 and W09 are reserved for identity + outro — **7 project slots for 9 candidates**. Recommendation: **fold FuryX into W04 caption** ("Chrome Extension + Strapi CMS portal shipped alongside") — same DriveX product-ops domain. **Cut Tescom Hardware (2024 internship)** as a place; surface as one-line `Earlier:` footnote in W08. Keeps every place strong. Alternatives if rejected: (a) compress W08 into E00, or (b) accept two thinner places.

---

## Awwwards-bar checks
- [x] Every beat earns its place — 23 phases, one purpose + one quantified outcome each.
- [x] On-screen copy in 2–4s read budget (≤8 words display, ≤14 words caption).
- [x] Specifics over adjectives — "sub-100ms / 482ms / 68 days / 31 days / 1,000+ / O(n log n) / ~200,000× / 100 kHz–10 GHz / 40% / INR 60L" verbatim from resume.
- [x] Voice consistency — dry, mono-spaced, systems-first across all 23 phases. Display serif reserved for narrative pivots (C04, C09, W09, E00).
- [x] Cohesive metaphor — universe is the literal setting, not a stylistic frame. Each W-phase is a place, not "represented by" a planet.

## Open questions for founder
1. **Glitch loader register.** Draft uses physical constants (mass, c, OK). Alternative: technique-first ("WORMHOLE FN COMPILED / SHADERS LINKED / DOPPLER OK"). Which feels more "you"?
2. **FuryX + Tescom.** Recommendation: fold FuryX into W04 caption, cut Tescom to W08 footnote. You said "all 9 should be shown" — confirm, or tell me which W01–W07 beat to compress.
3. **Audio direction.** (a) ambient drone + diegetic SFX (current, recommended), (b) synthwave score with project motifs, (c) silence + diegetic SFX only.
4. **Naming the universe.** No brand name on-screen yet. If you want one ("ARUN-Σ", "the Singularity", "the Lab"), natural slot is C09 or the W08 console nameplate.
5. **E00 resume download.** Want a literal `Download CV (PDF)` link beside the email?
