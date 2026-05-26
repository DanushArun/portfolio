// Job 003 AC11 — keyboard adapter mapping.
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveKeyAction, dispatchKeyAction } from '@/lib/scene-state/keyboard-adapter';
import { useScene, ALL_PHASES } from '@/lib/scene-state';
import { resetMiraStateForTest, useMiraState } from '@/lib/mira-state';

function resetSceneToOrbit(): void {
  useScene.setState({
    phase: 'C01_ORBIT',
    phaseStart: performance.now(),
    journeyProgress: 0,
    cosmicProgress: 0,
    workProgress: 0,
    localProgress: 0,
  });
}

beforeEach(resetSceneToOrbit);
beforeEach(resetMiraStateForTest);

describe('resolveKeyAction', () => {
  it('maps PageDown → phase-next', () => {
    expect(resolveKeyAction('PageDown')).toBe('phase-next');
  });

  it('maps PageUp → phase-prev', () => {
    expect(resolveKeyAction('PageUp')).toBe('phase-prev');
  });

  it('maps Home → phase-first and End → phase-last', () => {
    expect(resolveKeyAction('Home')).toBe('phase-first');
    expect(resolveKeyAction('End')).toBe('phase-last');
  });

  it('maps ArrowDown / ArrowUp → local progress', () => {
    expect(resolveKeyAction('ArrowDown')).toBe('local-forward');
    expect(resolveKeyAction('ArrowUp')).toBe('local-back');
  });

  it('maps ArrowRight / ArrowLeft → MIRA focus navigation', () => {
    expect(resolveKeyAction('ArrowRight')).toBe('focus-next');
    expect(resolveKeyAction('ArrowLeft')).toBe('focus-prev');
  });

  it('maps Space → pause-toggle', () => {
    expect(resolveKeyAction(' ')).toBe('pause-toggle');
  });

  it('returns null for unhandled keys', () => {
    expect(resolveKeyAction('q')).toBeNull();
  });
});

describe('dispatchKeyAction', () => {
  it('advances to the next phase on phase-next', () => {
    dispatchKeyAction('phase-next');
    expect(useScene.getState().phase).toBe('C02_PULL');
  });

  it('jumps to the first phase on phase-first', () => {
    useScene.setState({ phase: 'W05_WAVEFIELD' });
    dispatchKeyAction('phase-first');
    expect(useScene.getState().phase).toBe('C01_ORBIT');
  });

  it('jumps to the last phase on phase-last', () => {
    dispatchKeyAction('phase-last');
    expect(useScene.getState().phase).toBe(ALL_PHASES[ALL_PHASES.length - 1]);
  });

  it('advances localProgress by 0.33 on local-forward', () => {
    dispatchKeyAction('local-forward');
    expect(useScene.getState().localProgress).toBeGreaterThan(0.32);
    expect(useScene.getState().localProgress).toBeLessThanOrEqual(0.34);
  });

  it('moves MIRA focus instead of scrolling when W01 is active', () => {
    useScene.setState({ phase: 'W01_MIRA', localProgress: 0.5 });
    dispatchKeyAction('focus-next');
    expect(useMiraState.getState().focusId).toBe('EN');
  });
});
