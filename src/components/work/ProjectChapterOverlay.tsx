'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import {
  getPortfolioChapter,
  type PortfolioBeat,
  type PortfolioChapter,
} from '@/lib/portfolio-book';
import { usePortfolioBookState } from '@/lib/portfolio-book-state';
import type { PortfolioStop } from '@/lib/portfolio-journey';
import {
  getPortfolioStepTransition,
  usePortfolioStepTransition,
} from '@/lib/portfolio-step-transition';
import styles from './ProjectChapterOverlay.module.css';

interface StepCopy {
  readonly beat: PortfolioBeat;
  readonly beatIndex: number;
  readonly chapter: PortfolioChapter;
}

const OUTGOING_LAYER_STYLE: CSSProperties = {
  opacity: 'var(--outgoing-opacity, 1)',
  transform: 'translate3d(0, var(--outgoing-y, 0px), 0)',
};

const INCOMING_LAYER_STYLE: CSSProperties = {
  opacity: 'var(--incoming-opacity, 0)',
  transform: 'translate3d(0, var(--incoming-y, 12px), 0)',
};

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

function formatMotionValue(value: number): string {
  return value.toFixed(4);
}

function setTransitionVariables(root: HTMLElement, progress: number): void {
  const clamped = Math.max(0, Math.min(1, progress));
  root.style.setProperty('--outgoing-opacity', formatMotionValue(1 - clamped));
  root.style.setProperty('--incoming-opacity', formatMotionValue(clamped));
  root.style.setProperty('--outgoing-y', `${formatMotionValue(clamped * -12)}px`);
  root.style.setProperty('--incoming-y', `${formatMotionValue((1 - clamped) * 12)}px`);
}

function requestMotionFrame(callback: FrameRequestCallback): number {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return window.setTimeout(() => callback(performance.now()), 16);
}

function cancelMotionFrame(frame: number): void {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frame);
    return;
  }
  window.clearTimeout(frame);
}

function useStepTransitionVariables(
  rootRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (!enabled) {
      setTransitionVariables(root, 1);
      return undefined;
    }

    let frame: number | null = null;
    const tick = (): void => {
      const transition = getPortfolioStepTransition();
      setTransitionVariables(root, transition.easedProgress);
      if (transition.active) frame = requestMotionFrame(tick);
    };
    tick();
    return () => {
      if (frame !== null) cancelMotionFrame(frame);
      setTransitionVariables(root, 1);
    };
  }, [enabled, rootRef]);
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
  const rootRef = useRef<HTMLElement | null>(null);
  const chapterId = usePortfolioBookState((state) => state.chapterId);
  const beatIndex = usePortfolioBookState((state) => state.beatIndex);
  const transition = usePortfolioStepTransition((state) => state.transition);
  const chapter = getPortfolioChapter(chapterId);
  const beat = chapter.beats[Math.min(beatIndex, chapter.beats.length - 1)];
  const settledCopy = { beat, beatIndex, chapter };
  const showTransition = transition.active && transition.fromStop && transition.toStop;
  const outgoingCopy = showTransition ? copyForStop(transition.fromStop) : settledCopy;
  const incomingCopy = showTransition ? copyForStop(transition.toStop) : settledCopy;
  useStepTransitionVariables(rootRef, Boolean(showTransition));

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-label={`${chapter.title} case study`}
    >
      <div className={styles.identity}>
        <StepIdentity
          copy={outgoingCopy}
          style={showTransition ? OUTGOING_LAYER_STYLE : undefined}
        />
        {showTransition && (
          <StepIdentity
            copy={incomingCopy}
            descriptionTestId="project-step-description-incoming"
            style={INCOMING_LAYER_STYLE}
          />
        )}
      </div>

      <div className={styles.tagRail} data-testid="project-tag-rail">
        <TagLayer
          copy={outgoingCopy}
          style={showTransition ? OUTGOING_LAYER_STYLE : undefined}
        />
        {showTransition && (
          <TagLayer copy={incomingCopy} style={INCOMING_LAYER_STYLE} />
        )}
      </div>
    </section>
  );
}
