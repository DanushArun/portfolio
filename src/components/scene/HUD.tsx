'use client';

import { useScene, phaseTime } from '@/lib/scene-state';
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
// FORMULA_RINGS data overlay
// ─────────────────────────────────────────────────────────────────────────────

const RING_DATA: { text: string; accent: boolean }[] = [
  { text: 'FM23e ELECTRIC VEHICLE',         accent: false },
  { text: 'MOTOR: KV-80 · 500 RPM/V',       accent: false },
  { text: 'OPERATIONS LEAD: 2022–2024',      accent: false },
  { text: '',                                accent: false },
  { text: 'PATH PLANNING: AUTONOMOUS',       accent: false },
  { text: 'ACCURACY IMPROVEMENT: +40%',      accent: true  },
  { text: '',                                accent: false },
  { text: 'FORMULA BHARAT 2024: 1ST PLACE',  accent: true  },
  { text: 'COST & MANUFACTURING: 1ST PLACE', accent: true  },
  { text: 'SPONSORSHIP: ₹60 LAKH',          accent: true  },
];

function FormulaOverlay() {
  const scrollVelocity = useScene((s) => s.scrollVelocity);
  const visible = Math.abs(scrollVelocity) < 50;

  return (
    <div style={{
      position:      'fixed',
      top:           '50%',
      right:         '5vw',
      transform:     'translateY(-50%)',
      opacity:       visible ? 1 : 0,
      transition:    'opacity 400ms ease-out',
      pointerEvents: 'none',
      zIndex:        10,
      fontFamily:    'var(--font-mono, monospace)',
      fontSize:      '10px',
      letterSpacing: '0.22em',
      lineHeight:    1.65,
      textTransform: 'uppercase',
    }}>
      {RING_DATA.map((line, i) =>
        line.text === '' ? (
          <div key={i} style={{ height: '0.8em' }} />
        ) : (
          <div key={i} style={{ color: line.accent ? '#B8FF3C' : '#E8E4D8' }}>
            {line.text}
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main HUD
// ─────────────────────────────────────────────────────────────────────────────

export default function HUD() {
  const phase      = useScene((s) => s.phase);
  const phaseStart = useScene((s) => s.phaseStart);
  const pulsarBeat = useScene((s) => s.pulsarBeat);
  const [, tick]   = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 92);
    return () => clearInterval(id);
  }, []);

  const pt = phaseTime(phaseStart);

  return (
    <>
      {/* ── Top strip ── */}
      <div style={{ ...STRIP, top: 0 }}>
        <div style={MONO}>
          {phase === 'VOID'           && 'SCHWARZSCHILD METRIC — INITIALIZING'}
          {phase === 'DESCENT'        && 'EVENT HORIZON — CROSSING'}
          {phase === 'MIRA_PULSAR'    && 'MIRA — VOICE AI AGENT'}
          {phase === 'DRIVEX_QUASAR'  && 'DRIVEX — AGENTIC SYSTEMS'}
          {phase === 'TWIN_BUILD'     && 'FURYX × VERONICA — TWIN BUILD'}
          {phase === 'FORMULA_RINGS'  && 'FM23e — FORMULA BHARAT 2024'}
          {phase === 'QUANTUM_PLANET' && 'QUANTUM RESEARCH — BLEEDING EDGE'}
          {phase === 'SINGULARITY'    && 'DANUSH ARUN — 2026'}
        </div>
        <div style={{ ...MONO, color: 'rgba(255,255,255,0.35)' }}>
          {phase === 'MIRA_PULSAR' && (
            <span style={{ color: '#B8FF3C' }}>
              {'92ms · BEAT ' + String(pulsarBeat).padStart(4, '0')}
            </span>
          )}
          {phase === 'DESCENT' && (
            <span style={{ opacity: 0.5 }}>{pt.toFixed(2)}s</span>
          )}
        </div>
      </div>

      {/* ── Bottom strip ── */}
      <div style={{ ...STRIP, bottom: 0 }}>
        <div style={MONO}>
          {/* Landing page: creative nav guide */}
          {phase === 'EVENT_HORIZON' && <NavHint />}

          {/* Cosmic scenes — contextual prompts */}
          {phase === 'MIRA_PULSAR'    && <div style={{ color: 'rgba(232,228,216,0.35)' }}>SPACEBAR · FIRE MANUAL PULSE</div>}
          {phase === 'TWIN_BUILD'     && <div style={{ color: 'rgba(232,228,216,0.35)' }}>DRAG TO ORBIT THE BINARY SYSTEM</div>}
          {phase === 'FORMULA_RINGS'  && <div style={{ color: '#B8FF3C', opacity: 0.7 }}>SCROLL VELOCITY CONTROLS RING SPEED</div>}
          {phase === 'QUANTUM_PLANET' && <div style={{ color: 'rgba(232,228,216,0.35)' }}>CLICK EQUATIONS · DRAG PANELS</div>}
        </div>

        <div style={{ ...MONO, textAlign: 'right' }}>
          {/* Landing page identity */}
          {phase === 'EVENT_HORIZON' && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E8E4D8', letterSpacing: '0.18em' }}>
                DANUSH ARUN
              </div>
              <div style={{ color: 'rgba(232,228,216,0.28)', marginTop: 5, lineHeight: 1.8 }}>
                AGENTIC AI · SYSTEMS ENGINEER
              </div>
            </>
          )}
          {phase === 'DESCENT' && <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>TIME DILATION — ∞</div>}
        </div>
      </div>

      {/* ── Centered elements ── */}
      {phase === 'EVENT_HORIZON' && <ScrollCTA />}
      {phase === 'FORMULA_RINGS' && <FormulaOverlay />}

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
