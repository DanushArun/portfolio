'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Line = {
  text: string;
  kind: 'small' | 'huge';
  accent?: boolean;
};

const LINES: Line[] = [
  { text: 'he builds systems that cross boundaries', kind: 'small' },
  // ELECTRO / MAGNETIC split across two lines. The single word was clipping
  // the right edge on narrow viewports even with clamp() font sizing; the
  // split also reads more dramatically stacked.
  { text: 'ELECTRO', kind: 'huge' },
  { text: 'MAGNETIC', kind: 'huge' },
  { text: 'THEORY', kind: 'huge' },
  { text: '→ production software', kind: 'small' },
  { text: 'QUANTUM', kind: 'huge', accent: true },
  { text: 'INTO', kind: 'huge' },
  { text: 'FINANCE', kind: 'huge', accent: true },
];

const CREAM = '#E8E4D8';
const LIME = '#B8FF3C';
const MUTED = 'rgba(232,228,216,0.45)';

export default function Manifesto({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wordsRef.current;
    const trigger = sectionRef.current;
    if (!root || !trigger) return;

    const words = root.querySelectorAll<HTMLElement>('.m-word');
    if (words.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(words, {
        z: -120,
        rotateX: 35,
        opacity: 0,
        transformOrigin: 'left bottom',
      });

      gsap.to(words, {
        z: 0,
        rotateX: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.12,
        ease: 'power4.out',
        scrollTrigger: {
          trigger,
          start: 'top 80%',
          once: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={className}
      style={{
        minHeight: '100vh',
        background: '#0B0D10',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '8vh 2rem 6vh',
        perspective: '1400px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        overflow: 'hidden',
        overflowX: 'hidden',
      }}
    >
      <div
        ref={wordsRef}
        style={{
          transformStyle: 'preserve-3d',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          width: '100%',
        }}
      >
        {LINES.map((line, i) => {
          const isHuge = line.kind === 'huge';
          const color = line.accent ? LIME : isHuge ? CREAM : MUTED;
          const style: React.CSSProperties = isHuge
            ? {
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(2.2rem, 6vw, 5.25rem)',
                letterSpacing: '-0.04em',
                lineHeight: 0.88,
                color,
                display: 'block',
                willChange: 'transform, opacity',
                textTransform: 'uppercase',
                maxWidth: '100%',
              }
            : {
                fontFamily: '"Space Mono", monospace',
                fontSize: 'clamp(0.8rem, 1.5vw, 1.2rem)',
                color,
                display: 'block',
                letterSpacing: '0.02em',
                margin: isHuge ? 0 : '0.6rem 0',
                willChange: 'transform, opacity',
              };
          return (
            <span key={i} className="m-word" style={style}>
              {line.text}
            </span>
          );
        })}
      </div>
    </section>
  );
}
