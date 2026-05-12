// src/lib/fonts.ts
// ─────────────────────────────────────────────────────────────────────────────
// Job 003 typography — three voices.
//   composerMono     : JetBrains Mono (system text + HUD)         → --font-composer
//   dopSerif         : Instrument Serif (body italic + L00 line)  → --font-dop
//   directorMonoFull : JetBrains Mono unsubsetted (L00 only glyph
//                      coverage: U+2609 ☉, U+2076 ⁶, U+00D7 ×)    → --font-director
// Spec: .coo/jobs/003/typography-scorecard.md
//
// NOTE: next/font requires literal-only option values; the fallback arrays
// must be inlined, not referenced via a constant.
// ─────────────────────────────────────────────────────────────────────────────

import { JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';

export const composerMono = JetBrains_Mono({
  variable: '--font-composer',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});

export const dopSerif = Instrument_Serif({
  variable: '--font-dop',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
});

export const directorMonoFull = localFont({
  variable: '--font-director',
  src: '../../public/fonts/jetbrains-mono-full.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: 'Arial',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});
