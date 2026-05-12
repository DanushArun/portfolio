'use client';

// src/components/cursor/CustomCursor.tsx
// Job 003 AC9. Single global cursor; dot+ring; CSS-only state via
// data-cursor attribute on <body>. Hidden when:
//   • (pointer: coarse) touch devices
//   • body.dataset.cursor === 'gravity' | 'antenna' (C04 / W09 override)
// Spec: .coo/jobs/003/ux-spec.md §Cursor system.

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import styles from './CustomCursor.module.css';

const LERP_DEFAULT = 0.18;
const LERP_INTERACTIVE = 0.32;
const COARSE_QUERY = '(pointer: coarse)';

function pickLerp(state: string, reduced: boolean): number {
  if (reduced) return 1;
  if (state === 'interactive') return LERP_INTERACTIVE;
  if (state === 'dragging') return 0.5;
  return LERP_DEFAULT;
}

export default function CustomCursor(): React.JSX.Element | null {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const truePos = useRef({ x: -100, y: -100 });
  const dispPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia(COARSE_QUERY).matches) return;

    const onMove = (event: MouseEvent): void => {
      truePos.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia(COARSE_QUERY).matches) return;
    const node = rootRef.current;
    if (!node) return;

    let raf = 0;
    const tick = (): void => {
      const cursorState = document.body.dataset.cursor ?? 'default';
      const alpha = pickLerp(cursorState, reduced);
      dispPos.current.x += (truePos.current.x - dispPos.current.x) * alpha;
      dispPos.current.y += (truePos.current.y - dispPos.current.y) * alpha;
      node.style.transform = `translate3d(${dispPos.current.x}px, ${dispPos.current.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true" data-custom-cursor>
      <div className={styles.ring} />
      <div className={styles.dot} />
    </div>
  );
}
