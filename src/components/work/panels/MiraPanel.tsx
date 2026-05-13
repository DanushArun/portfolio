'use client';

/**
 * MiraPanel — dashboard overlay for the Virgo Linguistic Supercluster.
 *
 * Layout zones (all pointer-events:none so the canvas takes interaction):
 *   • Top-left   — catalog designation (VLS-001 / RA / DEC / z)
 *   • Center-left — MIRA title block with bespoke ClusterGlyph + body
 *   • Center-top — "THE VIRGO SUPERCLUSTER" floating overlay caption
 *   • Right       — ActiveCoreBadge + ModelStrengthBars dashboard column
 *   • Bottom-left — interaction hints (drag/hover/click)
 *
 * Reference: founder-supplied "MIRA Live Dashboard" mock (2026-05-13).
 * Deferred to later phases: live calls-processed counter + sparklines +
 * bottom storyboard strip + cycle-stage 1-4 annotations on the canvas.
 */

import { useEffect, useState } from 'react';
import { panelHues, type } from '@/lib/design-tokens';
import { panelCopy } from '@/lib/copy';
import {
  useMiraState, KNOT_TABLE, type MiraLang,
} from '@/lib/mira-state';

const LANG_ORDER: readonly MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE'];

const LANG_LABEL: Record<MiraLang, { code: string; native: string; long: string }> = {
  EN: { code: 'EN', native: 'English',  long: 'English'  },
  HI: { code: 'HI', native: 'हिंदी',   long: 'Hindi'    },
  TA: { code: 'TA', native: 'தமிழ்',   long: 'Tamil'    },
  KN: { code: 'KN', native: 'ಕನ್ನಡ',   long: 'Kannada'  },
  TE: { code: 'TE', native: 'తెలుగు',  long: 'Telugu'   },
};

export default function MiraPanel() {
  const c = panelCopy.W01_MIRA;
  const hue = panelHues.W01_MIRA;
  const activeLang = useMiraState((s) => s.activeLang);
  const density = useMiraState((s) => s.density);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      color: '#E8E4D8', pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* ── Top-left — catalog designation ──────────────────────── */}
      <div style={{
        position: 'absolute', top: 'clamp(1.8rem, 3.5vw, 3rem)',
        left: 'clamp(2rem, 4vw, 4rem)',
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

      {/* ── Center-top — floating subtitle ──────────────────────── */}
      <div style={{
        position: 'absolute', top: '8%', left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center',
        opacity: 0.78,
      }}>
        <div style={{
          fontFamily: type.display, fontSize: 'clamp(1rem, 1.4vw, 1.25rem)',
          letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 300,
          color: '#E8E4D8',
        }}>
          The Virgo Supercluster
        </div>
        <div style={{
          fontFamily: type.body, fontStyle: 'italic',
          fontSize: 'clamp(0.78rem, 0.95vw, 0.92rem)',
          color: hue.accent, opacity: 0.75, marginTop: '0.2rem',
          letterSpacing: '0.02em',
        }}>
          Mira&rsquo;s multilingual brain · unified by knowledge, specialised by language
        </div>
      </div>

      {/* ── Center-left — bespoke title block ───────────────────── */}
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

      {/* ── Right — dashboard column ────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '50%', right: 'clamp(2rem, 4vw, 4rem)',
        transform: 'translateY(-50%)', width: 'clamp(220px, 19vw, 280px)',
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
      }}>
        <ActiveCoreBadge activeLang={activeLang} primary={hue.primary} accent={hue.accent} />
        <ModelStrengthBars density={density} activeLang={activeLang} />
      </div>

      {/* ── Bottom-left — interaction hints ─────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 'clamp(2rem, 4vw, 4rem)',
        left: 'clamp(2rem, 4vw, 4rem)',
        display: 'flex', gap: '2.4rem',
        fontFamily: type.mono, fontSize: '10px', letterSpacing: '0.30em',
        textTransform: 'uppercase', color: 'rgba(232,228,216,0.40)',
      }}>
        <span>⌖&nbsp; drag · rotate</span>
        <span>⊙&nbsp; hover · probe</span>
        <span>◐&nbsp; click · activate</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// ACTIVE CORE BADGE
// ────────────────────────────────────────────────────────────────────────

function ActiveCoreBadge({
  activeLang, primary, accent,
}: { activeLang: MiraLang; primary: string; accent: string }) {
  const lab = LANG_LABEL[activeLang];
  const knotHue = KNOT_TABLE.find((k) => k.lang === activeLang)?.hue ?? primary;
  return (
    <div style={{
      border: `1px solid ${knotHue}55`, borderRadius: 4,
      padding: '0.85rem 1.0rem 0.95rem',
      background: 'linear-gradient(180deg, rgba(8,10,22,0.78), rgba(4,6,14,0.85))',
      boxShadow: `0 0 18px ${knotHue}22`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.55rem',
      }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: 99,
          background: knotHue, boxShadow: `0 0 8px ${knotHue}`,
        }} />
        <span style={{
          fontFamily: type.mono, fontSize: '9px', letterSpacing: '0.32em',
          textTransform: 'uppercase', color: 'rgba(232,228,216,0.55)',
        }}>
          Active Core
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '0.55rem', marginBottom: '0.55rem',
      }}>
        <span style={{
          fontFamily: type.display, fontSize: '1.7rem', fontWeight: 400,
          color: knotHue, lineHeight: 1,
        }}>
          {lab.code}
        </span>
        <span style={{ color: knotHue, opacity: 0.5, fontSize: '0.85rem' }}>·</span>
        <span style={{
          fontFamily: type.body, fontSize: '1.05rem',
          color: '#E8E4D8', opacity: 0.92,
        }}>
          {lab.native}
        </span>
      </div>
      <div style={{
        display: 'inline-block', padding: '0.18rem 0.6rem', borderRadius: 2,
        border: `1px solid ${accent}33`,
        fontFamily: type.mono, fontSize: '9px', letterSpacing: '0.28em',
        textTransform: 'uppercase', color: accent, opacity: 0.85,
        marginBottom: '0.65rem',
      }}>
        Live · 482ms
      </div>
      <div style={{
        fontFamily: type.mono, fontSize: '9px', letterSpacing: '0.28em',
        textTransform: 'uppercase', color: 'rgba(232,228,216,0.45)',
        marginTop: '0.15rem',
      }}>
        Training signal
        <span style={{ color: knotHue, marginLeft: '0.5rem' }}>+2.0% / call</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MODEL STRENGTH BARS
// ────────────────────────────────────────────────────────────────────────

function ModelStrengthBars({
  density, activeLang,
}: { density: Record<MiraLang, number>; activeLang: MiraLang }) {
  return (
    <div style={{
      border: '1px solid rgba(232,228,216,0.12)', borderRadius: 4,
      padding: '0.85rem 1.0rem',
      background: 'linear-gradient(180deg, rgba(8,10,22,0.72), rgba(4,6,14,0.80))',
    }}>
      <div style={{
        fontFamily: type.mono, fontSize: '9px', letterSpacing: '0.32em',
        textTransform: 'uppercase', color: 'rgba(232,228,216,0.55)',
        marginBottom: '0.75rem',
      }}>
        Model Strength · Density
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {LANG_ORDER.map((lang) => {
          const knot = KNOT_TABLE.find((k) => k.lang === lang)!;
          const value = density[lang];
          const isActive = lang === activeLang;
          const lab = LANG_LABEL[lang];
          return (
            <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: type.mono, fontSize: '9.5px', fontWeight: 700,
                letterSpacing: '0.18em', width: 18,
                color: isActive ? knot.hue : 'rgba(232,228,216,0.65)',
              }}>
                {lab.code}
              </span>
              <span style={{
                fontFamily: type.body, fontSize: '11px',
                color: isActive ? '#E8E4D8' : 'rgba(232,228,216,0.55)',
                width: 56, opacity: isActive ? 1 : 0.75,
              }}>
                {lab.native}
              </span>
              <div style={{
                flex: 1, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden', position: 'relative',
              }}>
                <div style={{
                  width: `${value * 100}%`, height: '100%',
                  background: `linear-gradient(90deg, ${knot.hue}, ${knot.hue}DD)`,
                  boxShadow: isActive ? `0 0 6px ${knot.hue}88` : 'none',
                  transition: 'width 0.35s ease-out',
                }} />
              </div>
              <span style={{
                fontFamily: type.mono, fontSize: '9px',
                color: isActive ? knot.hue : 'rgba(232,228,216,0.50)',
                width: 30, textAlign: 'right',
              }}>
                {value.toFixed(2)}
              </span>
            </div>
          );
        })}
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
