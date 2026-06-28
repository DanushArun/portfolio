'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import { isPortfolioChapterPhase } from '@/lib/portfolio-book';
import { useScene, type ScenePhase } from '@/lib/scene-state';
import {
  advanceCycle,
  exposeMiraDebug,
  holdCycleAtEnglish,
  ingestForLang,
  restartCycleClock,
  useMiraState,
} from '@/lib/mira-state';
import MiraSupercluster from './MiraSupercluster';

function computeReveal(phase: ScenePhase, local: number): number {
  if (phase === 'C07_TRANSITION') {
    if (local < 0.45) return 0;
    return ((local - 0.45) / 0.55) * 0.40;
  }
  if (phase === 'C08_EMERGE') return 0.40 + Math.min(1, local) * 0.40;
  if (phase === 'C09_PROJECT') return 0.80 + Math.min(1, local) * 0.20;
  if (isPortfolioChapterPhase(phase)) return 1.0;
  return 0;
}

function MiraCycleController({ reveal }: { reveal: number }): null {
  const reducedMotion = useReducedMotion();
  const armedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) holdCycleAtEnglish();
  }, [reducedMotion]);

  useFrame(() => {
    if (reveal < 0.85 || reducedMotion) {
      armedRef.current = false;
      return;
    }
    if (!armedRef.current) {
      restartCycleClock();
      armedRef.current = true;
      return;
    }
    const state = useMiraState.getState();
    if (performance.now() - state.cycleStartMs < 3000) return;
    ingestForLang(state.activeLang);
    advanceCycle();
  });

  return null;
}

export default function MiraScene(): React.ReactElement {
  const phase = useScene((state) => state.phase);
  const local = useScene((state) => state.localProgress);
  const reveal = computeReveal(phase, local);

  useEffect(() => {
    if (typeof window !== 'undefined') exposeMiraDebug(window);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as unknown as { __miraReveal?: number }).__miraReveal = reveal;
  }, [reveal]);

  return (
    <group>
      <color attach="background" args={['#000000']} />
      <MiraCycleController reveal={reveal} />
      {reveal >= 0.20 && <MiraSupercluster reveal={reveal} />}
    </group>
  );
}
