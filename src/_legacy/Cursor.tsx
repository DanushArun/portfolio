'use client';

/**
 * Cursor — cream dot + lerped ring + phosphor-lime trail.
 *
 * Design:
 *   - Dot: follows pointer exactly (0-lag, tactile).
 *   - Ring: lerped at ~18% per frame → ~5-frame time constant; gives the
 *     cursor weight without drift that feels broken.
 *   - Trail: last 12 positions, rendered as tiny lime dots that fade over
 *     300ms. Captures the CRT-phosphor "electron hit" feel without the cost
 *     of a real GPU trail.
 *
 * Implementation notes:
 *   - Trail points live in a ref (no React re-renders per frame). We render
 *     them once into 12 pre-allocated DOM nodes and mutate `transform` +
 *     `opacity` directly; React only owns the wrapper.
 *   - On mousemove we push into a circular buffer. The RAF loop iterates
 *     the buffer, computes age, writes styles. Zero allocations per frame.
 */

import { useEffect, useRef } from 'react';

const TRAIL_LEN = 12;
const TRAIL_LIFETIME_MS = 300;
const LIME = '184, 255, 60';

type TrailPoint = { x: number; y: number; born: number };

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailWrapRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  // Circular buffer of trail points. We write into index (head % TRAIL_LEN).
  const trail = useRef<TrailPoint[]>(
    Array.from({ length: TRAIL_LEN }, () => ({ x: -50, y: -50, born: 0 }))
  );
  const head = useRef(0);
  const trailNodes = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
      }
      // Push into circular buffer.
      const idx = head.current % TRAIL_LEN;
      trail.current[idx].x = e.clientX;
      trail.current[idx].y = e.clientY;
      trail.current[idx].born = performance.now();
      head.current += 1;
    };

    let raf = 0;
    const loop = () => {
      // Ring lerp.
      ring.current.x += (pos.current.x - ring.current.x) * 0.18;
      ring.current.y += (pos.current.y - ring.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${ring.current.x - 20}px, ${ring.current.y - 20}px)`;
      }

      // Trail: age each point, fade linearly.
      const now = performance.now();
      for (let i = 0; i < TRAIL_LEN; i++) {
        const p = trail.current[i];
        const node = trailNodes.current[i];
        if (!node) continue;
        const age = now - p.born;
        if (age > TRAIL_LIFETIME_MS || p.born === 0) {
          node.style.opacity = '0';
          continue;
        }
        const life = 1 - age / TRAIL_LIFETIME_MS; // 1 → 0
        node.style.transform = `translate(${p.x - 1.5}px, ${p.y - 1.5}px)`;
        node.style.opacity = (life * 0.6).toFixed(3);
      }

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#E8E4D8',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(232,228,216,0.5)',
          pointerEvents: 'none',
          zIndex: 9998,
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
      />
      <div ref={trailWrapRef} aria-hidden style={{ pointerEvents: 'none' }}>
        {Array.from({ length: TRAIL_LEN }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) trailNodes.current[i] = el;
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: `rgb(${LIME})`,
              boxShadow: `0 0 6px rgba(${LIME}, 0.8)`,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 9997,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>
    </>
  );
}
