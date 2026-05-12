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
      // C05 + C06: o2bomb-style warp. Particles span z ∈ [-10, 10] traveling
      // +z toward the camera. Camera at (0,0,5) fov 100 matches the upstream
      // Scene's framing — particles approach the camera and wrap behind it.
      // Without this, the default (0,0,30) fov 50 puts particles far in front
      // of the camera and the burst reads tiny.
      case 'C05_WARP':
      case 'C06_ANOMALY': {
        pcam.position.set(0, 0, 5);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 100;
        break;
      }
      case 'C07_TRANSITION': {
        const z = THREE.MathUtils.lerp(30, 12, local);
        pcam.position.set(0, 0, z);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 50;          // reset from warp's wide FOV
        break;
      }
      case 'C08_EMERGE': {
        const a = t * 0.05;
        pcam.position.set(Math.cos(a) * 12, 1.5, Math.sin(a) * 12);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 50;
        break;
      }
      case 'C09_PROJECT': {
        const a = t * 0.03;
        const z = THREE.MathUtils.lerp(12, 18, local);
        pcam.position.set(Math.cos(a) * z, 1.5, Math.sin(a) * z);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 50;
        break;
      }
      default: {
        // IDLE position
        pcam.position.lerp(new THREE.Vector3(0, 2, 30), 0.1);
        pcam.lookAt(new THREE.Vector3(0, 0, 0));
        pcam.fov = 50;
      }
    }
    pcam.updateProjectionMatrix();
  });

  return null;
}
