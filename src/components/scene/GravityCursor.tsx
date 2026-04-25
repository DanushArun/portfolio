'use client';

import { useEffect, useRef } from 'react';
import { useScene } from '@/lib/scene-state';

export default function GravityCursor() {
  const phase  = useScene((s) => s.phase);
  const active = phase === 'EVENT_HORIZON';

  const divRef   = useRef<HTMLDivElement>(null);
  const truePos  = useRef({ x: 0, y: 0 });
  const dispPos  = useRef({ x: -100, y: -100 });
  const rafRef   = useRef<number | null>(null);

  // Hide system cursor while active
  useEffect(() => {
    if (!active) return;
    document.body.style.cursor = 'none';
    return () => { document.body.style.cursor = ''; };
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const onMove = (e: MouseEvent) => {
      truePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const loop = () => {
      const W  = window.innerWidth;
      const H  = window.innerHeight;
      const cx = W / 2;
      const cy = H / 2;
      const tx = truePos.current.x;
      const ty = truePos.current.y;

      const dx   = (tx - cx) / (W * 0.5);
      const dy   = (ty - cy) / (H * 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);

      const lagFactor = dist < 0.4
        ? Math.pow(1 - dist / 0.4, 1.6) * 0.55
        : 0;

      const pullX   = cx - tx;
      const pullY   = cy - ty;
      const pullLen = Math.sqrt(pullX * pullX + pullY * pullY);

      const targetX = pullLen > 0 ? tx + (pullX / pullLen) * pullLen * lagFactor : tx;
      const targetY = pullLen > 0 ? ty + (pullY / pullLen) * pullLen * lagFactor : ty;

      const LERP = 0.18;
      dispPos.current.x += (targetX - dispPos.current.x) * LERP;
      dispPos.current.y += (targetY - dispPos.current.y) * LERP;

      // Direct DOM mutation — zero React re-renders
      if (divRef.current) {
        divRef.current.style.left = `${dispPos.current.x}px`;
        divRef.current.style.top  = `${dispPos.current.y}px`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  const ARM = 10;

  return (
    <div
      ref={divRef}
      style={{
        position: 'fixed',
        left: -100,
        top: -100,
        width: 0,
        height: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: active ? 'block' : 'none',
      }}
    >
      <div style={{ position: 'absolute', left: -ARM, top: -0.5, width: ARM * 2, height: 1, background: 'rgba(232,228,216,0.65)' }} />
      <div style={{ position: 'absolute', left: -0.5, top: -ARM, width: 1, height: ARM * 2, background: 'rgba(232,228,216,0.65)' }} />
      <div style={{ position: 'absolute', left: -1.5, top: -1.5, width: 3, height: 3, borderRadius: '50%', background: 'rgba(232,228,216,0.9)' }} />
    </div>
  );
}
