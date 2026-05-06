'use client';

import React, { useEffect, useState } from 'react';
import { useScene } from '@/lib/scene-state';

// --- THEMATIC SYMBOLS ---

const Singularity = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const Quantum = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <circle cx="12" cy="12" r="2" />
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
  </svg>
);

const Spacetime = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M2 6h20M2 12h20M2 18h20M6 2v20M12 2v20M18 2v20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <circle cx="12" cy="12" r="4" fill="black" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const Delta = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M12 4L2 20h20L12 4z" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8l-6 10h12l-6-10z" />
  </svg>
);

const Flux = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M4 12h16M14 6l6 6-6 6M4 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Orbit = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
    <circle cx="20" cy="12" r="3" />
  </svg>
);

const icons = [
  <Singularity key="s" />, 
  <Quantum key="q" />, 
  <Spacetime key="st" />, 
  <Delta key="d" />, 
  <Flux key="f" />, 
  <Orbit key="o" />
];

export default function VoidPrologue() {
  const [index, setIndex] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % icons.length);
      if (Math.random() > 0.5) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 30);
      }
    }, 70); // Faster cycle than the loader for intensity

    // Fade out after 3s
    const fadeTimeout = setTimeout(() => {
      setOpacity(0);
    }, 3000);

    // Unmount after fade
    const unmountTimeout = setTimeout(() => {
      setMounted(false);
    }, 3800);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
      clearTimeout(unmountTimeout);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#020203] flex items-center justify-center z-[100] overflow-hidden pointer-events-none"
      style={{ 
        opacity,
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />

      {/* Background glitch lines */}
      {glitch && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-full h-px bg-white/20" />
          <div className="absolute top-2/3 left-0 w-full h-1 bg-white/10" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/30" />
        </div>
      )}

      <div className={`relative w-24 h-24 text-white transition-transform duration-75 ${glitch ? 'scale-110 translate-x-1' : 'scale-100'}`}>
        {icons[index]}
        
        {/* Chromatic Aberration Glitch */}
        {glitch && (
          <>
            <div className="absolute inset-0 text-[#ff00ff] opacity-50 translate-x-2 translate-y-1 mix-blend-screen">
              {icons[index]}
            </div>
            <div className="absolute inset-0 text-[#00ffff] opacity-50 -translate-x-2 -translate-y-1 mix-blend-screen">
              {icons[index]}
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-12 font-mono text-[10px] tracking-[0.4em] text-white/40 uppercase">
        INITIALISING SINGULARITY
      </div>
    </div>
  );
}
