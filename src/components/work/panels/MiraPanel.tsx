'use client';

/**
 * MiraPanel — bespoke overlay for the interactive supercluster.
 *
 * The 3D rendering (MiraSupercluster + MiraPlume) lives in the main R3F
 * canvas. This panel is intentionally sparse — only the project's name,
 * its astronomical-catalog designation, a short caption, and interaction
 * hints. Everything else (chips, response-time metric, signal rail, the
 * language script stack) was removed so the cosmic web has the frame to
 * itself.
 *
 * Title treatment: "MIRA" + serif-tracked subtitle + a 5-node cosmic-web
 * SVG glyph that pulses on the active language. The glyph is the bespoke
 * mark — it visually echoes what's rendering behind it.
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
      color: '#E8E4D8', pointerEvents: 'none',
    }}>
      {/* ── Top-left — catalog designation ──────────────────────── */}
      <div style={{
        position: 'absolute', top: 'clamp(2rem, 4vw, 4rem)', left: 'clamp(2rem, 4vw, 4rem)',
        display: 'flex', flexDirection: 'column', gap: '0.35rem',
      }}>
        <span style={{
          fontFamily: type.mono, fontSize: '10px', letterSpacing: '0.32em',
          textTransform: 'uppercase', color: 'rgba(232,228,216,0.42)',
        }}>
          VLS-001 · MIRA · {c.number}
        </span>
        <span style={{
          fontFamily: type.mono, fontSize: '9px', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: hue.accent, opacity: 0.55,
        }}>
          RA 12ʰ 35ᵐ &nbsp;·&nbsp; DEC −05° 12′ &nbsp;·&nbsp; z = 0.0067
        </span>
      </div>

      {/* ── Center-left — bespoke title block ───────────────────── */}
      <div style={{
        position: 'absolute', top: '50%', left: 'clamp(2rem, 4vw, 4rem)',
        transform: 'translateY(-50%)', maxWidth: 'min(440px, 36vw)',
      }}>
        <ClusterGlyph
          activeIndex={LANG_ORDER.indexOf(activeLang)}
          primary={hue.primary}
          accent={hue.accent}
        />
        <h1 style={{
          fontFamily: type.display, margin: '1.2rem 0 0.35rem',
          fontSize: 'clamp(3.4rem, 6.4vw, 5.6rem)',
          fontWeight: 300, letterSpacing: '0.04em', lineHeight: 0.95,
          color: hue.primary,
        }}>
          MIRA
        </h1>
        <div style={{
          fontFamily: type.body, fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(0.95rem, 1.15vw, 1.1rem)',
          letterSpacing: '0.02em', opacity: 0.78, marginBottom: '1.4rem',
          color: hue.accent,
        }}>
          Virgo Linguistic Supercluster
        </div>
        <p style={{
          fontFamily: type.body, fontSize: 'clamp(0.85rem, 0.95vw, 0.95rem)',
          lineHeight: 1.62, opacity: 0.72, margin: 0,
        }}>
          {c.body}
        </p>
      </div>

      {/* ── Bottom — interaction hints ──────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 'clamp(2rem, 4vw, 4rem)',
        left: 'clamp(2rem, 4vw, 4rem)',
        display: 'flex', gap: '2.6rem',
        fontFamily: type.mono, fontSize: '10px', letterSpacing: '0.30em',
        textTransform: 'uppercase', color: 'rgba(232,228,216,0.42)',
      }}>
        <span>⌖&nbsp; drag · rotate</span>
        <span>⊙&nbsp; hover · probe</span>
        <span>◐&nbsp; click · activate</span>
      </div>
    </div>
  );
}

/**
 * ClusterGlyph — a tiny SVG echo of the 3D supercluster.
 *
 * 5 nodes laid out roughly per KNOT_TABLE topology, with thin filaments
 * between every pair. The active language's node pulses warm; others stay
 * dim. This is the panel's "mark" — its visual identity is bound to what
 * the canvas is doing.
 */
function ClusterGlyph({
  activeIndex, primary, accent,
}: {
  activeIndex: number;
  primary: string;
  accent: string;
}) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      // 482ms-period gaussian heartbeat, same as the cosmic core.
      const phase = (t % 0.482) / 0.482;
      const p = Math.exp(-Math.pow(phase * 18, 2)) * 0.6
              + Math.exp(-Math.pow((phase - 0.18) * 22, 2)) * 0.30;
      setPulse(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Project KNOT_TABLE x,y to 2D glyph space (60×40 viewBox).
  const nodes = KNOT_TABLE.map((k) => ({
    lang: k.lang,
    cx: 30 + k.position[0] * 8,
    cy: 20 - k.position[1] * 6,
    r:  0.85 + k.relativeScale * 0.6,
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
        return (
          <g key={n.lang}>
            <circle
              cx={n.cx} cy={n.cy} r={r * 2.6}
              fill={isActive ? primary : accent}
              fillOpacity={isActive ? 0.18 + pulse * 0.30 : 0.06}
            />
            <circle
              cx={n.cx} cy={n.cy} r={r}
              fill={isActive ? '#FFF7E6' : accent}
              fillOpacity={isActive ? 0.95 : 0.55}
            />
          </g>
        );
      })}
    </svg>
  );
}
