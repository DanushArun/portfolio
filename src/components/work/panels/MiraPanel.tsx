'use client';

/**
 * MiraPanel — center-left title block + language status column.
 * Matches the canonical spec frame (2026-05-13).
 */

import { useEffect, useState } from 'react';
import { panelHues, type } from '@/lib/design-tokens';
import { panelCopy } from '@/lib/copy';
import { useMiraState, KNOT_TABLE, type MiraLang } from '@/lib/mira-state';

const LANG_ORDER: readonly MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE'];

export default function MiraPanel() {
  const c = panelCopy.W01_MIRA;
  const hue = panelHues.W01_MIRA;
  const activeLang = useMiraState((s) => s.activeLang);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      color: '#E8E4D8', pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* 1. Language status column (bottom-left) */}
      <div style={{
        position: 'absolute', bottom: 'clamp(2rem, 4vw, 4rem)', left: 'clamp(2rem, 4vw, 4rem)',
        display: 'flex', flexDirection: 'column', gap: '0.8rem',
      }}>
        {KNOT_TABLE.map((k) => {
          const isActive = k.lang === activeLang;
          return (
            <div key={k.lang} style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              opacity: isActive ? 1 : 0.45, transition: 'opacity 0.4s',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: k.hue, boxShadow: isActive ? `0 0 12px ${k.hue}` : 'none',
              }} />
              <div style={{
                fontFamily: type.mono, fontSize: '10px', letterSpacing: '0.1em',
                display: 'flex', gap: '0.6rem',
              }}>
                <span style={{ fontWeight: 600 }}>{k.lang}</span>
                <span style={{ opacity: 0.6 }}>{c.languages[LANG_ORDER.indexOf(k.lang)]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Main Title Block (center-left) */}
      <div style={{
        position: 'absolute', top: '50%', left: 'clamp(2rem, 4vw, 4rem)',
        transform: 'translateY(-50%)', maxWidth: 'min(380px, 30vw)',
      }}>
        <ClusterGlyph
          activeIndex={LANG_ORDER.indexOf(activeLang)}
          primary={hue.primary}
          accent={hue.accent}
        />
        <h1 style={{
          fontFamily: type.display, margin: '1.1rem 0 0.30rem',
          fontSize: 'clamp(3.2rem, 5.6vw, 4.8rem)',
          fontWeight: 300, letterSpacing: '0.04em', lineHeight: 0.95,
          color: hue.primary,
        }}>
          MIRA
        </h1>
        <div style={{
          fontFamily: type.body, fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
          letterSpacing: '0.02em', opacity: 0.78, marginBottom: '1.3rem',
          color: hue.accent,
        }}>
          Virgo Linguistic Supercluster
        </div>
        <p style={{
          fontFamily: type.body, fontSize: 'clamp(0.82rem, 0.92vw, 0.92rem)',
          lineHeight: 1.62, opacity: 0.72, margin: 0,
        }}>
          {c.body}
        </p>
      </div>

      {/* 3. Live Ticker (bottom-center) */}
      <div style={{
        position: 'absolute', bottom: 'clamp(2rem, 4vw, 4rem)', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center',
        fontFamily: type.mono, letterSpacing: '0.05em',
      }}>
        <div style={{ fontSize: '12px', color: hue.accent, marginBottom: '0.25rem' }}>
          LIVE · <span style={{ color: '#FFF' }}>{c.languages[LANG_ORDER.indexOf(activeLang)]}</span> · 482ms
        </div>
        <div style={{ fontSize: '9px', opacity: 0.5 }}>
          TRAINING SIGNAL · <span style={{ color: hue.accent }}>+2.0% / call</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// CLUSTER GLYPH — tiny SVG echo of the 3D supercluster
// ────────────────────────────────────────────────────────────────────────

function ClusterGlyph({
  activeIndex, primary, accent,
}: { activeIndex: number; primary: string; accent: string }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const phase = (t % 0.482) / 0.482;
      const p = Math.exp(-Math.pow(phase * 18, 2)) * 0.6
              + Math.exp(-Math.pow((phase - 0.18) * 22, 2)) * 0.30;
      setPulse(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodes = KNOT_TABLE.map((k) => ({
    lang: k.lang,
    cx: 30 + k.position[0] * 8,
    cy: 20 - k.position[1] * 6,
    r:  0.85 + k.relativeScale * 0.6,
    hue: k.hue,
  }));

  const edges: Array<[number, number]> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) edges.push([i, j]);
  }

  return (
    <svg viewBox="0 0 60 40" width="64" height="44" style={{ display: 'block' }}>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke={accent}
          strokeWidth={0.18}
          strokeOpacity={0.30}
        />
      ))}
      {nodes.map((n, i) => {
        const isActive = i === activeIndex;
        const r = n.r * (isActive ? 1.0 + pulse * 0.45 : 1.0);
        const color = isActive ? n.hue : accent;
        return (
          <g key={n.lang}>
            <circle
              cx={n.cx} cy={n.cy} r={r * 2.6}
              fill={color}
              fillOpacity={isActive ? 0.20 + pulse * 0.32 : 0.06}
            />
            <circle
              cx={n.cx} cy={n.cy} r={r}
              fill={isActive ? '#FFF7E6' : color}
              fillOpacity={isActive ? 0.95 : 0.50}
            />
          </g>
        );
      })}
      {/* unused primary import — keep param signature stable */}
      {primary === '' ? null : null}
    </svg>
  );
}
