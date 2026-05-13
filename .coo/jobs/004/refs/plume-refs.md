# Curl-Noise Particle Plume / Ribbon-Sheet Rendering — References

These references inform the specific technique for the MiraPlume GPGPU system:
curl-noise velocity field, sheet-like ribbon structure, warm/cool band mixing,
and the return-arc trajectory. The spec requires the plume to read as a "flowing
veil" not an isotropic particle spray (AC4, Panel 2 and Panel 3 of storyboard).

---

## REF-PL-01 — atyuwen/bitangent_noise (GLSL divergence-free noise)

**URL:** https://github.com/atyuwen/bitangent_noise  
**Shadertoy demo:** https://www.shadertoy.com/view/ftl3zN  
**License:** MIT  
**Date:** Repository active 2021–present; technique based on Ivan DeWolf 2005 research  
**Author:** atyuwen  
**What it provides:** `BitangentNoise.glsl` — a single self-contained GLSL file that
generates 3D/4D divergence-free noise in HLSL and GLSL. Key functions:
`BitangentNoise3D(vec3 p)` and `BitangentNoise4D(vec4 p)`. Returns a `vec3` velocity
suitable for direct use as a curl-noise flow-field velocity. The implementation is
"computationally cheaper" than classical curl noise because it avoids the 18-sample
finite-difference approach; it works by computing noise derivatives analytically using
the bitangent vector of the noise gradient.

**Why it is the primary curl-noise source for MiraPlume:**  
1. MIT license — can be ported verbatim to `MiraPlume`'s compute fragment shader.
2. Self-contained: no `#pragma glslify` dependencies. One file, copy-paste into
   the compute shader string.
3. The Shadertoy demo (view/ftl3zN) demonstrates the smoke-ball particle effect —
   this is the closest existing visual to the plume-out phase (Panel 2 of storyboard).
4. 3× cheaper than `cabbibo/glsl-curl-noise` at equivalent visual quality (fewer
   noise samples per particle per frame — critical for staying inside the 80k
   particle budget at AC8's ≤ 18ms median frame time).

**What to port:** `BitangentNoise.glsl` — the `BitangentNoise3D` function only.
Use it as the velocity source in the compute pass: `velocity = BitangentNoise3D(pos * 0.8 + time * 0.4) * 1.8`.

**What to skip:** The 4D variant, the HLSL version, the Shadertoy wrapper code.

---

## REF-PL-02 — iagokrt/curl-noise-threejs (Three.js FBO particles + curl noise)

**URL:** https://github.com/iagokrt/curl-noise-threejs  
**License:** MIT  
**What it provides:** Vanilla Three.js FBO particle system with curl noise GLSL shaders
implemented in WebGL. The repository uses ping-pong framebuffer objects (two
`WebGLRenderTarget`s alternated each frame) to update particle positions entirely on the
GPU. The curl noise is applied as a velocity field in the compute fragment shader.
Language breakdown: 9% GLSL (the actual shader code), 91% JavaScript/HTML.

**Why it informs MiraPlume:**  
- This is a direct structural reference for the ping-pong FBO pattern in a
  Three.js context. The MiraPlume implementation should follow the same architecture:
  two render targets, swap references each frame, sample the previous frame's texture
  for positions in the compute pass.
- The project is the closest web-native match to what MiraPlume needs to build —
  FBO particles + curl noise + Three.js — with a permissive license.

**What to port:** The FBO ping-pong setup and the per-particle state texture read/write
pattern from the JavaScript side. The renderer state save/restore idiom around the
off-screen render (critical for not corrupting the main canvas — documented as a
known failure mode in the plan).

**What to skip:** The curl noise function itself (use REF-PL-01's bitangent_noise
instead, which is both licensed and cheaper). The repo's visual output is an isotropic
spray; do not port the visual style.

**Caveat:** The repo is a learning exercise (own readme says "experiments"), not a
production implementation. Check the actual shader files in the repo before using;
the FBO pattern should be solid but the curl function may be the 18-sample version.

---

## REF-PL-03 — "Dissecting Curl Noise" — Emil Dziewanowski (May 2024)

**URL:** https://emildziewanowski.com/curl-noise/  
**License:** Article is All Rights Reserved (blog post). GLSL snippets shown are
reference material / educational — read and understand, do not copy-paste verbatim
without verifying they are independently derivable from the mathematics.  
**Date:** 5 May 2024  
**What it provides:** The most thorough recent technical breakdown of curl noise for
VFX use. Key sections relevant to MiraPlume:

1. **Sheet / ribbon structure** — The article explains that curl noise fields have
   preferred curl axes, which causes particles to naturally form sheet-like structures
   perpendicular to the curl axis, not isotropic sprays. This is why curl noise is
   the right choice for the "flowing veil" (Panel 2) over a simpler noise field.
   To reinforce the sheet structure: use a 2D curl field (project velocity into the
   xy-plane of the knot's local coordinate frame) for the first 50% of plume life
   (outward phase). This locks particles onto a sheet-like manifold.

2. **Euler integration for path generation** — The article uses 3000 steps of Euler
   method for path generation (offline). Our compute shader does online Euler
   integration per frame (dt × velocity). The same principle applies.

3. **Computational cost** — "Curl relies on lots of samples from a layered vector
   field, making it computationally heavy." The article confirms using bitangent noise
   (or analytic derivatives) as the mitigation, consistent with REF-PL-01.

4. **Multiple frequency layers** — The article shows that layering two noise
   frequencies (coarse for overall direction, fine for internal wisp texture) produces
   the most convincing ribbon structure. For MiraPlume: use `BitangentNoise3D(pos * 0.8)
   * 1.8 + BitangentNoise3D(pos * 3.0) * 0.4` — the fine layer adds internal wisp
   texture to the sheet without overwhelming the overall curl direction.

**Why it is essential even though its code is not directly portable:**  
The explanation of *why* curl noise produces sheets (not sprays) is the conceptual
foundation the 3d-graphics-engineer needs to tune the plume correctly. Without it,
the compute shader will look "about right" but never reach the ribbon quality of
Panel 2 / Panel 3.

---

## Shadertoy reference: Visualizing Curl Noise

**URL:** https://www.shadertoy.com/view/mlsSWH  
**License:** Shadertoy default (CC BY-NC-SA). Inspiration-only — do not port code.  
**What it shows:** Real-time 2D curl noise visualization. Useful for tuning the
scale and speed parameters of the noise field before committing to the 3D GPGPU
implementation. Open it alongside the dev browser to calibrate `uNoiseScale`
and `uNoiseSpeed` uniforms in MiraPlume's compute shader.

**Also see:** https://www.shadertoy.com/view/4fVGWm (Curl Noise with Simplex3D_Deriv,
updated April 2024) — shows the derivative-based implementation, comparable to what
bitangent_noise does internally.

---

## Note on cabbibo/glsl-curl-noise

**URL:** https://github.com/cabbibo/glsl-curl-noise  
**License:** No license declared. Issue #1 in the repo asks the author to add MIT;
no response as of research date. **Do not use for production code.**  
This is a well-known curl noise reference used widely in three.js community tutorials,
but the lack of a license makes it legally ambiguous. Use REF-PL-01 (atyuwen/bitangent_noise,
MIT) instead for any code that ships. The cabbibo implementation also uses the 18-sample
finite-difference approach, which is 3× more expensive than bitangent_noise.
