'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const CREAM = '#E8E4D8';
const LIME = '#B8FF3C';
const INK = '#0B0D10';

const CONTACT_LINES: ReadonlyArray<{
  text: string;
  href?: string;
  muted?: boolean;
}> = [
  { text: 'DANUSH ARUN' },
  { text: 'Technical APM + Software Engineer', muted: true },
  { text: '' },
  { text: 'danusharun999@gmail.com', href: 'mailto:danusharun999@gmail.com' },
  { text: '+91 9901148254', href: 'tel:+919901148254' },
  {
    text: 'linkedin.com/in/danush-arun',
    href: 'https://linkedin.com/in/danush-arun',
  },
  { text: 'github.com/DanushArun', href: 'https://github.com/DanushArun' },
  { text: '' },
  { text: 'Currently: DriveX · Bengaluru', muted: true },
];

export default function Contact() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const rule = ruleRef.current;
    if (!section || !left || !right || !rule) return;

    gsap.set(left, { x: -40, autoAlpha: 0 });
    gsap.set(right, { x: 40, autoAlpha: 0 });
    gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.to(left, { x: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out' });
        gsap.to(right, {
          x: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: 'power3.out',
          delay: 0.12,
        });
        gsap.to(rule, {
          scaleX: 1,
          duration: 1.0,
          ease: 'power3.out',
          delay: 0.35,
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      style={{
        minHeight: '100vh',
        background: INK,
        color: CREAM,
        padding: 'clamp(2rem, 6vw, 5rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 6fr) minmax(0, 4fr)',
          gap: 'clamp(2rem, 5vw, 4rem)',
          flex: 1,
          alignItems: 'center',
          paddingTop: 'clamp(4rem, 10vh, 8rem)',
          paddingBottom: 'clamp(3rem, 8vh, 6rem)',
        }}
      >
        <div ref={leftRef} style={{ willChange: 'transform, opacity' }}>
          <h2
            style={{
              fontFamily: '"Syne", var(--font-geist-sans), sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(3rem, 7vw, 6rem)',
              letterSpacing: '-0.03em',
              lineHeight: 0.9,
              color: CREAM,
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Ready to build
            <br />
            something
            <br />
            remarkable?
          </h2>
          <div
            ref={ruleRef}
            style={{
              width: '80px',
              height: '1.5px',
              background: LIME,
              marginTop: 'clamp(2rem, 4vw, 3rem)',
            }}
          />
        </div>

        <div
          ref={rightRef}
          style={{
            willChange: 'transform, opacity',
            fontFamily: '"Space Mono", var(--font-geist-mono), monospace',
            fontSize: 'clamp(10px, 0.75vw, 11px)',
            lineHeight: 2,
            color: 'rgba(232, 228, 216, 0.6)',
          }}
        >
          {CONTACT_LINES.map((line, i) => {
            if (line.text === '') {
              return <div key={`gap-${i}`} style={{ height: '1.2em' }} />;
            }
            if (line.href) {
              const external = line.href.startsWith('http');
              return (
                <div key={i}>
                  <a
                    href={line.href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'color 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = CREAM;
                      (e.currentTarget as HTMLAnchorElement).style.textDecoration =
                        'underline';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'inherit';
                      (e.currentTarget as HTMLAnchorElement).style.textDecoration =
                        'none';
                    }}
                  >
                    {line.text}
                  </a>
                </div>
              );
            }
            return (
              <div
                key={i}
                style={{
                  color: line.muted ? 'rgba(232, 228, 216, 0.6)' : CREAM,
                  letterSpacing: line.muted ? '0.02em' : '0.08em',
                  textTransform: i === 0 ? 'uppercase' : 'none',
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          alignItems: 'center',
          fontFamily: '"Space Mono", var(--font-geist-mono), monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          paddingTop: '2rem',
        }}
      >
        <div style={{ fontSize: '9px', opacity: 0.2, color: CREAM }}>
          © 2026 Danush Arun
        </div>
        <div
          style={{
            fontSize: '8px',
            opacity: 0.15,
            color: CREAM,
            textAlign: 'center',
          }}
        >
          Built with Next.js · Three.js · GSAP · anime.js
        </div>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
          aria-hidden="true"
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: LIME,
                opacity: 0.35,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
