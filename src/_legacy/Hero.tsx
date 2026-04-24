'use client';

/**
 * Hero — "THE FIELD"
 *
 * A live electromagnetic-field simulation rendered in a GLSL fragment shader
 * via react-three-fiber. The cursor is the primary EM source; three fixed
 * dipole-style charges give the field visual structure. Scroll (wired later)
 * sweeps frequency across 100 kHz → 10 GHz, which modulates contour density
 * and phase velocity.
 *
 * Architecture:
 *   - Orthographic camera + [2,2] plane in clip space → zero-cost full-screen
 *     quad. No perspective math, no resize juggling.
 *   - Uniforms live on a useRef so state updates never re-create the material.
 *   - Mouse is lerped (tau ≈ 1/0.08 frames ≈ 12 frames @ 60fps) for liquid feel.
 *   - GSAP handles the title/label entrance; shader handles everything else.
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import styles from './Hero.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// SHADERS
// ─────────────────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2  u_mouse;
  uniform float u_freq;
  uniform float u_time;
  uniform float u_aspect;

  varying vec2 vUv;

  // Coulomb-style scalar potential from a point charge at 'source'.
  // Using 1/r (not 1/r²) keeps contours readable across the frame.
  float potential(vec2 pos, vec2 source, float charge) {
    vec2 r = pos - source;
    float d = length(r) + 0.001;
    return charge / d;
  }

  void main() {
    // Work in aspect-corrected UV so circles stay round on wide screens.
    vec2 uv = vUv;
    uv.x *= u_aspect;

    vec2 m = vec2(u_mouse.x * u_aspect, u_mouse.y);

    // Live cursor source + three fixed dipole-style charges for structure.
    float phi  = potential(uv, m, 1.0);
    phi       += potential(uv, vec2(0.2 * u_aspect, 0.5), -0.35);
    phi       += potential(uv, vec2(0.8 * u_aspect, 0.5),  0.35);
    phi       += potential(uv, vec2(0.5 * u_aspect, 0.2),  0.20);

    // Equipotential contours. Frequency controls both line count and drift.
    float density = 14.0 + u_freq * 36.0;
    float contour = fract(phi * density + u_time * 0.15 * u_freq);
    float line    = 1.0 - smoothstep(0.0, 0.12, abs(contour - 0.5) * 2.0 - 0.7);

    // Inverse-square glow under the cursor.
    float distM = length(uv - m);
    float glow  = 0.015 / (distM * distM + 0.0015) * 0.8;

    // Secondary pulsing source glow (fixed position dipole anchor, upper-left).
    float glow2 = 0.006 / (length(uv - vec2(0.2 * u_aspect, 0.6)) + 0.002);

    float intensity = clamp(line * 0.7 + glow + glow2, 0.0, 1.0);

    vec3 lime     = vec3(0.722, 1.000, 0.235); // #B8FF3C
    vec3 graphite = vec3(0.045, 0.053, 0.068); // faint lime-tinted graphite
    vec3 hot      = vec3(0.900, 1.000, 0.850);

    vec3 col = mix(graphite, mix(lime, hot, clamp(glow * 2.0, 0.0, 1.0)), intensity);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// FIELD PLANE (inside Canvas)
// Frequency is driven directly by scroll progress (0→1 maps to 0.10→10.00 GHz
// linearly). Formatting lives in Hero.handleFreqChange, close to the DOM.
// ─────────────────────────────────────────────────────────────────────────────

type FieldUniforms = {
  u_mouse: { value: THREE.Vector2 };
  u_freq: { value: number };
  u_time: { value: number };
  u_aspect: { value: number };
};

interface FieldPlaneProps {
  onFreqChange: (normalized: number) => void;
  scrollProgressRef: React.MutableRefObject<number>;
}

function FieldPlane({ onFreqChange, scrollProgressRef }: FieldPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();

  // Uniforms live in a ref so React never re-renders this on update.
  const uniformsRef = useRef<FieldUniforms>({
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_freq: { value: 0.0 },
    u_time: { value: 0.0 },
    u_aspect: { value: size.width / Math.max(size.height, 1) },
  });

  // Lerp target for the cursor (smooth mouse trail, no per-frame allocation).
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  // Throttle the JS → DOM freq readout to ~10 Hz. 60 fps × formatting the
  // string every frame is wasted work; the eye can't read it that fast anyway.
  const lastFreqEmitRef = useRef(0);

  // DOM-level mousemove so we track the pointer over the whole hero, not just
  // the canvas. Three.js `state.mouse` is canvas-relative and goes stale when
  // the pointer leaves; window-level capture is more reliable for a full-bleed
  // hero with UI overlays on top.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      targetMouse.current.x = e.clientX / window.innerWidth;
      // Y is flipped: UV y=0 is bottom, screen y=0 is top.
      targetMouse.current.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', handler, { passive: true });
    return () => window.removeEventListener('pointermove', handler);
  }, []);

  useFrame((state, delta) => {
    const u = uniformsRef.current;

    // Smooth cursor tracking (lerp ≈ 8% per frame → ~12-frame time constant).
    u.u_mouse.value.lerp(targetMouse.current, 0.08);

    u.u_time.value += delta;
    u.u_aspect.value = state.size.width / Math.max(state.size.height, 1);

    // Frequency is now driven by scroll position: 0 at top, 1 after 1 viewport.
    // The ref is updated by a DOM scroll listener and read here per frame —
    // this keeps React out of the hot path (no state updates per scroll event).
    const freqN = scrollProgressRef.current;
    u.u_freq.value = freqN;

    // Emit freq readout at ~10 Hz to keep React updates cheap.
    if (state.clock.elapsedTime - lastFreqEmitRef.current > 0.1) {
      lastFreqEmitRef.current = state.clock.elapsedTime;
      onFreqChange(freqN);
    }
  });

  // A fullscreen quad sized to the viewport in world units. For the default
  // orthographic camera r3f provides, viewport.width/height at z=0 equals the
  // visible extents, so a plane of this size exactly covers the screen with
  // no zoom fighting or black bars.
  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniformsRef.current as unknown as { [k: string]: THREE.IUniform }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

export default function Hero() {
  const [freqDisplay, setFreqDisplay] = useState('0.10 GHz');

  const rootRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const systemIdRef = useRef<HTMLDivElement | null>(null);
  const freqBlockRef = useRef<HTMLDivElement | null>(null);
  const scrollHintRef = useRef<HTMLDivElement | null>(null);

  // Scroll progress, 0 (at top) → 1 (after one viewport scrolled).
  // Lives on a ref so the WebGL frame loop can read it without re-rendering
  // Hero every scroll event. DOM listener updates it; FieldPlane reads it.
  const scrollProgressRef = useRef(0);

  // GSAP entrance. Runs once on mount; StrictMode double-invoke is safe here
  // because the context is reverted in cleanup — no accumulated tweens.
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      // Jump to final state; bail.
      gsap.set(
        [titleRef.current, systemIdRef.current, freqBlockRef.current, scrollHintRef.current],
        { opacity: 1, y: 0 }
      );
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
        delay: 0.2,
      });
      gsap.to([systemIdRef.current, freqBlockRef.current], {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.4,
      });
      gsap.to(scrollHintRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.7,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Scroll progress → frequency readout.
  // Linear sweep 0.10 GHz (at top) → 10.00 GHz (after 1 viewport) —
  // matches the u_freq uniform the shader uses for contour density.
  const handleFreqChange = (normalized: number) => {
    const ghz = 0.1 + normalized * 9.9;
    setFreqDisplay(`${ghz.toFixed(2)} GHz`);
  };

  // Scroll listener → writes to scrollProgressRef (not React state).
  // Kept on the ref because the WebGL frame loop reads it 60× per second;
  // routing through setState would trigger Hero re-renders every scroll tick.
  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      const p = window.scrollY / vh;
      scrollProgressRef.current = p < 0 ? 0 : p > 1 ? 1 : p;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Periodic RGB channel-split glitch on the title. Fires every 6-8s for
  // ~200ms, cycling through 3-4 shadow frames then snapping clean. Uses
  // requestAnimationFrame for frame-accurate cycling (not setTimeout, which
  // drifts) and clears aggressively in cleanup to survive StrictMode.
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const SHADOW_FRAMES = [
      '-4px 0 rgba(255,0,100,0.8), 4px 0 rgba(0,200,255,0.8)',
      '3px 0 rgba(255,0,100,0.8), -3px 0 rgba(0,200,255,0.8)',
      '-2px 1px rgba(255,0,100,0.8), 2px -1px rgba(0,200,255,0.8)',
      '4px 0 rgba(255,0,100,0.8), -4px 0 rgba(0,200,255,0.8)',
    ];
    const CLEAN = 'none';

    let rafId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const runBurst = () => {
      const t = titleRef.current;
      if (!t) return scheduleNext();
      let frame = 0;
      const FRAME_MS = 50; // ~200ms total for 4 frames
      let lastSwap = performance.now();

      const step = (now: number) => {
        if (now - lastSwap >= FRAME_MS) {
          if (frame >= SHADOW_FRAMES.length) {
            t.style.textShadow = CLEAN;
            scheduleNext();
            return;
          }
          t.style.textShadow = SHADOW_FRAMES[frame];
          frame += 1;
          lastSwap = now;
        }
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    };

    const scheduleNext = () => {
      const delay = 6000 + Math.random() * 2000; // 6-8s
      timeoutId = setTimeout(runBurst, delay);
    };

    scheduleNext();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      if (titleRef.current) titleRef.current.style.textShadow = CLEAN;
    };
  }, []);

  return (
    <section ref={rootRef} className={styles.root} aria-label="Hero — The Field">
      {/* 1. Shader canvas — with a CSS radial-gradient fallback painted on the
           parent layer. If WebGL fails, the gradient still gives the hero a
           visible EM-field-ish look instead of a pure-black rectangle. */}
      <div className={styles.canvasLayer}>
        <Canvas
          orthographic
          camera={{ position: [0, 0, 1], near: 0.01, far: 10 }}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <FieldPlane onFreqChange={handleFreqChange} scrollProgressRef={scrollProgressRef} />
        </Canvas>
      </div>

      {/* 2. UI overlay */}
      <div className={styles.uiLayer}>
        <div className={styles.topRow}>
          <div ref={systemIdRef} className={styles.systemId}>
            DA — FIELD SYSTEM v2026.04
          </div>
          <div ref={freqBlockRef} className={styles.freqBlock}>
            <div className={styles.freqValue}>{freqDisplay}</div>
            <div className={styles.freqLabel}>Frequency Sweep</div>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <h1 ref={titleRef} className={styles.title}>
            THE
            <br />
            FIELD
          </h1>
          <div ref={scrollHintRef} className={styles.scrollHint}>
            <div>Scroll to Calibrate</div>
            <div className={styles.scrollHintRule} />
          </div>
        </div>
      </div>

      {/* 3. Decorative rails */}
      <div className={styles.bottomRule} aria-hidden="true" />
      <div className={styles.navTrack} aria-hidden="true" />
    </section>
  );
}
