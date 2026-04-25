'use client';

// PostFX intentionally disabled.
// Heavy bloom + SMAA + streak pipeline was causing white-screen saturation
// and ~15ms GPU cost per frame. Visual effects are now handled cheaply:
//   - Vignette: CSS radial-gradient overlay in SceneManager
//   - Chromatic aberration: built into the lensing quad shader
//   - Film grain: omitted (imperceptible at this render quality)
export default function PostFX() { return null; }
