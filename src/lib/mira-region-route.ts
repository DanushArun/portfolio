import * as THREE from 'three';

import {
  MIRA_WORK_REGIONS,
  getMiraFocusAnchor,
  getMiraRegionIndex,
  type MiraVec3,
} from './mira-world';
import type { MiraFocusId, MiraLang, MiraWorkRegionId } from './mira-state';

export interface MiraJourneyTarget {
  readonly id: MiraWorkRegionId;
  readonly position: THREE.Vector3;
  readonly progress: number;
}

export interface MiraJourneyCamera {
  readonly fov: number;
  readonly lookAt: THREE.Vector3;
  readonly position: THREE.Vector3;
}

const LAST_INDEX = MIRA_WORK_REGIONS.length - 1;
const UP = new THREE.Vector3(0, 1, 0);
const CAMERA_BACK = new THREE.Vector3(-0.62, 0.42, 3.55);
const TEMP_TANGENT = new THREE.Vector3();
const TEMP_RIGHT = new THREE.Vector3();
const TEMP_UP = new THREE.Vector3();

function toVector(anchor: MiraVec3): THREE.Vector3 {
  return new THREE.Vector3(anchor[0], anchor[1], anchor[2]);
}

const ROUTE_TARGETS = MIRA_WORK_REGIONS.map((region, index) => ({
  id: region.id,
  position: toVector(region.anchor),
  progress: index / LAST_INDEX,
})) satisfies readonly MiraJourneyTarget[];

const ROUTE = new THREE.CatmullRomCurve3(
  ROUTE_TARGETS.map((target) => target.position),
  false,
  'catmullrom',
  0.42,
);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function focusAnchor(focusId: MiraFocusId, activeLang: MiraLang): THREE.Vector3 {
  return toVector(getMiraFocusAnchor(focusId, activeLang));
}

export function getMiraJourneyProgressForFocus(focusId: MiraFocusId): number | null {
  if (focusId === 'OVERVIEW') return null;
  return getMiraRegionIndex(focusId) / LAST_INDEX;
}

export function getMiraJourneyRouteTargets(): readonly MiraJourneyTarget[] {
  return ROUTE_TARGETS;
}

export function sampleMiraJourneyCamera(
  progress: number,
  activeLang: MiraLang,
  focusId: MiraFocusId = 'OVERVIEW',
): MiraJourneyCamera {
  const safeProgress = clamp01(progress);
  const point = focusId === 'LANGUAGES'
    ? focusAnchor(focusId, activeLang)
    : ROUTE.getPoint(safeProgress);
  const tangent = ROUTE.getTangent(safeProgress).normalize();
  TEMP_TANGENT.copy(tangent);
  TEMP_RIGHT.crossVectors(TEMP_TANGENT, UP).normalize();
  TEMP_UP.crossVectors(TEMP_RIGHT, TEMP_TANGENT).normalize();

  const orbit = TEMP_RIGHT.clone().multiplyScalar(Math.sin(safeProgress * Math.PI * 2) * 0.34);
  const lift = TEMP_UP.clone().multiplyScalar(0.18 + Math.sin(safeProgress * Math.PI) * 0.16);
  const position = point.clone().add(CAMERA_BACK).add(orbit).add(lift);
  const lookAt = point.clone().lerp(ROUTE.getPoint(clamp01(safeProgress + 0.06)), 0.18);

  return { fov: 36 + Math.sin(safeProgress * Math.PI) * 2, lookAt, position };
}
