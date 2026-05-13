'use client';

/**
 * MiraPanel — text + chip overlay for the MIRA project reveal.
 *
 * The 3D visualization (pulsing star + 11 converging streams) is rendered
 * inside the main R3F canvas as <MiraScene /> in SceneManager.tsx, NOT here.
 * This panel is purely DOM chrome that overlays on top of that canvas.
 *
 * PanelChrome layout: text on the left, free overlay area on the right.
 * Since PanelChrome's right slot has no opaque background and the dashboard
 * itself doesn't paint a backdrop over the panel area, the live 3D MIRA
 * shows through wherever this DOM doesn't draw.
 */

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';

export default function MiraPanel() {
  const c = panelCopy.W01_MIRA;
  const hue = panelHues.W01_MIRA;

  return (
    <PanelChrome
      phaseId="W01_MIRA"
      number={c.number}
      eyebrow={c.eyebrow}
      title={c.title}
      body={c.body}
      trail={[...c.trail]}
    >
      {/* No <MiraWisps /> here — visualization lives in the main R3F canvas. */}
      <MiraOverlay
        metric={c.metric}
        chips={c.chips}
        languages={c.languages}
        primary={hue.primary}
        accent={hue.accent}
      />
    </PanelChrome>
  );
}

function MiraOverlay({
  metric, chips, languages, primary, accent,
}: {
  metric: { label: string; value: string };
  chips: readonly string[];
  languages: readonly string[];
  primary: string;
  accent: string;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '8%', right: '8%', display: 'flex', flexDirection: 'column', gap: '0.6em', alignItems: 'flex-end' }}>
        {languages.map((l, i) => (
          <span key={l} style={{ fontFamily: type.body, fontSize: '1.4rem', color: i === 0 ? primary : accent, opacity: 0.5 + i * 0.1, textShadow: `0 0 12px ${primary}66` }}>
            {l}
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '6%', right: '6%', textAlign: 'right' }}>
        <div style={{ fontFamily: type.mono, fontSize: 9, letterSpacing: '0.32em', color: 'rgba(232,228,216,0.45)', textTransform: 'uppercase', marginBottom: '0.4em' }}>{metric.label}</div>
        <div style={{ fontFamily: type.display, fontSize: 'clamp(1.4rem, 2vw, 1.8rem)', fontWeight: 800, color: primary, textShadow: `0 0 16px ${primary}88` }}>{metric.value}</div>
      </div>
      <div style={{ position: 'absolute', bottom: '6%', left: '4%', maxWidth: '65%', pointerEvents: 'auto' }}>
        <ChipRow chips={chips} primary={primary} />
      </div>
    </div>
  );
}
