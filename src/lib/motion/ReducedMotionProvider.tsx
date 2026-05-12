'use client';

// src/lib/motion/ReducedMotionProvider.tsx
// Writes `data-rm="reduce" | "no-preference"` onto <html>. Tailwind v4 +
// CSS-only fallbacks key off this attribute (see globals.css §Reduced-motion).

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useReducedMotion } from './use-reduced-motion';

type Props = Readonly<{ children: ReactNode }>;

export function ReducedMotionProvider({ children }: Props): ReactNode {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.rm = reduced ? 'reduce' : 'no-preference';
    return () => { delete document.documentElement.dataset.rm; };
  }, [reduced]);
  return children;
}
