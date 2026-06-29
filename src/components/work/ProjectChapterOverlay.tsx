'use client';

import type { CSSProperties } from 'react';

import {
  getPortfolioChapter,
  type PortfolioBeat,
  type PortfolioChapter,
} from '@/lib/portfolio-book';
import { usePortfolioBookState } from '@/lib/portfolio-book-state';
import type { PortfolioStop } from '@/lib/portfolio-journey';
import { usePortfolioStepTransition } from '@/lib/portfolio-step-transition';
import styles from './ProjectChapterOverlay.module.css';

interface StepCopy {
  readonly beat: PortfolioBeat;
  readonly beatIndex: number;
  readonly chapter: PortfolioChapter;
}

function stepLabel(current: number, total: number): string {
  return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}

function summaryLabel(lines: readonly string[]): string {
  return lines.join(' / ');
}

function copyForStop(stop: PortfolioStop): StepCopy {
  const chapter = getPortfolioChapter(stop.projectId);
  const beatIndex = Math.min(stop.beatIndex, chapter.beats.length - 1);
  return { beat: chapter.beats[beatIndex], beatIndex, chapter };
}

function layerStyle(progress: number, incoming: boolean): CSSProperties {
  const opacity = incoming ? progress : 1 - progress;
  const offset = incoming ? (1 - progress) * 12 : progress * -12;
  return {
    opacity,
    transform: `translate3d(0, ${offset}px, 0)`,
  };
}

function StepIdentity({
  copy,
  descriptionTestId = 'project-step-description',
  style,
}: {
  readonly copy: StepCopy;
  readonly descriptionTestId?: string;
  readonly style?: CSSProperties;
}): React.JSX.Element {
  return (
    <div className={styles.copyLayer} style={style}>
      <p className={styles.eyebrow}>{copy.beat.sectionLabel}</p>
      <h1 className={styles.title} data-testid="project-chapter-title">
        {copy.chapter.title}
      </h1>
      <p className={styles.step}>
        <span>{stepLabel(copy.beatIndex + 1, copy.chapter.beats.length)}</span>
        {copy.beat.title === copy.chapter.title ? copy.chapter.eyebrow : copy.beat.title}
      </p>
      <p
        aria-label={copy.beat.description}
        className={styles.description}
        data-testid={descriptionTestId}
      >
        {summaryLabel(copy.beat.summaryLines)}
      </p>
    </div>
  );
}

function TagLayer({
  copy,
  style,
}: {
  readonly copy: StepCopy;
  readonly style?: CSSProperties;
}): React.JSX.Element {
  return (
    <div className={styles.tagLayer} style={style}>
      {copy.beat.stack.map((tag) => (
        <span className={styles.tag} key={tag}>{tag}</span>
      ))}
    </div>
  );
}

export default function ProjectChapterOverlay(): React.JSX.Element {
  const chapterId = usePortfolioBookState((state) => state.chapterId);
  const beatIndex = usePortfolioBookState((state) => state.beatIndex);
  const transition = usePortfolioStepTransition((state) => state.transition);
  const chapter = getPortfolioChapter(chapterId);
  const beat = chapter.beats[Math.min(beatIndex, chapter.beats.length - 1)];
  const settledCopy = { beat, beatIndex, chapter };
  const showTransition = transition.active && transition.fromStop && transition.toStop;
  const outgoingCopy = showTransition ? copyForStop(transition.fromStop) : settledCopy;
  const incomingCopy = showTransition ? copyForStop(transition.toStop) : settledCopy;

  return (
    <section className={styles.root} aria-label={`${chapter.title} case study`}>
      <div className={styles.identity}>
        <StepIdentity
          copy={outgoingCopy}
          style={showTransition ? layerStyle(transition.easedProgress, false) : undefined}
        />
        {showTransition && (
          <StepIdentity
            copy={incomingCopy}
            descriptionTestId="project-step-description-incoming"
            style={layerStyle(transition.easedProgress, true)}
          />
        )}
      </div>

      <div className={styles.tagRail} data-testid="project-tag-rail">
        <TagLayer
          copy={outgoingCopy}
          style={showTransition ? layerStyle(transition.easedProgress, false) : undefined}
        />
        {showTransition && (
          <TagLayer copy={incomingCopy} style={layerStyle(transition.easedProgress, true)} />
        )}
      </div>
    </section>
  );
}
