---
id: 002
title: Direction — from black hole to Awwwards-tier portfolio
shape: spike
status: done
owner: COO
opened: 2026-05-12
closed: 2026-05-12
priority: P1
---

## Spec
The portfolio has a working black hole simulation (`src/lib/blackHole/`) + an 18-phase journey scaffold (`src/lib/journey-map.ts`) + several R3F scenes (`src/components/scene/scenes/`). The cinematic script v2 from the prior planning round was deleted during the May-12 cleanup but exists in the git tag `pre-cleanup-2026-05-12`. The founder wants direction on what to build next, to a bar that competes with Awwwards SOTM/SOTY winners.

This spike defines the script, the motion direction, and a phase-by-phase composition plan. The output is the **direction package** that subsequent feature jobs implement against. No production code ships from this spike — only direction docs and a build sequence.

## Acceptance criteria
- [x] AC1: The founder's resume + relevant past work has been read and the script grounds in real specifics (named projects, named outcomes), not abstractions.
- [x] AC2: A finalized narrative script exists at `.coo/jobs/002/script.md` — one beat per phase (18 phases), on-screen copy lines, voice/tone notes. Founder approved.
- [x] AC3: A finalized motion direction brief exists at `.coo/jobs/002/motion-brief.md` — project-wide motion language + per-phase choreography brief. Founder approved.
- [x] AC4: A gap analysis exists at `.coo/jobs/002/gap-analysis.md` — for every phase, "what exists / what's stubbed / what's missing" with file paths, owner specialists, and effort estimates (S/M/L).
- [x] AC5: A sequenced build plan exists at `.coo/jobs/002/build-plan.md` — critical path, parallel tracks, named follow-on jobs (with proposed IDs and titles) that implement the package.
- [x] AC6: At least 5 Awwwards SOTM/SOTY references documented at `.coo/jobs/002/references.md` — each with a specific principle to steal (motion vocabulary, type system, color, navigation pattern, micro-interaction).
- [x] AC7: Founder explicitly signs off on the direction package before any implementation job opens.

## Out of scope
- Writing production code (every implementation lives in follow-on jobs that this spike unlocks).
- Choosing new libraries (defer to `library-evaluator` per follow-on job).
- Redesigning the black hole simulation (it works; we build forward from it).
- Picking the final brand color palette / typography (open as a separate creative job after this spike if needed).

## Plan
1. **`website-builder`** — codebase audit of the current state across all 18 phases (file inventory + what works + what's stubbed).
2. **`deep-researcher`** — Awwwards SOTM/SOTY references over the last 18 months that share territory with this project (3D portfolios, scrollytelling, founder/personal sites). 5+ refs minimum with principle-to-steal per ref. Saves to `.coo/jobs/002/references.md`.
3. **`scriptwriter`** — reads resume + audit + references; drafts the narrative script. Iterates with the founder to v1.
4. **`animator`** — reads the approved script + references; drafts the motion direction brief (motion language + per-phase choreography). Iterates with the founder to v1.
5. **`website-builder`** — synthesizes audit + script + motion brief into the gap analysis and the build plan with named follow-on jobs.
6. **COO** — quality gate on the direction package, present to founder for sign-off, then open the follow-on feature jobs.

## Dispatches

### 2026-05-12 — website-builder (via general-purpose fallback) — codebase audit
Brief: Read-only inventory of all 18 phases + cross-cutting systems. Cite file:line for every concrete claim. No fabrication of missing phases.

**Report:** Full audit at `.coo/jobs/002/current-state-audit.md` (1,650 words).

Headlines:
- **Cosmic left-half C01–C05** is production-grade — Bruno Simon-style black hole, EHT-faithful Doppler beaming, mathematically-continuous 5-phase camera curve (orbit → horizon → wormhole transit). This is the asset to build around.
- **Cosmic right-half C06–C09** is placeholder — cyan wireframe cubes ("Anomaly"), procedural shader Suns ("Emerge"). Visually unworthy of Awwwards bar.
- **Work half W01–W09** is essentially unbuilt: 8 of 9 panels are literal `<div>Stub</div>`. Only MIRA is shipped, plus its `/mira` deep route.
- **Bones are good**: Zustand+ScrollTrigger phase machinery, six named easings, panel-hue tokens, single Lenis scroll driver with test handle.
- **Cross-cutting gaps** (Awwwards-bar blockers): zero `prefers-reduced-motion` handling, `body { cursor: none }` globally with no replacement outside C04, no production HUD/nav/logo, audio stubbed (engine reverted 4 commits ago), typography stacks mismatched between `src/app/layout.tsx` and `design-tokens.ts`.

New open questions surfaced by the audit (6 total in the file).

### 2026-05-12 — deep-researcher (via general-purpose fallback) — Awwwards references
Brief: 5+ verified Awwwards SOTM/SOTY/Honors winners from last 18 months sharing territory with a 3D founder-portfolio. Concrete principle-to-steal per ref. No padding.

**Report:** Full reference deck at `.coo/jobs/002/references.md` (1,496 words). 10 refs delivered.

Headline patterns:
1. **Two-color discipline is the price of entry** — 9/10 winners use a strict 2-color palette (dark + cream/grey/accent). Ornate palettes don't win in 2024–2026.
2. **Motion is the highest-leverage axis** — every winner scored 8.0+ for animations/transitions. SOTY 2025 (Lando Norris) won *on motion craft*, not visual design. Motion budget should exceed visual-design budget.
3. **One signature 3D object beats scattered WebGL** — winners commit the page to a single hero geometry that reappears as a protagonist. Background-WebGL-just-because no longer scores.

Top-3 anchor refs:
- **Lando Norris (SOTY 2025)** — one-person narrative site committed to one 3D hero. Maps directly to "the black hole is on-screen across all 18 phases, framed cinematically".
- **Cartier Watches & Wonders 2025** — direct analog to the 9+9 phase structure (chapter-based 3D universes with per-chapter sound design).
- **Dark Star Labs (Honors Apr 2026)** — closest aesthetic match (cosmic duotone, diegetic loading copy, hero's-journey section flow).

3 new open questions surfaced (audio decision, hero-geometry commitment, intro animation).

### 2026-05-12 — scriptwriter (via general-purpose fallback) — narrative script v1
Brief: Draft 23-phase script grounded in founder's resume + vision, voice-locked, Awwwards-tier. Save to `.coo/jobs/002/script.md`.

**Report:** Full script at `.coo/jobs/002/script.md` (320 lines).

Headlines:
- **Spine**: "Land on a literal black hole. Get pulled past the event horizon by your own scroll. Emerge inside a real universe of nine actual places — each a working system you walk through rather than read about."
- **23 phases**: L00 glitch loader + C01–C09 cosmic + W01–W09 places + E00 outro.
- **Project-to-slot rationale**: W01 MIRA (Pulsar Station) → W02 AIDEN (Observatory) → W03 Vanguard (Sentinel) → W04 Veronica + FuryX-fold (Dry-dock) → W05 Wave Field (Research Station) → W06 EMI Engine (Shielded Forge) → W07 Formula Manipal (Race Line) → W08 The Engineer + Tescom-footnote (Control Room) → W09 Connect (Signal Antenna).
- **Voice contract**: favor numerals/units/verbs/proper nouns; forbid "passion / journey of / amazing / innovative / story / !"; display ≤ 8 words; caption ≤ 14 words; quantified outcome per project beat.
- **Awwwards-bar checks**: all 5 ticked.

5 open questions surfaced (loader register, FuryX/Tescom, audio, naming, CV download).

### 2026-05-12 — animator (via general-purpose fallback) — motion direction brief v1
Brief: Draft motion direction brief for all 23 phases. Define motion language + per-phase choreography + W→W travel + hero camera + a11y/reduced-motion contract. Save to `.coo/jobs/002/motion-brief.md`.

**Report:** Full motion brief at `.coo/jobs/002/motion-brief.md` (2,796 words).

Headlines:
- **Personality**: "Gravity-led — long inhales, snap-on-arrival, silence between moves; every motion is the universe doing physics, never decoration applied on top of it."
- **Easing palette (7 named)**: `gravity-arrival` (cubic-bezier 0.16,1,0.3,1) for arrivals; `event-horizon` (0.87,0,0.13,1) for crossfades; `tidal` (0.7,0,0.84,0) for acceleration into singularity / W-departure compression; plus `pulsar`, `accretion`, `cut`, `breath` for periodic/idle/glitch/wait beats.
- **W→W travel transition (defined once, reused everywhere)**: 1.6s scrubbed three-beat — Compress (0.4s, place collapses to a point, `tidal`) → Travel (0.6s, camera pulls back through starfield warp-blur + Doppler hue stretch, `event-horizon`) → Emerge (0.6s, next pinprick grows to fill frame, `gravity-arrival`). ~200ms silence at warp midpoint lets the next place hit harder.
- **Hero black-hole during W-phases**: **implied, not visible**. Each W-phase starfield carries a subtle `uGravLens ≈ 0.05` radial distortion anchored to a different frame edge per place — viewers feel the singularity's pull on stars without seeing it. Forcing visible BH would compete with W foreground (the references.md "background-WebGL-just-because" anti-pattern).
- **Reduced-motion contract**: explicit fallback for every motion beat. Audit's zero-coverage gap fixed systemically.
- **Keyboard parity**: Page Down / arrows / Home / End advance phases equivalently to scroll. Pin + "skip to next" affordance.

### 2026-05-12 — animator open questions resolved by COO defaults

1. **Per-W accent colors** — DEFER to per-W implementation jobs (animator recommended; agreed). Each W-place can introduce one accent color when in scene; system always returns to void+accretion when no scene is foreground.
2. **W→W travel audio** — KEEP animator's recommendation: sub-bass swell during compress (0.4s) → 200ms silence at warp midpoint → sub-bass swell on emerge (0.6s). Sits inside the ambient-orchestral bed. Diegetic place-SFX crossfades over the swell.
3. **Pinning vs free-scroll for W-phases** — PIN (~165vh per place) + "skip to next" affordance. Animator recommended; agreed. Rationale: pinning forces engagement with each interactive — matches Awwwards "motion budget > visual budget" principle and the founder's "incredible interactive 3D models" vision. Skip affordance preserves user control (a11y / impatient viewer escape hatch).

### 2026-05-12 — website-builder (via general-purpose fallback) — gap analysis + build plan
Brief: Synthesize audit + script + motion brief into per-phase gap analysis + sequenced build plan with named follow-on jobs.

**Reports:**
- Gap analysis: `.coo/jobs/002/gap-analysis.md` (2,325 words)
- Build plan: `.coo/jobs/002/build-plan.md` (1,695 words)

Headlines:
- **Critical path (must be sequential)**: Job 003 system foundations → Job 004 audio engine → Job 005 MIRA Canvas-2D removal → Job 006 L00 glitch loader → Job 007 C06–C09 cosmic re-direct → Job 008 W01 MIRA Pulsar Station (establishes W-phase scaffold contract).
- **Parallel tracks (after Job 003 ships)**: Track A cosmic polish (Job 009), Track B 8 W-place builds (Jobs 010–017 in parallel after Job 008 lands the contract), Track C cross-cutting (Job 018 E00, Job 019 perf, Job 020 a11y).
- **Biggest ship risk**: the W-phase scaffold contract from Job 008. If `onEnter`/`onTick`/`onExit` semantics aren't documented and ratified, Jobs 010–017 drift apart at integration. Rigor here pays back across the longest pole in the schedule.
- **Calendar estimate**: ~10–14 weeks total (3–4 wk critical path + 6–10 wk parallel W-phase track + 2 wk cross-cutting).
- **Awwwards submission**: pre-submission checklist as Job 021 after perf + a11y sign off. Targets: Site of the Day → eligible for SOTM → eligible for SOTY.

Two findings handled inside the gap analysis (no founder action needed now):
- `src/lib/copy.ts:80` violates the script's voice contract ("loves building" — rewrite in Job 016).
- `src/lib/copy.ts:94` email is `procx@partner.drivex.in`; correct to `growth@partner.drivex.in` in Job 017.

## Direction package status
All 7 AC complete. Status → review, pending founder sign-off.

## Decisions

### 2026-05-12 — Founder direction lock-in

**Resume:** `/Users/danusharun/Downloads/Important/Danush_Arun_Resume.pdf`

**Target viewer:** Prospective employers, with the explicit goal of submitting to **Awwwards.com**. Both bars must clear simultaneously — employer-credible specifics + Awwwards-tier craft.

**Founder's references:** Bruno Simon portfolio, Lando Norris, Igloo. **Critical constraint**: "I want it as my universe which is an actual universe" — the cosmic metaphor is **literal**, not stylistic decoration. Distinct from refs in that this is a true universe, not a brand using space iconography.

**Cinematic script v2 (prior):** NOT recovered. Fresh script.

**Master vision (verbatim from founder):**
> The black hole stays as the landing page with the name title. My vision was to give a breathtaking experience for the user by letting them scroll and fall into the black hole past the event horizon and a warp scene to set the tone. From there each project has its place in the universe. This is shown with incredible 3D models that are interactive and convey the information on the work done to the employer.

**Architectural direction lock-ins (these are binding for all follow-on jobs):**
1. **Singular universe**, not 18 disconnected scenes. The black hole + the resulting universe is one continuous space.
2. **Black hole = landing + name title** (current C01–C05 work is preserved as the entry sequence).
3. **Event horizon transit → warp scene** sets the tone before any project is revealed.
4. **Each project = a place in the universe** with its own interactive 3D model. The model conveys the work; the scene IS the case study.
5. **Audio: yes.** Re-introduce the audio engine that was reverted (audit found it ~4 commits ago). Diegetic, not background.
6. **Work panels: WebGL only.** No Canvas-2D. The current MIRA Canvas-2D panel approach is rejected — to be replaced.
7. **Intro animation: Love, Death & Robots-style glitch loader.** Bespoke to this portfolio, not a template effect.

**Awwwards-bar tax (from `.coo/jobs/002/references.md`):**
- Two-color palette discipline (founder/website-builder/animator to choose later).
- Motion budget exceeds visual-design budget.
- One signature 3D protagonist (the universe + black hole IS this — confirmed by founder's vision).

These decisions supersede any conflicting direction in the prior `docs/CINEMATIC_SCRIPT.md` (now deleted).

### 2026-05-12 — Founder refinements after script v1 draft

- **Universe name on-screen:** **"Danush Arun"** only. No invented brand-name overlay (rejects "ARUN-Σ" / "the Singularity"). The founder's name IS the universe identifier — already lives at C01 title plate.
- **Audio direction:** **Ambient-orchestral** (Hans Zimmer / Interstellar territory). Refines the scriptwriter's "ambient drone + diegetic SFX" to mean *orchestral pad + diegetic SFX* — fuller, cinematic texture. Animator's brief inherits this.
- **System palette (COO-picked per founder delegation):**
  - **Void**: `#08070a` (deep warm-leaning black — does not fight the accretion disc)
  - **Accretion**: `#FFA85C` (warm amber, vivid but not neon — matches EHT-image M87 / Sgr A* tones)
  - **Type cream**: `#F0E4D2` (replaces pure white; avoids harsh contrast against the void)
  - Rationale: closest to a *literal observed* black hole, cinematic (Interstellar / Dune family), Awwwards-aligned two-color discipline (per references.md), and reuses existing rendered black-hole color geometry without retexturing.
  - Per-W-phase accent colors allowed for the 9 distinct "places", but every place returns to the void+accretion base when no scene is foreground.
- **MIRA Canvas-2D cleanup**: approved. Follow-on job to file once direction package signs off: remove `/mira` deep route + Canvas-2D panel from `src/app/mira/` and any Canvas-2D code paths, since W01 is rebuilt as a WebGL "Pulsar Station".

### 2026-05-12 — Resolution of scriptwriter's open questions

1. **Glitch loader register** — KEEP draft (physics-first fragments + technique words mixed: `BOOT`, `LOCATING OBSERVER`, `MASS = 4.3 × 10⁶ M☉`, `c = 299,792,458 m/s`, `OK`). Founder is "systems-first" but the universe is literal — physics + technique together IS the voice.
2. **FuryX + Tescom slotting** — **OPTION A LOCKED** (founder picked A): scriptwriter's compromise stands.
   - FuryX folds into W04 (Veronica) caption: "Chrome Extension + Strapi CMS portal shipped alongside."
   - Tescom hardware internship → one-line `Earlier:` footnote on W08 console (`Earlier: PCB testing + assembly line logic, Tescom, 2024.`).
   - W08 = identity. W09 = contact. All 9 projects visible; FuryX + Tescom are credits, not full 3D places. Cleanest universe.
3. **Audio direction** — resolved (ambient-orchestral; see above).
4. **Naming the universe** — resolved (no invented brand name; "Danush Arun" only).
5. **E00 resume download (`Download CV (PDF)` link)** — APPROVE. Adds a low-friction conversion path next to LinkedIn/GitHub/Email. Animator brief gets this as part of W09 + E00 spec.

## Risks / open questions

### Inputs the founder must provide before stage 3 (scriptwriter)
1. **Resume / past work**: file path or pasted text. The script cannot be honest without this.
2. **Awwwards references the founder loves**: 3–5 sites whose direction the founder admires (we'll add to whatever `deep-researcher` finds).
3. **Recover the prior cinematic script v2?** It exists in git tag `pre-cleanup-2026-05-12` under `docs/CINEMATIC_SCRIPT.md`. Options: (a) restore as historical input to scriptwriter, (b) ignore and rewrite fresh, (c) cherry-pick beats from it.
4. **Target viewer**: prospective employer? VC? client? collaborator? Multiple? (Script changes substantially by viewer.)
5. **Hard "wow moments"** the founder won't compromise on (e.g., the black hole transit must stay).

### Inputs that can be deferred to later stages
- Specific brand colors / typography — open as a separate creative job after the script lands if needed.
- Asset sourcing (3D models, music, sound) — surfaced by the gap analysis.

### Execution risks
- 18 phases is a lot. The gap analysis may reveal that phases need to merge or be cut. The build plan must allow for that — the script and motion brief are not contracts to deliver every phase, they're starting drafts.
- Custom agents (`scriptwriter`, `animator`, `website-builder`) are written but require a session reload before they can be dispatched by name. Until reload, fallback dispatch via `general-purpose` is possible but defeats the rigor of the named specialists.

## Sign-off

[COO-SIGNOFF] 2026-05-12 — Direction package approved by founder. 18 follow-on jobs queued. Implementation begins with Job 003 (system foundations).

Evidence:
- All 7 AC ticked.
- 6 artifacts on disk at `.coo/jobs/002/`: current-state-audit.md, references.md, script.md, motion-brief.md, gap-analysis.md, build-plan.md.
- Founder approval: "approve" (2026-05-12).
- Critical-path sequence ratified: Job 003 → 004 → 005 → 006 → 007 → 008.
- W-phase parallel/sequential question: defaulted to **parallel** (Awwwards-readiness over compute cost).
- Asset delivery: CV PDF defaults to current `/Users/danusharun/Downloads/Important/Danush_Arun_Resume.pdf`; MIRA voice samples + ambient-orchestral bed sourcing decided at Jobs 008 and 004 respectively (founder can override).

Follow-on jobs filed (none opened yet beyond Job 003):
- 003 System foundations (P1, this session)
- 004 Audio engine + ambient-orchestral bed (P1)
- 005 MIRA Canvas-2D cleanup (P1)
- 006 L00 glitch loader (P1)
- 007 C06–C09 cosmic re-direct (P1)
- 008 W01 MIRA Pulsar Station — establishes W-phase scaffold contract (P1)
- 009 C01–C05 cosmic copy + telemetry adds (P2)
- 010–017 W02–W09 places, dispatched in parallel after Job 008 (P1)
- 018 E00 outro + CV download (P2)
- 019 performance pass + HUD quality toggle (P1)
- 020 full a11y audit + fixes (P1)
- 021 Awwwards.com submission prep + checklist (P2)

Retro: not opened. Direction-package spikes don't retro — the gap analysis is itself the retrospective on prior implementation. Will revisit if Job 008 reveals systemic drift between direction and what's buildable.
