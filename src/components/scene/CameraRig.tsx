'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { MIRA_CAMERA } from '@/lib/mira-canonical';
import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import {
  getPortfolioBookSnapshot,
  isPortfolioChapterPhase,
  type PortfolioProjectPhase,
} from '@/lib/portfolio-book';
import {
  samplePortfolioBookCamera,
  samplePortfolioReadingCamera,
} from '@/lib/portfolio-book-route';
import { getPortfolioStopForProgress } from '@/lib/portfolio-journey';
import { useScene, type ScenePhase } from '@/lib/scene-state';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const MIRA_POS = new THREE.Vector3(...MIRA_CAMERA.position);
const DEFAULT_POS = new THREE.Vector3(0, 2, 30);
const TEMP_ORBIT = new THREE.Vector3();

function setFov(camera: THREE.PerspectiveCamera, fov: number): void {
  camera.fov = fov;
}

function applyWarpCamera(camera: THREE.PerspectiveCamera): void {
  camera.position.set(0, 0, 5);
  camera.lookAt(ORIGIN);
  setFov(camera, 100);
}

function applyEmergenceCamera(camera: THREE.PerspectiveCamera, time: number): void {
  const angle = time * 0.06;
  camera.position.set(Math.cos(angle) * 13, 1.4, Math.sin(angle) * 13);
  camera.lookAt(ORIGIN);
  setFov(camera, 45);
}

function applyProjectCamera(camera: THREE.PerspectiveCamera, time: number, local: number): void {
  const angle = time * 0.06;
  TEMP_ORBIT.set(Math.cos(angle) * 13, 1.4, Math.sin(angle) * 13);
  camera.position.lerpVectors(TEMP_ORBIT, MIRA_POS, local);
  camera.lookAt(ORIGIN);
  setFov(camera, 45 + (MIRA_CAMERA.fov - 45) * local);
}

function applyPortfolioCamera(config: {
  camera: THREE.PerspectiveCamera;
  journeyProgress: number;
  local: number;
  phase: PortfolioProjectPhase;
  reducedMotion: boolean;
}): void {
  const snapshot = getPortfolioBookSnapshot(config.phase, config.local);
  const stop = getPortfolioStopForProgress(config.journeyProgress);
  const portfolioCamera = stop.cameraLocked
    ? samplePortfolioReadingCamera(snapshot.chapter)
    : samplePortfolioBookCamera(snapshot);
  const damping = stop.cameraLocked ? 0.18 : 0.075;
  config.camera.position.lerp(portfolioCamera.position, config.reducedMotion ? 1 : damping);
  config.camera.lookAt(portfolioCamera.lookAt);
  config.camera.fov += (portfolioCamera.fov - config.camera.fov) *
    (config.reducedMotion ? 1 : damping);
}

function applyDefaultCamera(camera: THREE.PerspectiveCamera): void {
  camera.position.lerp(DEFAULT_POS, 0.1);
  camera.lookAt(ORIGIN);
  setFov(camera, 50);
}

function applyPhaseCamera(config: {
  camera: THREE.PerspectiveCamera;
  journeyProgress: number;
  local: number;
  phase: ScenePhase;
  reducedMotion: boolean;
  time: number;
}): void {
  if (config.phase === 'C05_WARP' || config.phase === 'C06_ANOMALY') {
    applyWarpCamera(config.camera);
    return;
  }
  if (config.phase === 'C07_TRANSITION' || config.phase === 'C08_EMERGE') {
    applyEmergenceCamera(config.camera, config.time);
    return;
  }
  if (config.phase === 'C09_PROJECT') {
    applyProjectCamera(config.camera, config.time, config.local);
    return;
  }
  if (isPortfolioChapterPhase(config.phase)) {
    applyPortfolioCamera({
      camera: config.camera,
      journeyProgress: config.journeyProgress,
      local: config.local,
      phase: config.phase,
      reducedMotion: config.reducedMotion,
    });
    return;
  }
  applyDefaultCamera(config.camera);
}

export default function CameraRig(): null {
  const reducedMotion = useReducedMotion();

  useFrame((state) => {
    const scene = useScene.getState();
    const camera = state.camera as THREE.PerspectiveCamera;
    applyPhaseCamera({
      camera,
      journeyProgress: scene.journeyProgress,
      local: scene.localProgress,
      phase: scene.phase,
      reducedMotion,
      time: state.clock.elapsedTime,
    });
    camera.updateProjectionMatrix();
  });

  return null;
}
