'use client';

/**
 * Cinematic post-processing pipeline.
 *
 * @react-three/postprocessing v3 wraps effects with a helper that calls
 * JSON.stringify on all props, including ref objects.  Three.js objects are
 * circular, so this crashes with "Converting circular structure to JSON".
 *
 * Fix: instantiate every effect directly with useMemo and pass them to
 * EffectComposer via <primitive object={...} />.  The composer's internal
 * useLayoutEffect reads children[].object, creates an EffectPass per group,
 * and adds each pass — so this pattern is fully supported.
 */

import { EffectComposer } from '@react-three/postprocessing';
import {
  BlendFunction,
  KernelSize,
  Effect,
  BloomEffect,
  BrightnessContrastEffect,
  ChromaticAberrationEffect,
  HueSaturationEffect,
  VignetteEffect,
  NoiseEffect,
  SMAAEffect,
} from 'postprocessing';
import { useScene, phaseTime, type ScenePhase } from '@/lib/scene-state';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Per-phase grade targets
// ─────────────────────────────────────────────────────────────────────────────

type Grade = {
  contrast: number;
  saturation: number;
  hue: number;
  brightness: number;
  vignette: number;
  noise: number;
  caBase: number;
  caMax: number;
};

// contrast/brightness/saturation tuned per cinematic phase:
// VOID + EVENT_HORIZON: deep black, high contrast, film grain — Nolan IMAX
// DESCENT: crush to maximum darkness
// Cosmic scenes: balanced, slightly desaturated — Fraser cool/warm split
// SINGULARITY: clean, almost no grade — let the image breathe
const GRADE: Record<ScenePhase, Grade> = {
  VOID:           { contrast: 0.12, saturation: -0.12, hue: 0.00, brightness: -0.04, vignette: 0.80, noise: 0.10, caBase: 0.001,  caMax: 0.001  },
  EVENT_HORIZON:  { contrast: 0.10, saturation: -0.08, hue: 0.00, brightness: -0.03, vignette: 0.72, noise: 0.07, caBase: 0.0012, caMax: 0.012  },
  DESCENT:        { contrast: 0.22, saturation: -0.25, hue: 0.00, brightness: 0.02,  vignette: 0.90, noise: 0.18, caBase: 0.012,  caMax: 0.020  },
  MIRA_PULSAR:    { contrast: 0.10, saturation: -0.05, hue: 0.00, brightness: -0.02, vignette: 0.75, noise: 0.07, caBase: 0.001,  caMax: 0.001  },
  DRIVEX_QUASAR:  { contrast: 0.08, saturation: 0.05,  hue: 0.00, brightness: -0.02, vignette: 0.70, noise: 0.06, caBase: 0.001,  caMax: 0.001  },
  TWIN_BUILD:     { contrast: 0.10, saturation: -0.05, hue: 0.00, brightness: -0.02, vignette: 0.72, noise: 0.07, caBase: 0.001,  caMax: 0.001  },
  FORMULA_RINGS:  { contrast: 0.08, saturation: 0.08,  hue: 0.00, brightness: -0.01, vignette: 0.65, noise: 0.05, caBase: 0.001,  caMax: 0.001  },
  QUANTUM_PLANET: { contrast: 0.08, saturation: -0.10, hue: 0.00, brightness: -0.03, vignette: 0.75, noise: 0.06, caBase: 0.001,  caMax: 0.001  },
  SINGULARITY:    { contrast: 0.06, saturation: 0.00,  hue: 0.00, brightness: 0.00,  vignette: 0.60, noise: 0.04, caBase: 0.0008, caMax: 0.0008 },
};

const LERP = 0.04;

// ─────────────────────────────────────────────────────────────────────────────
// Anamorphic horizontal streak
// ─────────────────────────────────────────────────────────────────────────────

const ANAMORPHIC_FRAG = /* glsl */ `
  uniform float uIntensity;
  uniform float uThreshold;
  uniform vec2  uResolution;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 base = inputColor.rgb;
    float px = 1.0 / uResolution.x;
    vec3  streak = vec3(0.0);
    float total  = 0.0;
    for (int i = 1; i <= 13; i++) {
      float fi  = float(i);
      float off = pow(1.6, fi) * px;
      float w   = exp(-fi * 0.18);
      streak += texture2D(inputBuffer, uv + vec2( off, 0.0)).rgb * w;
      streak += texture2D(inputBuffer, uv + vec2(-off, 0.0)).rgb * w;
      total  += 2.0 * w;
    }
    streak /= max(total, 1e-4);
    float luma = dot(streak, vec3(0.2126, 0.7152, 0.0722));
    float mask = smoothstep(uThreshold, uThreshold + 0.25, luma);
    vec3 tint  = vec3(0.55, 0.78, 1.0);
    outputColor = vec4(base + streak * tint * mask * uIntensity, inputColor.a);
  }
`;

class AnamorphicStreakEffect extends Effect {
  constructor({ intensity = 0.9, threshold = 0.55 } = {}) {
    super('AnamorphicStreakEffect', ANAMORPHIC_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform<number | THREE.Vector2>>([
        ['uIntensity', new THREE.Uniform(intensity)],
        ['uThreshold', new THREE.Uniform(threshold)],
        ['uResolution', new THREE.Uniform(new THREE.Vector2(1920, 1080))],
      ]),
    });
  }

  override setSize(w: number, h: number) {
    const u = this.uniforms.get('uResolution')?.value as THREE.Vector2 | undefined;
    if (u) u.set(w, h);
  }

  set intensity(v: number) {
    const u = this.uniforms.get('uIntensity');
    if (u) u.value = v;
  }
  get intensity() {
    return (this.uniforms.get('uIntensity')?.value as number) ?? 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PostFX() {
  // Create every effect instance once.  Mutation happens inside useFrame —
  // no refs needed because these are stable objects from useMemo closures.
  const smaa     = useMemo(() => new SMAAEffect(), []);
  const bloom    = useMemo(() => new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 2.2,
    luminanceThreshold: 0.28,
    luminanceSmoothing: 0.65,
    kernelSize: KernelSize.MEDIUM,
    mipmapBlur: true,
  }), []);
  const halation = useMemo(() => new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.8,
    luminanceThreshold: 0.55,
    luminanceSmoothing: 0.9,
    kernelSize: KernelSize.LARGE,
    mipmapBlur: true,
  }), []);
  const streak   = useMemo(() => new AnamorphicStreakEffect({ intensity: 0.9 }), []);
  const ca       = useMemo(() => new ChromaticAberrationEffect({
    blendFunction: BlendFunction.NORMAL,
    offset: new THREE.Vector2(0.0015, 0.0015),
    radialModulation: true,
    modulationOffset: 0.15,
  }), []);
  const bc       = useMemo(() => new BrightnessContrastEffect({ brightness: -0.02, contrast: 0.08 }), []);
  const hs       = useMemo(() => new HueSaturationEffect({ hue: 0, saturation: -0.05 }), []);
  const vignette = useMemo(() => new VignetteEffect({ eskil: false, offset: 0.18, darkness: 0.68 }), []);
  const noise    = useMemo(() => new NoiseEffect({
    premultiply: true,
    blendFunction: BlendFunction.SOFT_LIGHT,
  }), []);

  // Lerped grade state — single ref, mutated in place each frame.
  const grade = useRef<Grade>({ ...GRADE.VOID });
  const caVal = useRef(0.0015);

  useFrame(() => {
    const { phase, phaseStart } = useScene.getState();
    const target = GRADE[phase];
    const g = grade.current;

    g.contrast   += (target.contrast   - g.contrast)   * LERP;
    g.saturation += (target.saturation - g.saturation) * LERP;
    g.hue        += (target.hue        - g.hue)        * LERP;
    g.brightness += (target.brightness - g.brightness) * LERP;
    g.vignette   += (target.vignette   - g.vignette)   * LERP;
    g.noise      += (target.noise      - g.noise)      * LERP;

    // CA ramps up during DESCENT, stays flat otherwise
    let caTarget = target.caBase;
    if (phase === 'DESCENT') {
      const t = phaseTime(phaseStart);
      caTarget = target.caBase + Math.min(t / 1.0, 1) * (target.caMax - target.caBase);
    }
    caVal.current += (caTarget - caVal.current) * 0.18;

    // ── Mutate effect instances directly ──
    bc.contrast   = g.contrast;
    bc.brightness = g.brightness;
    hs.saturation = g.saturation;
    hs.hue        = g.hue;
    (vignette as VignetteEffect & { darkness: number }).darkness = g.vignette;
    noise.blendMode.opacity.value = g.noise;

    const v = caVal.current;
    (ca.offset as THREE.Vector2).set(v, v);

    // Anamorphic streak: intense during DESCENT, subtle in cosmic scenes
    let streakTarget = 0.6;
    if (phase === 'DESCENT') streakTarget = 1.6;
    else if (phase === 'EVENT_HORIZON') streakTarget = 0.8;
    else if (phase === 'FORMULA_RINGS') streakTarget = 1.0;
    streak.intensity += (streakTarget - streak.intensity) * 0.05;
  });

  return (
    <EffectComposer multisampling={0}>
      <primitive object={smaa} />
      <primitive object={bloom} />
      <primitive object={halation} />
      <primitive object={streak} />
      <primitive object={ca} />
      <primitive object={bc} />
      <primitive object={hs} />
      <primitive object={vignette} />
      <primitive object={noise} />
    </EffectComposer>
  );
}
