// src/lib/design-tokens.ts
// ─────────────────────────────────────────────────────────────────────────────
// Cinematic Portfolio Design Tokens
// Source of truth for every color, spacing, type ramp, and panel copy hue.
// ─────────────────────────────────────────────────────────────────────────────

export const cosmicHues = {
  void:        '#0B0D10',  // absolute background
  ember:       '#FF8040',  // BH inner ring
  ash:         '#5A1A08',  // BH outer ring
  warpDeep:    '#0A1438',
  warpMid:     '#2E8CFF',
  warpHot:     '#FFEABF',
  glitchA:     '#FF2E3F',  // ANOMALY chromatic split R
  glitchB:     '#22FFD8',  // ANOMALY chromatic split G
  glitchC:     '#9266FF',  // ANOMALY chromatic split B
  emergeAmber: '#E8A020',
  emergeBlue:  '#85CCF7',  // ← also MIRA glow accent (D9)
} as const;

export const panelHues = {
  W01_MIRA:        { primary: '#85CCF7', accent: '#A78BFA', bg: '#0A0820' },  // blue→violet
  W02_AIDEN:       { primary: '#5EEAD4', accent: '#34D399', bg: '#02161A' },  // teal→emerald
  W03_VANGUARD:    { primary: '#86EFAC', accent: '#FCA5A5', bg: '#02180C' },  // green / red signals
  W04_INSPECTION:  { primary: '#A5F3FC', accent: '#F472B6', bg: '#021820' },  // cyan / magenta
  W05_WAVEFIELD:   { primary: '#C4B5FD', accent: '#67E8F9', bg: '#0A0418' },  // purple / cyan
  W06_EMI:         { primary: '#94A3B8', accent: '#38BDF8', bg: '#0E1218' },  // slate / azure
  W07_FORMULA:     { primary: '#FCD34D', accent: '#22C55E', bg: '#1A1604' },  // amber / lime
  W08_ABOUT:       { primary: '#DDD6FE', accent: '#FAFAFA', bg: '#0E0820' },  // violet / paper
  W09_CONNECT:     { primary: '#7DD3FC', accent: '#FCD34D', bg: '#020A1A' },  // sky / sun
} as const;

export const type = {
  display:  'var(--font-syne, "Syne", sans-serif)',     // Syne 800
  body:     'var(--font-grotesk, "Space Grotesk", sans-serif)',
  mono:     'var(--font-mono, "Space Mono", monospace)',
  serif:    '"Instrument Serif", "Cormorant Garamond", serif',  // BH text only
} as const;

export const fontSize = {
  panelNumber: 'clamp(0.7rem, 0.9vw, 0.85rem)',
  panelTitle:  'clamp(2.2rem, 4vw, 3.4rem)',
  panelSubtitle: 'clamp(0.95rem, 1.1vw, 1.05rem)',
  panelBody:   'clamp(0.82rem, 0.95vw, 0.92rem)',
  chip:        '10px',
  trail:       '11px',
} as const;

export const spacing = {
  panelPad:    'clamp(2rem, 4vw, 4rem)',
  cardPad:     'clamp(1.5rem, 3vw, 2.5rem)',
  chipGap:     '0.5rem',
} as const;

export const ease = {
  // Already exists in src/lib/ease.ts — re-export the GSAP form here.
  instrument: 'cubic-bezier(0.16, 1, 0.3, 1)',
  precision:  'cubic-bezier(0.25, 0.1, 0.25, 1)',
  typeset:    'cubic-bezier(0.19, 1, 0.22, 1)',
} as const;