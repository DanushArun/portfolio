'use client';

/**
 * Descent — 3.2s crossing sequence (DOM + WebGL).
 *
 * Timeline:
 *   0.0–0.8s  Accretion disk fills screen (handled by BH shader + camera)
 *   0.8–1.6s  Einstein equation full-screen, dissolves to static
 *   1.6–2.6s  Total darkness + single amber point growing
 *   2.6–3.2s  Point expands → MIRA_PULSAR
 *
 * This component handles the DOM layers. CameraRig handles the camera push.
 */

import { useEffect, useState, useRef } from 'react';
import { useScene } from '@/lib/scene-state';

const EQUATION = 'Rμν − ½gμνR + Λgμν = 8πG/c⁴ · Tμν';

export default function Descent() {
  const setPhase = useScene((s) => s.setPhase);

  // Stage: 0=initial black, 1=equation visible, 2=dissolving, 3=darkness+point, 4=done
  const [stage, setStage]   = useState(0);
  const [eqOpacity, setEqOpacity] = useState(0);
  const [staticAmt, setStaticAmt] = useState(0);  // 0..1 static overlay on equation
  const [pointScale, setPointScale] = useState(0); // 0..1 amber point size
  const [pointOpacity, setPointOpacity] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const t0 = performance.now();

    const tick = () => {
      const t = (performance.now() - t0) / 1000;

      if (t < 0.8) {
        // Still in "disk fills screen" — nothing to render yet
        setStage(0);
      } else if (t < 1.2) {
        // Equation fades in
        setStage(1);
        setEqOpacity(Math.min(1, (t - 0.8) / 0.4));
        setStaticAmt(0);
      } else if (t < 1.6) {
        // Equation holds
        setStage(1);
        setEqOpacity(1);
        setStaticAmt(0);
      } else if (t < 2.2) {
        // Equation dissolves to static character by character
        setStage(2);
        const progress = (t - 1.6) / 0.6;
        setStaticAmt(progress);
        setEqOpacity(1 - progress * 0.7);
      } else if (t < 2.6) {
        // Total darkness
        setStage(3);
        setEqOpacity(0);
        setPointOpacity(0);
        setPointScale(0);
      } else if (t < 3.1) {
        // Amber point grows
        setStage(3);
        const p = (t - 2.6) / 0.5;
        setPointOpacity(p);
        setPointScale(p * p * 0.4);
      } else if (t < 3.2) {
        // Point expands to fill — transition
        setStage(4);
        setPointScale(1);
        setPointOpacity(1);
      } else {
        // Advance to MIRA_PULSAR
        setPhase('MIRA_PULSAR');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [setPhase]);

  return (
    <>
      {/* Full black overlay for the darkness phase */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 30,
        background: '#000',
        opacity: stage === 0 ? 0 : stage === 3 ? 1 : 0,
        transition: stage === 3 ? 'opacity 0.3s' : 'none',
        pointerEvents: 'none',
      }} />

      {/* Einstein equation */}
      {(stage === 1 || stage === 2) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 31,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'clamp(1rem, 3.5vw, 2.2rem)',
            letterSpacing: '0.08em',
            color: '#fff',
            opacity: eqOpacity,
            position: 'relative',
            userSelect: 'none',
          }}>
            {/* Static overlay: randomly replace characters */}
            {stage === 2
              ? EQUATION.split('').map((ch, i) => {
                  const staticChars = '█▓▒░|/\\─│┼╬╪╫';
                  const replaced = Math.random() < staticAmt * 0.85;
                  return (
                    <span
                      key={i}
                      style={{ opacity: replaced ? staticAmt : 1,
                               color: replaced ? 'rgba(255,255,255,0.3)' : '#fff' }}
                    >
                      {replaced ? staticChars[Math.floor(Math.random() * staticChars.length)] : ch}
                    </span>
                  );
                })
              : EQUATION
            }
          </div>
        </div>
      )}

      {/* Amber point of light */}
      {stage >= 3 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 31,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: `${4 + pointScale * 300}px`,
            height: `${4 + pointScale * 300}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD580 0%, #E8820C 30%, #000 70%)',
            opacity: pointOpacity,
            transition: 'none',
            boxShadow: `0 0 ${60 + pointScale * 200}px ${20 + pointScale * 80}px rgba(232,130,12,0.4)`,
          }} />
        </div>
      )}
    </>
  );
}
