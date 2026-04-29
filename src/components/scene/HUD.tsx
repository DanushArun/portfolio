'use client';

import { useScene } from '@/lib/scene-state';
import { useEffect, useState } from 'react';

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 9,
  letterSpacing: '0.25em',
  textTransform: 'uppercase' as const,
  color: 'rgba(232,228,216,0.42)',
};

const STRIP: React.CSSProperties = {
  position: 'fixed',
  left: 0, right: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  padding: '1.25rem 2rem',
  zIndex: 20,
  pointerEvents: 'none',
};

function NavHint() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transition: 'opacity 1.4s cubic-bezier(0.16,1,0.3,1)',
      ...MONO,
      color: 'rgba(232,228,216,0.28)',
      lineHeight: 2.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9em' }}>
        <span style={{ color: 'rgba(255,168,50,0.5)', fontSize: 11 }}>⊕</span>
        <span>DRAG  —  ORBIT THE SINGULARITY</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9em' }}>
        <span style={{ color: 'rgba(255,168,50,0.5)', fontSize: 13 }}>↓</span>
        <span>SCROLL  —  CROSS THE THRESHOLD</span>
      </div>
    </div>
  );
}

export default function HUD() {
  const phase = useScene((s) => s.phase);

  return (
    <>
      <div style={{ ...STRIP, top: 0 }}>
        <div style={{ ...MONO, opacity: 0.55 }}>
          {phase === 'STRANGEON'     && 'MIRA  /  VOICE AI'}
          {phase === 'BINARY_MERGER' && 'DRIVEX  /  AGENTIC SYSTEMS'}
          {phase === 'EINSTEIN_CROSS'&& 'FURYX × VERONICA'}
          {phase === 'HAUMEA'        && 'FORMULA MANIPAL'}
          {phase === 'BOSON_STAR'    && 'QUANTUM RESEARCH'}
          {phase === 'CYGNUS_LOOP'   && 'DANUSH ARUN'}
        </div>
        <div />
      </div>

      <div style={{ ...STRIP, bottom: 0 }}>
        <div style={MONO}>
          {phase === 'COVER' && <NavHint />}
        </div>
        <div />
      </div>

    </>
  );
}
