'use client';

import dynamic from 'next/dynamic';
import { useScene, isWork, type ScenePhase } from '@/lib/scene-state';
import { panelCopy } from '@/lib/copy';

const WorkBackdrop = dynamic(() => import('./WorkBackdrop'), { ssr: false });

import AboutPanel from './panels/AboutPanel';
import ConnectPanel from './panels/ConnectPanel';
import ProjectChapterOverlay from './ProjectChapterOverlay';
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
      {handoffVisible && <RecruiterLinks />}

      <PanelHost phase={phase} which={PROJECT_CHAPTER_PHASES} interactive={false}>
        <ProjectChapterOverlay />
      </PanelHost>
      <PanelHost phase={phase} which="W08_ABOUT"><AboutPanel /></PanelHost>
      <PanelHost phase={phase} which="W09_CONNECT"><ConnectPanel /></PanelHost>
    </div>
  );
}

function RecruiterLinks(): React.JSX.Element {
  return (
    <nav
      aria-label="Recruiter links"
      style={{
        display: 'flex',
        gap: '0.75rem',
        position: 'fixed',
        right: 'clamp(1rem, 2.4vw, 2rem)',
        top: 'clamp(1rem, 2.4vw, 2rem)',
        zIndex: 30,
      }}
    >
      {panelCopy.W09_CONNECT.links.map((link) => {
        const external = link.href.startsWith('http');
        return (
          <a
            href={link.href}
            key={link.label}
            rel={external ? 'noopener noreferrer' : undefined}
            style={{
              border: '1px solid rgba(240, 228, 210, 0.2)',
              borderRadius: 4,
              color: 'rgba(240, 228, 210, 0.78)',
              fontFamily: 'var(--font-composer), ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.16em',
              padding: '0.55rem 0.7rem',
              textDecoration: 'none',
            }}
            target={external ? '_blank' : undefined}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
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
