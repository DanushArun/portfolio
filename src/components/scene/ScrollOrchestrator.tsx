// src/components/scene/ScrollOrchestrator.tsx
'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScene, type ScenePhase } from '@/lib/scene-state';
import { progressToPhase } from '@/lib/journey-map';
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
      handlePortfolioWheel(event, snappingRef.current, snapToProgress);
    };
    const onTouchStart = (event: TouchEvent): void => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent): void => {
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
        applyJourneyProgress(self.progress);
      },
    });

    return () => {
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
