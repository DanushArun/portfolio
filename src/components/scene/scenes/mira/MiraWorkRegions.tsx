'use client';

import {
  activateFocusedMiraRegion,
  setHoverRegion,
  setMiraFocus,
  useMiraState,
  type MiraWorkRegionId,
} from '@/lib/mira-state';
import { MIRA_WORK_REGIONS, type MiraVec3, type MiraWorkRegion } from '@/lib/mira-world';

interface RegionInteractorProps {
  readonly region: MiraWorkRegion;
}

function cursor(value: string): void {
  if (typeof document === 'undefined') return;
  document.body.style.cursor = value;
}

function hitRadius(radius: number): number {
  return Math.max(0.54, Math.min(1.12, radius * 0.36));
}

function positionOf(anchor: MiraVec3): [number, number, number] {
  return [anchor[0], anchor[1], anchor[2]];
}

function focusRegion(id: MiraWorkRegionId): void {
  const state = useMiraState.getState();
  if (state.focusId === id) {
    activateFocusedMiraRegion();
    return;
  }
  setMiraFocus(id);
}

function RegionInteractor({ region }: RegionInteractorProps): React.JSX.Element {
  return (
    <mesh
      onClick={(event) => {
        event.stopPropagation();
        focusRegion(region.id);
      }}
      onPointerOut={() => {
        setHoverRegion(null);
        cursor('default');
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHoverRegion(region.id);
        cursor('pointer');
      }}
      position={positionOf(region.anchor)}
    >
      <sphereGeometry args={[hitRadius(region.radius), 12, 12]} />
      <meshBasicMaterial depthWrite={false} opacity={0} transparent />
    </mesh>
  );
}

export function MiraWorkRegions(): React.JSX.Element {
  return (
    <>
      {MIRA_WORK_REGIONS.map((region) => (
        <RegionInteractor key={region.id} region={region} />
      ))}
    </>
  );
}
