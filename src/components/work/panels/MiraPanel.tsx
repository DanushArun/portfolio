'use client';

import { panelCopy } from '@/lib/copy';
import {
  MIRA_RECRUITER_JOURNEY,
  useMiraState,
  type MiraWorkRegionId,
} from '@/lib/mira-state';
import { getMiraWorkRegion } from '@/lib/mira-world';
import styles from './MiraPanel.module.css';

export default function MiraPanel(): React.JSX.Element {
  return (
    <section className={styles.root} aria-label="MIRA">
      <LanguageLabels />
      <RegionProof />
      <GameStatus />
      <TitleBlock />
    </section>
  );
}

function LanguageLabels(): React.JSX.Element {
  return (
    <div className={styles.labels} aria-hidden>
      <span className={`${styles.label} ${styles.en}`}>EN</span>
      <span className={`${styles.label} ${styles.hi}`}>HI</span>
      <span className={`${styles.label} ${styles.ta}`}>TA</span>
      <span className={`${styles.label} ${styles.kn}`}>KN</span>
      <span className={`${styles.label} ${styles.te}`}>TE</span>
    </div>
  );
}

function TitleBlock(): React.JSX.Element {
  const copy = panelCopy.W01_MIRA;

  return (
    <div className={styles.titleBlock}>
      <h1 className={styles.title}>{copy.title}</h1>
    </div>
  );
}

function RegionProof(): React.JSX.Element | null {
  const regionId = useMiraState((state): MiraWorkRegionId => {
    if (state.hoverRegion) return state.hoverRegion;
    if (state.focusId === 'OVERVIEW') return 'SHIPPED';
    return state.focusId;
  });
  const region = getMiraWorkRegion(regionId);

  return (
    <div className={styles.proof} style={region.labelPosition}>
      <span className={styles.regionTitle}>{region.title}</span>
      <span className={styles.question}>{region.recruiterQuestion}</span>
      <strong>{region.metric}</strong>
      <span>{region.proof[0]}</span>
    </div>
  );
}

function GameStatus(): React.JSX.Element {
  const completed = useMiraState((state) => state.completedRegions.length);
  const focusId = useMiraState((state) => state.focusId);
  const status = useMiraState((state) => state.gameStatus);
  const total = MIRA_RECRUITER_JOURNEY.length;
  const current = focusId === 'OVERVIEW' ? 0 : Math.min(total, completed + 1);
  const progress = status === 'complete' ? total : current;
  const label = status === 'complete' ? 'Catalogue complete' : 'MIRA catalogue';

  return (
    <div className={styles.gameStatus}>
      <span>{label}</span>
      <strong>{progress}/{total}</strong>
    </div>
  );
}
