'use client';

import { useScene, phaseTime } from '@/lib/scene-state';
import { useEffect, useState } from 'react';

/**
 * DOM overlays — top/bottom strip with cinematic text, ENTER prompt.
 * Everything pointer-events:none except the ENTER button.
 */
export default function HUD() {
  // Subscribe only to the slices HUD actually reads. Whole-store subscriptions
  // cause HUD to re-render on every scroll/frame update inside the scene,
  // which cascades into the Canvas tree and has caused dev-overlay serialization
  // errors during phase transitions.
  const phase = useScene((s) => s.phase);
  const phaseStart = useScene((s) => s.phaseStart);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const scene = { phase, phaseStart };
  const seconds = phase === 'IDLE' ? 0 : phaseTime(phaseStart);

  return (
    <>
      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          letterSpacing: '0.25em',
          color: 'rgba(232,228,216,0.42)',
          zIndex: 10,
          pointerEvents: 'none',
          textTransform: 'uppercase',
        }}
      >
        <div
          style={{
            opacity: scene.phase === 'FINAL' ? 0 : 1,
            transition: 'opacity 1.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          DA · OBS-24 · SAGITTARIUS A★
        </div>
        {scene.phase !== 'FINAL' && (
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>
            {scene.phase} · {seconds.toFixed(2)}s
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '1.25rem 2rem',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          letterSpacing: '0.2em',
          color: 'rgba(232,228,216,0.3)',
          zIndex: 10,
          pointerEvents: 'none',
          textTransform: 'uppercase',
        }}
      >
        <div>
          <div>Schwarzschild Metric</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
            Event horizon · r = 2GM/c²
          </div>
          {scene.phase === 'ASSEMBLY' && (
            <div
              style={{
                color: 'rgba(184,255,60,0.75)',
                marginTop: 10,
                letterSpacing: '0.3em',
                fontSize: 9,
              }}
            >
              GRAVITY SYSTEM ACTIVE
            </div>
          )}
        </div>
        {scene.phase === 'IDLE' && <EnterButton />}
        {scene.phase === 'VOID' && (
          <div
            style={{
              color: 'rgba(184,255,60,0.8)',
              letterSpacing: '0.3em',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: 10 }}>TIME DILATION — ∞</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              v / c → 1
            </div>
          </div>
        )}
        {(scene.phase === 'UNIVERSE' || scene.phase === 'ASSEMBLY' || scene.phase === 'FINAL') && (
          <div style={{ color: 'rgba(184,255,60,0.7)', textAlign: 'right' }}>
            <div style={{ fontSize: 10 }}>DANUSH ARUN — 2026</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
              scroll to explore
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EnterButton() {
  const begin = useScene((s) => s.beginJourney);
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={begin}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        pointerEvents: 'auto',
        background: 'transparent',
        border: 'none',
        padding: '0.5rem 0',
        color: hover ? '#B8FF3C' : '#E8E4D8',
        fontFamily: 'var(--font-display, serif)',
        fontWeight: 800,
        fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
        letterSpacing: '-0.02em',
        cursor: 'pointer',
        transition: 'color 0.4s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
      }}
      aria-label="Enter the black hole"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
        <span
          style={{
            width: hover ? 60 : 30,
            height: 1,
            background: hover ? '#B8FF3C' : 'rgba(232,228,216,0.5)',
            transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
            display: 'inline-block',
          }}
        />
        ENTER
      </span>
      <span
        style={{
          display: 'block',
          fontSize: 9,
          letterSpacing: '0.3em',
          opacity: 0.5,
          fontFamily: 'var(--font-mono)',
          fontWeight: 400,
          marginTop: 4,
          textTransform: 'uppercase',
        }}
      >
        cross the event horizon
      </span>
    </button>
  );
}
