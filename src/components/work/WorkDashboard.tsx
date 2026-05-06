'use client';

import dynamic from 'next/dynamic';
import { useScene, isWork } from '@/lib/scene-state';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const WorkBackdrop = dynamic(() => import('./WorkBackdrop'), { ssr: false });

const MiraPanel       = dynamic(() => import('./panels/MiraPanel'),       { ssr: false });
const AidenPanel      = dynamic(() => import('./panels/AidenPanel'),      { ssr: false });
const VanguardPanel   = dynamic(() => import('./panels/VanguardPanel'),   { ssr: false });
const InspectionPanel = dynamic(() => import('./panels/InspectionPanel'), { ssr: false });
const WaveFieldPanel  = dynamic(() => import('./panels/WaveFieldPanel'),  { ssr: false });
const EmiPanel        = dynamic(() => import('./panels/EmiPanel'),        { ssr: false });
const FormulaPanel    = dynamic(() => import('./panels/FormulaPanel'),    { ssr: false });
const AboutPanel      = dynamic(() => import('./panels/AboutPanel'),      { ssr: false });
const ConnectPanel    = dynamic(() => import('./panels/ConnectPanel'),    { ssr: false });

export default function WorkDashboard() {
  const phase = useScene((s) => s.phase);
  const visible = isWork(phase) || phase === 'C09_PROJECT';

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

      {/* Each panel renders absolute and switches visibility based on phase */}
      <PanelHost phase={phase} which="W01_MIRA"><MiraPanel /></PanelHost>
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

function PanelHost({ phase, which, children }: {
  phase: string; which: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = phase === which;

  useEffect(() => {
    if (!ref.current) return;
    if (active) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
    } else {
      gsap.to(ref.current, { opacity: 0, y: 24, duration: 0.4, ease: 'cubic-bezier(0.4, 0, 1, 1)' });
    }
  }, [active]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}