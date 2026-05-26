'use client';

import { panelCopy } from '@/lib/copy';
import styles from './MiraPanel.module.css';

export default function MiraPanel(): React.JSX.Element {
  return (
    <section className={styles.root} aria-label="MIRA">
      <TitleBlock />
    </section>
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
