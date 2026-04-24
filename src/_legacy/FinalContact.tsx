'use client';

import { useEffect, useState } from 'react';
import { useScene } from '@/lib/scene-state';

/**
 * FINAL-phase contact constellation.
 *
 * Composition:
 *   1. A single monumental statement in Syne 800 (cream).
 *   2. A constellation of contact details in Space Mono (small, wide-tracked).
 *      The email receives the lime accent — it is the CTA.
 *
 * Each line fades + translates up on a staggered per-index delay so the lines
 * arrive one after the other instead of all at once. 1.5s window, cinematic
 * ease curve matches the camera reveal.
 */

type ContactLine = {
  label: string;
  href?: string;
  accent?: boolean;
};

const CONTACT_LINES: ContactLine[] = [
  { label: 'danusharun999@gmail.com', href: 'mailto:danusharun999@gmail.com', accent: true },
  { label: '+91 9901148254', href: 'tel:+919901148254' },
  {
    label: 'linkedin.com/in/danush-arun-5aa762267',
    href: 'https://www.linkedin.com/in/danush-arun-5aa762267',
  },
  { label: 'github.com/DanushArun', href: 'https://github.com/DanushArun' },
  { label: 'Bengaluru · India' },
];

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
// Lead with 300ms so the container fade has time to start before the
// constellation lines begin arriving.
const STAGGER_BASE_MS = 300;
const STAGGER_STEP_MS = 120;

export default function FinalContact() {
  const phase = useScene((s) => s.phase);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (phase !== 'FINAL') {
      setVisible(false);
      return;
    }
    // Small delay so the fade starts *after* the phase settles — avoids the
    // constellation popping in before the camera pull-back registers.
    const timer = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10vh',
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transition: `opacity 1.5s ${EASE}`,
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 20,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display, serif)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          letterSpacing: '-0.03em',
          color: '#E8E4D8',
          margin: 0,
          lineHeight: 1.05,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: `transform 1.2s ${EASE}, opacity 1.2s ${EASE}`,
          opacity: visible ? 1 : 0,
        }}
      >
        the universe knows where to find you.
      </h2>

      <ul
        style={{
          listStyle: 'none',
          margin: '2.5rem 0 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.55rem',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        {CONTACT_LINES.map((line, i) => {
          const delay = STAGGER_BASE_MS + i * STAGGER_STEP_MS;
          const color = line.accent ? '#B8FF3C' : 'rgba(232,228,216,0.62)';
          const style: React.CSSProperties = {
            color,
            textDecoration: 'none',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity 900ms ${EASE} ${delay}ms, transform 900ms ${EASE} ${delay}ms`,
          };
          return (
            <li key={line.label}>
              {line.href ? (
                <a
                  href={line.href}
                  target={line.href.startsWith('http') ? '_blank' : undefined}
                  rel={line.href.startsWith('http') ? 'noreferrer' : undefined}
                  style={style}
                >
                  {line.label}
                </a>
              ) : (
                <span style={style}>{line.label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
