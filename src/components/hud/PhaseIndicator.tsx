'use client';

// src/components/hud/PhaseIndicator.tsx
// Bottom-right `NN / 18` indicator. aria-live="polite". Digit swap is
// instant; the cosmetic motion is owned by `HUD.module.css` and disables
// itself via `html[data-rm="reduce"]`.

import { useScene, ALL_PHASES } from '@/lib/scene-state';
import styles from './HUD.module.css';

const TOTAL = ALL_PHASES.length;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function PhaseIndicator(): React.JSX.Element {
  const phase = useScene((s) => s.phase);
  const current = ALL_PHASES.indexOf(phase) + 1;
  const label = `Phase ${current} of ${TOTAL}`;
  return (
    <div
      className={styles.phaseIndicator}
      aria-live="polite"
      aria-label={label}
      data-phase-indicator
    >
      <span aria-hidden="true">
        {pad2(current)} / {pad2(TOTAL)}
      </span>
    </div>
  );
}
