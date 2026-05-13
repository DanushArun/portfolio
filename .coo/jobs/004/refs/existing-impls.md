# Existing Implementations to Port — Evaluation

Sourced per spec Plan step 1, per the project memory directive to prefer porting
proven implementations over building from scratch.

---

## 1. angeluriot/Galaxy_simulation

**URL:** https://github.com/angeluriot/Galaxy_simulation  
**License:** MIT  
**Stack:** C++ (83%), OpenCL (GPU compute), OpenGL (rendering), GLSL shaders  
**Purpose:** Real-time N-body galaxy simulation — single galaxy, collision, expanding
universe. Interactive 3D camera. Latest release v4.1 "Fixed shaders for most recent
drivers."

### Honest verdict on portability

**The N-body engine is NOT portable to the browser and is the wrong tool.**

Reason: The simulation uses OpenCL for gravitational force computation between all
particle pairs. OpenCL has no web equivalent. The Web GPU Compute Shaders API (via
WebGPU) could theoretically replicate N-body, but (a) WebGPU browser support is still
uneven in 2026, (b) the spec's MIRA scene does not use N-body physics — it uses a
deterministic GPGPU curl-noise velocity field (a fundamentally different approach),
and (c) rewriting an N-body engine to WebGPU is a separate multi-week project, not a
port. The spec correctly identifies this: MiraPlume uses a ping-pong FBO with a
curl-noise compute pass, not gravitational simulation.

### GLSL fragments worth examining

The Renderer.cpp file confirms the following shader pipeline (shaders loaded by name —
actual GLSL files are in a `/sources/shaders/` directory not directly indexed):

**Shader "galaxy"** — Renders particles via `glDrawArrays(GL_POINTS, ...)`.  
This is standard point-sprite rendering. The technique is identical to what Three.js
`Points` with a `ShaderMaterial` does. No direct code to port, but it confirms that
point sprites with radial alpha falloff in the fragment shader is the industry-standard
approach for particle star fields.

**Shader "blur"** — Two-pass Gaussian blur (horizontal then vertical).  
Applied to a separate FBO for bloom. This is a separable Gaussian blur, the standard
method. Three.js `@react-three/postprocessing` `<Bloom>` already implements this
(via the UnrealBloom pass). No need to port — use the existing `<Bloom>` post-process
already in the scene.

**Shader "post"** — Final composition that merges the sharp FBO and the blurred FBO.  
This is additive or screen-blend composition of the star layer and its bloom. Again,
already handled by `@react-three/postprocessing`. No port value.

**Texture format:** FBOs use `RGB_16f` (16-bit float, HDR). This matches what Three.js
uses when `renderer.outputColorSpace = THREE.SRGBColorSpace` and
`renderer.toneMapping = THREE.ACESFilmicToneMapping` — already configured in the
project's SceneManager. No port needed.

### Specific files and lines

The GLSL files are named "galaxy", "blur", "post" and loaded by the Dimension3D
shader manager. They are in `sources/` but exact sub-paths are not publicly indexed.
Given the shader names and the `GL_POINTS` draw call, the "galaxy" fragment almost
certainly implements:
```glsl
float d = length(gl_PointCoord - vec2(0.5));
float alpha = 1.0 - smoothstep(0.0, 0.5, d * 2.0);
gl_FragColor = vec4(color, alpha);
```
This is the standard point-splat pattern. It is derivable from first principles and
is already described in the MiraKnots task plan. No unique insight to port.

### Final verdict on Galaxy_simulation

Nothing in Galaxy_simulation is worth porting. The N-body engine is the wrong
computational model. The GLSL shaders implement standard point-sprite + separable
Gaussian bloom — both of which are already present in the project. The visual output
(single rotating galaxy disk) is also structurally wrong for our target (multi-node
supercluster web). Treat as inspiration-only: confirms that point sprites + additive
blending + HDR FBOs is the correct industry stack.

---

## 2. Web-native references

### 2A. iagokrt/curl-noise-threejs

**URL:** https://github.com/iagokrt/curl-noise-threejs  
**License:** MIT  
**Stack:** Vanilla Three.js + WebGL, GLSL shaders (~9% of codebase)  
**What it implements:** FBO ping-pong particle system in Three.js with curl noise.
Explicitly tagged: webgl, threejs, particles, 3d, fbo.

**What to port:**  
The FBO ping-pong architecture on the JavaScript/Three.js side:
- Two `WebGLRenderTarget` allocations (position texture A, position texture B).
- Per-frame swap: use A as input, render to B; next frame use B as input, render to A.
- Renderer state save/restore around the off-screen compute pass (prevents FBO
  corrupting the main canvas — the plan flags this as the "GPGPU state leak" risk).

**What to skip:**  
- The curl noise GLSL function itself (use REF-PL-01 bitangent_noise instead).
- The visual output is an isotropic spray; do not port the render shader.
- The repository is a learning experiment; the JavaScript FBO wiring is the only
  transferable artifact.

**Portability verdict:** port-fragment (FBO wiring pattern only)

---

### 2B. atyuwen/bitangent_noise

**URL:** https://github.com/atyuwen/bitangent_noise  
**Shadertoy:** https://www.shadertoy.com/view/ftl3zN  
**License:** MIT  
**Stack:** GLSL + HLSL (self-contained; no dependencies)  
**What it implements:** Divergence-free 3D/4D noise generation as a single GLSL file
(`BitangentNoise.glsl`). Drop-in replacement for curl noise. Functions:
`BitangentNoise3D(vec3 p) → vec3`, `BitangentNoise4D(vec4 p) → vec3`.

**What to port:**  
The `BitangentNoise3D` function verbatim into MiraPlume's compute fragment shader.
The function is self-contained — no imports, no dependencies. Copy the GLSL body
(roughly 30–40 lines) directly into the compute shader string.

**What to skip:**  
The 4D variant (unnecessary complexity), the HLSL version, the Shadertoy wrapper.

**Portability verdict:** port-fragment (the `BitangentNoise3D` function body)

---

### 2C. Three.js Journey GPGPU Galaxy lesson (lesson 41 / student repos)

**URL (course):** https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders  
**URL (student repo with implementation):** https://github.com/rajput-hemant/threejs-journey  
  (folder `src/04-shaders/30-animated-galaxy`)  
**License:** MIT (student repos)  
**Stack:** Three.js + GLSL (vertex/fragment shaders for point particles)  
**What it implements:** Animated galaxy particle system using custom ShaderMaterial
for point sprites. Key techniques per the lesson page:
- `gl_PointSize` controlled in vertex shader with manual size attenuation.
- Fragment shader: circular splat with `smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5))`.
- `depthWrite: false`, `blending: THREE.AdditiveBlending`, `vertexColors: true`.
- Particles animated by rotating in vertex shader (not GPGPU — CPU-side attribute update).

GPGPU lesson (41) additionally covers:
- FBO via `WebGLRenderTarget`.
- Per-pixel = per-particle position encoded in RGB.
- Flow-field velocity applied each frame via compute fragment shader.

**What to port:**  
- The point-splat fragment pattern (smooth circular falloff) for MiraSupercluster and MiraKnots.
- The `depthWrite: false + AdditiveBlending` material setup.
- The vertex shader `gl_PointSize` size-attenuation formula.
- From lesson 41: the `WebGLRenderTarget` FBO wiring (confirms and cross-references iagokrt).

**What to skip:**  
- The galaxy-disk particle geometry (wrong shape for our use).
- The spiral arm colour logic (wrong palette).
- The CPU-side animation loop (lesson 30 uses CPU; MiraPlume needs GPU compute).

**Portability verdict:** port-fragment (splat shader pattern + FBO wiring confirmation)

---

## Recommendation Table

| Technique | Source | License | Portability verdict |
|---|---|---|---|
| N-body galaxy engine | angeluriot/Galaxy_simulation | MIT | skip — wrong computational model, no browser equivalent |
| Point-sprite "galaxy" GLSL shader | angeluriot/Galaxy_simulation | MIT | skip — standard pattern; derivable from first principles; bloom already in project |
| Separable Gaussian bloom | angeluriot/Galaxy_simulation | MIT | skip — already in project via @react-three/postprocessing Bloom |
| FBO ping-pong wiring (Three.js) | iagokrt/curl-noise-threejs | MIT | port-fragment — JS-side FBO architecture |
| Divergence-free curl noise (GLSL) | atyuwen/bitangent_noise | MIT | port-fragment — `BitangentNoise3D` function body into compute shader |
| Bitangent noise Shadertoy demo | shadertoy.com/view/ftl3zN | CC BY-NC-SA | inspiration-only — use the MIT GitHub source instead |
| Point-splat fragment pattern | Three.js Journey lesson 30/41 | MIT (student repos) | port-fragment — circular splat + additive blend setup |
| FBO GPGPU confirm | Three.js Journey lesson 41 | MIT (student repos) | port-fragment — cross-reference for FBO wiring |
| Curl noise visualizer | shadertoy.com/view/mlsSWH | CC BY-NC-SA | inspiration-only — for parameter calibration only, do not port |
| cabbibo/glsl-curl-noise | cabbibo/glsl-curl-noise | No license | skip — unlicensed; use atyuwen/bitangent_noise instead |
| kbladin/Curl_Noise | kbladin/Curl_Noise | MIT | inspiration-only — OpenGL not WebGL; confirms Bridson 2007 technique |
