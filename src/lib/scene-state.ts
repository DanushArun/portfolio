import { create } from 'zustand';

export type ScenePhase =
  | 'IDLE'            // Black hole static, waiting for user click
  | 'THRESHOLD'       // Dolly-zoom into event horizon (1.2s)
  | 'VOID'            // Hyperspace transit through the singularity (3s)
  | 'EMERGENCE'       // Decelerate, emerge into universe (1.5s)
  | 'UNIVERSE'        // Free exploration of celestial bodies
  | 'ASSEMBLY'        // Resume fragments assemble via gravity
  | 'FINAL';          // Final constellation + contact

export type FocusedBody = 'none' | 'mira' | 'emi' | 'veronica' | 'quantum' | 'formula';

type SceneStore = {
  phase: ScenePhase;
  phaseStart: number;      // performance.now() when phase began
  focusedBody: FocusedBody;
  universeScroll: number;  // 0..1 scroll progress inside universe
  assemblyProgress: number; // 0..1 jigsaw completion
  setPhase: (p: ScenePhase) => void;
  setFocus: (b: FocusedBody) => void;
  setUniverseScroll: (v: number) => void;
  setAssemblyProgress: (v: number) => void;
  beginJourney: () => void;
};

export const useScene = create<SceneStore>((set) => ({
  phase: 'IDLE',
  phaseStart: 0,
  focusedBody: 'none',
  universeScroll: 0,
  assemblyProgress: 0,
  setPhase: (phase) => set({ phase, phaseStart: performance.now() }),
  setFocus: (focusedBody) => set({ focusedBody }),
  setUniverseScroll: (universeScroll) => set({ universeScroll }),
  setAssemblyProgress: (assemblyProgress) => set({ assemblyProgress }),
  beginJourney: () => {
    set({ phase: 'THRESHOLD', phaseStart: performance.now() });
    // Auto-advance phases on timer
    setTimeout(() => set({ phase: 'VOID', phaseStart: performance.now() }), 1200);
    setTimeout(() => set({ phase: 'EMERGENCE', phaseStart: performance.now() }), 4200);
    setTimeout(() => set({ phase: 'UNIVERSE', phaseStart: performance.now() }), 5700);
  },
}));

// Utility: time since phase began in seconds
export const phaseTime = (phaseStart: number) => (performance.now() - phaseStart) / 1000;
