'use client';

import { useEffect, useRef } from 'react';
import { useScene, type ScenePhase } from '@/lib/scene-state';

/**
 * Scroll-driven phase controller for the post-emergence journey.
 *
 * Scroll ranges (of total scrollable distance):
 *   [0.00, 0.33)  → UNIVERSE    — drives `universeScroll` 0..1
 *   [0.33, 0.66)  → ASSEMBLY    — drives `assemblyProgress` 0..1
 *   [0.66, 1.00]  → FINAL       — contact constellation visible
 *
 * The page is only scrollable once the user has emerged into UNIVERSE.
 * During IDLE / THRESHOLD / VOID / EMERGENCE the spacer is unmounted and
 * scroll is pinned to 0, so the cinematic opening cannot be spoiled.
 */

// Phases during which scroll drives the scene.
const DRIVEN: ReadonlySet<ScenePhase> = new Set<ScenePhase>([
  'UNIVERSE',
  'ASSEMBLY',
  'FINAL',
]);

// Scroll-range boundaries. Centralised so they stay in sync between the
// RAF loop and anyone reading them elsewhere (e.g. future HUD readouts).
const UNIVERSE_END = 0.33;
const ASSEMBLY_END = 0.66;

export default function ScrollDriver() {
  const phase = useScene((s) => s.phase);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Pre-universe phases: pin scroll to the top and do not run the RAF.
    // `scrollTo` is only invoked when we need it (avoid clobbering user intent).
    if (!DRIVEN.has(phase)) {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
      return;
    }

    // RAF loop reads state via getState() so the loop body never closes over
    // stale selectors. This keeps the effect deps tiny (just `phase`) while
    // still dispatching the latest store setters every frame.
    const loop = () => {
      const store = useScene.getState();
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? window.scrollY / max : 0;

      if (t < UNIVERSE_END) {
        // UNIVERSE region: interpolate universeScroll 0..1 linearly.
        const u = t / UNIVERSE_END;
        if (store.universeScroll !== u) store.setUniverseScroll(u);
        if (store.assemblyProgress !== 0) store.setAssemblyProgress(0);
        if (store.phase !== 'UNIVERSE') store.setPhase('UNIVERSE');
      } else if (t < ASSEMBLY_END) {
        // ASSEMBLY region: universeScroll pinned at 1, assembly 0..1.
        const a = (t - UNIVERSE_END) / (ASSEMBLY_END - UNIVERSE_END);
        if (store.universeScroll !== 1) store.setUniverseScroll(1);
        if (store.assemblyProgress !== a) store.setAssemblyProgress(a);
        if (store.phase !== 'ASSEMBLY') store.setPhase('ASSEMBLY');
      } else {
        // FINAL region: both progress values locked at 1.
        if (store.universeScroll !== 1) store.setUniverseScroll(1);
        if (store.assemblyProgress !== 1) store.setAssemblyProgress(1);
        if (store.phase !== 'FINAL') store.setPhase('FINAL');
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // Spacer only mounts during the driven phases, so the page becomes
  // scrollable exactly when the scene is ready to be scrolled.
  if (!DRIVEN.has(phase)) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: '500vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
