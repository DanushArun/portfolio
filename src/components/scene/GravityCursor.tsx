'use client';

import { useEffect, useRef, useState } from 'react';
import { useScene } from '@/lib/scene-state';

/**
 * GravityCursor — replaces system cursor during EVENT_HORIZON.
 *
 * Behavior:
 *  - 1px crosshair, barely visible
 *  - Within 40% of screen radius from center: cursor position lags its true
 *    position (gravitational drag proportional to proximity)
 *  - Near the photon ring boundary (~15% from center): cursor visibly bends
 *    toward singularity
 *  - Outside EVENT_HORIZON phase: hidden (system cursor restored)
 */
export default function GravityCursor() {
  const phase = useScene((s) => s.phase);
  const active = phase === 'EVENT_HORIZON';

  const truePos  = useRef({ x: 0, y: 0 });
  const dispPos  = useRef({ x: 0, y: 0 });
  const rafRef   = useRef<number | null>(null);
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    if (!active) return;

    const onMove = (e: MouseEvent) => {
      truePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const loop = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cx = W / 2;
      const cy = H / 2;
      const tx = truePos.current.x;
      const ty = truePos.current.y;

      // Normalized distance from screen center (0=center, 1=corner)
      const dx = (tx - cx) / (W * 0.5);
      const dy = (ty - cy) / (H * 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy); // 0..√2

      // Gravitational lag: stronger closer to center (BH).
      // Within 40% radius (dist < 0.4): pull cursor toward BH.
      // Lag factor 0 (no lag) at dist=1, grows to 0.55 at dist=0.
      const lagFactor = dist < 0.4
        ? Math.pow(1 - dist / 0.4, 1.6) * 0.55
        : 0;

      // Pull direction: toward BH (screen center)
      const pullX = cx - tx;
      const pullY = cy - ty;
      const pullLen = Math.sqrt(pullX * pullX + pullY * pullY);

      const targetX = pullLen > 0
        ? tx + (pullX / pullLen) * pullLen * lagFactor
        : tx;
      const targetY = pullLen > 0
        ? ty + (pullY / pullLen) * pullLen * lagFactor
        : ty;

      // Smooth displayed position toward target
      const LERP = 0.18;
      dispPos.current.x += (targetX - dispPos.current.x) * LERP;
      dispPos.current.y += (targetY - dispPos.current.y) * LERP;

      setPos({ x: dispPos.current.x, y: dispPos.current.y });
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;

  const ARM = 10; // crosshair arm length px

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top:  pos.y,
        width: 0,
        height: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        // Hide system cursor while this is active
      }}
    >
      {/* Horizontal arm */}
      <div style={{
        position: 'absolute',
        left: -ARM,
        top: -0.5,
        width: ARM * 2,
        height: 1,
        background: 'rgba(232,228,216,0.65)',
      }} />
      {/* Vertical arm */}
      <div style={{
        position: 'absolute',
        left: -0.5,
        top: -ARM,
        width: 1,
        height: ARM * 2,
        background: 'rgba(232,228,216,0.65)',
      }} />
      {/* Center dot */}
      <div style={{
        position: 'absolute',
        left: -1.5,
        top: -1.5,
        width: 3,
        height: 3,
        borderRadius: '50%',
        background: 'rgba(232,228,216,0.9)',
      }} />
    </div>
  );
}
