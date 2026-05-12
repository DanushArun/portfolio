'use client';

/**
 * PostFX — selective bloom + scroll-driven chromatic aberration.
 *
 * Bloom: only fragments brighter than `luminanceThreshold` halo. Keeps the
 * void black; lights up emissives (warp particles, pulsar, jet, etc).
 *
 * Chromatic aberration: matched to o2bomb/space-warp's CA envelope. Ramps to
 * peak at C05_WARP onset (engulfment) and decays as 0.5^t through C05+C06,
 * exactly like upstream's `Math.pow(0.5, elapsedTime) * CHROMATIC_ABBERATION_OFFSET`.
 * Off in every other phase.
 *
 * Note: ChromaticAberrationEffect is constructed imperatively and mounted via
 * <primitive>, NOT via the wrapped <ChromaticAberration> component. Reason:
 * the wrapper does `useMemo(..., [JSON.stringify(a)])` over its rest-props.
 * In React 19 `ref` is a regular prop. After first render `ref.current` points
 * to the Effect instance whose `parent` (EffectPass) circular-refs back to it
 * via `children[0]`, so JSON.stringify throws "Converting circular structure
 * to JSON". Using <primitive> sidesteps the wrapper entirely.
 */

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction, ChromaticAberrationEffect } from 'postprocessing';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

// Strong CA so each white motion streak splits into visible R / G / B
// channels — the "RGB-shift" look. Bloom at moderate intensity (0.4) keeps
// the haloing in check at this offset. If the user wants even more dramatic
// channel separation, push to 0.025; if it disco-balls, drop to 0.012.
const CA_PEAK = 0.018;

export default function PostFX() {
  // Construct the effect once, mutate its uniforms each frame.
  const caEffect = useMemo(
    () => new ChromaticAberrationEffect({
      blendFunction: BlendFunction.NORMAL,
      offset: new THREE.Vector2(0, 0),
      radialModulation: false,
      modulationOffset: 0,
    }),
    [],
  );

  useFrame(() => {
    const phase  = useScene.getState().phase;
    const cosmic = useScene.getState().cosmicProgress;

    if (phase !== 'C05_WARP' && phase !== 'C06_ANOMALY') {
      caEffect.offset.x = 0;
      caEffect.offset.y = 0;
      return;
    }
    // CA tied to the same acceleration curve as the warp velocity in
    // WarpScene.tsx — physically coupled, so chromatic shift grows AS the
    // user accelerates. Subtle at the slow start, peaks with peak warp.
    const cp = Math.max(0, Math.min(1, (cosmic - 0.50) / 0.25));
    const BASE_V = 0.08;
    const accelInput = Math.min(1, cp / 0.85);
    const accel = Math.pow(accelInput, 1.8);
    const velocity = BASE_V + (1 - BASE_V) * accel;
    const o = velocity * CA_PEAK;
    caEffect.offset.x = o;
    caEffect.offset.y = o;
  });

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
        blendFunction={BlendFunction.ADD}
      />
      <primitive object={caEffect} dispose={null} />
    </EffectComposer>
  );
}
