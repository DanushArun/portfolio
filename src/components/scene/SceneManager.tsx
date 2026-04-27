'use client';

import { useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScene, isCosmic, type ScenePhase } from '@/lib/scene-state';
import dynamic from 'next/dynamic';
import { useAudio } from '@/hooks/useAudio';
import AudioToggle from '@/components/ui/AudioToggle';

import BlackHoleMount from './BlackHoleMount';
import CameraRig from './CameraRig';
import PostFX from './PostFX';

const VoidPrologue      = dynamic(() => import('./VoidPrologue'), { ssr: false });
const MiraPulsar        = dynamic(() => import('./scenes/MiraPulsar'), { ssr: false });
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
 * ONE SHOT.
 *
 * The Bruno Simon BH canvas owns the entire journey from landing to
 * MIRA_PULSAR. There are no canvas swaps mid-flight. Scroll progress
 * 0..1 drives the camera continuously through:
 *
 *   orbit → BH approach → through BH → wormhole tunnel → emerge → pulsar
 *
 * Phase state is purely a HUD hint — it switches when journey progress
 * crosses thresholds, but does NOT change which canvas is rendered.
 *
 * The R3F canvas only mounts for the OTHER cosmic scenes (DriveX, Twin
 * Build, etc.) which the user reaches by scrolling past MIRA_PULSAR.
 * That swap uses a veil because those scenes don't share world space
 * with the BH/pulsar.
 */

// Total wheel travel for the entire flight from orbit to MIRA_PULSAR.
const JOURNEY_WHEEL_PX = 6500;

// Journey progress thresholds at which we update the phase (HUD only)
const PHASE_AT: { p: number; phase: ScenePhase }[] = [
  { p: 0.00, phase: 'EVENT_HORIZON' },
  { p: 0.32, phase: 'DESCENT'       },
  { p: 0.78, phase: 'MIRA_PULSAR'   },
];

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
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    
    // Set global scroll velocity
    const dy = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;
    setScrollVelocity(dy);

    // Map 0..1 to the 7 stages (0 to 6)
    const continuous = progress * 6;
    const idx = Math.floor(continuous);

    // 0 to 1/6 (0.166) is the BH flight.
    const bhProg = Math.min(1, progress * 6);
    setHorizonProgress(bhProg);

    // Determine discrete phase for overlays
    let newPhase: ScenePhase = 'VOID';
    if (idx === 0) newPhase = bhProg > 0.6 ? 'DESCENT' : 'EVENT_HORIZON';
    else if (idx === 1) newPhase = 'MIRA_PULSAR';
    else if (idx === 2) newPhase = 'DRIVEX_QUASAR';
    else if (idx === 3) newPhase = 'TWIN_BUILD';
    else if (idx === 4) newPhase = 'FORMULA_RINGS';
    else if (idx === 5) newPhase = 'QUANTUM_PLANET';
    else if (idx >= 6)  newPhase = 'SINGULARITY';

    if (newPhase !== useScene.getState().phase) {
      useScene.getState().setPhase(newPhase);
    }
  }, [setScrollVelocity, setHorizonProgress]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll',    onScroll,    { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll',    onScroll);
    };
  }, [onMouseMove, onScroll]);

  useEffect(() => {
    const { beginJourney, phase: p } = useScene.getState();
    if (p === 'VOID') beginJourney();
  }, []);

  useAudio();

  // The BH canvas drives everything from VOID through DESCENT.
  // It unmounts when the user reaches MIRA_PULSAR.
  const showBH       = phase === 'VOID' || phase === 'EVENT_HORIZON' || phase === 'DESCENT';
  const showCosmic   = isCosmic(phase);
  const showR3F      = showCosmic; // R3F for all cosmic scenes including pulsar
  const atPulsar     = phase === 'MIRA_PULSAR';

  return (
    <>
      {/* The BH canvas is the entire one-shot — landing through MIRA_PULSAR. */}
      {showBH && (
        <BlackHoleMount
          zIndex={1}
          innerColor="#ffc066"
          outerColor="#5a1a08"
          progress={horizonProgress}
        />
      )}

      {/* R3F canvas — only for post-MIRA_PULSAR cosmic scenes. */}
      {showR3F && (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 2, 30], fov: 50, near: 0.01, far: 2000 }}
          style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 1 }}
        >
          <Suspense fallback={null}>
            <CameraRig />
            <group position={[0, 0, 0]}><MiraPulsar /></group>
            <group position={[0, 0, -90]}><DriveXQuasar /></group>
            <group position={[0, 0, -180]}><TwinBuild /></group>
            <group position={[0, 0, -270]}><FormulaRings /></group>
            <group position={[0, 0, -360]}><QuantumPlanet /></group>
            <group position={[0, 0, -450]}><Singularity /></group>
            <PostFX />
          </Suspense>
        </Canvas>
      )}

      {/* Veil — only used at the BH→R3F handoff (post-MIRA_PULSAR). */}
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

      {showCosmic && <GravityCursor />}
      <HUD />
      {phase === 'VOID' && <VoidPrologue />}
      {atPulsar         && <MiraPulsarOverlay />}
      <DriveXQuasarOverlay />
      <TwinBuildOverlay />
      <div style={{ height: '700vh', width: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: -1 }} />
      <AudioToggle />
    </>
  );
}
