// src/lib/journey-map.ts
import {
  COSMIC_PHASES, WORK_PHASES, type ScenePhase,
} from './scene-state';

// ─── Bands (locked from §2) ──────────────────────────────────────────────────
// Cosmic occupies 0.000..0.555 (so dashboard has 50% of scroll real estate).
// Each cosmic phase has a width proportional to storyboard percentages from
// the bottom row of image #1. We've packed those 9 weights into the 0..0.555
// band linearly with the same ratios.
const COSMIC_END = 0.555;
const COSMIC_WEIGHTS = [
  0.10,  // C01 ORBIT     (10%)
  0.15,  // C02 PULL      (15%)
  0.15,  // C03 STRETCH   (15%)
  0.10,  // C04 HORIZON   (10%)
  0.15,  // C05 WARP      (15%)
  0.10,  // C06 ANOMALY   (10%)
  0.10,  // C07 TRANSITION(10%)
  0.10,  // C08 EMERGE    (10%)
  0.05,  // C09 PROJECT   (5%)
];
const COSMIC_BANDS = (() => {
  const bands: Array<{ phase: ScenePhase; from: number; to: number }> = [];
  let acc = 0;
  COSMIC_WEIGHTS.forEach((w, i) => {
    const from = (acc / 1) * COSMIC_END;
    acc += w;
    const to = (acc / 1) * COSMIC_END;
    bands.push({ phase: COSMIC_PHASES[i], from, to });
  });
  return bands;
})();

// Work occupies 0.555..1.000, equally divided 9 ways.
const WORK_BAND_WIDTH = (1 - COSMIC_END) / WORK_PHASES.length;
const WORK_BANDS = WORK_PHASES.map((phase, i) => ({
  phase,
  from: COSMIC_END + i * WORK_BAND_WIDTH,
  to:   COSMIC_END + (i + 1) * WORK_BAND_WIDTH,
}));

const ALL_BANDS = [...COSMIC_BANDS, ...WORK_BANDS];

export interface PhaseSnapshot {
  phase: ScenePhase;
  /** Current band's local 0..1 progress (`(p - from) / (to - from)`). */
  localProgress: number;
  /** 0..1 over cosmic phases C01..C09. 1 once crossed into work. */
  cosmicProgress: number;
  /** 0..1 over work phases W01..W09. 0 before crossing. */
  workProgress: number;
}

export function progressToPhase(p: number): PhaseSnapshot {
  const clamped = Math.max(0, Math.min(1, p));
  // Find band
  const band = ALL_BANDS.find((b) => clamped >= b.from && clamped <= b.to)
            ?? ALL_BANDS[ALL_BANDS.length - 1];
  const local = band.to === band.from ? 0 : (clamped - band.from) / (band.to - band.from);

  // Cosmic / work progress
  const cosmicProgress = clamped <= COSMIC_END
    ? clamped / COSMIC_END
    : 1;
  const workProgress = clamped <= COSMIC_END
    ? 0
    : (clamped - COSMIC_END) / (1 - COSMIC_END);

  return {
    phase: band.phase,
    localProgress: Math.max(0, Math.min(1, local)),
    cosmicProgress: Math.max(0, Math.min(1, cosmicProgress)),
    workProgress: Math.max(0, Math.min(1, workProgress)),
  };
}