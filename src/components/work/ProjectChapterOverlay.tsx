'use client';

import { getPortfolioChapter } from '@/lib/portfolio-book';
import { usePortfolioBookState } from '@/lib/portfolio-book-state';
import styles from './ProjectChapterOverlay.module.css';

function stepLabel(current: number, total: number): string {
  return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}

export default function ProjectChapterOverlay(): React.JSX.Element {
  const chapterId = usePortfolioBookState((state) => state.chapterId);
  const beatIndex = usePortfolioBookState((state) => state.beatIndex);
  const chapter = getPortfolioChapter(chapterId);
  const beat = chapter.beats[Math.min(beatIndex, chapter.beats.length - 1)];

  return (
    <section className={styles.root} aria-label={`${chapter.title} case study`}>
      <div className={styles.identity}>
        <p className={styles.eyebrow}>{beat.sectionLabel}</p>
        <h1 className={styles.title} data-testid="project-chapter-title">
          {chapter.title}
        </h1>
        <p className={styles.step}>
          <span>{stepLabel(beatIndex + 1, chapter.beats.length)}</span>
          {beat.title === chapter.title ? chapter.eyebrow : beat.title}
        </p>
        <p className={styles.description} data-testid="project-step-description">
          {beat.description}
        </p>
      </div>

      <div className={styles.tagRail} data-testid="project-tag-rail">
        {beat.stack.map((tag) => (
          <span className={styles.tag} key={tag}>{tag}</span>
        ))}
      </div>
    </section>
  );
}
