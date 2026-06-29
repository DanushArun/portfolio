// src/lib/design-tokens.ts
// ─────────────────────────────────────────────────────────────────────────────
// Job 003 design tokens — single source of truth.
//
// Palette is LOCKED (founder, 2026-05-12):
//   void       #08070a   absolute background
//   accretion  #FFA85C   the only accent / use sparingly
//   cream      #F0E4D2   body text / paper
//
// Typography variables match `src/app/layout.tsx` exactly:
//   --font-composer  → JetBrains Mono (system + HUD)
//   --font-dop       → Instrument Serif (body italic + earned-moment normal)
//   --font-director  → JetBrains Mono full (L00 only — U+2609 / U+2076)
//
// Per-W-phase accents are placeholders; W-jobs replace with locked accents.
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  void:      '#08070a',
  accretion: '#FFA85C',
  cream:     '#F0E4D2',
} as const;

export type PaletteToken = keyof typeof palette;

const SERIF_FALLBACK = '"Instrument Serif", Georgia, Cambria, "Times New Roman", serif';
const MONO_FALLBACK = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const typography = {
  fontFamily: {
    composer: `var(--font-composer), ${MONO_FALLBACK}`,
    dop:      `var(--font-dop), ${SERIF_FALLBACK}`,
    director: `var(--font-director), ${MONO_FALLBACK}`,
  },
  cssVar: {
    composer: '--font-composer',
    dop:      '--font-dop',
    director: '--font-director',
  },
} as const;

// Aliases preserved so panel components keep compiling. The three voices map
// to the canonical variables.
export const type = {
  display: typography.fontFamily.dop,
  body:    typography.fontFamily.dop,
  mono:    typography.fontFamily.composer,
  serif:   typography.fontFamily.dop,
} as const;

// Per-W-phase accent placeholders. Each W-job overrides its row with locked
// accents. Job 003 ships placeholders so consumers compile.
export const panelHues = {
  W01_MIRA:       { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W02_AIDEN:      { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W03_VANGUARD:   { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W04_INSPECTION: { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W05_WAVEFIELD:  { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W06_EMI:        { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W07_FORMULA:    { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W08_ABOUT:      { primary: palette.cream, accent: palette.accretion, bg: palette.void },
  W09_CONNECT:    { primary: palette.cream, accent: palette.accretion, bg: palette.void },
} as const;

export const fontSize = {
  panelNumber:   'clamp(0.7rem, 0.9vw, 0.85rem)',
  panelTitle:    'clamp(2.2rem, 4vw, 3.4rem)',
  panelSubtitle: 'clamp(0.95rem, 1.1vw, 1.05rem)',
  panelBody:     'clamp(0.82rem, 0.95vw, 0.92rem)',
  chip:          '10px',
  trail:         '11px',
} as const;

export const spacing = {
  panelPad: 'clamp(2rem, 4vw, 4rem)',
  cardPad:  'clamp(1.5rem, 3vw, 2.5rem)',
  chipGap:  '0.5rem',
} as const;

export const ease = {
  instrument: 'cubic-bezier(0.16, 1, 0.3, 1)',
  precision:  'cubic-bezier(0.25, 0.1, 0.25, 1)',
  typeset:    'cubic-bezier(0.19, 1, 0.22, 1)',
} as const;
