// src/components/scene/ScrollOrchestrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScene } from '@/lib/scene-state';
import { progressToPhase } from '@/lib/journey-map';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollOrchestrator() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    // GSAP ticker is the single RAF driver — do NOT also use requestAnimationFrame.
    // Using both calls lenis.raf twice per frame, breaking smooth scroll on HMR.
    const lenisRaf = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    // Test handle: bypasses Lenis/GSAP so Playwright can drive scene state directly.
    if (process.env.NODE_ENV !== 'production') {
      (window as any).__setJourneyProgress = (p: number) => {
        const snap = progressToPhase(p);
        useScene.getState().setProgress(
          p,
          snap.cosmicProgress,
          snap.workProgress,
          snap.localProgress,
          snap.phase,
        );
      };
    }

    // Single ScrollTrigger driving journeyProgress.
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end:   'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress;
        const snap = progressToPhase(p);
        useScene.getState().setProgress(
          p,
          snap.cosmicProgress,
          snap.workProgress,
          snap.localProgress,
          snap.phase,
        );
      },
    });

    return () => {
      trigger.kill();
      gsap.ticker.remove(lenisRaf);
      lenis.destroy();
      delete (window as any).__setJourneyProgress;
    };
  }, []);

  return null;
}