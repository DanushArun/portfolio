'use client';

/**
 * PostFX — selective bloom.
 *
 * luminanceThreshold: 0.6 — only fragments brighter than 60% intensity bloom.
 * This keeps the #000000 void black and only halos emissive objects (pulsar
 * beam, jet particles, star emissive materials).
 *
 * mipmapBlur: true — smoother bloom spread, no ring artifacts.
 * intensity: 0.4 — visible glow without washing out the scene.
 */

import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function PostFX() {
  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
        blendFunction={BlendFunction.ADD}
      />
    </EffectComposer>
  );
}
