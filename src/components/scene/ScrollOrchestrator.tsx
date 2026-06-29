// src/components/scene/ScrollOrchestrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScene, type ScenePhase } from '@/lib/scene-state';
import { phaseToProgress, progressToPhase } from '@/lib/journey-map';
import { syncMiraCatalogueForScene } from '@/lib/mira-state';
import { isPortfolioChapterPhase } from '@/lib/portfolio-book';
import { syncPortfolioBookForScene } from '@/lib/portfolio-book-state';
import {
  type PortfolioStop,
  getPortfolioStopForProgress,
  getProgressForPortfolioStop,
} from '@/lib/portfolio-journey';
import { getPortfolioMorphState } from '@/lib/portfolio-supercluster';
import {
  beginPortfolioStepTransition,
  finishPortfolioStepTransition,
  getPortfolioStepTransition,
  resetPortfolioStepTransition,
  syncPortfolioStepTransition,
} from '@/lib/portfolio-step-transition';

gsap.registerPlugin(ScrollTrigger);

const SNAP_COOLDOWN_MS = 520;
const JOURNEY_NAVIGATION_EVENT = 'portfolio:go-to-progress';
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
    __goToJourneyProgress?: (progress: number, options?: JourneyNavigationOptions) => void;
    __setJourneyProgress?: (progress: number) => void;
    __setPortfolioStop?: (index: number) => void;
  }
}

interface JourneyNavigationOptions {
  readonly immediate?: boolean;
}

export default function ScrollOrchestrator() {
  const lenisRef = useRef<Lenis | null>(null);
  const snappingRef = useRef(false);
  const warpFrameRef = useRef<number | null>(null);
  const warpAutoplayConsumedRef = useRef(false);
  const progressFrameRef = useRef<number | null>(null);
  const pendingProgressRef = useRef<number | null>(null);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.32,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.12,
      touchMultiplier: 1.1,
      wheelMultiplier: 1.15,
    });
    lenisRef.current = lenis;
    const applyJourneyProgressNow = (progress: number): void => {
      if (progressFrameRef.current !== null) cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = null;
      pendingProgressRef.current = null;
      applyJourneyProgress(progress);
    };
    const scheduleJourneyProgress = (progress: number): void => {
      pendingProgressRef.current = progress;
      if (progressFrameRef.current !== null) return;
      progressFrameRef.current = requestAnimationFrame(() => {
        const pending = pendingProgressRef.current;
        progressFrameRef.current = null;
        pendingProgressRef.current = null;
        if (pending !== null) applyJourneyProgress(pending);
      });
    };
    const snapToStop = (stop: PortfolioStop): void => {
      beginPortfolioStepTransition(useScene.getState().journeyProgress, stop);
      scrollToProgress(lenis, stop.progress, snappingRef, finishPortfolioStepTransition);
    };
    const jumpWithLenis = (
      progress: number,
      options: JourneyNavigationOptions = {},
    ): void => {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      warpAutoplayConsumedRef.current = clampedProgress >= WARP_START_PROGRESS;
      resetPortfolioStepTransition();
      snappingRef.current = false;
      if (options.immediate) {
        syncLenisScrollPosition(lenis, clampedProgress);
        applyJourneyProgressNow(clampedProgress);
      } else {
        scrollToProgress(lenis, clampedProgress, snappingRef, undefined);
      }
      lastProgressRef.current = clampedProgress;
    };
    const finishWarpAutoplay = (): void => {
      if (warpFrameRef.current !== null) cancelAnimationFrame(warpFrameRef.current);
      warpFrameRef.current = null;
      lastProgressRef.current = WARP_RELEASE_PROGRESS;
      syncLenisScrollPosition(lenis, WARP_RELEASE_PROGRESS);
      applyJourneyProgressNow(WARP_RELEASE_PROGRESS);
      useScene.getState().setWarpAutoplayActive(false);
      snappingRef.current = false;
      lenis.start();
    };
    const startWarpAutoplay = (): void => {
      if (warpAutoplayConsumedRef.current) return;
      if (useScene.getState().warpAutoplayActive) return;
      warpAutoplayConsumedRef.current = true;
      useScene.getState().setWarpAutoplayActive(true);
      snappingRef.current = true;
      lenis.stop();
      lastProgressRef.current = WARP_START_PROGRESS;
      syncLenisScrollPosition(lenis, WARP_START_PROGRESS);
      applyJourneyProgressNow(WARP_START_PROGRESS);
      const startedAt = performance.now();
      const tick = (now: number): void => {
        const elapsed = now - startedAt;
        const sample = sampleWarpAutoplayProgress(elapsed);
        const progress = sample.progress;
        applyJourneyProgressNow(progress);
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
      window.__setJourneyProgress = jumpWithLenis;
      window.__setPortfolioStop = (index: number) => {
        snappingRef.current = false;
        jumpWithLenis(getProgressForPortfolioStop(index), { immediate: true });
      };
    }

    window.__goToJourneyProgress = jumpWithLenis;
    const onJourneyNavigation = (event: Event): void => {
      const detail = (event as CustomEvent<JourneyNavigationOptions & {
        readonly progress?: number;
      }>).detail;
      if (typeof detail?.progress !== 'number') return;
      jumpWithLenis(detail.progress, detail);
    };
    window.addEventListener(JOURNEY_NAVIGATION_EVENT, onJourneyNavigation);

    // Single ScrollTrigger driving journeyProgress.
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end:   'bottom bottom',
      onUpdate: (self) => {
        if (useScene.getState().warpAutoplayActive) return;
        if (self.progress < WARP_START_PROGRESS - 0.012) {
          warpAutoplayConsumedRef.current = false;
        }
        if (shouldStartWarpAutoplay({
          consumed: warpAutoplayConsumedRef.current,
          current: self.progress,
          previous: lastProgressRef.current,
        })) {
          startWarpAutoplay();
          return;
        }
        lastProgressRef.current = self.progress;
        scheduleJourneyProgress(self.progress);
      },
    });

    return () => {
      if (warpFrameRef.current !== null) cancelAnimationFrame(warpFrameRef.current);
      if (progressFrameRef.current !== null) cancelAnimationFrame(progressFrameRef.current);
      useScene.getState().setWarpAutoplayActive(false);
      resetPortfolioStepTransition();
      trigger.kill();
      window.removeEventListener(JOURNEY_NAVIGATION_EVENT, onJourneyNavigation);
      gsap.ticker.remove(lenisRaf);
      lenis.destroy();
      delete window.__goToJourneyProgress;
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
  onComplete?: () => void,
): void {
  const target = progress * getTotalScroll();
  snappingRef.current = true;
  lenis.scrollTo(target, {
    duration: 0.24,
    lock: false,
    onComplete: () => {
      applyJourneyProgress(progress);
      onComplete?.();
      window.setTimeout(() => {
        snappingRef.current = false;
      }, SNAP_COOLDOWN_MS);
    },
  });
}

function syncLenisScrollPosition(lenis: Lenis, progress: number): void {
  const target = progress * getTotalScroll();
  lenis.scrollTo(target, { immediate: true, force: true, lock: false });
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

export function shouldStartWarpAutoplay(config: {
  readonly consumed: boolean;
  readonly current: number;
  readonly previous: number;
}): boolean {
  if (config.consumed) return false;
  return config.current > config.previous &&
    config.previous < WARP_START_PROGRESS &&
    config.current >= WARP_START_PROGRESS;
}

function isPortfolioActive(): boolean {
  return isPortfolioChapterPhase(useScene.getState().phase);
}

function applyJourneyProgress(progress: number): void {
  const snap = progressToPhase(progress);
  syncPortfolioStepTransition(progress);
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
  const transition = getPortfolioStepTransition();
  const morph = getPortfolioMorphState(phase, local, progress, transition);
  const stop = getPortfolioStopForProgress(progress);
  (window as Window & { __portfolioDebug?: unknown }).__portfolioDebug = {
    activeBeat: morph.activeBeat,
    activeProject: morph.activeProject,
    activeProjectId: morph.activeProjectId,
    activeStopIndex: stop.activeStopIndex,
    cameraLocked: stop.cameraLocked,
    glyphMorph: morph.glyphMorph,
    projectMorph: morph.projectMorph,
    stepMorph: morph.stepMorph,
    titleMorph: morph.titleMorph,
    transitionActive: transition.active,
  };
}
