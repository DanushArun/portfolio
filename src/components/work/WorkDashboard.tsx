'use client';

import dynamic from 'next/dynamic';
import { useScene, isWork, type ScenePhase } from '@/lib/scene-state';
import { panelCopy } from '@/lib/copy';

const WorkBackdrop = dynamic(() => import('./WorkBackdrop'), { ssr: false });

import MiraPanel from './panels/MiraPanel';
import AidenPanel from './panels/AidenPanel';
import VanguardPanel from './panels/VanguardPanel';
import InspectionPanel from './panels/InspectionPanel';
import WaveFieldPanel from './panels/WaveFieldPanel';
import EmiPanel from './panels/EmiPanel';
import FormulaPanel from './panels/FormulaPanel';
import AboutPanel from './panels/AboutPanel';
import ConnectPanel from './panels/ConnectPanel';

const MIRA_PHASES: readonly ScenePhase[] = [
  'C07_TRANSITION',
  'C08_EMERGE',
  'C09_PROJECT',
  'W01_MIRA',
];

export default function WorkDashboard() {
  const phase = useScene((s) => s.phase);
  // MIRA now appears directly after the warp's white flash (C07 onwards),
  // not at W01. The intermediate phases (C07_TRANSITION, C08_EMERGE,
  // C09_PROJECT) all render the MiraPanel — see the array on its PanelHost
  // below. Backdrop / pointer events also need to be live for those phases.
  const visible = isWork(phase) || MIRA_PHASES.includes(phase);
  const miraVisible = MIRA_PHASES.includes(phase);

  return (
    <div
      data-dashboard
      aria-hidden={!visible}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        pointerEvents: visible ? 'auto' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      {visible && <WorkBackdrop />}
      {visible && !miraVisible && <RecruiterLinks />}

      <PanelHost
        interactive={false}
        phase={phase}
        which={MIRA_PHASES}
      ><MiraPanel /></PanelHost>
      <PanelHost phase={phase} which="W02_AIDEN"><AidenPanel /></PanelHost>
      <PanelHost phase={phase} which="W03_VANGUARD"><VanguardPanel /></PanelHost>
      <PanelHost phase={phase} which="W04_INSPECTION"><InspectionPanel /></PanelHost>
      <PanelHost phase={phase} which="W05_WAVEFIELD"><WaveFieldPanel /></PanelHost>
      <PanelHost phase={phase} which="W06_EMI"><EmiPanel /></PanelHost>
      <PanelHost phase={phase} which="W07_FORMULA"><FormulaPanel /></PanelHost>
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
