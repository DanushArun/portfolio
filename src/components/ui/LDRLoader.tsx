'use client';

import React, { useEffect, useState } from 'react';

// --- INTENSE THEMATIC SYMBOLS ---

const Singularity = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
    <circle cx="50" cy="50" r="15" fill="currentColor" />
    <ellipse cx="50" cy="50" rx="40" ry="10" strokeWidth="2" transform="rotate(15 50 50)" />
    <ellipse cx="50" cy="50" rx="38" ry="8" transform="rotate(-15 50 50)" opacity="0.6" />
    <ellipse cx="50" cy="50" rx="42" ry="12" transform="rotate(45 50 50)" opacity="0.3" />
    <circle cx="50" cy="50" r="25" strokeDasharray="2 4" opacity="0.5" />
  </svg>
);

const Wormhole = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
    {Array.from({length: 10}).map((_, i) => (
      <ellipse key={i} cx="50" cy="50" rx={10 + i*4} ry={4 + i*2} opacity={1 - i*0.08} />
    ))}
    <path d="M 50 10 C 20 40, 40 45, 50 50 C 60 45, 80 40, 50 10" opacity="0.5"/>
    <path d="M 50 90 C 20 60, 40 55, 50 50 C 60 55, 80 60, 50 90" opacity="0.5"/>
  </svg>
);

const EventHorizon = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
    <circle cx="50" cy="50" r="20" fill="currentColor" />
    <path d="M 10 50 A 40 40 0 0 1 90 50" strokeWidth="2" />
    <path d="M 15 50 A 35 35 0 0 0 85 50" opacity="0.6" />
    <path d="M 20 50 A 30 30 0 0 1 80 50" strokeDasharray="1 3" />
    <circle cx="50" cy="50" r="45" opacity="0.2" />
  </svg>
);

const Quasar = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
    <circle cx="50" cy="50" r="8" fill="currentColor" />
    <path d="M 50 42 L 50 5" strokeWidth="3" strokeLinecap="round"/>
    <path d="M 50 58 L 50 95" strokeWidth="3" strokeLinecap="round"/>
    <path d="M 45 50 L 10 50 M 55 50 L 90 50" strokeDasharray="2 4"/>
    <ellipse cx="50" cy="50" rx="30" ry="6" opacity="0.8"/>
    <ellipse cx="50" cy="50" rx="20" ry="4" strokeWidth="2"/>
  </svg>
);

const Magnetar = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
    <circle cx="50" cy="50" r="10" fill="currentColor" />
    <path d="M 50 40 C 0 0, 0 100, 50 60" opacity="0.6"/>
    <path d="M 50 40 C 100 0, 100 100, 50 60" opacity="0.6"/>
    <path d="M 50 30 C -20 -20, -20 120, 50 70" opacity="0.3"/>
    <path d="M 50 30 C 120 -20, 120 120, 50 70" opacity="0.3"/>
    <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="4 4" opacity="0.5"/>
  </svg>
);

const BinaryMerger = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" width="100%" height="100%">
    <circle cx="35" cy="50" r="8" fill="currentColor" />
    <circle cx="65" cy="50" r="8" fill="currentColor" />
    <path d="M 35 42 C 50 30, 65 42, 65 42" strokeWidth="2"/>
    <path d="M 35 58 C 50 70, 65 58, 65 58" strokeWidth="2"/>
    <ellipse cx="50" cy="50" rx="40" ry="20" opacity="0.4" transform="rotate(30 50 50)"/>
    <ellipse cx="50" cy="50" rx="40" ry="20" opacity="0.4" transform="rotate(-30 50 50)"/>
  </svg>
);

const icons = [
  <Singularity key="s" />, 
  <Wormhole key="w" />, 
  <EventHorizon key="eh" />, 
  <Quasar key="q" />, 
  <Magnetar key="m" />, 
  <BinaryMerger key="bm" />
];

export default function LDRLoader() {
  const [index, setIndex] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % icons.length);
      if (Math.random() > 0.6) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 40);
      }
    }, 90);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--color-void)] flex items-center justify-center z-[100] overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />

      {/* Background glitch lines */}
      {glitch && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 w-full h-px bg-white/20" />
          <div className="absolute top-2/3 left-0 w-full h-[2px] bg-white/10" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/30" />
        </div>
      )}

      <div className={`relative w-32 h-32 text-white transition-transform duration-75 ${glitch ? 'scale-110 translate-x-1 rotate-1' : 'scale-100'}`}>
        {icons[index]}
        
        {/* Chromatic Aberration Glitch */}
        {glitch && (
          <>
            <div className="absolute inset-0 text-[#ff00ff] opacity-70 translate-x-1 translate-y-1 mix-blend-screen">
              {icons[index]}
            </div>
            <div className="absolute inset-0 text-[#00ffff] opacity-70 -translate-x-1 -translate-y-1 mix-blend-screen">
              {icons[index]}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
