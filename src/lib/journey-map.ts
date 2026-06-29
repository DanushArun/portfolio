// src/lib/journey-map.ts
import {
  COSMIC_PHASES, WORK_PHASES, type ScenePhase,
} from './scene-state';

// Bands.
// Keep the arrival cinematic tight; the long product-catalogue chapter is MIRA.
const COSMIC_END = 0.47;
const COSMIC_WEIGHTS = [
  8, // C01 ORBIT
  8, // C02 PULL
  7, // C03 STRETCH
  4, // C04 HORIZON
  8, // C05 WARP
  5, // C06 ANOMALY
  2, // C07 TRANSITION
  2, // C08 EMERGE
  2, // C09 PROJECT
];
const COSMIC_TOTAL_WEIGHT = COSMIC_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
const COSMIC_BANDS = (() => {
  const bands: Array<{ phase: ScenePhase; from: number; to: number }> = [];
  let acc = 0;
  COSMIC_WEIGHTS.forEach((w, i) => {
    const from = (acc / COSMIC_TOTAL_WEIGHT) * COSMIC_END;
    acc += w;
    const to = (acc / COSMIC_TOTAL_WEIGHT) * COSMIC_END;
    bands.push({ phase: COSMIC_PHASES[i], from, to });
  });
  return bands;
})();

const WORK_WEIGHTS: Record<(typeof WORK_PHASES)[number], number> = {
  W01_MIRA: 2.8,
  W02_AIDEN: 2.1,
  W03_VANGUARD: 1.3,
  W04_INSPECTION: 1.6,
  W05_WAVEFIELD: 1.6,
  W06_EMI: 1.6,
  W07_FORMULA: 1.3,
  W08_ABOUT: 1.0,
  W09_CONNECT: 0.9,
};

const WORK_TOTAL_WEIGHT = WORK_PHASES.reduce((sum, phase) => sum + WORK_WEIGHTS[phase], 0);
const WORK_BANDS = (() => {
  const bands: Array<{ phase: ScenePhase; from: number; to: number }> = [];
  let acc = 0;
  WORK_PHASES.forEach((phase) => {
    const from = COSMIC_END + (acc / WORK_TOTAL_WEIGHT) * (1 - COSMIC_END);
    acc += WORK_WEIGHTS[phase];
    const to = COSMIC_END + (acc / WORK_TOTAL_WEIGHT) * (1 - COSMIC_END);
    bands.push({ phase, from, to });
  });
  return bands;
})();

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

export function phaseToProgress(phase: ScenePhase, local: number = 0): number {
  const band = ALL_BANDS.find((b) => b.phase === phase);
  if (!band) return 0;
  const span = band.to - band.from;
  const clamped = Math.max(0, Math.min(1, local));
  return Math.min(0.9999, band.from + span * clamped);
}

function containsProgress(
  band: { phase: ScenePhase; from: number; to: number },
  index: number,
  progress: number,
): boolean {
  const isLast = index === ALL_BANDS.length - 1;
  if (isLast) return progress >= band.from && progress <= band.to;
  return progress >= band.from && progress < band.to;
}

export function progressToPhase(p: number): PhaseSnapshot {
  const clamped = Math.max(0, Math.min(1, p));
  // Find band
  const band = ALL_BANDS.find((b, index) => containsProgress(b, index, clamped))
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
