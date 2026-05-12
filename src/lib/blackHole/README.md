# Black Hole — palette exemption (Job 003 AC5)

The black hole renderer at `src/lib/blackHole/index.ts` + `shaders.ts` is an
imperative Three.js scene; its colours are GLSL uniforms baked at module
load. The token system in `src/lib/design-tokens.ts` is the source of
truth for **DOM** colours; shader uniforms are exempt because they live
inside the WebGL program, not the cascade.

## Exempt hex literals

These colours intentionally bypass the palette token system. Updating them
requires editing the shader source directly, then re-verifying the
visual baseline (BH disc + Doppler beaming).

| Location                                    | Hex / vec3                       | Role                          |
| ------------------------------------------- | -------------------------------- | ----------------------------- |
| `src/lib/blackHole/index.ts:innerColor`     | `#ffc066`                        | Accretion disc inner ring     |
| `src/lib/blackHole/index.ts:outerColor`     | `#5a1a08`                        | Accretion disc outer ring     |
| `src/lib/blackHole/shaders.ts` (uniforms)   | various `vec3(...)` constants    | Disc gradient, Doppler shift  |

## OFL attribution

`public/fonts/jetbrains-mono-full.woff2` ships with the JetBrains Mono SIL
Open Font License 1.1 source release. Used by the L00 loader only via
`src/lib/fonts.ts` (`directorMonoFull`) for U+2609 (☉) and U+2076 (⁶).
