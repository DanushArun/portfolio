import * as THREE from 'three';

import { KNOT_TABLE, type MiraFocusId, type MiraLang } from './mira-state';
import type { ScenePhase } from './scene-state';

export type MiraGameCheckpoint = MiraLang;

export interface MiraGameTarget {
  readonly lang: MiraLang;
  readonly position: THREE.Vector3;
  readonly progress: number;
}

export interface MiraGameSample {
  readonly checkpoint: MiraGameCheckpoint;
  readonly lookAt: THREE.Vector3;
  readonly position: THREE.Vector3;
  readonly progress: number;
}

export interface MiraGameCamera {
  readonly fov: number;
  readonly lookAt: THREE.Vector3;
  readonly position: THREE.Vector3;
}

const WORLD_SCALE = 2.35;
const LAST_TARGET = KNOT_TABLE.length - 1;
const ROUTE_TARGETS = KNOT_TABLE.map((knot, index) => ({
  lang: knot.lang,
  position: new THREE.Vector3(
    knot.position[0] * WORLD_SCALE,
    knot.position[1] * WORLD_SCALE,
    knot.position[2] * WORLD_SCALE,
  ),
  progress: index / LAST_TARGET,
})) satisfies readonly MiraGameTarget[];

const ROUTE = new THREE.CatmullRomCurve3(
  ROUTE_TARGETS.map((target) => target.position),
  false,
  'catmullrom',
  0.46,
);
const UP = new THREE.Vector3(0, 1, 0);
const CAMERA_BACK = new THREE.Vector3(-0.88, 0.54, 3.20);
const CAMERA_ORBIT = new THREE.Vector3();
const TEMP_TANGENT = new THREE.Vector3();
const TEMP_RIGHT = new THREE.Vector3();
const TEMP_UP = new THREE.Vector3();

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function checkpointFor(progress: number): MiraGameCheckpoint {
  const index = Math.max(0, Math.min(LAST_TARGET, Math.round(progress * LAST_TARGET)));
  return ROUTE_TARGETS[index].lang;
}

export function computeMiraGameProgress(phase: ScenePhase, local: number, reveal: number): number {
  if (phase === 'C08_EMERGE') return clamp01(reveal * 0.30);
  if (phase === 'C09_PROJECT') return clamp01(0.30 + local * 0.45);
  if (phase === 'W01_MIRA') return clamp01(local);
  return clamp01(reveal * 0.25);
}

export function getMiraGameProgressForFocus(focusId: MiraFocusId): number | null {
  const target = ROUTE_TARGETS.find((item) => item.lang === focusId);
  return target?.progress ?? null;
}

export function sampleMiraGameRoute(progress: number, lateralOffset: number): MiraGameSample {
  const safeProgress = clamp01(progress);
  const point = ROUTE.getPoint(safeProgress);
  const tangent = ROUTE.getTangent(safeProgress).normalize();
  TEMP_TANGENT.copy(tangent);
  TEMP_RIGHT.crossVectors(TEMP_TANGENT, UP).normalize();
  TEMP_UP.crossVectors(TEMP_RIGHT, TEMP_TANGENT).normalize();

  const offsetPoint = point
    .clone()
    .addScaledVector(TEMP_RIGHT, lateralOffset)
    .addScaledVector(TEMP_UP, Math.abs(lateralOffset) * 0.16);

  return {
    checkpoint: checkpointFor(safeProgress),
    lookAt: ROUTE.getPoint(clamp01(safeProgress + 0.075)),
    position: offsetPoint,
    progress: safeProgress,
  };
}

export function getMiraGameCamera(progress: number): MiraGameCamera {
  const safeProgress = clamp01(progress);
  const probe = sampleMiraGameRoute(safeProgress, 0);
  const tangent = ROUTE.getTangent(safeProgress).normalize();
  CAMERA_ORBIT.set(
    Math.sin(safeProgress * Math.PI * 2) * 0.32,
    Math.cos(safeProgress * Math.PI) * 0.22,
    0,
  );
  const position = probe.position
    .clone()
    .add(CAMERA_BACK)
    .add(CAMERA_ORBIT)
    .addScaledVector(tangent, -0.92);
  const lookAt = probe.position.clone().lerp(probe.lookAt, 0.38);
  const fov = 36 + Math.sin(safeProgress * Math.PI) * 4;

  return { fov, lookAt, position };
}

export function getMiraGameRoutePoints(segments: number): THREE.Vector3[] {
  return ROUTE.getPoints(segments);
}

export function getMiraGameTargets(): readonly MiraGameTarget[] {
  return ROUTE_TARGETS;
}
