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

const QuantumPlanet     = dynamic(() => import('./scenes/QuantumPlanet'), { ssr: false });
const MiraPulsar        = dynamic(() => import('./scenes/MiraPulsar'), { ssr: false });
const DriveXQuasar      = dynamic(() => import('./scenes/DriveXQuasar'), { ssr: false });
const TwinBuild         = dynamic(() => import('./scenes/TwinBuild'), { ssr: false });
const FormulaRings      = dynamic(() => import('./scenes/FormulaRings'),  { ssr: false });
const Singularity       = dynamic(() => import('./scenes/Singularity'),   { ssr: false });

import HUD from './HUD';
import GravityCursor from './GravityCursor';
import Overlays from './Overlays';
import VoidPrologue from './VoidPrologue';

export default function SceneManager() {
  const phase           = useScene((s) => s.phase);
  const veil            = useScene((s) => s.veil);
  const horizonProgress = useScene((s) => s.horizonProgress);
  const setMouse = useScene((s) => s.setMouse);

  const lastScrollY    = useRef(0);
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

  const onScroll = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;

    const dy = window.scrollY - lastScrollY.current;
    lastScrollY.current = window.scrollY;

    const continuous = progress * 9;
    const idx = Math.floor(continuous);
    const bhProg = Math.min(1, progress * 3);

    let newPhase: ScenePhase = 'COVER';
    if (idx === 0) newPhase = 'COVER';
    else if (idx === 1) newPhase = 'APPROACH';
    else if (idx === 2) newPhase = 'CROSSING';
    else if (idx === 3) newPhase = 'BOSON_STAR';
    else if (idx === 4) newPhase = 'STRANGEON';
    else if (idx === 5) newPhase = 'BINARY_MERGER';
    else if (idx === 6) newPhase = 'EINSTEIN_CROSS';
    else if (idx === 7) newPhase = 'HAUMEA';
    else if (idx === 8) newPhase = 'MANIFEST';
    else if (idx >= 9)  newPhase = 'CYGNUS_LOOP';

    // Batch all scroll-derived state into a single zustand set call
    useScene.setState((s) => ({
      scrollVelocity:  dy,
      horizonProgress: bhProg,
      ...(newPhase !== s.phase ? { phase: newPhase, phaseStart: performance.now() } : {}),
    }));
  }, []);

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
    if (p === 'COVER') beginJourney();
  }, []);

  useAudio();

  // The BH canvas drives everything from COVER through CROSSING.
  const showBH       = phase === 'COVER' || phase === 'APPROACH' || phase === 'CROSSING';
  const showCosmic   = isCosmic(phase);
  const showR3F      = showCosmic;

  return (
    <>
      {showBH && (
        <BlackHoleMount
          zIndex={1}
          innerColor="#ffc066"
          outerColor="#5a1a08"
          progress={horizonProgress}
        />
      )}

      {showR3F && (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 2, 30], fov: 50, near: 0.01, far: 2000 }}
          style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 1 }}
        >
          <Suspense fallback={null}>
            <CameraRig />
            <group position={[0, 0, 0]}><QuantumPlanet /></group>
            <group position={[0, 0, -90]}><MiraPulsar /></group>
            <group position={[0, 0, -180]}><DriveXQuasar /></group>
            <group position={[0, 0, -270]}><TwinBuild /></group>
            <group position={[0, 0, -360]}><FormulaRings /></group>
            {/* MANIFEST AT -450 HAS NO R3F SCENE */}
            <group position={[0, 0, -540]}><Singularity /></group>
            <PostFX />
          </Suspense>
        </Canvas>
      )}

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

      {showCosmic && <GravityCursor />}
      <HUD />
      <Overlays />
      <VoidPrologue />
      <div style={{ height: '1000vh', width: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: -1 }} />
      <AudioToggle />
    </>
  );
}
