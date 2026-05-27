'use client';

import { panelCopy } from '@/lib/copy';
import styles from './MiraPanel.module.css';

export default function MiraPanel(): React.JSX.Element {
  return (
    <section className={styles.root} aria-label="MIRA">
      <LanguageLabels />
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
