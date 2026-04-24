'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import BlackHole from './BlackHole';
import VoidTransit from './VoidTransit';
import Universe from './Universe';
import CameraRig from './CameraRig';
import PostFX from './PostFX';
import HUD from './HUD';
import ScrollDriver from './ScrollDriver';
import FinalContact from './FinalContact';
import { useScene } from '@/lib/scene-state';

/**
 * The root cinematic orchestrator.
 * Mounts phase-specific scenes conditionally while keeping the black hole
 * alive through THRESHOLD (for gravitational capture visuals).
 */
export default function SceneManager() {
  const phase = useScene((s) => s.phase);

  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 2, 30], fov: 50, near: 0.01, far: 2000 }}
        style={{ position: 'fixed', inset: 0, background: '#000' }}
      >
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          <CameraRig />

          {/* Black hole lives through IDLE + THRESHOLD */}
          {(phase === 'IDLE' || phase === 'THRESHOLD') && <BlackHole />}

          {/* Void transit */}
          {(phase === 'VOID' || phase === 'EMERGENCE') && <VoidTransit />}

          {/* Universe with celestial bodies */}
          {(phase === 'EMERGENCE' || phase === 'UNIVERSE' || phase === 'ASSEMBLY' || phase === 'FINAL') && (
            <Universe />
          )}

          <PostFX />
        </Suspense>
      </Canvas>

      {/* DOM overlays */}
      <HUD />
      <ScrollDriver />
      <FinalContact />
    </>
  );
}
