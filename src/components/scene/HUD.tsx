'use client';

import { useScene } from '@/lib/scene-state';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared style tokens
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// EVENT_HORIZON — landing page components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NavHint — bottom-left control guide for the landing BH scene.
 * Fades in after 1s so it doesn't compete with the initial reveal.
 */
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

/**
 * LandingIdentity — large centered name that anchors the landing page.
 * Portfolio visitors know immediately whose world they've entered.
 * As the user scrolls toward the BH, the name drifts upward and fades,
 * consumed by the singularity before Descent takes over.
 */
function LandingIdentity() {
  const horizonProgress = useScene((s) => s.horizonProgress);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Name opacity: full until 30% scroll, then fades out as BH consumes it
  const nameOpacity = visible ? Math.max(0, 1 - Math.max(0, horizonProgress - 0.3) / 0.5) : 0;
  const lift = horizonProgress * 40; // px upward drift as BH pulls

  return (
    <div style={{
      position: 'fixed',
      top: '18vh',
      left: '50%',
      transform: `translateX(-50%) translateY(-${lift}px)`,
      opacity: nameOpacity,
      transition: visible ? 'none' : 'opacity 1.8s cubic-bezier(0.16,1,0.3,1)',
      textAlign: 'center',
      pointerEvents: 'none',
      zIndex: 15,
      userSelect: 'none',
    }}>
      {/* Primary name — large, unmissable */}
      <div style={{
        fontFamily: 'var(--font-display, serif)',
        fontWeight: 800,
        fontSize: 'clamp(2.4rem, 6vw, 5rem)',
        letterSpacing: '0.1em',
        color: '#E8E4D8',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        DANUSH ARUN
      </div>

      {/* Amber divider line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.2em',
        marginTop: '1.1rem',
      }}>
        <div style={{ height: 1, width: 48, background: 'rgba(255,168,50,0.5)' }} />
        <div style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'clamp(0.55rem, 1.1vw, 0.75rem)',
          letterSpacing: '0.32em',
          color: 'rgba(232,228,216,0.4)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          AGENTIC AI  ·  SYSTEMS ENGINEER  ·  BUILDER
        </div>
        <div style={{ height: 1, width: 48, background: 'rgba(255,168,50,0.5)' }} />
      </div>
    </div>
  );
}

/**
 * ScrollCTA — centered scroll-to-enter prompt.
 * Fades in after 2s, stays visible throughout EVENT_HORIZON.
 * The progress ring fills as the user scrolls, giving live feedback
 * before DESCENT fires and this component unmounts.
 */
function ScrollCTA() {
  const horizonProgress = useScene((s) => s.horizonProgress);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const radius = 22;
  const circ   = 2 * Math.PI * radius;
  const arc    = circ * horizonProgress;

  return (
    <div style={{
      position: 'fixed',
      bottom: '7vh',
      left: '50%',
      transform: 'translateX(-50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 1.6s cubic-bezier(0.16,1,0.3,1)',
      pointerEvents: 'none',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.6rem',
    }}>
      {/* Progress ring + animated chevron */}
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        {/* Track ring */}
        <svg
          width={52} height={52}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={26} cy={26} r={radius}
            fill="none" stroke="rgba(255,168,50,0.12)"
            strokeWidth={1}
          />
          {horizonProgress > 0.01 && (
            <circle
              cx={26} cy={26} r={radius}
              fill="none" stroke="rgba(255,168,50,0.65)"
              strokeWidth={1.5}
              strokeDasharray={`${arc} ${circ}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        {/* Bouncing chevron */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'bh-bounce 1.8s ease-in-out infinite',
        }}>
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path d="M1 4 L7 10 L13 4" stroke="rgba(255,168,50,0.7)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <span style={{
        ...MONO,
        fontSize: 8,
        letterSpacing: '0.35em',
        color: 'rgba(232,228,216,0.3)',
      }}>
        SCROLL TO ENTER
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main HUD
// ─────────────────────────────────────────────────────────────────────────────

export default function HUD() {
  const phase = useScene((s) => s.phase);

  return (
    <>
      {/* Top strip — silent during the flight. Only the project name on arrival. */}
      <div style={{ ...STRIP, top: 0 }}>
        <div style={{ ...MONO, opacity: 0.55 }}>
          {phase === 'MIRA_PULSAR' && 'MIRA  /  VOICE AI'}
          {phase === 'DRIVEX_QUASAR'  && 'DRIVEX  /  AGENTIC SYSTEMS'}
          {phase === 'TWIN_BUILD'     && 'FURYX × VERONICA'}
          {phase === 'FORMULA_RINGS'  && 'FORMULA MANIPAL'}
          {phase === 'QUANTUM_PLANET' && 'QUANTUM RESEARCH'}
          {phase === 'SINGULARITY'    && 'DANUSH ARUN'}
        </div>
        <div />
      </div>

      {/* Bottom strip — only the landing nav hint and a quiet identity. */}
      <div style={{ ...STRIP, bottom: 0 }}>
        <div style={MONO}>
          {phase === 'EVENT_HORIZON' && <NavHint />}
        </div>
        <div />
      </div>

      {/* Centered identity — landing only. */}
      {phase === 'EVENT_HORIZON' && <LandingIdentity />}
      {phase === 'EVENT_HORIZON' && <ScrollCTA />}

      {/* Keyframes for ScrollCTA bounce animation */}
      <style>{`
        @keyframes bh-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </>
  );
}
