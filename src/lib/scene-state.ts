import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Phase definitions — Nolan/Villeneuve cinematic journey
// ─────────────────────────────────────────────────────────────────────────────

export type ScenePhase =
  | 'COVER'          // 00: Cover — The Event Horizon Cut
  | 'APPROACH'       // 01: Approach — The Veil
  | 'CROSSING'       // 02: Crossing — The Wormhole Transition
  | 'BOSON_STAR'     // 03: Boson Star — Quantum Lab
  | 'STRANGEON'      // 04: Strangeon — MIRA
  | 'BINARY_MERGER'  // 05: Binary Merger — DriveX
  | 'EINSTEIN_CROSS' // 06: Einstein Cross — FuryX × Veronica
  | 'HAUMEA'         // 07: Haumea — Formula Manipal
  | 'MANIFEST'       // 08: Manifest — The Logbook
  | 'CYGNUS_LOOP';   // 09: Cygnus Loop — Singularity (Contact)

// Ordered scene sequence after CROSSING (for R3F rendering and scroll advancement)
export const COSMIC_SCENES: ScenePhase[] = [
  'BOSON_STAR',
  'STRANGEON',
  'BINARY_MERGER',
  'EINSTEIN_CROSS',
  'HAUMEA',
  'MANIFEST',
  'CYGNUS_LOOP',
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
  phase: 'COVER',
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
  },

  beginJourney: () => {
    set({ phase: 'COVER', phaseStart: performance.now(), veil: 0, horizonProgress: 0 });
    setTimeout(() => {
      set({ phase: 'APPROACH', phaseStart: performance.now() });
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
export const isCosmicCanvas = (phase: ScenePhase) =>
  phase === 'CROSSING' || COSMIC_SCENES.includes(phase);
