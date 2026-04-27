'use client';

/**
 * Descent — 3.2s event-horizon crossing sequence.
 *
 * Timeline (Script-aligned):
 *   0.0–0.8s  Event Horizon: Accretion disk fills frame, shadow swallows (Three.js drives this)
 *   0.8–1.2s  Equation: Einstein field equation fades in
 *   1.2–1.6s  Equation: Holds, then begins to dissolve
 *   1.6–2.6s  The Void: Total silence/darkness. Single amber point of light grows far away.
 *   2.6–3.2s  The Warp: Point expands violently into MIRA_PULSAR scene.
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { useScene } from '@/lib/scene-state';

const EQUATION = 'Rμν − ½gμνR + Λgμν = 8πG/c⁴ · Tμν';

// Cinematic easing for the warp
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function Descent() {
  const setPhase = useScene((s) => s.setPhase);

  // Stage: 0=BH rush, 1=equation, 2=void+point, 3=warp
  const [stage, setStage]               = useState(0);
  const [eqOpacity, setEqOpacity]       = useState(0);
  const [staticAmt, setStaticAmt]       = useState(0);
  const [pointScale, setPointScale]     = useState(0);
  const [pointOpacity, setPointOpacity] = useState(0);
  const [warpIntensity, setWarpIntensity] = useState(0);

  const rafRef    = useRef<number | null>(null);
  const veilFired = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    let active = true;

    const tick = () => {
      if (!active) return;
      const t = (performance.now() - t0) / 1000;

      if (t < 0.8) {
        setStage(0);
        // BH is already filling the screen via SceneManager progress=1/isDescent=true
      } else if (t < 1.6) {
        setStage(1);
        if (t < 1.2) {
          setEqOpacity(Math.min(1, (t - 0.8) / 0.4));
          setStaticAmt(0);
        } else {
          setEqOpacity(1);
          setStaticAmt((t - 1.2) / 0.4);
        }
      } else if (t < 2.6) {
        setStage(2);
        setEqOpacity(0);
        const p = (t - 1.6) / 1.0; // 1s duration
        setPointOpacity(Math.pow(p, 3)); // slow reveal
        setPointScale(p * 0.05);
      } else if (t < 3.2) {
        setStage(3);
        const p = (t - 2.6) / 0.6; // 0.6s warp
        setPointOpacity(1);
        setPointScale(0.05 + easeInOutCubic(p) * 10);
        setWarpIntensity(easeInOutCubic(p));

        if (p > 0.5 && !veilFired.current) {
          veilFired.current = true;
          useScene.getState().setVeil(1);
        }
      } else {
        setPhase('BOSON_STAR');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [setPhase]);

  return (
    <>
      {/* ── Visual Overlays ── */}
      
      {/* Black darkness barrier */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 30,
        background: '#000',
        opacity: stage >= 2 ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
      }} />

      {/* Einstein equation with static breakdown */}
      {stage === 1 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 31,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'clamp(1rem, 2.8vw, 1.8rem)',
            letterSpacing: '0.15em',
            color: '#E8E4D8',
            opacity: eqOpacity,
            filter: `blur(${staticAmt * 2}px)`,
            userSelect: 'none',
          }}>
            {EQUATION.split('').map((ch, i) => {
              const staticChars = '█▓▒░|/\\─│┼╬╪╫';
              const replaced = Math.random() < staticAmt * 1.2;
              return (
                <span key={i} style={{ 
                  opacity: replaced ? 0.3 : 1,
                  display: 'inline-block',
                  transform: replaced ? `translate(${Math.random()*4-2}px, ${Math.random()*4-2}px)` : 'none'
                }}>
                  {replaced ? staticChars[Math.floor(Math.random() * staticChars.length)] : ch}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* The Singular Point / Warp Bloom */}
      {stage >= 2 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Main amber core */}
          <div style={{
            width:  `${4 + pointScale * 500}px`,
            height: `${4 + pointScale * 500}px`,
            borderRadius: '50%',
            background: stage === 3 
              ? `radial-gradient(circle, #fff 0%, #FFD580 20%, #E8820C 50%, transparent 80%)`
              : '#E8820C',
            opacity: pointOpacity,
            boxShadow: stage === 3 
              ? `0 0 ${100 + warpIntensity * 400}px ${50 + warpIntensity * 200}px rgba(255,213,128,${0.4 * (1-warpIntensity)})`
              : '0 0 20px 5px rgba(232,130,12,0.8)',
            transform: `scale(${1 + warpIntensity * 2})`,
            filter: `blur(${warpIntensity * 10}px)`,
          }} />
          
          {/* Radial Warp Streaks (Fraser-style light streaks) */}
          {stage === 3 && (
            <div style={{
              position: 'absolute',
              width: '200vw',
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,213,128,0.8) 50%, transparent 100%)',
              opacity: warpIntensity * 0.6,
              transform: `rotate(${Math.random()*360}deg) scaleX(${warpIntensity * 5})`,
              filter: 'blur(1px)',
            }} />
          )}
        </div>
      )}

      {/* Full-screen flash/warp distortion filter */}
      {stage === 3 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 35,
          background: `radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,${warpIntensity * 0.8}) 100%)`,
          backdropFilter: `blur(${warpIntensity * 20}px) brightness(${1 + warpIntensity * 2})`,
          opacity: warpIntensity,
          pointerEvents: 'none',
        }} />
      )}
    </>
  );
}
