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
        // eslint-disable-next-line react-hooks/immutability
        pcam.fov = 100;
        break;
      }
      // C07 → C09: framing the MIRA celestial body for the build-up arc.
      // Radius 13 keeps the body + inner stream arcs tight in frame.
      case 'C07_TRANSITION':
      case 'C08_EMERGE':
      case 'C09_PROJECT': {
        const a = t * 0.06;
        const r = 13;
        pcam.position.set(Math.cos(a) * r, 1.4, Math.sin(a) * r);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 45;
        break;
      }
      // W01_MIRA: pull camera back so the full Virgo Linguistic Supercluster
      // (±8.84 world units) fits in frame. Radius 18, FOV 52 → visible plane
      // ≈17.6 units at origin, snug fit with light bleed at the edges (the
      // reference frames the cluster wall-to-wall). Slower orbit so the
      // wider view doesn't whip past the structure.
      case 'W01_MIRA': {
        const a = t * 0.04;
        const r = 18;
        pcam.position.set(Math.cos(a) * r, 1.8, Math.sin(a) * r);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 52;
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
