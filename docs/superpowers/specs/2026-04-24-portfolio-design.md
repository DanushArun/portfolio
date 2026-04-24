# Portfolio Design Spec: The Event Horizon & The Gravity of Engineering

## 1. Cinematic Vision & Directorial Intent
This portfolio is not a website; it is a cinematic, interactive short film directed with the visual fidelity, atmospheric weight, and profound scale of Greig Fraser (Dune, The Batman, Rogue One). It relies on vast, oppressive darkness, blindingly intense light sources (accretion disks), and a deep sense of cosmic scale. The aesthetic merges hyper-realistic computational physics with a human-scale narrative about engineering.

## 2. Core Metaphor
- **The Vibe:** An interstellar, physics-accurate journey through space-time. Massive scale, terrifyingly beautiful physics, and high-fidelity volumetric rendering.
- **The Core Mechanic:** Gravity. Gravity is the invisible glue that binds the user's journey, dictates the transitions, and physically pulls the elements of the resume and projects together.

## 3. The Sequence (Three-Act Structure)

### Act I: The Singularity (The Entry)
- **The Scene:** Pitch black. A fully rendering, physics-accurate black hole dominates the center of the screen (inspired by Bruno Simon's workshop/Interstellar). It features a glowing, volumetric accretion disk, photon rings, and intense gravitational lensing warping the starfield behind it.
- **The Action:** An understated, elegant "Enter the Void" prompt (or a scroll action).
- **The Physics:** Custom GLSL shaders calculate the inverse-square law and light bending around the event horizon.

### Act II: The Void (The Transition)
- **The Scene:** Upon entry, the camera violently accelerates *into* the black hole.
- **The Action:** The user experiences extreme space-time distortion. Long, blinding streaks of starlight (reminiscent of warp speed or the Star Gate sequence in 2001: A Space Odyssey) streak past the camera.
- **The Physics:** A particle system with extreme radial velocity and FOV stretching (spaghettification) to simulate relativistic travel speeds. The screen eventually blows out to blinding white or absolute black.

### Act III: The Universe (The Portfolio)
- **The Scene:** The user is spat out into a new, calm, and vast "Universe"—the actual portfolio space.
- **The Assembly (The Mechanic):** The portfolio does not just "load." Instead, fragmented planetary debris, floating data nodes, and UI glass panels physically attract to one another. Using simulated gravity (N-body simulation or targeted attractors), the pieces of the resume—Agentic AI (Mira), Computational Physics Engine, Formula EV—orbit and snap together like a massive jigsaw puzzle forming a cohesive, readable structure (a solar system or a megastructure).
- **The Exploration:** The user navigates this newly formed universe. As they focus on a specific project (e.g., a "planet" or "orbital ring"), gravity shifts, pulling the camera into orbit around that specific project to read the details, GitHub links, and technical specs.

## 4. Tech Stack & Architecture
- **Framework:** Next.js 14 (App Router), React, TypeScript.
- **3D Engine:** Three.js, React Three Fiber (R3F), Drei.
- **Shaders:** Custom GLSL for gravitational lensing, accretion disk volumetric rendering, and space-time streak effects.
- **Physics Engine:** Custom lightweight physics or Rapier for the gravitational attraction/jigsaw assembly in Act III.
- **Animation:** GSAP (ScrollTrigger/Observer) for camera movements and UI fading.
- **Styling:** Tailwind CSS for the minimalist, cinematic typography that floats above the 3D canvas.

## 5. Engineering Constraints
- The visual fidelity must be paramount. The black hole cannot look like a cheap particle system; it requires rigorous shader math.
- The transition from Act II (The Void) to Act III (The Universe) must be completely seamless. No loading screens; asset loading must be handled during the black hole sequence.
- The "jigsaw" gravitational assembly must resolve into a layout that is actually readable and accessible for recruiters, striking the perfect balance between awe-inspiring art and functional information delivery.
