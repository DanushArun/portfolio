'use client';

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

export default function CameraRig() {
  const { camera } = useThree();

  useFrame((state) => {
    const pcam = camera as THREE.PerspectiveCamera;
    const phase = useScene.getState().phase;
    const local = useScene.getState().localProgress;
    const t = state.clock.elapsedTime;

    switch (phase) {
      case 'C06_ANOMALY': {
        const jx = (Math.sin(t * 11) * 0.3) * (1 - Math.abs(local - 0.5) * 2);
        const jy = (Math.cos(t * 7)  * 0.3) * (1 - Math.abs(local - 0.5) * 2);
        pcam.position.set(jx, jy, 30);
        pcam.lookAt(0, 0, 0);
        break;
      }
      case 'C07_TRANSITION': {
        const z = THREE.MathUtils.lerp(30, 12, local);
        pcam.position.set(0, 0, z);
        pcam.lookAt(0, 0, 0);
        break;
      }
      case 'C08_EMERGE': {
        const a = t * 0.05;
        pcam.position.set(Math.cos(a) * 12, 1.5, Math.sin(a) * 12);
        pcam.lookAt(0, 0, 0);
        break;
      }
      case 'C09_PROJECT': {
        const a = t * 0.03;
        const z = THREE.MathUtils.lerp(12, 18, local);
        pcam.position.set(Math.cos(a) * z, 1.5, Math.sin(a) * z);
        pcam.lookAt(0, 0, 0);
        break;
      }
      default: {
        // IDLE position
        pcam.position.lerp(new THREE.Vector3(0, 2, 30), 0.1);
        pcam.lookAt(new THREE.Vector3(0, 0, 0));
      }
    }
    pcam.updateProjectionMatrix();
  });

  return null;
}
