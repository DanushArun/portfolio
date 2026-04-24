'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useScene, isCosmic } from '@/lib/scene-state';
import dynamic from 'next/dynamic';

// Three.js components (inside Canvas)
import BlackHole from './BlackHole';
import PostFX from './PostFX';
import CameraRig from './CameraRig';

// DOM overlays (outside Canvas)
const VoidPrologue = dynamic(() => import('./VoidPrologue'), { ssr: false });
const Descent      = dynamic(() => import('./Descent'),      { ssr: false });
const MiraPulsar     = dynamic(() => import('./scenes/MiraPulsar'),    { ssr: false });
const DriveXQuasar   = dynamic(() => import('./scenes/DriveXQuasar'),  { ssr: false });
const DriveXQuasarOverlay = dynamic(
  () => import('./scenes/DriveXQuasar').then((m) => ({ default: m.DriveXQuasarOverlay })),
  { ssr: false },
);
const TwinBuild      = dynamic(() => import('./scenes/TwinBuild'),     { ssr: false });
const TwinBuildOverlay = dynamic(
  () => import('./scenes/TwinBuild').then((m) => ({ default: m.TwinBuildOverlay })),
  { ssr: false },
);
const FormulaRings   = dynamic(() => import('./scenes/FormulaRings'),  { ssr: false });
const QuantumPlanet  = dynamic(() => import('./scenes/QuantumPlanet'), { ssr: false });
const Singularity    = dynamic(() => import('./scenes/Singularity'),   { ssr: false });

import HUD from './HUD';
import GravityCursor from './GravityCursor';
import ScrollSnap from './ScrollSnap';

/**
 * Root cinematic orchestrator.
 *
 * Phases VOID → EVENT_HORIZON → DESCENT: autonomous, linear, non-interactive.
 * Phases MIRA_PULSAR → SINGULARITY: scroll-snap, one scene at a time.
 *
 * Mouse tracking is active only during EVENT_HORIZON — fed into the BH shader
 * so mouse position warps the spacetime geometry (disk tilt + Doppler beaming).
 */
export default function SceneManager() {
  const phase = useScene((s) => s.phase);
  const setMouse = useScene((s) => s.setMouse);
  const lastScrollY = useRef(0);
  const setScrollVelocity = useScene((s) => s.setScrollVelocity);

  // Global mouse tracking — only meaningful in EVENT_HORIZON but cheap everywhere
  const onMouseMove = useCallback((e: MouseEvent) => {
    // Normalize to -1..1
    const x = (e.clientX / window.innerWidth)  * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMouse(x, -y); // flip Y so up = positive
  }, [setMouse]);

  // Scroll velocity tracking for FORMULA_RINGS ring speed
  const onScroll = useCallback(() => {
    const dy = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;
    setScrollVelocity(dy);
    // Decay to zero next frame handled in FormulaRings
  }, [setScrollVelocity]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll',    onScroll,    { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll',    onScroll);
    };
  }, [onMouseMove, onScroll]);

  // Auto-start: VOID kicks off immediately on mount
  useEffect(() => {
    const { beginJourney, phase: p } = useScene.getState();
    if (p === 'VOID') beginJourney();
  }, []);

  return (
    <>
      {/* ── WebGL canvas — always mounted ── */}
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 2, 30], fov: 50, near: 0.01, far: 2000 }}
        style={{ position: 'fixed', inset: 0, background: '#000' }}
      >
        <color attach="background" args={['#000000']} />

        <Suspense fallback={null}>
          <CameraRig />

          {/* ── VOID: procedural star crystallization happens in VoidPrologue (DOM + shader) ── */}

          {/* ── EVENT_HORIZON + VOID end: black hole renders ── */}
          {(phase === 'VOID' || phase === 'EVENT_HORIZON') && <BlackHole />}

          {/* ── Cosmic scenes: one at a time ── */}
          {phase === 'MIRA_PULSAR'    && <MiraPulsar />}
          {phase === 'DRIVEX_QUASAR'  && <DriveXQuasar />}
          {phase === 'TWIN_BUILD'     && <TwinBuild />}
          {phase === 'FORMULA_RINGS'  && <FormulaRings />}
          {phase === 'QUANTUM_PLANET' && <QuantumPlanet />}
          {phase === 'SINGULARITY'    && <Singularity />}

          <PostFX />
        </Suspense>
      </Canvas>

      {/* ── DOM overlays ── */}
      <GravityCursor />
      <HUD />
      {phase === 'VOID'    && <VoidPrologue />}
      {phase === 'DESCENT' && <Descent />}
      <DriveXQuasarOverlay />
      <TwinBuildOverlay />
      {isCosmic(phase)     && <ScrollSnap />}
    </>
  );
}
