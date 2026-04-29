'use client';

import { useScene } from '@/lib/scene-state';

function DebugProgressOverlay() {
  const phase = useScene((s) => s.phase);
  const j = useScene((s) => s.journeyProgress);
  const c = useScene((s) => s.cosmicProgress);
  const w = useScene((s) => s.workProgress);
  const l = useScene((s) => s.localProgress);
  return (
    <div style={{
      position: 'fixed', top: 8, right: 8, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', color: '#5EEAD4',
      fontFamily: 'monospace', fontSize: 10, padding: '4px 8px',
      pointerEvents: 'none', letterSpacing: '0.05em',
    }}>
      <div>{phase}</div>
      <div>j={j.toFixed(3)} c={c.toFixed(3)} w={w.toFixed(3)}</div>
      <div>local={l.toFixed(3)}</div>
    </div>
  );
}

export default function HUD() {
  return (
    <>
      {process.env.NODE_ENV !== 'production' && <DebugProgressOverlay />}
    </>
  );
}
