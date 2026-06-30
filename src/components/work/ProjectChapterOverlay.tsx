'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  getPortfolioChapter,
  type PortfolioBeat,
  type PortfolioChapter,
  type PortfolioStackTag,
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

function tagKey(tag: PortfolioStackTag): string {
  return `${tag.label}:${tag.detail}`;
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

function ProjectIdentity({ copy }: { readonly copy: StepCopy }): React.JSX.Element {
  return (
    <div className={styles.projectIdentity}>
      <p className={styles.eyebrow}>{copy.chapter.beats[0].sectionLabel}</p>
      <h1 className={styles.title} data-testid="project-chapter-title">
        {copy.chapter.title}
      </h1>
      <p className={styles.step}>
        <span>{stepLabel(copy.beatIndex + 1, copy.chapter.beats.length)}</span>
        {copy.chapter.eyebrow}
      </p>
    </div>
  );
}

function StepDescriptionLayer({
  copy,
  descriptionTestId = 'project-step-description',
  style,
}: {
  readonly copy: StepCopy;
  readonly descriptionTestId?: string;
  readonly style?: CSSProperties;
}): React.JSX.Element {
  return (
    <div className={styles.descriptionLayer} style={style}>
      <p
        aria-label={copy.beat.description}
        className={styles.description}
        data-testid={descriptionTestId}
      >
        {copy.beat.description}
      </p>
    </div>
  );
}

function TagLayer({
  copy,
  onSelect,
  selectedKey,
  style,
}: {
  readonly copy: StepCopy;
  readonly onSelect: (tag: PortfolioStackTag) => void;
  readonly selectedKey: string | null;
  readonly style?: CSSProperties;
}): React.JSX.Element {
  return (
    <div className={styles.tagLayer} style={style}>
      {copy.beat.stack.map((tag) => (
        <button
          aria-expanded={selectedKey === tagKey(tag)}
          className={styles.tag}
          key={tag.label}
          onClick={() => onSelect(tag)}
          type="button"
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}

function TagDetailCard({ tag }: { readonly tag: PortfolioStackTag }): React.JSX.Element {
  return (
    <aside aria-label={tag.label} className={styles.tagDetail} role="dialog">
      <p className={styles.tagDetailLabel}>{tag.label}</p>
      <p className={styles.tagDetailText}>{tag.detail}</p>
    </aside>
  );
}

type SelectedTagState = Readonly<{
  contextKey: string;
  tag: PortfolioStackTag;
}>;

function useSelectedTag(chapterId: string, beatIndex: number): {
  readonly selectedKey: string | null;
  readonly selectedTag: PortfolioStackTag | null;
  readonly selectTag: (tag: PortfolioStackTag) => void;
} {
  const contextKey = `${chapterId}:${beatIndex}`;
  const [selected, setSelected] = useState<SelectedTagState | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const selectedTag = selected?.contextKey === contextKey ? selected.tag : null;
  const selectedKey = selectedTag ? tagKey(selectedTag) : null;
  const selectTag = (tag: PortfolioStackTag): void => {
    setSelected((current) => {
      if (current?.contextKey === contextKey && tagKey(current.tag) === tagKey(tag)) return null;
      return { contextKey, tag };
    });
  };
  return { selectedKey, selectedTag, selectTag };
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
  const tagState = useSelectedTag(chapterId, beatIndex);
  useStepTransitionVariables(rootRef, Boolean(showTransition));

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-label={`${chapter.title} case study`}
    >
      <div className={styles.identity}>
        <ProjectIdentity copy={settledCopy} />
        <div className={styles.descriptionStage}>
          <StepDescriptionLayer
            copy={outgoingCopy}
            style={showTransition ? OUTGOING_LAYER_STYLE : undefined}
          />
          {showTransition && (
            <StepDescriptionLayer
              copy={incomingCopy}
              descriptionTestId="project-step-description-incoming"
              style={INCOMING_LAYER_STYLE}
            />
          )}
        </div>
      </div>

      <div className={styles.tagRail} data-testid="project-tag-rail">
        {tagState.selectedTag && <TagDetailCard tag={tagState.selectedTag} />}
        <TagLayer
          copy={outgoingCopy}
          onSelect={tagState.selectTag}
          selectedKey={tagState.selectedKey}
          style={showTransition ? OUTGOING_LAYER_STYLE : undefined}
        />
        {showTransition && (
          <TagLayer
            copy={incomingCopy}
            onSelect={tagState.selectTag}
            selectedKey={tagState.selectedKey}
            style={INCOMING_LAYER_STYLE}
          />
        )}
      </div>
    </section>
  );
}
