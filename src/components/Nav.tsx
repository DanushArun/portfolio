'use client';

import { useEffect, useRef, useState } from 'react';

const SECTIONS = [
  'hero',
  'manifesto',
  'mira',
  'projects',
  'numbers',
  'formula',
  'contact',
] as const;

type SectionId = (typeof SECTIONS)[number];

export default function Nav() {
  const [activeSection, setActiveSection] = useState(0);
  // Sweep state: a 2px lime line that scales across the viewport when the
  // active section changes. Lando-inspired: lime should appear sparingly —
  // each sweep is one of those rare appearances.
  const [sweeping, setSweeping] = useState(false);
  const prevActive = useRef(0);
  const sweepTimer = useRef<number | null>(null);

  useEffect(() => {
    if (prevActive.current === activeSection) return;
    prevActive.current = activeSection;
    // Double RAF: reset to scale 0, then trigger scale 1 so the CSS
    // transition always plays (React batch could otherwise skip it).
    setSweeping(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSweeping(true));
    });
    if (sweepTimer.current) window.clearTimeout(sweepTimer.current);
    sweepTimer.current = window.setTimeout(() => setSweeping(false), 400);
    return () => {
      if (sweepTimer.current) window.clearTimeout(sweepTimer.current);
    };
  }, [activeSection]);

  useEffect(() => {
    const elements: HTMLElement[] = [];
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) elements.push(el);
    });

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = SECTIONS.indexOf(entry.target.id as SectionId);
          if (index === -1) continue;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }
        if (bestIndex !== -1) setActiveSection(bestIndex);
      },
      { threshold: [0.25, 0.5, 0.75] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: SectionId) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Section-change sweep: 2px lime line across viewport. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '50%',
          left: 0,
          width: '100%',
          height: '2px',
          background: '#B8FF3C',
          boxShadow: '0 0 8px rgba(184,255,60,0.6)',
          transform: sweeping ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: sweeping ? 'left' : 'right',
          transition: 'transform 0.38s cubic-bezier(0.65, 0.05, 0, 1)',
          pointerEvents: 'none',
          zIndex: 99,
        }}
      />
    <nav
      aria-label="Section navigation"
      style={{
        position: 'fixed',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '-32px',
          bottom: '-32px',
          width: '1px',
          background: 'rgba(255,255,255,0.06)',
          transform: 'translateX(-50%)',
        }}
      />

      {SECTIONS.map((section, i) => {
        const isActive = activeSection === i;
        return (
          <button
            key={section}
            type="button"
            aria-label={`Go to ${section} section`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => scrollToSection(section)}
            style={{
              position: 'relative',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: isActive ? '#B8FF3C' : 'rgba(255,255,255,0.14)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              transform: isActive ? 'scale(1.8)' : 'scale(1)',
            }}
          />
        );
      })}
    </nav>
    </>
  );
}
