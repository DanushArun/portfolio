'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useScene } from '@/lib/scene-state';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SILENCE_MS        = 3000;
const ORB_TRAVEL_MS     = 2500;
const MONOLITH_DELAY_MS = SILENCE_MS + ORB_TRAVEL_MS;         // 5500
const SCRAMBLE_MS       = 600;
const RESOLVE_CHAR_MS   = 55;
const TARGET_TEXT       = '> INITIALIZE CONTACT';
const CONTACT_DELAY_MS  =
  MONOLITH_DELAY_MS + SCRAMBLE_MS + TARGET_TEXT.length * RESOLVE_CHAR_MS;
const BLINK_DELAY_MS    = CONTACT_DELAY_MS + 400;

const CENTER_X = '50vw';
const CENTER_Y = '50vh';
const EASE     = 'cubic-bezier(0.16,1,0.3,1)';
const EASE_ORB = 'cubic-bezier(0.25,1,0.5,1)';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789><./:_-';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

type OrbDef = {
  id:     string;
  color:  string;
  glow:   string;
  initX:  string;
  initY:  string;
};

const ORB_DEFS: OrbDef[] = [
  { id: 'pulsar',  color: '#4FC3F7', glow: '0 0 16px 4px #4FC3F7', initX: '8vw',  initY: '12vh' },
  { id: 'quasar',  color: '#FFB74D', glow: '0 0 16px 4px #FFB74D', initX: '92vw', initY: '50vh' },
  { id: 'magnetar',color: '#90CAF9', glow: '0 0 16px 4px #90CAF9', initX: '50vw', initY: '90vh' },
  { id: 'rings',   color: '#BDBDBD', glow: '0 0 16px 4px #BDBDBD', initX: '88vw', initY: '10vh' },
  { id: 'planet',  color: '#FFD54F', glow: '0 0 16px 4px #FFD54F', initX: '6vw',  initY: '50vh' },
];

type ContactLine = {
  label:            string;
  href?:            string;
  accent:           boolean;
  initialTranslate: string;
};

const CONTACT_LINES: ContactLine[] = [
  {
    label: 'danusharun999@gmail.com',
    href:  'mailto:danusharun999@gmail.com',
    accent: true,
    initialTranslate: 'translateX(-28px)',
  },
  {
    label: '+91 9901148254',
    href:  'tel:+919901148254',
    accent: false,
    initialTranslate: 'translateX(28px)',
  },
  {
    label: 'linkedin.com/in/danush-arun-5aa762267',
    href:  'https://www.linkedin.com/in/danush-arun-5aa762267',
    accent: false,
    initialTranslate: 'translateY(18px)',
  },
  {
    label: 'github.com/DanushArun',
    href:  'https://github.com/DanushArun',
    accent: false,
    initialTranslate: 'translateX(28px)',
  },
  {
    label: 'Bengaluru · India',
    href:  undefined,
    accent: false,
    initialTranslate: 'translateX(-28px)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ScrambleText — random characters → final string, character by character
// ─────────────────────────────────────────────────────────────────────────────

function randomChar(): string {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function buildDisplay(target: string, resolvedCount: number): string {
  return target
    .split('')
    .map((ch, i) => {
      if (i < resolvedCount) return ch;
      if (ch === ' ') return ' ';
      return randomChar();
    })
    .join('');
}

type ScrambleProps = { active: boolean };

function ScrambleText({ active }: ScrambleProps) {
  const [display, setDisplay] = useState('');
  const resolvedRef  = useRef(0);
  const rafRef       = useRef<number | null>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef     = useRef<'idle' | 'scramble' | 'resolve'>('idle');
  const scrambleEndRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current !== null)   { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  // Scramble loop — runs in rAF while phaseRef === 'scramble'
  const scrambleTick = useCallback(() => {
    if (phaseRef.current !== 'scramble') return;
    setDisplay(buildDisplay(TARGET_TEXT, 0));
    if (performance.now() < scrambleEndRef.current) {
      rafRef.current = requestAnimationFrame(scrambleTick);
      return;
    }
    // Transition to resolve phase
    phaseRef.current = 'resolve';
    resolvedRef.current = 0;
    const resolveStep = () => {
      resolvedRef.current += 1;
      setDisplay(buildDisplay(TARGET_TEXT, resolvedRef.current));
      if (resolvedRef.current < TARGET_TEXT.length) {
        timerRef.current = setTimeout(resolveStep, RESOLVE_CHAR_MS);
      }
    };
    timerRef.current = setTimeout(resolveStep, RESOLVE_CHAR_MS);
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      phaseRef.current = 'idle';
      resolvedRef.current = 0;
      setDisplay('');
      return;
    }
    phaseRef.current = 'scramble';
    scrambleEndRef.current = performance.now() + SCRAMBLE_MS;
    rafRef.current = requestAnimationFrame(scrambleTick);
    return stop;
  }, [active, stop, scrambleTick]);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display || ' '}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Singularity
// ─────────────────────────────────────────────────────────────────────────────

export default function Singularity() {
  const phase  = useScene((s) => s.phase);
  const active = phase === 'SINGULARITY';

  const [overlayGone,      setOverlayGone]      = useState(false);
  // orbsTraveling: orbs are moving from edge → center (opacity 1, position transitioning)
  // orbsFaded: orbs reached center and faded out (opacity 0)
  const [orbsTraveling,    setOrbsTraveling]    = useState(false);
  const [orbsFaded,        setOrbsFaded]        = useState(false);
  const [monolithVisible,  setMonolithVisible]  = useState(false);
  const [scrambleActive,   setScrambleActive]   = useState(false);
  const [contactVisible,   setContactVisible]   = useState(false);
  const [blinkActive,      setBlinkActive]      = useState(false);

  useEffect(() => {
    if (!active) {
      setOverlayGone(false);
      setOrbsTraveling(false);
      setOrbsFaded(false);
      setMonolithVisible(false);
      setScrambleActive(false);
      setContactVisible(false);
      setBlinkActive(false);
      return;
    }

    const ts: ReturnType<typeof setTimeout>[] = [];

    // T+3000: overlay fades, orbs appear at edges and begin travelling (opacity 1)
    ts.push(setTimeout(() => { setOverlayGone(true); setOrbsTraveling(true); }, SILENCE_MS));

    // T+5500: orbs arrive at center → fade them out; monolith appears; scramble starts
    ts.push(setTimeout(() => {
      setOrbsFaded(true);
      setMonolithVisible(true);
      setScrambleActive(true);
    }, MONOLITH_DELAY_MS));

    // After scramble + resolve completes: contact lines stagger in
    ts.push(setTimeout(() => setContactVisible(true), CONTACT_DELAY_MS));

    // Cursor blink — brief screen flash, then done
    ts.push(setTimeout(() => {
      setBlinkActive(true);
      ts.push(setTimeout(() => setBlinkActive(false), 700));
    }, BLINK_DELAY_MS));

    return () => ts.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  return (
    <Html fullscreen zIndexRange={[10, 10]}>
      {/* Black silence overlay — absolute dark for first 3s */}
      <div
        aria-hidden
        style={{
          position:   'fixed',
          inset:      0,
          background: '#000',
          opacity:    overlayGone ? 0 : 1,
          transition: overlayGone ? 'opacity 0.5s linear' : 'none',
          pointerEvents: overlayGone ? 'none' : 'all',
          zIndex: 50,
        }}
      />

      {/* Orbs — 5 glowing points drifting from edges to center, then fading */}
      {ORB_DEFS.map((orb) => (
        <div
          key={orb.id}
          aria-hidden
          style={{
            position:     'fixed',
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   orb.color,
            boxShadow:    orb.glow,
            // Position: edges while traveling, center once faded
            left:         orbsTraveling ? CENTER_X : orb.initX,
            top:          orbsTraveling ? CENTER_Y : orb.initY,
            transform:    'translate(-50%, -50%)',
            // Opacity: hidden before overlay lifts; 1 during travel; 0 after convergence
            opacity:      orbsTraveling && !orbsFaded ? 1 : 0,
            transition:   orbsTraveling
              ? [
                  `left ${ORB_TRAVEL_MS}ms ${EASE_ORB}`,
                  `top ${ORB_TRAVEL_MS}ms ${EASE_ORB}`,
                  `opacity 400ms ease-out`,
                ].join(', ')
              : 'none',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        />
      ))}

      {/* Monolith — frosted black rectangle, centered */}
      <div
        style={{
          position:       'fixed',
          top:            '50%',
          left:           '50%',
          transform:      monolithVisible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.94)',
          width:          'min(420px, 90vw)',
          height:         'min(180px, 40vh)',
          background:     'rgba(5,5,5,0.95)',
          border:         '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(2px)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          opacity:        monolithVisible ? 1 : 0,
          transition:     monolithVisible
            ? `opacity 0.45s ${EASE}, transform 0.45s ${EASE}`
            : 'none',
          zIndex: 30,
        }}
      >
        <p
          style={{
            margin:         0,
            fontFamily:     'var(--font-mono, monospace)',
            fontSize:       13,
            letterSpacing:  '0.35em',
            color:          '#E8E4D8',
            textTransform:  'uppercase',
            whiteSpace:     'pre',
            userSelect:     'none',
          }}
        >
          <ScrambleText active={scrambleActive} />
        </p>
      </div>

      {/* Contact lines — staggered fade-in below monolith */}
      <div
        style={{
          position:       'fixed',
          top:            'calc(50% + min(105px, 23vh))',
          left:           '50%',
          transform:      'translateX(-50%)',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '0.55rem',
          zIndex:         30,
        }}
      >
        {CONTACT_LINES.map((line, i) => {
          const delayMs = 200 + i * 200;
          const color   = line.accent ? '#B8FF3C' : 'rgba(232,228,216,0.62)';

          const commonStyle: React.CSSProperties = {
            fontFamily:    'var(--font-mono, monospace)',
            fontSize:      11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color,
            textDecoration: 'none',
            display:       'block',
            opacity:       contactVisible ? 1 : 0,
            transform:     contactVisible ? 'translate(0,0)' : line.initialTranslate,
            transition:    contactVisible
              ? `opacity 700ms ${EASE} ${delayMs}ms, transform 700ms ${EASE} ${delayMs}ms`
              : 'none',
            whiteSpace: 'nowrap',
          };

          if (!line.href) {
            return <span key={line.label} style={commonStyle}>{line.label}</span>;
          }

          const isExternal = line.href.startsWith('http');
          return (
            <a
              key={line.label}
              href={line.href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noreferrer noopener' : undefined}
              style={commonStyle}
            >
              {line.label}
            </a>
          );
        })}
      </div>

      {/* Cursor blink — single screen-flash after all content lands */}
      {blinkActive && (
        <div
          aria-hidden
          style={{
            position:      'fixed',
            inset:         0,
            background:    'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
            zIndex:        40,
            animation:     'sg-blink 700ms ease-out forwards',
          }}
        />
      )}

      <style>{`
        @keyframes sg-blink {
          0%   { opacity: 1; }
          60%  { opacity: 0.5; }
          100% { opacity: 0; }
        }
      `}</style>
    </Html>
  );
}
