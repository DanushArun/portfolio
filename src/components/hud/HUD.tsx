'use client';

// src/components/hud/HUD.tsx
// Job 003 AC10 — production HUD scaffold. Replaces the dev overlay.
//   bottom-right: PhaseIndicator + SkipToNextButton
//   bottom-left : audio / RM / quality slots (Job 003 ships disabled stubs)
// During C04 horizon (scroll 0.155–0.205) the HUD fades — ux-spec §C04.

import { useScene } from '@/lib/scene-state';
import { PhaseIndicator } from './PhaseIndicator';
import { SkipToNextButton } from './SkipToNextButton';
import { ToggleSlot } from './ToggleSlot';
import styles from './HUD.module.css';

const C04_FADE_START = 0.155;
const C04_FADE_END = 0.205;

function c04Opacity(journey: number): number {
  if (journey < C04_FADE_START) return 1;
  if (journey > C04_FADE_END) return 1;
  const mid = (C04_FADE_START + C04_FADE_END) / 2;
  const half = (C04_FADE_END - C04_FADE_START) / 2;
  const dist = Math.abs(journey - mid) / half;
  return Math.max(0, Math.min(1, dist));
}

export default function HUD(): React.JSX.Element | null {
  const journey = useScene((s) => s.journeyProgress);
  const phase = useScene((s) => s.phase);
  const opacity = c04Opacity(journey);

  if (phase === 'W01_MIRA') {
    return (
      <div className={styles.root} style={{ opacity }}>
        {/* Top Left: Metadata */}
        <div style={{
          position: 'absolute', top: '1.5rem', left: '1.5rem',
          fontFamily: 'var(--font-composer)', fontSize: '10px',
          letterSpacing: '0.12em', color: '#E8E4D8', opacity: 0.8,
        }}>
          <div style={{ marginBottom: '0.4rem' }}>VLS-001 • MIRA • ONLINE</div>
          <div style={{ opacity: 0.5 }}>RA 12h 35m &nbsp; DEC -05° 12&apos; &nbsp; Z = 0.0067</div>
        </div>

        {/* Bottom Center: Interaction Hints */}
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '2rem', fontFamily: 'var(--font-composer)',
          fontSize: '9px', letterSpacing: '0.2em', color: '#E8E4D8', opacity: 0.6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', border: '1px solid #E8E4D8', borderRadius: '50%' }} /> ROTATE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', border: '1px solid #E8E4D8', borderRadius: '50%' }} /> HOVER
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', border: '1px solid #E8E4D8', borderRadius: '50%' }} /> PROBE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', border: '1px solid #E8E4D8', borderRadius: '2px' }} /> ACTIVATE
          </div>
        </div>

        {/* Bottom Right: Phase Indicator (existing component) */}
        <div className={styles.cluster + ' ' + styles.bottomRight}>
          <PhaseIndicator />
          <SkipToNextButton />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} aria-label="Scene controls" style={{ opacity }}>
      <div className={styles.cluster + ' ' + styles.bottomRight}>
        <PhaseIndicator />
        <SkipToNextButton />
      </div>
      <div className={styles.cluster + ' ' + styles.bottomLeft}>
        <ToggleSlot kind="audio" state="unavailable" />
        <ToggleSlot kind="rm" state="unavailable" />
        <ToggleSlot kind="quality" state="unavailable" />
      </div>
    </div>
  );
}
