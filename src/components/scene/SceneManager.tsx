'use client';

import { useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScene, isCosmic, isBlackHoleCanvas, isR3FCanvas } from '@/lib/scene-state';
import dynamic from 'next/dynamic';
import { useAudio } from '@/hooks/useAudio';
import AudioToggle from '@/components/ui/AudioToggle';

import ScrollOrchestrator from './ScrollOrchestrator';
import BlackHoleMount from './BlackHoleMount';
import CameraRig from './CameraRig';
import PostFX from './PostFX';

// New high-fidelity R3F components
const WarpScene             = dynamic(() => import('./scenes/WarpScene'),             { ssr: false });
const AnomalyGlitch         = dynamic(() => import('./scenes/AnomalyGlitch'),         { ssr: false });
const TransitionConvergence = dynamic(() => import('./scenes/TransitionConvergence'), { ssr: false });
const EmergeSystem          = dynamic(() => import('./scenes/EmergeSystem'),          { ssr: false });
const StarField             = dynamic(() => import('./StarField'),                    { ssr: false });

import HUD from '@/components/hud/HUD';
import VoidPrologue from './VoidPrologue';
import GravityCursor from './GravityCursor';
import { useKeyboardNavigation } from '@/lib/scene-state/keyboard-adapter';
import WorkDashboard from '@/components/work/WorkDashboard';

export default function SceneManager() {
  const phase           = useScene((s) => s.phase);
  const veil            = useScene((s) => s.veil);
  const cosmicProgress  = useScene((s) => s.cosmicProgress);
  const setMouse = useScene((s) => s.setMouse);

  const mousePending   = useRef(false);
  const pendingMouseX  = useRef(0);
  const pendingMouseY  = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    pendingMouseX.current = (e.clientX / window.innerWidth) * 2 - 1;
    pendingMouseY.current = -((e.clientY / window.innerHeight) * 2 - 1);
    if (!mousePending.current) {
      mousePending.current = true;
      requestAnimationFrame(() => {
        setMouse(pendingMouseX.current, pendingMouseY.current);
        mousePending.current = false;
      });
    }
  }, [setMouse]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [onMouseMove]);

  useEffect(() => {
    const { beginJourney, phase: p } = useScene.getState();
    if (p === 'C01_ORBIT') beginJourney();
  }, []);

  useEffect(() => {
    if (isCosmic(phase)) useScene.setState({ veil: 0 });
  }, [phase]);

  useAudio();
  useKeyboardNavigation();

  const showBH    = isBlackHoleCanvas(phase);
  const showR3F   = isR3FCanvas(phase) || phase === 'C05_WARP';  // overlap during WARP
  // BH canvas fades out FAST at start of C05 so the user doesn't see
  // the BH camera flying in -z (which reads as "retreating from the BH"
  // behind the warp). After fade, only the WarpScene renders → warp streaks.
  const bhAlpha   = phase === 'C05_WARP'
    ? Math.max(0, 1 - useScene.getState().localProgress * 8)
    : (showBH ? 1 : 0);

  // ── Journey Remapping ──────────────────────────────────────────────────────
  const local = useScene((s) => s.localProgress);

  // ── Fall-in darkness ───────────────────────────────────────────────────────
  // Pure screen-space black overlay that ramps in during C04 (the user is
  // being engulfed by the singularity — the BH renderer alone can't deliver
  // "darkness fills frame" because it's designed for outside-the-BH views).
  // C04: 0 → 0.96. C05: 0.96 → 0 (warp streaks emerge from the dark).
  const fallDarkness = (() => {
    if (phase === 'C04_HORIZON') return Math.min(0.96, local * 1.1);
    if (phase === 'C05_WARP') {
      if (local < 0.15) return 0.96;
      if (local < 0.55) return 0.96 * (1 - (local - 0.15) / 0.40);
      return 0;
    }
    return 0;
  })();
  let bhProgress = cosmicProgress;
  let bhIntensity = 1.0;

  if (phase === 'C04_HORIZON') {
    // Map HORIZON (local 0..1) to internal Phase B (0.55..0.65)
    bhProgress = 0.55 + local * 0.10;
    // Intensity spike at the crossing (white-flash)
    bhIntensity = 1.0 + local * 0.6;
  } else if (phase === 'C05_WARP') {
    // Map WARP (local 0..1) to internal Phase C/D (0.65..0.90)
    bhProgress = 0.65 + local * 0.25;
  } else if (isBlackHoleCanvas(phase) && cosmicProgress < 0.4) {
    // Scale C01..C03 to fit in the 0.00..0.55 approach window
    bhProgress = (cosmicProgress / 0.4) * 0.55;
  }

  return (
    <>
      {showBH && (
        <div
          aria-hidden
          style={{
            position: 'fixed', inset: 0, zIndex: 1,
            opacity: bhAlpha,
            transition: bhAlpha === 1 ? 'none' : 'opacity 80ms linear',
            pointerEvents: bhAlpha < 0.05 ? 'none' : 'auto',
          }}
        >
          <BlackHoleMount
            innerColor="#ffc066"
            outerColor="#5a1a08"
            progress={bhProgress}
          />
        </div>
      )}

      {showR3F && (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 30], fov: 50, near: 0.01, far: 2000 }}
          style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 2 }}
        >
          <Suspense fallback={null}>
            <CameraRig />
            <StarField />
            {phase === 'C05_WARP' && <WarpScene />}
            {(phase === 'C06_ANOMALY' || phase === 'C07_TRANSITION') && <AnomalyGlitch />}
            {phase === 'C07_TRANSITION' && <TransitionConvergence />}
            {(phase === 'C08_EMERGE' || phase === 'C09_PROJECT') && <EmergeSystem />}
            <PostFX />
          </Suspense>
        </Canvas>
      )}

      {/* Fall-in darkness — the user being engulfed by the singularity at C04 → C05. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          background: '#000',
          opacity: fallDarkness,
          pointerEvents: 'none',
          zIndex: 3,  // Above BH canvas (1) and R3F canvas (2); below HUD (50).
        }}
      />

      {/* Veil — only used at the BH→R3F handoff (post-CROSSING). */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          background: '#000',
          opacity: veil,
          transition: veil === 0 ? 'opacity 0.9s cubic-bezier(0.16,1,0.3,1)' : 'none',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />

      <ScrollOrchestrator />
      <WorkDashboard />
      <HUD />
      <GravityCursor />
      <VoidPrologue />
      <div
        aria-hidden
        style={{
          height: '1500vh',
          width: '100%',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      <AudioToggle />
    </>
  );
}
