'use client';

import { ReactNode } from 'react';
import { type WorkPhase } from '@/lib/scene-state';
import { panelHues, type, fontSize, spacing } from '@/lib/design-tokens';

export interface PanelChromeProps {
  phaseId: WorkPhase;
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  trail: readonly string[];
  children?: ReactNode;
}

export default function PanelChrome({
  phaseId, number, eyebrow, title, body, trail, children,
}: PanelChromeProps) {
  const hues = panelHues[phaseId];
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      flexDirection: 'column', justifyContent: 'space-between',
      padding: spacing.panelPad, color: '#E8E4D8',
      position: 'relative', zIndex: 10,
    }}>
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: fontSize.panelNumber, fontFamily: type.mono, color: hues.primary }}>{number}</span>
            <span style={{ fontSize: '10px', letterSpacing: '0.1em', fontFamily: type.mono, color: hues.accent }}>{eyebrow}</span>
          </div>
          <h2 style={{ fontSize: fontSize.panelTitle, fontFamily: type.display, margin: '0 0 1rem', textTransform: 'uppercase' }}>{title}</h2>
          <p style={{ fontSize: fontSize.panelBody, fontFamily: type.body, opacity: 0.8, lineHeight: 1.6, maxWidth: '400px' }}>{body}</p>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          {children}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '2rem', fontFamily: type.mono, fontSize: fontSize.trail, color: hues.accent, opacity: 0.7, paddingBottom: '2rem' }}>
        {trail.map((t, i) => (
          <span key={i}>{t}{i < trail.length - 1 && ' →'}</span>
        ))}
      </div>
    </div>
  );
}