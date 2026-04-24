'use client';

import { useScene, phaseTime } from '@/lib/scene-state';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// FormulaRings data overlay — mounted here so it lives in DOM, not in Canvas
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
    <div
      style={{
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
      }}
    >
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
      {/* Top strip */}
      <div style={{ ...STRIP, top: 0 }}>
        <div style={MONO}>
          {phase === 'VOID'           && 'SCHWARZSCHILD METRIC — INITIALIZING'}
          {phase === 'EVENT_HORIZON'  && 'DA · OBS-25 · SAGITTARIUS A★'}
          {phase === 'DESCENT'        && 'EVENT HORIZON — CROSSING'}
          {phase === 'MIRA_PULSAR'    && 'MIRA — VOICE AI AGENT'}
          {phase === 'DRIVEX_QUASAR'  && 'DRIVEX — AGENTIC SYSTEMS'}
          {phase === 'TWIN_BUILD'     && 'FURYX × VERONICA — TWIN BUILD'}
          {phase === 'FORMULA_RINGS'  && 'FM23e — FORMULA BHARAT 2024'}
          {phase === 'QUANTUM_PLANET' && 'QUANTUM RESEARCH — BLEEDING EDGE'}
          {phase === 'SINGULARITY'    && 'DANUSH ARUN — 2026'}
        </div>
        <div style={{ ...MONO, color: 'rgba(255,255,255,0.35)' }}>
          {phase === 'EVENT_HORIZON' && 'SCHWARZSCHILD RADIUS: 1.0 Rs · DISK: 15°'}
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

      {/* Bottom strip */}
      <div style={{ ...STRIP, bottom: 0 }}>
        <div style={MONO}>
          {phase === 'EVENT_HORIZON' && (
            <>
              <div>SCHWARZSCHILD METRIC</div>
              <div style={{ color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>EVENT HORIZON · r = 2GM/c²</div>
              <div style={{ color: 'rgba(232,228,216,0.3)', marginTop: 8 }}>SCROLL TO APPROACH</div>
            </>
          )}
          {phase === 'MIRA_PULSAR'    && <div style={{ color: 'rgba(232,228,216,0.35)' }}>SPACEBAR · FIRE MANUAL PULSE</div>}
          {phase === 'TWIN_BUILD'     && <div style={{ color: 'rgba(232,228,216,0.35)' }}>DRAG TO ORBIT THE BINARY SYSTEM</div>}
          {phase === 'FORMULA_RINGS'  && <div style={{ color: '#B8FF3C', opacity: 0.7 }}>SCROLL VELOCITY CONTROLS RING SPEED</div>}
          {phase === 'QUANTUM_PLANET' && <div style={{ color: 'rgba(232,228,216,0.35)' }}>CLICK EQUATIONS · DRAG PANELS</div>}
        </div>
        <div style={{ ...MONO, textAlign: 'right' }}>
          {phase === 'EVENT_HORIZON' && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#E8E4D8' }}>DANUSH ARUN</div>
              <div style={{ color: 'rgba(232,228,216,0.25)', marginTop: 4 }}>SYSTEMS ARCHITECT · PHYSICS ENGINE</div>
            </>
          )}
          {phase === 'DESCENT' && <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>TIME DILATION — ∞</div>}
        </div>
      </div>

      {phase === 'EVENT_HORIZON' && <CrossPrompt />}

      {/* FormulaRings data overlay — position:fixed, must be outside the strip divs */}
      {phase === 'FORMULA_RINGS' && <FormulaOverlay />}
    </>
  );
}

function CrossPrompt() {
  const [scrollPct, setScrollPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const visible = scrollPct > 0.55;
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      zIndex: 20, pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1)',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-display,serif)',
        fontWeight: 800,
        fontSize: 'clamp(0.7rem,1.5vw,1.1rem)',
        letterSpacing: '0.35em',
        color: '#E8E4D8',
        textTransform: 'uppercase',
      }}>
        CROSS THE EVENT HORIZON
      </div>
    </div>
  );
}
