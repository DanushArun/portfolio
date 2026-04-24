# The Event Horizon (Black Hole) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a scientifically rigorous, WebGL-rendered black hole using curved raymarching (gravitational lensing) and procedural accretion disk noise, serving as the "void" entry transition for the portfolio.

**Architecture:** 
This will not use standard 3D meshes. Instead, it will use a single fullscreen quad rendering a custom GLSL fragment shader. The shader will implement a raymarching loop where light rays do not travel straight, but bend according to general relativity. 

The astrophysics logic is as follows:
- **Schwarzschild Radius ($R_s$):** The boundary of the event horizon. If a ray's distance to the center $r < R_s$, the ray terminates in absolute black.
- **Curved Space-Time Raymarching:** At each step, a ray has position $p$ and direction $\vec{v}$. Gravity imparts an acceleration $\vec{a}$ pointing to the center of the black hole, magnitude approximated as $\frac{1.5 \cdot R_s}{r^2}$. The new direction $\vec{v}_{new} = normalize(\vec{v} + \vec{a} \cdot dt)$.
- **Photon Sphere:** At $1.5 \cdot R_s$, light can temporarily orbit. This creates the intense "ring" of light wrapping around the singularity.
- **Accretion Disk:** Modeled as an intersecting flat disc on the XZ plane. When the ray intersects the disc ($y \approx 0$), we sample 3D noise (Simplex/Perlin) mapped to polar coordinates to simulate swirling superheated gas. The lensing effect will automatically make the *back* of the disc appear above and below the black hole, creating the *Interstellar* Gargantua shape.
- **Relativistic Beaming (Doppler Beaming):** For hyper-realism, gas moving toward the camera (on one side of the disc) will be brighter/bluer, and gas moving away will be dimmer/redder.

**Tech Stack:** Three.js, React Three Fiber (R3F), GLSL (Fragment/Vertex Shaders), Math (Numerical ODE integration for ray curvature).

---

### Task 1: Setup the WebGL Canvas and Fullscreen Quad

**Files:**
- Create: `src/components/canvas/BlackHole.tsx`
- Create: `src/components/canvas/shaders/blackHole.frag.glsl`
- Create: `src/components/canvas/shaders/blackHole.vert.glsl`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the basic Vertex Shader**
Create `src/components/canvas/shaders/blackHole.vert.glsl` as a simple passthrough shader for a fullscreen quad.

```glsl
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
```

- [ ] **Step 2: Write the boilerplate Fragment Shader**
Create `src/components/canvas/shaders/blackHole.frag.glsl`. Add uniforms for resolution and time. Output a simple color just to test the pipeline.

```glsl
uniform vec2 uResolution;
uniform float uTime;
varying vec2 vUv;
void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    gl_FragColor = vec4(st.x, st.y, 0.0, 1.0);
}
```

- [ ] **Step 3: Create the R3F BlackHole Component**
In `src/components/canvas/BlackHole.tsx`, create a functional React component that uses `@react-three/fiber` to render a `screen-space` `<planeGeometry>` with a `<shaderMaterial>`. Pass the `uResolution` and `uTime` uniforms, updating them via `useFrame`.

- [ ] **Step 4: Mount the Canvas**
In `src/app/page.tsx`, replace the placeholder content with `<Canvas><BlackHole /></Canvas>` spanning the full window width/height (100vw/100vh). Run `npm run dev` to verify the shader compiles and displays.

- [ ] **Step 5: Commit**
```bash
git add src/components/canvas/ src/app/page.tsx
git commit -m "feat: setup Three.js canvas and initial shader structure"
```

### Task 2: Implement the Curved Raymarching (Gravitational Lensing)

**Files:**
- Modify: `src/components/canvas/shaders/blackHole.frag.glsl`

- [ ] **Step 1: Define Ray Setup**
In the fragment shader, map pixel coordinates to a normalized device coordinate (NDC) space (-1 to 1). Define the camera position (e.g., `vec3(0.0, 0.5, 5.0)`) and initial ray direction pointing towards the origin.

- [ ] **Step 2: Write the Raymarching Loop with Gravity**
Implement a loop (e.g., 200 steps). At each step:
1. Calculate distance `r` to origin.
2. If `r < 1.0` (Schwarzschild radius), return black.
3. Calculate gravitational force: `forceDir = normalize(-rayPos)`, `acceleration = 1.5 / (r * r)`.
4. Update direction: `rayDir = normalize(rayDir + forceDir * acceleration * dt)`.
5. Update position: `rayPos += rayDir * dt`.

- [ ] **Step 3: Add the Background Starfield**
If the ray loop finishes without hitting the event horizon, sample a simple procedural noise (or a texture if provided) to represent background stars. Because `rayDir` was bent by the loop, the stars will appear severely distorted (lensed) around the black hole.

- [ ] **Step 4: Verify the Einstein Ring**
Test visually. The background should warp in a circular fashion around a solid black sphere.

- [ ] **Step 5: Commit**
```bash
git add src/components/canvas/shaders/blackHole.frag.glsl
git commit -m "feat: implement gravitational lensing raymarching"
```

### Task 3: Build the Volumetric Accretion Disk

**Files:**
- Modify: `src/components/canvas/shaders/blackHole.frag.glsl`

- [ ] **Step 1: Add Disk Intersection Logic**
Inside the raymarching loop, check if the ray passes through the equatorial plane (`abs(rayPos.y) < thickness`).

- [ ] **Step 2: Generate Orbital Noise**
If inside the disk, calculate polar coordinates (`radius`, `angle`). Generate high-frequency noise based on these coordinates and `uTime` to simulate swirling matter.

- [ ] **Step 3: Accumulate Emission (Volumetric Rendering)**
Instead of stopping the ray when it hits the disk, accumulate color (`color += noiseValue * diskColor * dt * attenuation`). This creates the glowing, translucent look of superheated plasma.
Due to the ray curvature, the accumulated glow will wrap over and under the black hole, forming the "Gargantua" shape.

- [ ] **Step 4: Add Relativistic Doppler Beaming**
Calculate the cross product of the ray position and the up vector to get the orbital velocity vector. Take the dot product with the `rayDir`. If positive (moving towards camera), multiply the emission by a brightness factor and shift color towards blue. If negative, dim and shift towards red/orange.

- [ ] **Step 5: Commit**
```bash
git add src/components/canvas/shaders/blackHole.frag.glsl
git commit -m "feat: add relativistic accretion disk and doppler beaming"
```

### Task 4: The Void Transition (Spaghettification & Relativistic Travel)

**Files:**
- Modify: `src/components/canvas/BlackHole.tsx`
- Modify: `src/components/canvas/shaders/blackHole.frag.glsl`
- Create: `src/components/canvas/StarlightStreaks.tsx`

- [ ] **Step 1: Add Transition Uniforms**
Add a `uTransitionProgress` uniform (0.0 to 1.0) to the black hole shader.

- [ ] **Step 2: Build the Starlight Streaks Particle System**
Create `StarlightStreaks.tsx`. Use a `<points>` geometry with a custom shader material that renders thousands of particles. Connect their radial velocity and length (streaking effect) to a shared GSAP timeline so they streak dramatically outwards from the center.

- [ ] **Step 3: Implement Preloading & Trigger Logic**
In `BlackHole.tsx`, set up a `useScroll` or custom event listener to trigger the transition. Ensure that calling the trigger also begins loading Act III assets (via R3F `useGLTF.preload` or equivalent logic) so there's no stutter.

- [ ] **Step 4: Apply Spaghettification in Shader**
As `uTransitionProgress` nears 1.0 (driven by GSAP mapped to the scroll event), stretch the initial ray direction mapping (simulating infinite FOV) and shift the camera position aggressively towards the event horizon.

- [ ] **Step 5: Fade to White/Black**
When `uTransitionProgress == 1.0`, fade the final output to absolute white or black, completing the seamless transition and allowing the new universe (Act III) to appear.

- [ ] **Step 6: Commit**
```bash
git add src/components/canvas/
git commit -m "feat: implement void transition, particle streaks, and seamless preloading"
```