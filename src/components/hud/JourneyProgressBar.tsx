'use client';

import { useScene } from '@/lib/scene-state';
import styles from './HUD.module.css';

function progressPercent(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return Math.round(clamped * 100);
}

export function JourneyProgressBar(): React.JSX.Element {
  const progress = useScene((s) => s.journeyProgress);
  const percent = progressPercent(progress);

  return (
    <progress
      aria-label="Journey progress"
      aria-valuetext={`${percent}% complete`}
      className={styles.journeyProgress}
      data-journey-progress
      max={100}
      value={percent}
    />
  );
}
