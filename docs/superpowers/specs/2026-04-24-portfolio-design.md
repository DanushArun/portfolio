# Portfolio Design Spec: The Cinematic R&D Lab & The Event Horizon

## 1. Overview
A premium, highly interactive portfolio website designed to compete for Awwwards "Site of the Year". The core aesthetic merges the dark-mode, massive-typography elegance of the Orano Group with deep, mathematically accurate physical simulations (Three.js/WebGL) reflecting the creator's background in Agentic AI, Computational Physics, and Formula EV.

## 2. Core Vibe & Metaphor
- **The Vibe:** The Cinematic R&D Lab. It feels like an authentic engineering masterpiece rather than an AI template.
- **The Core Metaphor:** "Beauty lies in physics." Every major transition and background element is governed by actual physical laws rather than arbitrary easing functions.

## 3. UX Flow & Architecture

### 3.1 The Transition (The Airlock & Event Horizon)
- **Scene:** The site loads into pitch black featuring a hyper-realistic, wireframe-style black hole (accretion disk and event horizon) rendered via Three.js/WebGL.
- **Physics:** Custom GLSL shaders simulating gravitational lensing and photon rings around a singularity.
- **Action:** Driven by user scroll. Scrolling pushes the camera forward, accelerating into the black hole. The FOV stretches, wireframes undergo dramatic spaghettification, culminating in a flash of white/black at the singularity before snapping into the main environment.

### 3.2 The Main Experience (The Lab Corridors)
- **Layout:** Horizontal-scrolling experience powered by Lenis and GSAP ScrollTrigger.
- **Background:** A mathematically precise wireframe grid (Orano-style) that reacts to scroll velocity (inertia) and cursor mass/frequency.
- **Content Panels:** Massive typography and frosted glassmorphic panels floating over the reactive wireframes. These panels represent distinct "Departments":
  1. **Agentic Core:** Highlighting work on Mira (Pipecat/WebSockets), FuryX, and Veronica.
  2. **Physics Simulation Lab:** Highlighting the Vectorized Physics Engine (Schelkunoff’s theory) and Quantum Options Pricing.
  3. **EV Control Center:** Highlighting Formula Manipal FM23e autonomous path planning.

### 3.3 The Archive (GitHub & Resume)
- **Integration:** Located at the end of the horizontal corridor.
- **Functionality:** Seamlessly presents the user's DriveX GitHub, personal GitHub, and formal resume details (Education, Skills, Certifications).
- **Aesthetic:** An interactive "Data Archive" UI mapping resume components to the underlying wireframe grid, maintaining the cinematic HUD style.

## 4. Tech Stack
- **Framework:** Next.js 14 (App Router), React, TypeScript.
- **3D & Physics:** Three.js, React Three Fiber (R3F), Custom GLSL Shaders.
- **Animation & Scroll:** GSAP (ScrollTrigger), Lenis (smooth scrolling).
- **Styling:** Tailwind CSS (for HUD overlays, glassmorphism, and typography).
- **Data Handling:** Hardcoded/structured mapping of the resume data, alongside potential API fetching for live GitHub data visualization.

## 5. Constraints & Out of Scope
- No generic "floating shapes" or arbitrary CSS animations. All 3D movement must be mathematically grounded (gravity, electromagnetism, pathfinding).
- No standard PDF links for the resume; all data must be natively rendered in the Archive UI.
- No vertical scrolling in the main Lab Corridors; the primary navigation axis post-singularity is strictly horizontal.
