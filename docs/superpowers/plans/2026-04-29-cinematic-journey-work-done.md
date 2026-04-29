# Cinematic Journey & Work Done Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the ultra-high-quality cinematic transitions and the futuristic 9-panel "Work Done" dashboard as specified in the storyboards, ensuring Bruno Simon-level WebGL fidelity and 60fps performance.

**Architecture:**
- **Performance-First Render Loop:** Use custom GLSL shaders and refs for all animations to avoid React state overhead.
- **Selective Bloom & Post-Processing:** Implement a surgical post-processing stack that preserves absolute black voids while making emissive elements glow.
- **Hybrid Real-time/Pre-rendered:** Use pre-rendered WebM for the most complex warp/convergence transitions to guarantee cinematic quality across all devices.
- **Zustand Orchestration:** A central state machine drives the 18-phase journey (9 Cosmic + 9 Work Done).

**Tech Stack:** React Three Fiber (R3F), GLSL, GSAP ScrollTrigger, Zustand, Web Audio API.

---

## FILE MAP

### New Files
| File | Responsibility |
|---|---|
| `src/components/scene/scenes/TransitionConvergence.tsx` | "07 TRANSITION" — GLSL fragment convergence shader |
| `src/components/scene/scenes/EmergeSystem.tsx` | "08 EMERGE" — Stabilized binary quantum system (AMBER/BLUE) |
| `src/components/ui/WorkDashboard.tsx` | Part II Dashboard shell + GSAP ScrollTrigger integration |
| `src/components/ui/panels/*.tsx` | Individual UI panels (MIRA, AIDEN, VANGUARD, etc.) |
| `public/video/warp-descent.webm` | Pre-rendered cinematic warp tunnel (for Phase 05) |

### Modified Files
| File | Change |
|---|---|
| `src/lib/scene-state.ts` | Refactor into 18 discrete phases from storyboards |
| `src/components/scene/SceneManager.tsx` | Orchestrate new scenes and hybrid video transitions |
| `src/components/scene/PostFX.tsx` | Implement selective bloom layer |

---

## Task 1: Refactor Scene State Machine (18 Phases)

**Files:**
- Modify: `src/lib/scene-state.ts`

- [ ] **Step 1: Update Phase Types**
Re-align the `ScenePhase` type to match the 18 storyboard steps.
```typescript
export type CosmicPhase = 
  | '01_ORBIT' | '02_PULL' | '03_STRETCH' | '04_HORIZON' 
  | '05_WARP' | '06_ANOMALY' | '07_TRANSITION' | '08_EMERGE' | '09_PROJECT';

export type WorkPhase = 
  | 'W01_MIRA' | 'W02_AIDEN' | 'W03_VANGUARD' | 'W04_AI_INSPECTION'
  | 'W05_WAVE_FIELD' | 'W06_EMI_ENGINE' | 'W07_FORMULA_MANIPAL' 
  | 'W08_ABOUT' | 'W09_CONNECT';

export type ScenePhase = CosmicPhase | WorkPhase;
```

- [ ] **Step 2: Update Progression Logic**
Update `COSMIC_SCENES` and `advanceScene` to handle the full linear flow.

- [ ] **Step 3: Commit**
```bash
git add src/lib/scene-state.ts
git commit -m "refactor: align scene-state with 18-step cinematic storyboard"
```

---

## Task 2: Build the "07 TRANSITION" Convergence Shader

**Files:**
- Create: `src/components/scene/scenes/TransitionConvergence.tsx`
- Modify: `src/components/scene/SceneManager.tsx`

- [ ] **Step 1: Implement the Convergence GLSL**
Use `THREE.BufferGeometry` with `THREE.ShaderMaterial` to simulate chaotic fragments snapping into a structured central point.
- Vertex shader: Animates `position = mix(chaosPos, targetPos, uProgress)`.
- Fragment shader: High-intensity emissive glow with additive blending.

- [ ] **Step 2: Mount in SceneManager**
Ensure the scene is mounted during phase `'07_TRANSITION'`.

- [ ] **Step 3: Commit**
```bash
git add src/components/scene/scenes/TransitionConvergence.tsx
git commit -m "feat: implement cinematic fragment convergence shader"
```

---

## Task 3: Build the "08 EMERGE" Binary System

**Files:**
- Create: `src/components/scene/scenes/EmergeSystem.tsx`

- [ ] **Step 1: Implement the Binary Stars**
Create two spheres (Amber `#E8A020` and Blue `#85CCF7`) orbiting a barycenter.
- Use selective bloom (Layer 1) to give them a soft cinematic glow.
- Add a faint, high-fidelity accretion ring using `THREE.TorusGeometry` with a noise shader.

- [ ] **Step 2: Commit**
```bash
git add src/components/scene/scenes/EmergeSystem.tsx
git commit -m "feat: implement high-fidelity binary system for Emerge phase"
```

---

## Task 4: Implement the "Work Done" Dashboard Shell

**Files:**
- Create: `src/components/ui/WorkDashboard.tsx`
- Modify: `src/components/scene/SceneManager.tsx`

- [ ] **Step 1: Create the GSAP-driven Grid UI**
Build the fixed overlay that reveals the 9 project panels.
- Use GSAP `ScrollTrigger` to scrub through panels `W01` to `W09`.
- Each panel should have a fast reveal/settle animation: `cubic-bezier(0.16, 1, 0.3, 1)`.

- [ ] **Step 2: Commit**
```bash
git add src/components/ui/WorkDashboard.tsx
git commit -m "feat: add WorkDashboard shell with GSAP ScrollTrigger orchestration"
```

---

## Task 5: Implement MIRA (W01) and AIDEN (W02) Panels

**Files:**
- Create: `src/components/ui/panels/MiraPanel.tsx`
- Create: `src/components/ui/panels/AidenPanel.tsx`

- [ ] **Step 1: Build MIRA UI**
Implement the purple waveform visualization (2D canvas or SVG) + the "92ms" latency HUD.

- [ ] **Step 2: Build AIDEN UI**
Implement the engagement analytics sine graph + the intent cluster HUD.

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/panels/MiraPanel.tsx src/components/ui/panels/AidenPanel.tsx
git commit -m "feat: implement MIRA and AIDEN dashboard visualizations"
```

---

## Task 6: Final Performance & Visual Audit

- [ ] **Step 1: Selective Bloom Verification**
Verify that only Layer 1 objects glow. The background void must remain absolute black `#0B0D10`.

- [ ] **Step 2: Render Loop Audit**
Ensure zero React state updates are happening in `useFrame` across all 18 phases.

- [ ] **Step 3: Commit**
```bash
git commit --allow-empty -m "perf: verified 60fps budget and selective bloom fidelity"
```

---
**Plan complete and saved to `docs/superpowers/plans/2026-04-29-cinematic-journey-work-done.md`. 

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration. 

Approved.
