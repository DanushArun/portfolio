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
    const dy = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;
    setScrollVelocity(dy);
  }, [setScrollVelocity]);

  // Wheel drives the entire journey progress (orbit → MIRA_PULSAR).
  // No threshold trigger — progress goes smoothly 0..1 across the flight.
  // Phase changes are derived from progress (HUD only, no canvas swap).
  const onWheel = useCallback((e: WheelEvent) => {
    const cur = useScene.getState().phase;
    // Once we're past MIRA_PULSAR, scroll is owned by ScrollSnap (cosmic scenes)
    if (cur !== 'EVENT_HORIZON' && cur !== 'DESCENT' && cur !== 'MIRA_PULSAR') return;

    wheelAcc.current = Math.max(0, Math.min(JOURNEY_WHEEL_PX, wheelAcc.current + e.deltaY));
    const progress = wheelAcc.current / JOURNEY_WHEEL_PX;
    setHorizonProgress(progress);

    // Update phase based on journey progress (HUD only — no rendering swap)
    let target: ScenePhase = 'EVENT_HORIZON';
    for (const { p, phase: ph } of PHASE_AT) if (progress >= p) target = ph;
    if (target !== cur) useScene.getState().setPhase(target);
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
    const { beginJourney, phase: p } = useScene.getState();
    if (p === 'VOID') beginJourney();
  }, []);

  useAudio();

  // The BH canvas drives everything from VOID through MIRA_PULSAR.
  // It only unmounts when the user moves PAST MIRA_PULSAR into other planets.
  const showBH       = phase === 'VOID' || phase === 'EVENT_HORIZON' ||
                       phase === 'DESCENT' || phase === 'MIRA_PULSAR';
  const showCosmic   = isCosmic(phase);
  const showR3F      = showCosmic && phase !== 'MIRA_PULSAR'; // R3F for post-pulsar scenes only
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
          style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1 }}
        >
          <color attach="background" args={['#000000']} />
          <Suspense fallback={null}>
            <CameraRig />
            {phase === 'DRIVEX_QUASAR'  && <DriveXQuasar />}
            {phase === 'TWIN_BUILD'     && <TwinBuild />}
            {phase === 'FORMULA_RINGS'  && <FormulaRings />}
            {phase === 'QUANTUM_PLANET' && <QuantumPlanet />}
            {phase === 'SINGULARITY'    && <Singularity />}
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
      {showR3F && <ScrollSnap />}
      <AudioToggle />
    </>
  );
}
