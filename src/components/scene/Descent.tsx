'use client';

/**
 * Descent — 3.5s event-horizon crossing sequence.
 *
 * Timeline:
 *   0.0–0.8s  Black (disk fills screen in BH shader)
 *   0.8–1.6s  Einstein equation fades in, holds
 *   1.6–2.2s  Equation dissolves to static
 *   2.2–2.6s  Total darkness
 *   2.6–3.1s  Amber singularity point grows from nothing
 *   3.1–3.5s  Stage 4: veil fires (black cover for canvas swap),
 *              hyperspace streaks shoot radially, amber point fades
 *   3.5s+     setPhase → MIRA_PULSAR
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { useScene } from '@/lib/scene-state';

const EQUATION = 'Rμν − ½gμνR + Λgμν = 8πG/c⁴ · Tμν';

// Pre-generate stable hyperspace streak geometry (avoid Math.random in render)
function makeStreaks(count: number) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * 360;
    const jitter    = (Math.random() * 10 - 5);
    out.push({
      angle:   baseAngle + jitter,
      width:   1.2 + Math.random() * 2.2,
      opacity: 0.25 + Math.random() * 0.45,
      length:  40  + Math.random() * 30,   // % of viewport height
    });
  }
  return out;
}

export default function Descent() {
  const setPhase = useScene((s) => s.setPhase);

  // Stage: 0=black, 1=equation, 2=dissolving, 3=darkness+point, 4=hyperspace+veil
  const [stage, setStage]               = useState(0);
  const [eqOpacity, setEqOpacity]       = useState(0);
  const [staticAmt, setStaticAmt]       = useState(0);
  const [pointScale, setPointScale]     = useState(0);
  const [pointOpacity, setPointOpacity] = useState(0);
  const [hyperAmt, setHyperAmt]         = useState(0); // 0→1→0 bell curve for streaks

  const rafRef    = useRef<number | null>(null);
  const veilFired = useRef(false);

  // Stable streak geometry (computed once on mount)
  const streaks = useMemo(() => makeStreaks(32), []);

  useEffect(() => {
    const t0 = performance.now();
    let active = true;

    const tick = () => {
      if (!active) return;
      const t = (performance.now() - t0) / 1000;

      if (t < 0.8) {
        setStage(0);
      } else if (t < 1.2) {
        setStage(1);
        setEqOpacity(Math.min(1, (t - 0.8) / 0.4));
        setStaticAmt(0);
      } else if (t < 1.6) {
        setStage(1);
        setEqOpacity(1);
        setStaticAmt(0);
      } else if (t < 2.2) {
        setStage(2);
        const p = (t - 1.6) / 0.6;
        setStaticAmt(p);
        setEqOpacity(1 - p * 0.7);
      } else if (t < 2.6) {
        setStage(3);
        setEqOpacity(0);
        setPointOpacity(0);
        setPointScale(0);
      } else if (t < 3.1) {
        setStage(3);
        const p = (t - 2.6) / 0.5;
        setPointOpacity(p);
        setPointScale(p * p * 0.4);
      } else if (t < 3.5) {
        // Stage 4 — Star Wars moment.
        // Fire the veil first (instant black, invisible under existing overlays)
        // then hyperspace streaks radiate while amber point fades.
        setStage(4);
        if (!veilFired.current) {
          veilFired.current = true;
          useScene.getState().setVeil(1);
        }
        const p = (t - 3.1) / 0.4; // 0→1
        setPointOpacity(1 - p);
        setPointScale(0.4 + p * 3);
        setHyperAmt(Math.sin(p * Math.PI)); // bell: 0 → peak at p=0.5 → 0
      } else {
        setPhase('MIRA_PULSAR');
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
      {/* Black overlay — solid during darkness stages */}
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
            userSelect: 'none',
          }}>
            {stage === 2
              ? EQUATION.split('').map((ch, i) => {
                  const staticChars = '█▓▒░|/\\─│┼╬╪╫';
                  const replaced = Math.random() < staticAmt * 0.85;
                  return (
                    <span
                      key={i}
                      style={{
                        opacity: replaced ? staticAmt : 1,
                        color: replaced ? 'rgba(255,255,255,0.3)' : '#fff',
                      }}
                    >
                      {replaced ? staticChars[Math.floor(Math.random() * staticChars.length)] : ch}
                    </span>
                  );
                })
              : EQUATION}
          </div>
        </div>
      )}

      {/* Amber singularity point */}
      {stage >= 3 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 31,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width:  `${4 + pointScale * 300}px`,
            height: `${4 + pointScale * 300}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFD580 0%, #E8820C 30%, #000 70%)',
            opacity: pointOpacity,
            boxShadow: `0 0 ${60 + pointScale * 200}px ${20 + pointScale * 80}px rgba(232,130,12,0.4)`,
          }} />
        </div>
      )}

      {/* ── Hyperspace effect (stage 4 only) ── */}
      {/* Radial amber/white streaks simulate stars stretching to lightspeed.
          All streaks are above the veil (z:25) at z:36 so they're visible
          against the black background during the crossing flash. */}
      {stage === 4 && hyperAmt > 0.01 && (
        <>
          {/* Central radial glow */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 36,
            background: `radial-gradient(circle at 50% 50%,
              rgba(255,230,120,${hyperAmt * 0.55}) 0%,
              rgba(255,160,40,${hyperAmt * 0.2}) 15%,
              transparent 55%
            )`,
            pointerEvents: 'none',
          }} />

          {/* Speed-line streaks radiating from viewport center */}
          {streaks.map((s, i) => (
            <div
              key={i}
              aria-hidden
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                width:  `${s.width}px`,
                height: `${s.length * hyperAmt}vh`,
                transformOrigin: 'top center',
                transform: `translateX(-50%) rotate(${s.angle}deg)`,
                background: 'linear-gradient(to bottom, rgba(255,230,120,0.9) 0%, rgba(255,200,80,0.35) 40%, transparent 100%)',
                opacity: s.opacity * hyperAmt,
                pointerEvents: 'none',
                zIndex: 36,
              }}
            />
          ))}
        </>
      )}
    </>
  );
}
