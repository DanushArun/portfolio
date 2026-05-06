/**
 * Canonical easing curves for the entire portfolio.
 *
 * Every motion in this codebase routes through one of these six curves.
 * Names describe *role*, not shape — authored once, referenced forever.
 *
 *   instrument → entrances           (hard out, decisive arrival)
 *   compute    → exits / slams       (precision dismiss)
 *   precision  → steady continuous   (general-purpose)
 *   typeset    → text reveals        (soft-ease, respects line rhythm)
 *   transmit   → data state changes  (material-style)
 *   dismiss    → fast removes        (quick out)
 *
 * Two shapes are exported:
 *   - `ease`     → tuple form for Framer Motion / React transitions
 *   - `gsapEase` → cubic-bezier() strings for GSAP + CSS transitions
 */

export const ease = {
  instrument: [0.16, 1, 0.3, 1],
  compute:    [0.65, 0.05, 0, 1],
  precision:  [0.25, 0.1, 0.25, 1],
  typeset:    [0.19, 1, 0.22, 1],
  transmit:   [0.4, 0, 0.2, 1],
  dismiss:    [0.4, 0, 1, 1],
} as const;

export const gsapEase = {
  instrument: `cubic-bezier(0.16, 1, 0.3, 1)`,
  compute:    `cubic-bezier(0.65, 0.05, 0, 1)`,
  precision:  `cubic-bezier(0.25, 0.1, 0.25, 1)`,
  typeset:    `cubic-bezier(0.19, 1, 0.22, 1)`,
  transmit:   `cubic-bezier(0.4, 0, 0.2, 1)`,
  dismiss:    `cubic-bezier(0.4, 0, 1, 1)`,
} as const;

export type EaseName = keyof typeof ease;
