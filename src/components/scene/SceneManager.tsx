'use client';

import { useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScene, isCosmic } from '@/lib/scene-state';
import dynamic from 'next/dynamic';

import BlackHoleMount from './BlackHoleMount';
import CameraRig from './CameraRig';

const VoidPrologue      = dynamic(() => import('./VoidPrologue'), { ssr: false });
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
 * ONE CONTINUOUS SHOT — no canvas swaps, no cut scenes.
 *
 * The Bruno Simon BH canvas IS the entire entry experience.
 * Scroll accumulates and drives the camera from the starting orbit
 * all the way into the event horizon interior — through the accretion
 * disk, through the photon sphere, into total darkness.
 *
 * Canvas lifecycle:
 *   VOID / EVENT_HORIZON / DESCENT  → BH canvas (same canvas the whole time)
 *   DESCENT ends after 1.2s         → veil covers swap, MIRA_PULSAR mounts
 *   MIRA_PULSAR … SINGULARITY       → R3F canvas (cosmic scenes)
 *
 * The DESCENT phase is just the 1.2s pause inside the BH darkness before
 * MIRA_PULSAR. The camera is already at 0.1 units (inside event horizon,
 * total darkness) when DESCENT fires — the BH canvas shows nothing but black.
 * The veil is therefore invisible anyway. Clean.
 */

// Total wheel travel (px) to fly from orbit → event horizon interior.
// Large enough that the journey feels like a real traversal, not a trigger.
const WHEEL_THRESHOLD = 4800;

const isBHPhase = (p: string) =>
  p === 'VOID' || p === 'EVENT_HORIZON' || p === 'DESCENT';

export default function SceneManager() {
  const phase           = useScene((s) => s.phase);
  const veil            = useScene((s) => s.veil);
  const horizonProgress = useScene((s) => s.horizonProgress);
  const setMouse           = useScene((s) => s.setMouse);
  const setScrollVelocity  = useScene((s) => s.setScrollVelocity);
  const setHorizonProgress = useScene((s) => s.setHorizonProgress);

  const lastScrollY = useRef(0);
  const wheelAcc    = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    setMouse(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1),
    );
  }, [setMouse]);

  const onScroll = useCallback(() => {
    const dy = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;
    setScrollVelocity(dy);
  }, [setScrollVelocity]);

  // Scroll drives the camera all the way into the BH — continuously, like a
  // video game. DESCENT only fires when the user has scrolled all the way in
  // (camera is inside the event horizon, screen is already black).
  const onWheel = useCallback((e: WheelEvent) => {
    if (useScene.getState().phase !== 'EVENT_HORIZON') return;
    wheelAcc.current = Math.min(WHEEL_THRESHOLD, wheelAcc.current + Math.max(0, e.deltaY));
    const progress = wheelAcc.current / WHEEL_THRESHOLD;
    setHorizonProgress(progress);
    if (progress >= 1) {
      wheelAcc.current = 0;
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

  useEffect(() => {
    if (phase !== 'EVENT_HORIZON') wheelAcc.current = 0;
  }, [phase]);

  useEffect(() => {
    const { beginJourney, phase: p } = useScene.getState();
    if (p === 'VOID') beginJourney();
  }, []);

  // DESCENT: camera is already inside (screen black). Wait 1.2s then swap.
  // The veil is just insurance — the screen is visually already black.
  useEffect(() => {
    if (phase !== 'DESCENT') return;
    const cover = setTimeout(() => useScene.getState().setVeil(1), 1000);
    const swap  = setTimeout(() => useScene.getState().setPhase('MIRA_PULSAR'), 1200);
    return () => { clearTimeout(cover); clearTimeout(swap); };
  }, [phase]);

  // After MIRA_PULSAR canvas mounts, fade the veil away.
  useEffect(() => {
    if (phase !== 'MIRA_PULSAR') return;
    const t = setTimeout(() => useScene.getState().setVeil(0), 300);
    return () => clearTimeout(t);
  }, [phase]);

  const showBH     = isBHPhase(phase);
  const showCosmic = isCosmic(phase);

  return (
    <>
      {/* ── Bruno Simon BH canvas — the entire entry experience ── */}
      {showBH && (
        <BlackHoleMount
          zIndex={1}
          innerColor="#ffc066"
          outerColor="#5a1a08"
          // During EVENT_HORIZON: scroll drives progress 0→1 (full journey in).
          // During DESCENT: locked at 1 (camera inside, screen black).
          progress={phase === 'EVENT_HORIZON' ? horizonProgress : phase === 'DESCENT' ? 1 : 0}
        />
      )}

      {/* ── R3F canvas — cosmic scenes only (mounts after BH journey ends) ── */}
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

      {/* Veil — only active at the final BH→cosmic canvas swap.
          Since the BH interior is already black at that point,
          the veil is invisible and just ensures a clean swap. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          background: '#000',
          opacity: veil,
          transition: veil === 0 ? 'opacity 1.0s cubic-bezier(0.16,1,0.3,1)' : 'none',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />

      {/* ── DOM overlays ── */}
      {showCosmic && <GravityCursor />}
      <HUD />
      {phase === 'VOID'         && <VoidPrologue />}
      {phase === 'MIRA_PULSAR'  && <MiraPulsarOverlay />}
      <DriveXQuasarOverlay />
      <TwinBuildOverlay />
      {showCosmic               && <ScrollSnap />}
    </>
  );
}
