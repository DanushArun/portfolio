'use client';

// src/components/cursor/CustomCursor.tsx
// Job 003 AC9. Single global cursor; dot+ring; CSS-only state via
// data-cursor attribute on <body>. Hidden when:
//   • (pointer: coarse) touch devices
//   • body.dataset.cursor === 'gravity' | 'antenna' (C04 / W09 override)
// Spec: .coo/jobs/003/ux-spec.md §Cursor system.

import { useEffect, useRef } from 'react';
import styles from './CustomCursor.module.css';

const COARSE_QUERY = '(pointer: coarse)';

export default function CustomCursor(): React.JSX.Element | null {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia(COARSE_QUERY).matches) return;
    const node = rootRef.current;
    if (!node) return;

    const onMove = (event: MouseEvent): void => {
      node.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true" data-custom-cursor>
      <div className={styles.ring} />
      <div className={styles.dot} />
    </div>
  );
}
