'use client';

import { useState, useCallback } from 'react';
import { audioEngine } from '@/lib/audio';

/**
 * AudioToggle — fixed top-right, Space Mono 9px.
 * First click creates the AudioContext (browser gesture requirement).
 */
export default function AudioToggle() {
  const [on, setOn] = useState(false);

  const toggle = useCallback(() => {
    if (!on) {
      audioEngine.enable();
    } else {
      audioEngine.disable();
    }
    setOn((prev) => !prev);
  }, [on]);

  return (
    <button
      onClick={toggle}
      aria-label={on ? 'Mute audio' : 'Enable audio'}
      style={{
        position:         'fixed',
        top:              '24px',
        right:            '24px',
        zIndex:           100,
        background:       'none',
        border:           'none',
        cursor:           'pointer',
        padding:          '4px 0',
        fontFamily:       'var(--font-mono, monospace)',
        fontSize:         '9px',
        letterSpacing:    '0.28em',
        color:            on ? 'rgba(232,228,216,0.7)' : 'rgba(232,228,216,0.25)',
        textTransform:    'uppercase',
        transition:       'color 0.4s cubic-bezier(0.16,1,0.3,1)',
        userSelect:       'none',
        WebkitUserSelect: 'none',
      }}
    >
      {on ? 'AUDIO ON' : 'AUDIO OFF'}
    </button>
  );
}
