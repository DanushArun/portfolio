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
      // C07 → C09 → W01_MIRA: framing the MIRA celestial body. Slow auto-orbit
      // around Y so 3D depth registers without interaction. Camera sits at
      // radius 13 with a small Y lift; FOV 45 frames the body + the inner
      // arcs of the converging streams cleanly without showing the far
      // origins (radius 16) clipping the frame edges.
      case 'C07_TRANSITION':
      case 'C08_EMERGE':
      case 'C09_PROJECT':
      case 'W01_MIRA': {
        const a = t * 0.06;          // ~3.4°/s — slow but visible
        const r = 13;
        pcam.position.set(Math.cos(a) * r, 1.4, Math.sin(a) * r);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 45;
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
