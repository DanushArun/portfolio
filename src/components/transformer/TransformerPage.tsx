'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTransformer } from '@/lib/transformer-store';
import { STAGES } from '@/lib/transformer/constants';
import TransformerScene from './TransformerScene';
import MathPanel from './MathPanel';
import StageIndicator from './StageIndicator';

gsap.registerPlugin(ScrollTrigger);

export default function TransformerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const setGlobalProgress = useTransformer((s) => s.setGlobalProgress);
  const reset = useTransformer((s) => s.reset);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const sectionHeight = window.innerHeight;

    if (containerRef.current) {
      const trigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${sectionHeight * STAGES.length}`,
        scrub: 1,
        pin: true,
        onUpdate: (self) => {
          setGlobalProgress(self.progress);
        },
      });
      triggerRef.current = trigger;
    }

    return () => {
      lenis.destroy();
      triggerRef.current?.kill();
      reset();
    };
  }, [setGlobalProgress, reset]);

  return (
    <div ref={containerRef} className="relative bg-[#08070a]">
      <div style={{ height: `${STAGES.length * 100}vh` }}>
        <div className="fixed inset-0 flex flex-col lg:flex-row">
          <div className="w-full lg:w-[60%] h-[50vh] lg:h-full relative">
            <TransformerScene />
          </div>
          <div className="w-full lg:w-[40%] h-[50vh] lg:h-full overflow-y-auto border-l border-[#F0E4D2]/10">
            <MathPanel />
          </div>
        </div>
        <StageIndicator />
      </div>
    </div>
  );
}
