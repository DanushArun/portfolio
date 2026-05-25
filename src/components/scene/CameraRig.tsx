'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MIRA_CAMERA } from '@/lib/mira-canonical';
import { useScene } from '@/lib/scene-state';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const MIRA_POS = new THREE.Vector3(...MIRA_CAMERA.position);
const DEFAULT_POS = new THREE.Vector3(0, 2, 30);
const TEMP_ORBIT = new THREE.Vector3();

export default function CameraRig(): null {
  useFrame((state) => {
    const pcam = state.camera as THREE.PerspectiveCamera;
    const p = useScene.getState().phase;
    const local = useScene.getState().localProgress;
    const t = state.clock.elapsedTime;

    switch (p) {
      case 'C05_WARP':
      case 'C06_ANOMALY': {
        pcam.position.set(0, 0, 5);
        pcam.lookAt(ORIGIN);

        pcam.fov = 100;
        break;
      }
      case 'C07_TRANSITION':
      case 'C08_EMERGE': {
        const a = t * 0.06;
        const r = 13;
        pcam.position.set(Math.cos(a) * r, 1.4, Math.sin(a) * r);
        pcam.lookAt(ORIGIN);
        pcam.fov = 45;
        break;
      }
      case 'C09_PROJECT': {
        const a = t * 0.06;
        TEMP_ORBIT.set(Math.cos(a) * 13, 1.4, Math.sin(a) * 13);
        pcam.position.lerpVectors(TEMP_ORBIT, MIRA_POS, local);
        pcam.lookAt(ORIGIN);
        pcam.fov = 45 + (MIRA_CAMERA.fov - 45) * local;
        break;
      }
      case 'W01_MIRA': {
        pcam.position.copy(MIRA_POS);
        pcam.lookAt(ORIGIN);
        pcam.fov = MIRA_CAMERA.fov;
        break;
      }
      default: {
        pcam.position.lerp(DEFAULT_POS, 0.1);
        pcam.lookAt(ORIGIN);
        pcam.fov = 50;
      }
    }
    pcam.updateProjectionMatrix();
  });

  return null;
}
