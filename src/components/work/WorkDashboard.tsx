'use client';

import dynamic from 'next/dynamic';
import { useScene, isWork, type ScenePhase } from '@/lib/scene-state';

const WorkBackdrop = dynamic(() => import('./WorkBackdrop'), { ssr: false });

import AboutPanel from './panels/AboutPanel';
import ConnectPanel from './panels/ConnectPanel';
import ProjectChapterOverlay from './ProjectChapterOverlay';
import EmergeIndicator from './EmergeIndicator';
import { PORTFOLIO_CHAPTERS } from '@/lib/portfolio-book';

const BOOK_ENTRY_PHASES: readonly ScenePhase[] = [
  'C07_TRANSITION',
  'C08_EMERGE',
  'C09_PROJECT',
];
const PROJECT_CHAPTER_PHASES = PORTFOLIO_CHAPTERS.map((chapter) => chapter.phase);

export default function WorkDashboard() {
  const phase = useScene((s) => s.phase);
  const handoffVisible = phase === 'W08_ABOUT' || phase === 'W09_CONNECT';
  const visible = isWork(phase) || BOOK_ENTRY_PHASES.includes(phase);

  return (
    <div
      data-dashboard
      aria-hidden={!visible}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        pointerEvents: visible && handoffVisible ? 'auto' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      {visible && <WorkBackdrop />}

      <PanelHost phase={phase} which={PROJECT_CHAPTER_PHASES} interactive={false}>
        <ProjectChapterOverlay />
      </PanelHost>
      <PanelHost phase={phase} which="C08_EMERGE" interactive={false}>
        <EmergeIndicator />
      </PanelHost>
      <PanelHost phase={phase} which="W08_ABOUT"><AboutPanel /></PanelHost>
      <PanelHost phase={phase} which="W09_CONNECT"><ConnectPanel /></PanelHost>
    </div>
  );
}

function PanelHost({ phase, which, children, interactive = true }: {
  phase: ScenePhase;
  which: ScenePhase | readonly ScenePhase[];
  children: React.ReactNode;
  interactive?: boolean;
}): React.JSX.Element | null {
  const active = Array.isArray(which) ? which.includes(phase) : phase === which;
  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}
