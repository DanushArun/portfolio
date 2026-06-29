'use client';

import { useMemo } from 'react';

import { detectQualityProfile } from '@/lib/mira-state';
import { isPortfolioChapterPhase } from '@/lib/portfolio-book';
import { useScene } from '@/lib/scene-state';

import { MiraNebulaField } from './mira/MiraNebulaField';
import { MiraSignalRibbons } from './mira/MiraSignalRibbons';
import { MiraTendrilLines } from './mira/MiraTendrilLines';
import type { Quality } from './mira/knot-config';
import PortfolioSupercluster from './portfolio/PortfolioSupercluster';

interface MiraSuperclusterProps {
  readonly reveal: number;
}

function useQuality(): Quality {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);
}

export default function MiraSupercluster({
  reveal,
}: MiraSuperclusterProps): React.ReactElement | null {
  const quality = useQuality();
  const phase = useScene((state) => state.phase);
  const showSignalRibbons = !isPortfolioChapterPhase(phase);

  if (reveal < 0.18) return null;

  return (
    <group>
      <MiraNebulaField quality={quality} reveal={reveal} />
      <MiraTendrilLines reveal={reveal} />
      {showSignalRibbons ? <MiraSignalRibbons reveal={reveal} /> : null}
      <PortfolioSupercluster reveal={reveal} />
    </group>
  );
}
