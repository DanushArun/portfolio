'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useScene, phaseTime } from '@/lib/scene-state';

const IDLE_POS = new THREE.Vector3(0, 2, 30);
const IDLE_LOOK = new THREE.Vector3(0, 0, 0);

const VOID_POS = new THREE.Vector3(0, 0, 0);
const VOID_LOOK = new THREE.Vector3(0, 0, -1);

const UNIVERSE_POS = new THREE.Vector3(0, 4, 40);
const UNIVERSE_LOOK = new THREE.Vector3(0, 0, 0);

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * Drives camera through the cinematic phases.
 * IDLE      -> holding on black hole, slow orbital drift (breathing)
 * THRESHOLD -> dolly forward, FOV crush 50 -> 120
 * VOID      -> camera static at origin, looking forward
 * EMERGENCE -> decelerate out, FOV back to 50
 * UNIVERSE  -> orbital hover around celestial bodies
 */
export default function CameraRig() {
  const { camera } = useThree();
  const tmp = useRef(new THREE.Vector3());
  const scene = useScene();
  const breathe = useRef(Math.random() * 100);

  useFrame((state, dt) => {
    const pcam = camera as THREE.PerspectiveCamera;
    breathe.current += dt;

    switch (scene.phase) {
      case 'IDLE': {
        // Slow orbital breath around black hole
        const t = state.clock.elapsedTime * 0.08;
        tmp.current.set(
          IDLE_POS.x + Math.sin(t) * 1.2,
          IDLE_POS.y + Math.sin(t * 0.7) * 0.4,
          IDLE_POS.z + Math.cos(t) * 0.8
        );
        camera.position.lerp(tmp.current, 0.02);
        camera.lookAt(IDLE_LOOK);
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 50, 0.05);
        pcam.updateProjectionMatrix();
        break;
      }
      case 'THRESHOLD': {
        const t = phaseTime(scene.phaseStart);
        const k = smoothstep(0, 1.2, t);
        // Rapid dolly forward toward BH
        const dollyZ = THREE.MathUtils.lerp(IDLE_POS.z, 1.8, k * k);
        camera.position.set(0, 2 * (1 - k), dollyZ);
        camera.lookAt(IDLE_LOOK);
        // FOV crush: 50 -> 118
        pcam.fov = THREE.MathUtils.lerp(50, 118, k);
        pcam.updateProjectionMatrix();
        break;
      }
      case 'VOID': {
        // Static-ish at origin, very slight jitter for tension
        const t = phaseTime(scene.phaseStart);
        camera.position.set(
          Math.sin(t * 9) * 0.05,
          Math.cos(t * 7) * 0.05,
          0
        );
        camera.lookAt(VOID_LOOK);
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 110, 0.08);
        pcam.updateProjectionMatrix();
        break;
      }
      case 'EMERGENCE': {
        const t = phaseTime(scene.phaseStart);
        const k = smoothstep(0, 1.5, t);
        camera.position.lerp(UNIVERSE_POS, 0.04 + k * 0.04);
        camera.lookAt(UNIVERSE_LOOK);
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 55, 0.06);
        pcam.updateProjectionMatrix();
        break;
      }
      case 'UNIVERSE':
      case 'ASSEMBLY':
      case 'FINAL': {
        // Gentle orbital breath around universe center
        const t = state.clock.elapsedTime * 0.05;
        const s = scene.universeScroll;
        tmp.current.set(
          UNIVERSE_POS.x + Math.sin(t) * 2.5,
          UNIVERSE_POS.y + 2 + s * 6,
          UNIVERSE_POS.z + Math.cos(t) * 2.5 - s * 10
        );
        camera.position.lerp(tmp.current, 0.035);
        camera.lookAt(UNIVERSE_LOOK);
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 50, 0.05);
        pcam.updateProjectionMatrix();
        break;
      }
    }
  });

  return null;
}
