# Job 004 — MIRA Virgo Supercluster: Reference Research Memo

**For:** 3d-graphics-engineer (primary implementer, Tasks 6–9)  
**From:** deep-researcher  
**Date:** 2026-05-13  

This memo is your single entry point for all external references. Every link has
been license-checked. Do not use anything marked "inspiration-only" for production
code — those are look-at references only.

---

## Summary

### Galaxy_simulation verdict (one sentence)

`angeluriot/Galaxy_simulation` (MIT) uses OpenCL N-body physics that has no browser
equivalent, and its GLSL shaders implement standard point-sprite + separable Gaussian
bloom that are both already present in this project — nothing in it is worth porting.

### Top 2 most useful references for this specific job

1. **`atyuwen/bitangent_noise`** (MIT) — `BitangentNoise3D` is your curl-noise function.
   Copy the GLSL body verbatim into MiraPlume's compute fragment shader. Self-contained,
   no deps, 3× cheaper than the cabbibo alternative, and MIT licensed. This is the
   only external GLSL code you should paste into a production file.

2. **ESA/Hubble heic2003b "Cosmic Web Artist's Impression" (CC BY 4.0)** — The direct
   photographic aesthetic target. Open it next to your dev browser. If your render could
   plausibly be from the same image set, you're on track. If it reads as "video game
   particles", you're not.

---

## Punch list for the 3d-graphics-engineer

### For the filament web (MiraSupercluster, Task 7)

Look at:
- **REF-CW-02** (heic2003b, CC BY 4.0): the direct aesthetic target for filament
  thread-mesh appearance. Filaments are thin, luminous-core with diffuse halo,
  sparse (lots of void). Use this to calibrate point density and alpha.
- **REF-CW-01** (ESA Planck/ROSAT Shapley): palette reference. The cool blue/purple
  gas with warm orange-pink cluster cores. Asymmetric, irregular boundary.
- **REF-CW-03** (IllustrisTNG TNG300): internal sub-structure within filaments —
  bright spine, diffuse wings. Drive this with a per-particle distance-from-filament-axis
  alpha weight.

Implementation note: filaments are Bezier curves from knot to knot with midpoint jitter.
Render each as a tube of additive point sprites. Brighten sprites within 20% of knot
endpoint (matches REF-CW-04: filaments brighten at cluster termination). Total particle
budget: 30k high / 8k low (AC8).

### For the knot cores (MiraKnots, Task 6)

Look at:
- **REF-CW-01** (Planck/ROSAT Shapley): pink X-ray hotspot cores are the direct
  model. A3558 and A3562 are 2 distinct blobs of different sizes — map this to our
  English knot (largest) vs regional knots.
- **REF-CW-02** (heic2003b): white-hot cores at filament intersections, with large
  diffuse halos that fade into the web. The halo is much larger than the core.

Shader recipe from the plan (Task 6, Step 2):
```glsl
// Core fragment — matches Planck X-ray hotspot appearance:
vec3 col = mix(hue * 0.6, hue * 3.0, smoothstep(0.0, 0.4, glow));
// Halo billboard radial falloff:
float alpha = exp(-r * r * 4.0);
```

### For the plume ribbon (MiraPlume, Task 8)

The only code reference you should copy from is **REF-PL-01**:
- **`atyuwen/bitangent_noise`** — MIT — `BitangentNoise.glsl`
  — copy `BitangentNoise3D` function into your compute fragment shader.

For the FBO ping-pong wiring on the JS/Three.js side:
- **`iagokrt/curl-noise-threejs`** — MIT — architecture reference for
  `WebGLRenderTarget` swap pattern.

For understanding *why* curl noise produces sheet ribbons (not sprays):
- **"Dissecting Curl Noise"** by Emil Dziewanowski (2024):
  https://emildziewanowski.com/curl-noise/
  The mechanism: curl fields have preferred curl axes, which locks particles to
  a sheet-like manifold. Reinforce this by projecting velocity into the knot's
  local xy-plane for the first 50% of plume life (outward phase).

For visual calibration of noise parameters:
- **Shadertoy view/mlsSWH** — inspiration-only — open alongside dev browser to
  tune `uNoiseScale` and `uNoiseSpeed` before committing to the 3D GPGPU pass.
- **Shadertoy view/ftl3zN** — the bitangent_noise smoke-ball demo. Closest existing
  visual to the outward-plume phase (Panel 2).

Layering recipe from Dziewanowski:
```glsl
// Two-frequency layering for internal wisp texture:
vec3 velocity = BitangentNoise3D(pos * 0.8 + time * 0.4) * 1.8
              + BitangentNoise3D(pos * 3.0 + time * 0.2) * 0.4;
```

For the return arc:
```glsl
// Return phase (life >= 0.5): curl-tinted gravity back to knot.
velocity = -BitangentNoise3D(pos * 0.8 + time * 0.4) * 1.8
         + (knotPos - pos) * 3.0;
```
This matches Panel 3 ("data embrace"): the return arc curves / wraps because the curl
noise deflects the gravity vector, preventing a straight-line collapse.

---

## Full source list

| ID | URL | License | Relevance |
|---|---|---|---|
| REF-CW-01 | https://www.esa.int/ESA_Multimedia/Images/2013/10/Shapley_Supercluster | Inspiration-only (ESA Planck attribution) | Palette + filament/knot structural reference |
| REF-CW-02 | https://esahubble.org/images/heic2003b/ | CC BY 4.0 | Aesthetic target for the full render |
| REF-CW-03 | https://www.tng-project.org/media/ | Inspiration-only (TNG attribution) | Filament sub-structure, void/filament contrast |
| REF-CW-04 | https://www.esa.int/Science_Exploration/Space_Science/Cosmic_filaments_exposed_near_huge_cluster | Inspiration-only (ESA/XMM attribution) | Filament terminus brightening near knots |
| REF-CW-05 | https://www.tng-project.org/media/ (DM+gas overlay) | Inspiration-only | Data flow along filament axes → plume motion model |
| REF-CW-06 | https://www.illustris-project.org/media/ (animated projection) | Inspiration-only | 3D depth layering of filaments in 2D projection |
| REF-PL-01 | https://github.com/atyuwen/bitangent_noise | MIT — port-fragment | `BitangentNoise3D` for MiraPlume compute shader |
| REF-PL-02 | https://github.com/iagokrt/curl-noise-threejs | MIT — port-fragment | FBO ping-pong wiring pattern |
| REF-PL-03 | https://emildziewanowski.com/curl-noise/ | All rights reserved — read-only | Sheet/ribbon mechanism explanation |
| REF-PL-DEMO | https://www.shadertoy.com/view/ftl3zN | CC BY-NC-SA — inspiration-only | Noise parameter calibration |
| REF-PL-VIZ | https://www.shadertoy.com/view/mlsSWH | CC BY-NC-SA — inspiration-only | 2D curl noise visual calibration |
| REF-TJ-GALAXY | https://github.com/rajput-hemant/threejs-journey | MIT — port-fragment | Point-splat shader + additive blend setup |
| REF-IMPL-GALAXY | https://github.com/angeluriot/Galaxy_simulation | MIT — skip | Confirmed: nothing worth porting |

---

## What I did not research (and why)

- **SDSS/BOSS observational data renderers** — These are Fortran/Python scientific
  pipelines producing static images, not real-time WebGL renderers. No portability to
  browser. Not searched in depth.
- **Bruno Simon's closed course materials** — The lesson source code is behind a paywall.
  Student repos (MIT licensed, independently verified) provide the same artifacts.
- **WebGPU-based cosmic web implementations** — WebGPU support is uneven in 2026 and
  the project's current SceneManager uses WebGL via Three.js. Introducing WebGPU would
  be a separate infrastructure job.
- **Real astrophotography image datasets (DSS, PanSTARRS)** — Not referenced because
  we are building a stylized render, not a scientific visualizer. The quality-bar
  storyboard is the canonical visual target, not actual survey data.

---

## Evidence: what I verified directly

- Confirmed `angeluriot/Galaxy_simulation` uses `glDrawArrays(GL_POINTS, ...)` in
  Renderer.cpp (point-sprite rendering), loads shaders named "galaxy", "blur", "post",
  uses `RGB_16f` FBOs. GLSL files not publicly indexed but shader names confirm standard
  point-splat + Gaussian bloom pipeline. Nothing novel.
- Confirmed `atyuwen/bitangent_noise` is MIT licensed with `BitangentNoise3D(vec3) → vec3`
  and `BitangentNoise4D(vec4) → vec3` as the key functions. Has Shadertoy demo at
  view/ftl3zN showing smoke-ball particle effect.
- Confirmed `cabbibo/glsl-curl-noise` has no license (open GitHub issue #1 requesting MIT,
  no response). Do not use.
- Confirmed `iagokrt/curl-noise-threejs` is MIT licensed, uses FBO ping-pong in Three.js.
- Confirmed ESA/Hubble heic2003b is CC BY 4.0 (Volker Springel / Max Planck credit).
- Confirmed ESA Planck/ROSAT Shapley image (2013) credit line:
  "ESA & Planck Collaboration / ROSAT / Digitised Sky Survey"
  No CC license formally stated — treat as inspiration-only for production use.
