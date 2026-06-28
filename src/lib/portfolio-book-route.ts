import * as THREE from 'three';

import {
  PORTFOLIO_CHAPTERS,
  type PortfolioBeat,
  type PortfolioBookSnapshot,
  type PortfolioChapter,
  type PortfolioChapterId,
  type PortfolioVec3,
} from './portfolio-book';

export interface PortfolioRouteTarget {
  readonly id: PortfolioChapterId;
  readonly position: THREE.Vector3;
  readonly progress: number;
}

export interface PortfolioBookCamera {
  readonly fov: number;
  readonly lookAt: THREE.Vector3;
  readonly position: THREE.Vector3;
}

const LAST_INDEX = PORTFOLIO_CHAPTERS.length - 1;
const CAMERA_PITCH = new THREE.Vector3(0, 0.28, 0);
const READ_CAMERA_OFFSET = new THREE.Vector3(0, 0.16, 6.8);
const READ_CAMERA_TARGET = new THREE.Vector3(0, 0.08, 0.5);
const READ_CAMERA_FOV = 44;
const TRANSITION_PULLBACK = new THREE.Vector3(0, 0.6, 1.6);
const TEMP_TARGET = new THREE.Vector3();
const TEMP_ROUTE = new THREE.Vector3();

function toVector(anchor: PortfolioVec3): THREE.Vector3 {
  return new THREE.Vector3(anchor[0], anchor[1], anchor[2]);
}

const ROUTE_TARGETS = PORTFOLIO_CHAPTERS.map((chapter, index) => ({
  id: chapter.id,
  position: toVector(chapter.node.anchor),
  progress: index / LAST_INDEX,
})) satisfies readonly PortfolioRouteTarget[];

const ROUTE = new THREE.CatmullRomCurve3(
  ROUTE_TARGETS.map((target) => target.position),
  false,
  'catmullrom',
  0.46,
);

function cameraOffset(beat: PortfolioBeat, beatProgress: number): THREE.Vector3 {
  const angle = beat.orbit + beatProgress * 0.48;
  return new THREE.Vector3(
    Math.cos(angle) * beat.distance,
    beat.lift,
    Math.sin(angle) * beat.distance,
  );
}

function routePoint(progress: number): THREE.Vector3 {
  return ROUTE.getPoint(Math.max(0, Math.min(1, progress)));
}

function chapterPoint(chapter: PortfolioChapter): THREE.Vector3 {
  return toVector(chapter.node.anchor);
}

export function getPortfolioBookRouteTargets(): readonly PortfolioRouteTarget[] {
  return ROUTE_TARGETS;
}

export function samplePortfolioBookCamera(
  snapshot: PortfolioBookSnapshot,
): PortfolioBookCamera {
  const chapterAnchor = chapterPoint(snapshot.chapter);
  const routeAnchor = routePoint(snapshot.routeProgress);
  TEMP_TARGET.copy(routeAnchor).lerp(chapterAnchor, 0.62);
  TEMP_ROUTE.copy(routeAnchor).sub(chapterAnchor);

  const pullback = TRANSITION_PULLBACK.clone().multiplyScalar(TEMP_ROUTE.length() * 0.11);
  const position = TEMP_TARGET.clone()
    .add(cameraOffset(snapshot.beat, snapshot.beatProgress))
    .add(pullback);
  const lookAt = TEMP_TARGET.clone().add(CAMERA_PITCH);
  return { fov: snapshot.beat.fov, lookAt, position };
}

export function samplePortfolioReadingCamera(chapter: PortfolioChapter): PortfolioBookCamera {
  const anchor = chapterPoint(chapter);
  return {
    fov: READ_CAMERA_FOV,
    lookAt: anchor.clone().add(READ_CAMERA_TARGET),
    position: anchor.clone().add(READ_CAMERA_OFFSET),
  };
}
