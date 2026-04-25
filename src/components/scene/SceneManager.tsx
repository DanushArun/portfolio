'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useScene, isCosmic } from '@/lib/scene-state';
import dynamic from 'next/dynamic';

import BlackHoleMount from './BlackHoleMount';
import CameraRig from './CameraRig';

const VoidPrologue      = dynamic(() => import('./VoidPrologue'), { ssr: false });
const Descent           = dynamic(() => import('./Descent'),      { ssr: false });
const MiraPulsar        = dynamic(() => import('./scenes/MiraPulsar'),    { ssr: false });
const MiraPulsarOverlay = dynamic(
  () => import('./scenes/MiraPulsar').then((m) => ({ default: m.MiraPulsarOverlay })),
  { ssr: false },
);
const DriveXQuasar        = dynamic(() => import('./scenes/DriveXQuasar'), { ssr: false });
const DriveXQuasarOverlay = dynamic(
  () => import('./scenes/DriveXQuasar').then((m) => ({ default: m.DriveXQuasarOverlay })),
  { ssr: false },
);
const TwinBuild        = dynamic(() => import('./scenes/TwinBuild'), { ssr: false });
const TwinBuildOverlay = dynamic(
  () => import('./scenes/TwinBuild').then((m) => ({ default: m.TwinBuildOverlay })),
  { ssr: false },
);
const FormulaRings  = dynamic(() => import('./scenes/FormulaRings'),  { ssr: false });
const QuantumPlanet = dynamic(() => import('./scenes/QuantumPlanet'), { ssr: false });
const Singularity   = dynamic(() => import('./scenes/Singularity'),   { ssr: false });

import HUD from './HUD';
import GravityCursor from './GravityCursor';
import ScrollSnap from './ScrollSnap';

/**
 * Root cinematic orchestrator.
 *
 *   VOID / EVENT_HORIZON / DESCENT  → vanilla Bruno Simon black hole canvas
 *   MIRA_PULSAR ... SINGULARITY     → R3F Canvas with the cosmic-scene component
 *
 * EVENT_HORIZON scroll mechanic: wheel events accumulate to WHEEL_THRESHOLD
 * before triggering DESCENT. This bypasses the OrbitControls / window.scrollY
 * conflict — OrbitControls intercepts wheel for (disabled) zoom but we read
 * raw deltaY directly from the event, independent of window.scrollY.
 */

const isBlackHolePhase = (p: string) =>
  p === 'VOID' || p === 'EVENT_HORIZON' || p === 'DESCENT';

// Cumulative wheel travel (px) the user must scroll to enter the BH.
const WHEEL_THRESHOLD = 900;

export default function SceneManager() {
  const phase           = useScene((s) => s.phase);
  const veil            = useScene((s) => s.veil);
  const horizonProgress = useScene((s) => s.horizonProgress);
  const setMouse           = useScene((s) => s.setMouse);
  const setScrollVelocity  = useScene((s) => s.setScrollVelocity);
  const setHorizonProgress = useScene((s) => s.setHorizonProgress);

  const lastScrollY  = useRef(0);
  const wheelAcc     = useRef(0); // running wheel delta for EVENT_HORIZON entry

  const onMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth)  * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMouse(x, -y);
  }, [setMouse]);

  // Scroll velocity — used by FORMULA_RINGS ring speed and ScrollSnap
  const onScroll = useCallback(() => {
    const dy = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;
    setScrollVelocity(dy);
  }, [setScrollVelocity]);

  // Wheel-based EVENT_HORIZON → DESCENT entry (independent of window.scrollY).
  // OrbitControls captures the canvas's wheel events for zoom (which is disabled)
  // but the event still bubbles to window, so raw deltaY is always available here.
  const onWheel = useCallback((e: WheelEvent) => {
    const { phase: p } = useScene.getState();
    if (p !== 'EVENT_HORIZON') return;

    // Only count downward scroll — once the user commits to entering, no going back.
    wheelAcc.current = Math.min(WHEEL_THRESHOLD, wheelAcc.current + Math.max(0, e.deltaY));
    const progress = Math.min(1, wheelAcc.current / WHEEL_THRESHOLD);
    setHorizonProgress(progress);

    if (progress >= 1) {
      wheelAcc.current = 0;
      setHorizonProgress(0);
      useScene.getState().setPhase('DESCENT');
    }
  }, [setHorizonProgress]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll',    onScroll,    { passive: true });
    window.addEventListener('wheel',     onWheel,     { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll',    onScroll);
      window.removeEventListener('wheel',     onWheel);
    };
  }, [onMouseMove, onScroll, onWheel]);

  // Reset wheel accumulator when leaving EVENT_HORIZON so a back-navigation
  // doesn't carry stale progress into the next visit.
  useEffect(() => {
    if (phase !== 'EVENT_HORIZON') {
      wheelAcc.current = 0;
    }
  }, [phase]);

  // Auto-start: VOID kicks off immediately on mount
  useEffect(() => {
    const { beginJourney, phase: p } = useScene.getState();
    if (p === 'VOID') beginJourney();
  }, []);

  // After the BH→cosmic canvas swap, fade the veil out to reveal the new scene.
  // 200ms gives the R3F Canvas time to mount and begin its first render.
  useEffect(() => {
    if (phase !== 'MIRA_PULSAR') return;
    const timer = setTimeout(() => {
      useScene.getState().setVeil(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [phase]);

  const showBlackHole = isBlackHolePhase(phase);
  const showCosmic    = isCosmic(phase);

  return (
    <>
      {showBlackHole && (
        <BlackHoleMount
          zIndex={1}
          innerColor="#ffc066"
          outerColor="#5a1a08"
          progress={phase === 'EVENT_HORIZON' ? horizonProgress : 0}
        />
      )}

      {showCosmic && (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 2, 30], fov: 50, near: 0.01, far: 2000 }}
          style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1 }}
        >
          <color attach="background" args={['#000000']} />
          <Suspense fallback={null}>
            <CameraRig />
            {phase === 'MIRA_PULSAR'    && <MiraPulsar />}
            {phase === 'DRIVEX_QUASAR'  && <DriveXQuasar />}
            {phase === 'TWIN_BUILD'     && <TwinBuild />}
            {phase === 'FORMULA_RINGS'  && <FormulaRings />}
            {phase === 'QUANTUM_PLANET' && <QuantumPlanet />}
            {phase === 'SINGULARITY'    && <Singularity />}
          </Suspense>
        </Canvas>
      )}

      {/* Cross-canvas transition veil.
          Descent snaps it to 1 (instant, covered by its own overlays) just before
          the BH canvas unmounts and the R3F canvas mounts. SceneManager then
          fades it back to 0 over 1.2s, giving a cinematic reveal of the new scene.
          z:25 — above canvas (z:1) + vignette (z:9), below Descent overlays (z:30/31)
          so the amber ball remains visible during stage 4 expansion. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          background: '#000',
          opacity: veil,
          transition: veil === 0 ? 'opacity 1.2s cubic-bezier(0.16,1,0.3,1)' : 'none',
          pointerEvents: 'none',
          zIndex: 25,
        }}
      />

      {showCosmic && <GravityCursor />}
      <HUD />
      {phase === 'VOID'         && <VoidPrologue />}
      {phase === 'DESCENT'      && <Descent />}
      {phase === 'MIRA_PULSAR'  && <MiraPulsarOverlay />}
      <DriveXQuasarOverlay />
      <TwinBuildOverlay />
      {showCosmic               && <ScrollSnap />}
    </>
  );
}
