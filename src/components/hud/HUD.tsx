'use client';

// src/components/hud/HUD.tsx
// Job 003 AC10 — production HUD scaffold. Replaces the dev overlay.
//   bottom-right: PhaseIndicator + SkipToNextButton
//   bottom-left : audio / RM / quality slots (Job 003 ships disabled stubs)
// During C04 horizon (scroll 0.155–0.205) the HUD fades — ux-spec §C04.

import { useScene } from '@/lib/scene-state';
import { PhaseIndicator } from './PhaseIndicator';
import { SkipToNextButton } from './SkipToNextButton';
import { ToggleSlot } from './ToggleSlot';
import styles from './HUD.module.css';

const C04_FADE_START = 0.155;
const C04_FADE_END = 0.205;

function c04Opacity(journey: number): number {
  if (journey < C04_FADE_START) return 1;
  if (journey > C04_FADE_END) return 1;
  const mid = (C04_FADE_START + C04_FADE_END) / 2;
  const half = (C04_FADE_END - C04_FADE_START) / 2;
  const dist = Math.abs(journey - mid) / half;
  return Math.max(0, Math.min(1, dist));
}

export default function HUD(): React.JSX.Element | null {
  const journey = useScene((s) => s.journeyProgress);
  const phase = useScene((s) => s.phase);
  const opacity = c04Opacity(journey);
  // W01_MIRA: founder direction 2026-05-13 — only the panel title block shows.
  if (phase === 'W01_MIRA') return null;
  return (
    <div className={styles.root} aria-label="Scene controls" style={{ opacity }}>
      <div className={styles.cluster + ' ' + styles.bottomRight}>
        <PhaseIndicator />
        <SkipToNextButton />
      </div>
      <div className={styles.cluster + ' ' + styles.bottomLeft}>
        <ToggleSlot kind="audio" state="unavailable" />
        <ToggleSlot kind="rm" state="unavailable" />
        <ToggleSlot kind="quality" state="unavailable" />
      </div>
    </div>
  );
}
