'use client';

// src/components/hud/ToggleSlot.tsx
// Job 003 ships labelled empty slots. Jobs 004 / 019 wire `state` + `onToggle`.

import styles from './HUD.module.css';

export type ToggleKind = 'audio' | 'rm' | 'quality';
export type ToggleState = 'on' | 'off' | 'unavailable';

type Props = Readonly<{
  kind: ToggleKind;
  state: ToggleState;
  onToggle?: () => void;
}>;

const GLYPH: Record<ToggleKind, Record<'on' | 'off', string>> = {
  audio:   { on: '♪', off: '⌀' },
  rm:      { on: '~', off: '=' },
  quality: { on: '●', off: '◐' },
};

const LABEL: Record<ToggleKind, string> = {
  audio:   'Toggle audio',
  rm:      'Toggle reduced motion',
  quality: 'Toggle quality',
};

const FUTURE_JOB: Record<ToggleKind, string> = {
  audio:   'Wires up in Job 004',
  rm:      'Wires up in Job 004',
  quality: 'Wires up in Job 019',
};

function glyphFor(kind: ToggleKind, state: ToggleState): string {
  if (state === 'unavailable') return GLYPH[kind].off;
  return state === 'on' ? GLYPH[kind].on : GLYPH[kind].off;
}

export function ToggleSlot({ kind, state, onToggle }: Props): React.JSX.Element {
  const disabled = state === 'unavailable';
  const ariaLabel = `${LABEL[kind]} (${state})`;
  return (
    <button
      type="button"
      className={styles.toggleSlot}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      title={disabled ? FUTURE_JOB[kind] : undefined}
      data-toggle-slot={kind}
      onClick={disabled ? undefined : onToggle}
      tabIndex={0}
    >
      <span aria-hidden="true">{glyphFor(kind, state)}</span>
    </button>
  );
}
