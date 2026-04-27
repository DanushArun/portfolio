'use client';

import { useScene } from '@/lib/scene-state';
import { useEffect, useState } from 'react';

const HUD_STYLE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 100,
  fontSize: '10px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'var(--color-lead)',
  pointerEvents: 'none',
  mixBlendMode: 'difference',
};

export default function HUD() {
  const phase = useScene((s) => s.phase);
  const scrollVelocity = useScene((s) => s.scrollVelocity);

  const [progress, setProgress] = useState(0);
  const [smoothedSpeed, setSmoothedSpeed] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const p = maxScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0;
      setProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let speed = Math.abs(scrollVelocity);
    speed = Math.min(0.99, speed * 0.01);
    setSmoothedSpeed((prev) => prev + (speed - prev) * 0.1);
  }, [scrollVelocity]);

  const hudNames: Record<string, string> = {
    COVER: "THE THRESHOLD",
    APPROACH: "THE THRESHOLD",
    CROSSING: "THE THRESHOLD",
    BOSON_STAR: "ANOMALY 03 // QUANTUM",
    STRANGEON: "ANOMALY 04 // MIRA",
    BINARY_MERGER: "ANOMALY 05 // DRIVEX",
    EINSTEIN_CROSS: "ANOMALY 06 // BINARY",
    HAUMEA: "ANOMALY 07 // COMET",
    MANIFEST: "THE LOGBOOK",
    CYGNUS_LOOP: "THE OUTSKIRTS",
  };

  return (
    <>
      <div style={{ ...HUD_STYLE, top: 32, left: 32 }} className="voice-composer">
        {hudNames[phase] || "THE THRESHOLD"}
      </div>
      <div style={{ ...HUD_STYLE, top: 32, right: 32 }} className="voice-composer">
        SYSTEM ONLINE
      </div>
      <div style={{ ...HUD_STYLE, bottom: 32, left: 32 }} className="voice-composer">
        Z: -{(progress * 15000).toFixed(0)} LY
      </div>
      <div style={{ ...HUD_STYLE, bottom: 32, right: 32 }} className="voice-composer">
        VELOCITY: {smoothedSpeed.toFixed(2)} c
      </div>

      {/* Progress Bar */}
      <div style={{ position: 'fixed', right: 32, top: '50%', transform: 'translateY(-50%)', width: 1, height: 200, background: 'rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ position: 'absolute', top: 0, left: -1, width: 3, background: 'var(--color-bone)', height: `${progress * 100}%`, transition: 'height 0.1s linear' }} />
      </div>
    </>
  );
}