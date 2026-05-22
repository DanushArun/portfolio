'use client';

/* eslint-disable react-hooks/immutability */

/**
 * PostFX — phase-aware bloom + scroll-driven chromatic aberration.
 *
 * Both effects are constructed imperatively and mutated each frame
 * (mirror of the caEffect pattern). This avoids the React 19 circular-JSON
 * bug from the postprocessing wrappers and enables per-phase tuning without
 * conditional JSX.
 *
 * Bloom per-phase tuning:
 *   W01_MIRA — threshold 0.15, smoothing 0.40, intensity 2.00 (spec: everything glows, cores erupt)
 *   all other — threshold 0.60, smoothing 0.9,  intensity 0.40 (general bloom)
 *
 * Chromatic aberration: ramps on C05_WARP + C06_ANOMALY only.
 */

import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { BlendFunction, ChromaticAberrationEffect, BloomEffect } from 'postprocessing';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const CA_PEAK = 0.018;

export default function PostFX() {
  const { scene } = useThree();

  const caEffect = useMemo(
    () => new ChromaticAberrationEffect({
      blendFunction: BlendFunction.NORMAL,
      offset: new THREE.Vector2(0, 0),
      radialModulation: false,
      modulationOffset: 0,
    }),
    [],
  );

  const bloomEffect = useMemo(
    () => new BloomEffect({
      blendFunction: BlendFunction.ADD,
      intensity: 0.4,
      luminanceThreshold: 0.6,
      luminanceSmoothing: 0.9,
      mipmapBlur: true,
    }),
    [],
  );

  useFrame(() => {
    const phase = useScene.getState().phase;
    const cosmic = useScene.getState().cosmicProgress;
    const local = useScene.getState().localProgress;
    const isMira = phase === 'W01_MIRA';

    // Phase-aware bloom uniform mutation.
    if (isMira) {
      bloomEffect.luminanceMaterial.threshold = 0.97;
      bloomEffect.luminanceMaterial.smoothing = 0.01;
      bloomEffect.intensity = 0.20; // Keeps bloom pinned to core centers only, space stays pitch black
    } else {
      bloomEffect.luminanceMaterial.threshold = 0.60;
      bloomEffect.luminanceMaterial.smoothing = 0.9;
      bloomEffect.intensity = 0.40;
    }

    // Phase-aware scene background.
    let reveal = 0;
    if (phase === 'C07_TRANSITION') {
      reveal = local < 0.45 ? 0 : ((local - 0.45) / 0.55) * 0.40;
    } else if (phase === 'C08_EMERGE') {
      reveal = 0.40 + Math.min(1, local) * 0.40;
    } else if (phase === 'C09_PROJECT') {
      reveal = 0.80 + Math.min(1, local) * 0.15;
    } else if (phase === 'W01_MIRA') {
      reveal = 1.0;
    }

    const isMiraBg = phase === 'W01_MIRA' || phase === 'C09_PROJECT' || (phase === 'C08_EMERGE' && reveal > 0.4);
    if (isMiraBg) {
      scene.background = new THREE.Color(0, 0, 0); // Pure pitch black for deep space
    } else {
      scene.background = new THREE.Color(0, 0, 0);
    }

    // Chromatic aberration — active only during warp phases.
    if (phase !== 'C05_WARP' && phase !== 'C06_ANOMALY') {
      caEffect.offset.x = 0;
      caEffect.offset.y = 0;
      return;
    }
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
      <primitive object={bloomEffect} dispose={null} />
      <primitive object={caEffect} dispose={null} />
    </EffectComposer>
  );
}
