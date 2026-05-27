'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { MIRA_CAMERA } from '@/lib/mira-canonical';
import {
  computeMiraGameProgress,
  getMiraGameCamera,
  getMiraGameProgressForFocus,
} from '@/lib/mira-game-route';
import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import { useMiraState } from '@/lib/mira-state';
import { useScene, type ScenePhase } from '@/lib/scene-state';
import { getMiraCameraStop, type MiraCameraStop } from '@/lib/mira-world';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const MIRA_POS = new THREE.Vector3(...MIRA_CAMERA.position);
const DEFAULT_POS = new THREE.Vector3(0, 2, 30);
const TEMP_ORBIT = new THREE.Vector3();
const TEMP_POS = new THREE.Vector3();
const TEMP_LOOK = new THREE.Vector3();
const TEMP_STOP_POS = new THREE.Vector3();
const TEMP_STOP_LOOK = new THREE.Vector3();

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

function applyMiraCamera(
  camera: THREE.PerspectiveCamera,
  gameProgress: number,
  stop: MiraCameraStop,
  reducedMotion: boolean,
): void {
  const gameCamera = getMiraGameCamera(gameProgress);
  TEMP_STOP_POS.set(...stop.position);
  TEMP_STOP_LOOK.set(...stop.lookAt);
  TEMP_POS.copy(gameCamera.position).lerp(TEMP_STOP_POS, 0.22);
  TEMP_LOOK.copy(gameCamera.lookAt).lerp(TEMP_STOP_LOOK, 0.18);
  camera.position.lerp(TEMP_POS, reducedMotion ? 1 : 0.085);
  camera.lookAt(TEMP_LOOK);
  const fov = gameCamera.fov + (stop.fov - gameCamera.fov) * 0.18;
  camera.fov += (fov - camera.fov) * (reducedMotion ? 1 : 0.08);
}

function applyMiraOverviewCamera(
  camera: THREE.PerspectiveCamera,
  reducedMotion: boolean,
): void {
  camera.position.lerp(MIRA_POS, reducedMotion ? 1 : 0.085);
  camera.lookAt(ORIGIN);
  camera.fov += (MIRA_CAMERA.fov - camera.fov) * (reducedMotion ? 1 : 0.08);
}

function applyDefaultCamera(camera: THREE.PerspectiveCamera): void {
  camera.position.lerp(DEFAULT_POS, 0.1);
  camera.lookAt(ORIGIN);
  setFov(camera, 50);
}

function applyPhaseCamera(config: {
  camera: THREE.PerspectiveCamera;
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
  if (config.phase === 'W01_MIRA') {
    const miraState = useMiraState.getState();
    if (miraState.focusId === 'OVERVIEW') {
      applyMiraOverviewCamera(config.camera, config.reducedMotion);
      return;
    }
    const stop = getMiraCameraStop(miraState.focusId);
    const focusProgress = getMiraGameProgressForFocus(miraState.focusId);
    const gameProgress = focusProgress ?? computeMiraGameProgress(config.phase, config.local, 1);
    applyMiraCamera(config.camera, gameProgress, stop, config.reducedMotion);
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
      local: scene.localProgress,
      phase: scene.phase,
      reducedMotion,
      time: state.clock.elapsedTime,
    });
    camera.updateProjectionMatrix();
  });

  return null;
}
