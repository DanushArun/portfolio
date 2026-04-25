import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Phase definitions — Nolan/Villeneuve cinematic journey
// ─────────────────────────────────────────────────────────────────────────────

export type ScenePhase =
  | 'VOID'           // 3.5s autonomous: stars crystallize, terminal boot, BH reveals
  | 'EVENT_HORIZON'  // Hero: full-screen BH, mouse = physics, scroll approaches
  | 'DESCENT'        // 3.2s: equation dissolves, darkness, amber point grows
  | 'MIRA_PULSAR'    // Scene 1: 92ms clockwork, Mira AI
  | 'DRIVEX_QUASAR'  // Scene 2: dual jets, DriveX agentic AI
  | 'TWIN_BUILD'     // Scene 3: binary magnetar, drag to orbit, FuryX + Veronica
  | 'FORMULA_RINGS'  // Scene 4: scroll velocity = ring speed, Formula Manipal
  | 'QUANTUM_PLANET' // Scene 5: equation interaction + shatter, quantum research
  | 'SINGULARITY';   // Act VII: convergence, monolith, contact

// Ordered scene sequence after DESCENT (for scroll-snap advancement)
export const COSMIC_SCENES: ScenePhase[] = [
  'MIRA_PULSAR',
  'DRIVEX_QUASAR',
  'TWIN_BUILD',
  'FORMULA_RINGS',
  'QUANTUM_PLANET',
  'SINGULARITY',
];

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

type SceneStore = {
  phase: ScenePhase;
  phaseStart: number;       // performance.now() when phase began

  // EVENT_HORIZON: normalized mouse position -1..1
  mouseX: number;
  mouseY: number;

  // FORMULA_RINGS: scroll delta per frame for ring speed
  scrollVelocity: number;

  // TWIN_BUILD: orbit angle in radians (driven by drag)
  orbitAngle: number;

  // Whether the 92ms Pulsar metronome is running (true from MIRA_PULSAR onward)
  pulsarActive: boolean;

  // Current beat count since Pulsar started (increments every 92ms)
  pulsarBeat: number;

  // QUANTUM_PLANET: is shatter sequence playing
  shatterActive: boolean;

  // Cross-canvas transition veil: 0 = transparent, 1 = opaque black.
  // Descent sets it to 1 just before the BH→cosmic canvas swap.
  // SceneManager fades it back to 0 once the new scene has mounted.
  veil: number;

  // EVENT_HORIZON: 0–1 progress toward crossing the threshold (driven by wheel).
  // Used by HUD to render a scroll-progress indicator on the landing page.
  horizonProgress: number;

  // Actions
  setPhase: (p: ScenePhase) => void;
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
  phase: 'VOID',
  phaseStart: performance.now(),
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

  setMouse: (mouseX, mouseY) => set({ mouseX, mouseY }),

  setScrollVelocity: (scrollVelocity) => set({ scrollVelocity }),

  setOrbitAngle: (orbitAngle) => set({ orbitAngle }),

  setShatter: (shatterActive) => set({ shatterActive }),

  setVeil: (veil) => set({ veil }),

  setHorizonProgress: (horizonProgress) => set({ horizonProgress }),

  tickPulsar: () => set((s) => ({ pulsarBeat: s.pulsarBeat + 1 })),

  advanceScene: () => {
    const { phase } = get();
    const idx = COSMIC_SCENES.indexOf(phase as ScenePhase);
    if (idx === -1) return; // not in cosmic sequence
    const next = COSMIC_SCENES[idx + 1];
    if (next) {
      set({ phase: next, phaseStart: performance.now() });
    }
    // SINGULARITY has no next — stays
  },

  beginJourney: () => {
    set({ phase: 'VOID', phaseStart: performance.now(), veil: 0, horizonProgress: 0 });
    setTimeout(() => {
      set({ phase: 'EVENT_HORIZON', phaseStart: performance.now() });
    }, 3500);
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

export const phaseTime = (phaseStart: number) =>
  (performance.now() - phaseStart) / 1000;

// True for all phases that render the post-descent cosmic universe
export const isCosmic = (phase: ScenePhase) =>
  COSMIC_SCENES.includes(phase);

// True when the R3F canvas should be mounted.
// DESCENT → WarpScene runs inside the same canvas, avoiding a second canvas swap.
export const isCosmicCanvas = (phase: ScenePhase) =>
  phase === 'DESCENT' || COSMIC_SCENES.includes(phase);
