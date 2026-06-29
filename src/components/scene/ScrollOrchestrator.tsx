// src/components/scene/ScrollOrchestrator.tsx
'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScene, type ScenePhase } from '@/lib/scene-state';
import { phaseToProgress, progressToPhase } from '@/lib/journey-map';
import { syncMiraCatalogueForScene } from '@/lib/mira-state';
import { isPortfolioChapterPhase } from '@/lib/portfolio-book';
import { syncPortfolioBookForScene } from '@/lib/portfolio-book-state';
import {
  getPortfolioStopForProgress,
  getProgressForPortfolioStop,
  resolvePortfolioGesture,
} from '@/lib/portfolio-journey';
import { getPortfolioMorphState } from '@/lib/portfolio-supercluster';

gsap.registerPlugin(ScrollTrigger);

const SNAP_COOLDOWN_MS = 520;
const WARP_START_PROGRESS = phaseToProgress('C04_HORIZON', 0);
const WARP_RELEASE_PROGRESS = phaseToProgress('C08_EMERGE', 0.12);
const WARP_AUTOPLAY_SEGMENTS = [
  {
    durationMs: 1600,
    from: phaseToProgress('C04_HORIZON', 0),
    to: phaseToProgress('C04_HORIZON', 1),
  },
  {
    durationMs: 2200,
    from: phaseToProgress('C05_WARP', 0),
    to: phaseToProgress('C05_WARP', 1),
  },
  {
    durationMs: 1700,
    from: phaseToProgress('C06_ANOMALY', 0),
    to: phaseToProgress('C06_ANOMALY', 1),
  },
  {
    durationMs: 1200,
    from: phaseToProgress('C07_TRANSITION', 0),
    to: phaseToProgress('C07_TRANSITION', 1),
  },
  {
    durationMs: 700,
    from: phaseToProgress('C08_EMERGE', 0),
    to: WARP_RELEASE_PROGRESS,
  },
] as const;

declare global {
  interface Window {
    __setJourneyProgress?: (progress: number) => void;
    __setPortfolioStop?: (index: number) => void;
  }
}

export default function ScrollOrchestrator() {
  const lenisRef = useRef<Lenis | null>(null);
  const snappingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const warpFrameRef = useRef<number | null>(null);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 0.72,
      wheelMultiplier: 0.68,
    });
    lenisRef.current = lenis;
    const snapToProgress = (progress: number): void => {
      scrollToProgress(lenis, progress, snappingRef);
    };
    const finishWarpAutoplay = (): void => {
      if (warpFrameRef.current !== null) cancelAnimationFrame(warpFrameRef.current);
      warpFrameRef.current = null;
      syncScrollPosition(WARP_RELEASE_PROGRESS);
      applyJourneyProgress(WARP_RELEASE_PROGRESS);
      useScene.getState().setWarpAutoplayActive(false);
      snappingRef.current = false;
      lenis.start();
      lastProgressRef.current = WARP_RELEASE_PROGRESS;
    };
    const startWarpAutoplay = (): void => {
      if (useScene.getState().warpAutoplayActive) return;
      useScene.getState().setWarpAutoplayActive(true);
      snappingRef.current = true;
      lenis.stop();
      syncScrollPosition(WARP_START_PROGRESS);
      applyJourneyProgress(WARP_START_PROGRESS);
      const startedAt = performance.now();
      const tick = (now: number): void => {
        const elapsed = now - startedAt;
        const sample = sampleWarpAutoplayProgress(elapsed);
        const progress = sample.progress;
        applyJourneyProgress(progress);
        if (sample.done) {
          finishWarpAutoplay();
          return;
        }
        warpFrameRef.current = requestAnimationFrame(tick);
      };
      warpFrameRef.current = requestAnimationFrame(tick);
    };

    // GSAP ticker is the single RAF driver — do NOT also use requestAnimationFrame.
    // Using both calls lenis.raf twice per frame, breaking smooth scroll on HMR.
    const lenisRaf = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    // Test handle: bypasses Lenis/GSAP so Playwright can drive scene state directly.
    if (process.env.NODE_ENV !== 'production') {
      window.__setJourneyProgress = jumpToProgress;
      window.__setPortfolioStop = (index: number) => {
        snappingRef.current = false;
        jumpToProgress(getProgressForPortfolioStop(index));
      };
    }

    const onWheel = (event: WheelEvent): void => {
      if (useScene.getState().warpAutoplayActive) {
        event.preventDefault();
        return;
      }
      handlePortfolioWheel(event, snappingRef.current, snapToProgress);
    };
    const onTouchStart = (event: TouchEvent): void => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent): void => {
      if (useScene.getState().warpAutoplayActive) {
        event.preventDefault();
        return;
      }
      handlePortfolioTouch(event, touchStartYRef, snappingRef.current, snapToProgress);
    };

    window.addEventListener('wheel', onWheel, { capture: true, passive: false });
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });

    // Single ScrollTrigger driving journeyProgress.
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end:   'bottom bottom',
      onUpdate: (self) => {
        if (useScene.getState().warpAutoplayActive) return;
        if (shouldStartWarpAutoplay(lastProgressRef.current, self.progress)) {
          startWarpAutoplay();
          return;
        }
        lastProgressRef.current = self.progress;
        applyJourneyProgress(self.progress);
      },
    });

    return () => {
      if (warpFrameRef.current !== null) cancelAnimationFrame(warpFrameRef.current);
      useScene.getState().setWarpAutoplayActive(false);
      trigger.kill();
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      gsap.ticker.remove(lenisRaf);
      lenis.destroy();
      delete window.__setJourneyProgress;
      delete window.__setPortfolioStop;
    };
  }, []);

  return null;
}

function getTotalScroll(): number {
  if (typeof window === 'undefined') return 0;
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function scrollToProgress(
  lenis: Lenis,
  progress: number,
  snappingRef: MutableRefObject<boolean>,
): void {
  const target = progress * getTotalScroll();
  snappingRef.current = true;
  lenis.scrollTo(target, {
    duration: 0.92,
    lock: true,
    onComplete: () => {
      applyJourneyProgress(progress);
      window.setTimeout(() => {
        snappingRef.current = false;
      }, SNAP_COOLDOWN_MS);
    },
  });
}

function jumpToProgress(progress: number): void {
  const target = progress * getTotalScroll();
  applyJourneyProgress(progress);
  window.scrollTo({ top: target, behavior: 'auto' });
  ScrollTrigger.update();
}

function syncScrollPosition(progress: number): void {
  const target = progress * getTotalScroll();
  window.scrollTo({ top: target, behavior: 'auto' });
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function sampleWarpAutoplayProgress(elapsedMs: number): {
  done: boolean;
  progress: number;
} {
  let remaining = Math.max(0, elapsedMs);
  for (const segment of WARP_AUTOPLAY_SEGMENTS) {
    if (remaining > segment.durationMs) {
      remaining -= segment.durationMs;
      continue;
    }
    const local = remaining / segment.durationMs;
    return {
      done: false,
      progress: mix(segment.from, segment.to, easeInOut(local)),
    };
  }
  return { done: true, progress: WARP_RELEASE_PROGRESS };
}

function shouldStartWarpAutoplay(previous: number, current: number): boolean {
  return current > previous && previous < WARP_START_PROGRESS && current >= WARP_START_PROGRESS;
}

function isPortfolioActive(): boolean {
  return isPortfolioChapterPhase(useScene.getState().phase);
}

function handlePortfolioWheel(
  event: WheelEvent,
  locked: boolean,
  snapToProgress: (progress: number) => void,
): void {
  if (!isPortfolioActive()) return;
  event.preventDefault();
  const state = useScene.getState();
  const result = resolvePortfolioGesture({
    currentProgress: state.journeyProgress,
    delta: event.deltaY,
    locked,
  });
  if (result.committed) snapToProgress(result.stop.progress);
}

function handlePortfolioTouch(
  event: TouchEvent,
  touchStartYRef: MutableRefObject<number | null>,
  locked: boolean,
  snapToProgress: (progress: number) => void,
): void {
  if (!isPortfolioActive()) return;
  const touchY = event.touches[0]?.clientY;
  if (touchY === undefined || touchStartYRef.current === null) return;
  event.preventDefault();
  const delta = touchStartYRef.current - touchY;
  const result = resolvePortfolioGesture({
    currentProgress: useScene.getState().journeyProgress,
    delta,
    locked,
  });
  if (!result.committed) return;
  touchStartYRef.current = touchY;
  snapToProgress(result.stop.progress);
}

function applyJourneyProgress(progress: number): void {
  const snap = progressToPhase(progress);
  syncMiraCatalogueForScene(snap.phase, snap.localProgress);
  syncPortfolioBookForScene(snap.phase, snap.localProgress);
  exposePortfolioDebug(snap.phase, snap.localProgress, progress);
  useScene.getState().setProgress(
    progress,
    snap.cosmicProgress,
    snap.workProgress,
    snap.localProgress,
    snap.phase,
  );
}

function exposePortfolioDebug(phase: ScenePhase, local: number, progress: number): void {
  if (typeof window === 'undefined') return;
  const morph = getPortfolioMorphState(phase, local, progress);
  const stop = getPortfolioStopForProgress(progress);
  (window as Window & { __portfolioDebug?: unknown }).__portfolioDebug = {
    activeBeat: morph.activeBeat,
    activeProject: morph.activeProject,
    activeProjectId: morph.activeProjectId,
    activeStopIndex: stop.activeStopIndex,
    cameraLocked: stop.cameraLocked,
    glyphMorph: morph.glyphMorph,
    projectMorph: morph.projectMorph,
    titleMorph: morph.titleMorph,
  };
}
