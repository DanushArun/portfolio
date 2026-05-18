import { create } from 'zustand';

export interface TransformerStore {
  currentStage: number;
  scrollProgress: number;
  globalProgress: number;
  setStage: (stage: number) => void;
  setScrollProgress: (progress: number) => void;
  setGlobalProgress: (progress: number) => void;
  reset: () => void;
}

export const useTransformer = create<TransformerStore>((set) => ({
  currentStage: 0,
  scrollProgress: 0,
  globalProgress: 0,
  setStage: (stage) => set({ currentStage: stage }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setGlobalProgress: (globalProgress) => set({
    globalProgress,
    currentStage: Math.min(6, Math.floor(globalProgress * 7)),
  }),
  reset: () => set({ currentStage: 0, scrollProgress: 0, globalProgress: 0 }),
}));
