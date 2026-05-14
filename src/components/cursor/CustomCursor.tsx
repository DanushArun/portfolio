'use client';

// src/components/cursor/CustomCursor.tsx
// Job 003 AC9. Single global cursor; dot+ring; CSS-only state via
// data-cursor attribute on <body>. Hidden when:
//   • (pointer: coarse) touch devices
//   • body.dataset.cursor === 'gravity' | 'antenna' (C04 / W09 override)
// Spec: .coo/jobs/003/ux-spec.md §Cursor system.

import { useEffect, useRef, useState } from 'react';
import styles from './CustomCursor.module.css';
import { useReducedMotion } from '@/lib/motion/use-reduced-motion';

const COARSE_QUERY = '(pointer: coarse)';

export default function CustomCursor(): React.JSX.Element | null {
  const rootRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const delayedPosRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const rm = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia(COARSE_QUERY).matches) return;
    
    const node = rootRef.current;
    if (!node) return;

    const onMove = (event: MouseEvent): void => {
      posRef.current = { x: event.clientX, y: event.clientY };
      
      if (!initializedRef.current) {
        delayedPosRef.current = { ...posRef.current };
        initializedRef.current = true;
        setIsVisible(true);
      }

      // Update data-cursor state based on target
      const target = event.target as HTMLElement;
      if (target) {
        const interactive = target.closest('a, button, [role="button"], [data-cursor-interactive]');
        const text = target.closest('[data-cursor-text]');
        
        // Only set if not already in a special state like dragging or gravity
        const current = document.body.dataset.cursor;
        const isInternalState = current === 'interactive' || current === 'text' || !current;
        
        if (isInternalState) {
          if (interactive) {
            document.body.dataset.cursor = 'interactive';
          } else if (text) {
            document.body.dataset.cursor = 'text';
          } else {
            delete document.body.dataset.cursor;
          }
        }
      }
    };

    const loop = () => {
      if (rm) {
        delayedPosRef.current = { ...posRef.current };
      } else {
        const state = document.body.dataset.cursor;
        
        // Spec-aligned lerp physics from ux-spec.md §Cursor follow physics
        let LERP = 0.18; // Default: 6-frame lag
        if (state === 'interactive') LERP = 0.32; // 3-frame lag
        if (state === 'dragging') LERP = 0.5; // Minimal lag

        delayedPosRef.current.x += (posRef.current.x - delayedPosRef.current.x) * LERP;
        delayedPosRef.current.y += (posRef.current.y - delayedPosRef.current.y) * LERP;
      }

      if (node) {
        // Use translate3d for GPU acceleration
        node.style.transform = `translate3d(${delayedPosRef.current.x}px, ${delayedPosRef.current.y}px, 0)`;
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [rm]);

  // Handle SSR and touch devices
  if (typeof window !== 'undefined' && window.matchMedia(COARSE_QUERY).matches) return null;

  return (
    <div 
      ref={rootRef} 
      className={styles.root} 
      aria-hidden="true" 
      data-custom-cursor
      style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <div className={styles.ring} />
      <div className={styles.dot} />
    </div>
  );
}
