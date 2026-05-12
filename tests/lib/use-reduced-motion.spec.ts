// Job 003 AC6 — useReducedMotion hook contract.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useReducedMotion } from '@/lib/motion/use-reduced-motion';

type Listener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initial: boolean): { setMatches: (next: boolean) => void } {
  let matches = initial;
  const listeners = new Set<Listener>();
  const mql = {
    get matches() { return matches; },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
    dispatchEvent: () => false,
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => mql),
  });
  return {
    setMatches: (next) => {
      matches = next;
      listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent));
    },
  };
}

afterEach(() => cleanup());

describe('useReducedMotion', () => {
  it('returns the current media query value on mount', () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('reflects matches=true when the media query is set', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('re-renders when the media query changes', () => {
    const handle = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => handle.setMatches(true));
    expect(result.current).toBe(true);
  });

  it('does not throw after unmount when the change event fires', () => {
    const handle = installMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(() => handle.setMatches(true)).not.toThrow();
  });
});
