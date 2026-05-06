'use client';
import { type } from '@/lib/design-tokens';

export default function PanelChip({ children, primary = '#E8E4D8' }: { children: React.ReactNode; primary?: string }) {
  return (
    <span style={{
      fontFamily: type.mono,
      fontSize: 10,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      padding: '0.35em 0.7em',
      border: `1px solid ${primary}55`,
      borderRadius: 2,
      color: primary,
      background: `${primary}10`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export function ChipRow({ chips, primary }: { chips: readonly string[]; primary: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.4rem' }}>
      {chips.map((c) => <PanelChip key={c} primary={primary}>{c}</PanelChip>)}
    </div>
  );
}
