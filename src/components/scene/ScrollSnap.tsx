'use client';

import { useEffect, useRef } from 'react';
import { useScene, COSMIC_SCENES } from '@/lib/scene-state';

/**
 * ScrollSnap — drives scene advancement for post-DESCENT cosmic scenes.
 *
 * Each scene occupies one "page" worth of scroll. When the user scrolls
 * past 80% of a page, advance to the next scene. Scroll velocity is also
 * fed into the store for FORMULA_RINGS ring speed.
 *
 * TWIN_BUILD exception: scrolling does not advance if orbitAngle hasn't
 * completed at least 180° of rotation (user must physically drag).
 */

const PAGE_H = typeof window !== 'undefined' ? window.innerHeight : 900;

export default function ScrollSnap() {
  const phase         = useScene((s) => s.phase);
  const advanceScene  = useScene((s) => s.advanceScene);
  const orbitAngle    = useScene((s) => s.orbitAngle);
  const setScrollVel  = useScene((s) => s.setScrollVelocity);

  const lastY = useRef(0);
  const lastT = useRef(performance.now());
  const cooldown = useRef(false); // prevent double-advance

  useEffect(() => {
    const onScroll = () => {
      const now = performance.now();
      const dt  = Math.max(1, now - lastT.current);
      const dy  = window.scrollY - lastY.current;
      lastY.current = window.scrollY;
      lastT.current = now;

      // Scroll velocity in px/s — used by FORMULA_RINGS
      setScrollVel(dy / (dt / 1000));

      // Advance when scrolled more than 80% of one page height
      if (cooldown.current) return;
      const { phase: p, orbitAngle: oa } = useScene.getState();

      // TWIN_BUILD requires orbit completion before scroll advances
      if (p === 'TWIN_BUILD' && Math.abs(oa) < Math.PI) return;

      if (window.scrollY > PAGE_H * 0.8) {
        cooldown.current = true;
        advanceScene();
        // Reset scroll to top after advancing
        setTimeout(() => {
          window.scrollTo({ top: 0 });
          cooldown.current = false;
        }, 800);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [advanceScene, setScrollVel]);

  // Spacer gives the page scrollable height
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', top: 0, left: 0,
        width: 1, height: '200vh',
        pointerEvents: 'none', zIndex: 1,
      }}
    />
  );
}
