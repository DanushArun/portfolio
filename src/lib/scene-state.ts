import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Phase definitions — Nolan/Villeneuve cinematic journey
// ─────────────────────────────────────────────────────────────────────────────

export type CosmicPhase =
  | 'C01_ORBIT' | 'C02_PULL' | 'C03_STRETCH' | 'C04_HORIZON'
  | 'C05_WARP'  | 'C06_ANOMALY' | 'C07_TRANSITION'
  | 'C08_EMERGE' | 'C09_PROJECT';

export type WorkPhase =
  | 'W01_MIRA' | 'W02_AIDEN' | 'W03_VANGUARD' | 'W04_INSPECTION'
  | 'W05_WAVEFIELD' | 'W06_EMI' | 'W07_FORMULA'
  | 'W08_ABOUT' | 'W09_CONNECT';

export type ScenePhase = CosmicPhase | WorkPhase;

export const COSMIC_PHASES: CosmicPhase[] = [
  'C01_ORBIT','C02_PULL','C03_STRETCH','C04_HORIZON','C05_WARP',
  'C06_ANOMALY','C07_TRANSITION','C08_EMERGE','C09_PROJECT',
];
export const WORK_PHASES: WorkPhase[] = [
  'W01_MIRA','W02_AIDEN','W03_VANGUARD','W04_INSPECTION',
  'W05_WAVEFIELD','W06_EMI','W07_FORMULA','W08_ABOUT','W09_CONNECT',
];
export const ALL_PHASES: ScenePhase[] = [...COSMIC_PHASES, ...WORK_PHASES];

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

type SceneStore = {
  phase: ScenePhase;
  phaseStart: number;
  journeyProgress: number;   // global 0..1
  cosmicProgress: number;    // derived 0..1 over C01..C09
  workProgress: number;      // derived 0..1 over W01..W09
  localProgress: number;     // 0..1 within current phase

  // Existing fields retained
  mouseX: number;
  mouseY: number;
  scrollVelocity: number;
  orbitAngle: number;
  pulsarActive: boolean;
  pulsarBeat: number;
  shatterActive: boolean;
  veil: number;
  horizonProgress: number;

  setPhase: (p: ScenePhase) => void;
  setProgress: (j: number, c: number, w: number, l: number, phase: ScenePhase) => void;
  setMouse: (x: number, y: number) => void;
  setScrollVelocity: (v: number) => void;
  setOrbitAngle: (a: number) => void;
  setShatter: (active: boolean) => void;
  setVeil: (v: number) => void;
  setHorizonProgress: (v: number) => void;
  tickPulsar: () => void;
  advanceScene: () => void;    // advance to next cosmic scene
  beginJourney: () => void;    // VOID → EVENT_HORIZON → DESCENT → MIRA_PULSAR
};

export const useScene = create<SceneStore>((set, get) => ({
  phase: 'C01_ORBIT',
  phaseStart: performance.now(),
  journeyProgress: 0,
  cosmicProgress: 0,
  workProgress: 0,
  localProgress: 0,
  mouseX: 0,
  mouseY: 0,
  scrollVelocity: 0,
  orbitAngle: 0,
  pulsarActive: false,
  pulsarBeat: 0,
  shatterActive: false,
  veil: 0,
  horizonProgress: 0,

  setPhase: (phase) => set({ phase, phaseStart: performance.now() }),

  setProgress: (journeyProgress, cosmicProgress, workProgress, localProgress, phase) =>
    set((s) =>
      phase !== s.phase
        ? { journeyProgress, cosmicProgress, workProgress, localProgress, phase, phaseStart: performance.now() }
        : { journeyProgress, cosmicProgress, workProgress, localProgress }
    ),

  setMouse: (mouseX, mouseY) => set({ mouseX, mouseY }),

  setScrollVelocity: (scrollVelocity) => set({ scrollVelocity }),

  setOrbitAngle: (orbitAngle) => set({ orbitAngle }),

  setShatter: (shatterActive) => set({ shatterActive }),

  setVeil: (veil) => set({ veil }),

  setHorizonProgress: (horizonProgress) => set({ horizonProgress }),

  tickPulsar: () => set((s) => ({ pulsarBeat: s.pulsarBeat + 1 })),

  advanceScene: () => {
    const { phase } = get();
    const idx = ALL_PHASES.indexOf(phase);
    if (idx === -1) return;
    const next = ALL_PHASES[idx + 1];
    if (next) {
      set({ phase: next, phaseStart: performance.now() });
    }
  },

  beginJourney: () => {
    set({
      phase: 'C01_ORBIT',
      phaseStart: performance.now(),
      veil: 0,
      horizonProgress: 0,
      journeyProgress: 0,
      cosmicProgress: 0,
      workProgress: 0,
      localProgress: 0,
    });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export const phaseTime = (phaseStart: number) =>
  (performance.now() - phaseStart) / 1000;

export const isCosmic = (p: ScenePhase): p is CosmicPhase =>
  (COSMIC_PHASES as ScenePhase[]).includes(p);

export const isWork = (p: ScenePhase): p is WorkPhase =>
  (WORK_PHASES as ScenePhase[]).includes(p);

// BH custom canvas drives C01..C04 (orbit → engulfment). R3F canvas takes
// over at C05 — the warp scene replaces what used to be the BH's internal
// "tunnel rings + neutron star" continuation, so the disc-edge artifacts
// from those tunnel rings no longer render through the void.
export const isBlackHoleCanvas = (p: ScenePhase) =>
  p === 'C01_ORBIT' || p === 'C02_PULL' || p === 'C03_STRETCH' ||
  p === 'C04_HORIZON';

export const isR3FCanvas = (p: ScenePhase) =>
  !isBlackHoleCanvas(p);  // C05 onward including all work panels
