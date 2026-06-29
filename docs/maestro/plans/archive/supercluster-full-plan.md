# Supercluster Full Production Implementation Plan

## Objective
Implement the 7-chapter "Supercluster" particle animation system as defined in the Production Scroll Script, migrating the portfolio to an 800k particle GPGPU engine supporting 39 scroll beats and 6 core behaviors (Condense, Route, Carve, Pulse, Shear, Rejoin).

## Background & Motivation
The current portfolio uses isolated scenes with smaller particle budgets (e.g., MIRA's 30k knot system). The new script demands a unified, persistent "ambient field" of 800k particles (200k mobile) that seamlessly morphs across 7 distinct project chapters (MIRA, AIDEN, VANGUARD, INSPECTION, WAVEFIELD, EMI, FORMULA) using a continuous GPGPU simulation.

## Scope & Impact
- **Core Engine:** A ping-pong FBO compute shader system for state management (position, velocity, target, color) across 800k particles.
- **Scene Orchestration:** ScrollTrigger-based mapping of 39 "Dots" (scroll snaps) driving the transition timings and camera rigging.
- **Geometries:** Procedural generators and SDFs for the 7 artifact shapes (MIRA nodes, AIDEN double helix, VANGUARD DAG, INSPECTION silhouette, WAVEFIELD matrix/wave, EMI concentric curves, FORMULA track).
- **React Overlay:** State-synced DOM overlay for the 39 Proof Cards with exact fade in/out timings.
- **Impact:** Replaces the current disparate canvas scenes (MIRA, Warp, etc.) with a single unified `SuperclusterScene.tsx` canvas post-crossing.

## Proposed Solution: GPGPU FBO Ping-Pong
**Architecture:**
- **State Textures (1024x1024 for 1M particles):** Two RGBA float textures storing `(x, y, z, life)`. Additional textures for `velocity` and `target_position`.
- **Simulation Shader:** Reads current state, applies forces (curl noise, gravity towards targets for `Condense`/`Route`, explosive forces for `Shear`), and outputs next state.
- **Render Shader:** `THREE.Points` reading positions from the state texture. Colors interpolated in the fragment shader based on the active chapter palette.

**Alternatives Considered:**
- *Analytic Vertex Shader (Stateless):* Rejected due to the inability to maintain persistent velocity for realistic `Shear` and `Rejoin` physics at 800k scale.

## Implementation Steps
**Phase 1: GPGPU Foundation & Ambient Field**
- Setup `SuperclusterEngine.tsx` with FBO ping-pong rendering.
- Implement the "Resting" camera and the idle ambient field drift behavior.
- Ensure 800k (desktop) / 200k (mobile) budget maintains 60fps.

**Phase 2: Core Behaviors & Orchestration**
- Integrate `ScrollOrchestrator.tsx` to drive a master `timelineProgress` (0 to 39).
- Implement GLSL logic for `Condense`, `Route`, `Pulse`, `Shear`, and `Rejoin`.
- Implement global Chapter Entry (Locate -> Pulse -> Extract) and Exit (Pulse -> Shear -> Rejoin) state machines.

**Phase 3: Chapter Artifact Geometries**
- Develop SDFs and target-buffer generators for each of the 7 chapters.
- *Performance Gate:* Specifically optimize WAVEFIELD Dot 02 (matrix-to-wave morph).

**Phase 4: DOM Overlay & Camera**
- Build the `ProofCard` overlay synchronized with scroll snaps (fade in +400ms, fade out -200ms).
- Configure `CameraRig` for dynamic micro-adjustments and chapter transition pull-backs.

## Verification & Testing
- **Visual Checks:** E2E visual regressions using Playwright against reference frames for each of the 39 beats.
- **Performance Budget:** Ensure median frame time ≤ 16.6ms (60fps) on desktop and ≥ 30fps on mobile using DevTools tracing.
- **Quality Gates:** Verify all checklist items from the PDF (e.g., ambient field active during beats, proof claims visible in particle state, legible silhouettes).

## Migration & Rollback
- Keep the current `MiraScene` and other R3F components intact during development.
- Develop `SuperclusterScene` behind a feature flag or specific route until performance and visual parity are achieved.
- If performance targets fail, we can fall back to the existing scene manager.
