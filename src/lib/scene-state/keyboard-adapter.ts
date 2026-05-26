'use client';

// src/lib/scene-state/keyboard-adapter.ts
// Job 003 AC11. Wires PageUp/PageDown/Home/End/Arrows/Space to the same
// progress driver scroll uses. Uses `phaseToProgress` so the adapter sits
// on the same non-uniform band layout as ScrollOrchestrator.

import { useEffect } from 'react';
import { useScene, ALL_PHASES } from '@/lib/scene-state';
import { progressToPhase, phaseToProgress } from '@/lib/journey-map';
import { stepMiraFocus } from '@/lib/mira-state';

export type KeyAction =
  | 'phase-next' | 'phase-prev' | 'phase-first' | 'phase-last'
  | 'local-forward' | 'local-back' | 'focus-next' | 'focus-prev'
  | 'pause-toggle' | null;

const KEY_MAP: Record<string, KeyAction> = {
  PageDown: 'phase-next',
  PageUp: 'phase-prev',
  Home: 'phase-first',
  End: 'phase-last',
  ArrowRight: 'focus-next',
  ArrowLeft: 'focus-prev',
  ArrowDown: 'local-forward',
  ArrowUp: 'local-back',
  ' ': 'pause-toggle',
  Space: 'pause-toggle',
};

const LOCAL_STEP = 0.33;
const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isFormFocused(): boolean {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement;
  if (!active) return false;
  if (FORM_TAGS.has(active.tagName)) return true;
  if (active instanceof HTMLElement && active.isContentEditable) return true;
  return false;
}

function phaseAt(idx: number, local: number): number {
  const clamped = Math.max(0, Math.min(ALL_PHASES.length - 1, idx));
  return phaseToProgress(ALL_PHASES[clamped], Math.max(0, Math.min(1, local)));
}

function applyProgress(target: number): void {
  const snap = progressToPhase(target);
  useScene.getState().setProgress(
    target, snap.cosmicProgress, snap.workProgress, snap.localProgress, snap.phase,
  );
  if (typeof window !== 'undefined') {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (totalScroll > 0) window.scrollTo({ top: target * totalScroll, behavior: 'auto' });
  }
}

export function resolveKeyAction(key: string): KeyAction {
  return KEY_MAP[key] ?? null;
}

function dispatchMiraFocusAction(action: KeyAction): boolean {
  const phase = useScene.getState().phase;
  if (phase !== 'W01_MIRA') return false;
  if (action === 'focus-next' || action === 'local-forward') {
    stepMiraFocus(1);
    return true;
  }
  if (action === 'focus-prev' || action === 'local-back') {
    stepMiraFocus(-1);
    return true;
  }
  return false;
}

export function dispatchKeyAction(action: KeyAction): void {
  if (!action) return;
  if (dispatchMiraFocusAction(action)) return;
  const state = useScene.getState();
  if (action === 'phase-next') {
    const idx = ALL_PHASES.indexOf(state.phase);
    applyProgress(phaseAt(idx + 1, 0.05));
    return;
  }
  if (action === 'phase-prev') {
    const idx = ALL_PHASES.indexOf(state.phase);
    applyProgress(phaseAt(idx - 1, 0.05));
    return;
  }
  if (action === 'phase-first') { applyProgress(0); return; }
  if (action === 'phase-last') { applyProgress(phaseAt(ALL_PHASES.length - 1, 0.05)); return; }
  if (action === 'local-forward') {
    const local = Math.min(1, state.localProgress + LOCAL_STEP);
    const idx = ALL_PHASES.indexOf(state.phase);
    applyProgress(phaseAt(idx, local));
    return;
  }
  if (action === 'local-back') {
    const local = Math.max(0, state.localProgress - LOCAL_STEP);
    const idx = ALL_PHASES.indexOf(state.phase);
    applyProgress(phaseAt(idx, local));
    return;
  }
  // pause-toggle: Job 003 stub; wires in Job 004.
}

export function useKeyboardNavigation(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent): void => {
      if (isFormFocused()) return;
      const action = resolveKeyAction(event.key);
      if (!action) return;
      event.preventDefault();
      dispatchKeyAction(action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
