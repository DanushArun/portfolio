'use client';

import {
  MIRA_RECRUITER_JOURNEY,
  useMiraState,
  type MiraFocusId,
} from '@/lib/mira-state';
import { getMiraFlowSnapshot } from '@/lib/mira-flow';
import styles from './MiraPanel.module.css';

function beatIndexForFocus(focusId: MiraFocusId): number {
  if (focusId === 'OVERVIEW') return 0;
  const index = MIRA_RECRUITER_JOURNEY.indexOf(focusId);
  return Math.max(0, index);
}

export default function MiraPanel(): React.JSX.Element {
  const focusId = useMiraState((state) => state.focusId);
  const activeBeatIndex = beatIndexForFocus(focusId);
  const snapshot = getMiraFlowSnapshot(activeBeatIndex);

  return (
    <section className={styles.root} aria-label="MIRA">
      <div className={styles.context}>
        <p>MIRA trace</p>
        <h1 data-testid="mira-project-title">MIRA</h1>
        <div className={styles.caption} data-testid="mira-particle-caption">
          <span>{snapshot.index + 1}/8</span>
          <strong>{snapshot.title}</strong>
          <em>{snapshot.metric}</em>
        </div>
      </div>
    </section>
  );
}
