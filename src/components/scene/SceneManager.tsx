'use client';

import { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { useScene, isCosmic, isBlackHoleCanvas, isR3FCanvas } from '@/lib/scene-state';
import dynamic from 'next/dynamic';

import ScrollOrchestrator from './ScrollOrchestrator';
import BlackHoleMount from './BlackHoleMount';
import CameraRig from './CameraRig';
import PostFX from './PostFX';

// New high-fidelity R3F components
const WarpScene = dynamic(() => import('./scenes/WarpScene'), { ssr: false });
const MiraScene = dynamic(() => import('./scenes/MiraScene'), { ssr: false });
const StarField = dynamic(() => import('./StarField'), { ssr: false });

import HUD from '@/components/hud/HUD';
import VoidPrologue from './VoidPrologue';

import { useKeyboardNavigation } from '@/lib/scene-state/keyboard-adapter';
import WorkDashboard from '@/components/work/WorkDashboard';
import { isPortfolioChapterPhase } from '@/lib/portfolio-book';

export default function SceneManager() {
  const phase           = useScene((s) => s.phase);
  const veil            = useScene((s) => s.veil);
  const cosmicProgress  = useScene((s) => s.cosmicProgress);
  const local           = useScene((s) => s.localProgress);
  const pathname        = usePathname();
  const isHome          = pathname === '/';

  useEffect(() => {
    if (!isHome) return;
    const { beginJourney, phase: p } = useScene.getState();
    if (p === 'C01_ORBIT') beginJourney();
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;
    if (isCosmic(phase)) useScene.setState({ veil: 0 });
  }, [isHome, phase]);

  useKeyboardNavigation();

  if (!isHome) return null;

  const showBH    = isBlackHoleCanvas(phase);
  // R3F canvas covers C05+ — WarpScene renders during C05_WARP and C06_ANOMALY.
  const showR3F   = isR3FCanvas(phase);
  // BH canvas only renders during C01..C04. By C05 the user is engulfed and
  // the warp scene takes over — no fading needed since the BH canvas isn't
  // even mounted.
  const bhAlpha   = showBH ? 1 : 0;

  // Journey remapping.
  // Fall-in darkness.
  // Pure screen-space black overlay that ramps in during C04 (the user is
  // being engulfed by the singularity — the BH renderer alone can't deliver
  // "darkness fills frame" because it's designed for outside-the-BH views).
  // C04: 0 → 0.96 (the user is engulfed). C05: hold full black briefly so the
  // engulfment registers, then clear so the user sees the warp drive engage at
  // its slow start and accelerate. The acceleration curve in WarpScene.tsx
  // peaks late (combined cp 0.85), so the darkness needs to be GONE early
  // — otherwise the visible part of the warp is just black.
  const fallDarkness = (() => {
    if (phase === 'C04_HORIZON') return Math.min(0.96, local * 1.1);
    if (phase === 'C05_WARP') {
      if (local < 0.01) return 0.96;
      if (local < 0.05) return 0.96 * (1 - (local - 0.01) / 0.04);
      return 0;
    }
    return 0;
  })();
  // Warp-end white flash.
  // The flash now spans ~2× its prior scroll window so the user has to keep
  // scrolling to escape it — exiting the warp should feel like coming OUT of
  // something dense, not a quick blink.
  //
  //   C06 local 0.78 → 1.0  : ramp 0 → 1   (longer ramp-in as warp decelerates)
  //   C07 local 0    → 0.45 : hold 1       (sustained white — scroll to escape)
  //   C07 local 0.45 → 0.90 : fade 1 → 0   (slow reveal of the empty universe)
  //
  // Pure CSS overlay — bloom alone can't reliably hit pure white at every
  // viewport size, and a DOM overlay also covers the post-FX seam during the
  // canvas swap from R3F → next-phase canvas.
  const warpFlash = (() => {
    if (phase === 'C06_ANOMALY' && local > 0.78) {
      return Math.min(1, (local - 0.78) / 0.22);
    }
    if (phase === 'C07_TRANSITION') {
      if (local < 0.45) return 1;
      if (local < 0.90) return 1 - (local - 0.45) / 0.45;
      return 0;
    }
    return 0;
  })();

  let bhProgress = cosmicProgress;

  if (phase === 'C04_HORIZON') {
    // Map HORIZON (local 0..1) to internal Phase B (0.55..0.65) — the plunge
    // through the singularity. By end of C04 the camera is past the origin
    // and the disc has scaled to 0; the BH canvas is then unmounted and
    // WarpScene takes over.
    bhProgress = 0.55 + local * 0.10;
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
            {/* StarField hidden during the warp — its background stars at z=400
                read as motionless distant pinpricks against the bursting warp
                particles, which breaks the "moving fast" illusion. */}
            {phase !== 'C05_WARP' && phase !== 'C06_ANOMALY' && <StarField />}
            {(phase === 'C05_WARP' || phase === 'C06_ANOMALY') && <WarpScene />}
            {/* Supercluster reveal: active from post-flash emergence through
                the full W01-W07 portfolio route. Project information is
                carried by the canvas particle field, not a DOM overlay. */}
            {(phase === 'C07_TRANSITION' || phase === 'C08_EMERGE'
              || phase === 'C09_PROJECT' || isPortfolioChapterPhase(phase)) && <MiraScene />}
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

      {/* Warp-end white flash — peaks at end of C06, holds through C07 onset,
          then fades. The "we just landed in a new universe" punctuation. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          background: '#ffffff',
          opacity: warpFlash,
          pointerEvents: 'none',
          zIndex: 4,
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
      <VoidPrologue />
      <div
        aria-hidden
        style={{
          height: '5200vh',
          width: '100%',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </>
  );
}
