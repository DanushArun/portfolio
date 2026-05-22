'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

export default function CameraRig() {
  const enteredMira = useRef(false);
  const phase = useScene((s) => s.phase);

  useFrame((state) => {
    const pcam = state.camera as THREE.PerspectiveCamera;
    const p = useScene.getState().phase;
    const local = useScene.getState().localProgress;
    const t = state.clock.elapsedTime;

    switch (p) {
      case 'C05_WARP':
      case 'C06_ANOMALY': {
        enteredMira.current = false;
        pcam.position.set(0, 0, 5);
        pcam.lookAt(0, 0, 0);

        pcam.fov = 100;
        break;
      }
      case 'C07_TRANSITION':
      case 'C08_EMERGE': {
        enteredMira.current = false;
        const a = t * 0.06;
        const r = 13;
        pcam.position.set(Math.cos(a) * r, 1.4, Math.sin(a) * r);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 45;
        break;
      }
      case 'C09_PROJECT': {
        enteredMira.current = false;
        const a = t * 0.06;
        // Smoothly pull back from r=13 to r=18 over the course of C09
        const r = 13 + (18 - 13) * local;
        const y = 1.4 + (1.8 - 1.4) * local;
        pcam.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        pcam.lookAt(0, 0, 0);
        pcam.fov = 45 + (52 - 45) * local;
        break;
      }
      case 'W01_MIRA': {
        pcam.fov = 52;
        if (!enteredMira.current) {
          enteredMira.current = true;
          // Let OrbitControls take over from where C09 left off
        }
        break;
      }
      default: {
        enteredMira.current = false;
        pcam.position.lerp(new THREE.Vector3(0, 2, 30), 0.1);
        pcam.lookAt(new THREE.Vector3(0, 0, 0));
        pcam.fov = 50;
      }
    }
    pcam.updateProjectionMatrix();
  });

  if (phase === 'W01_MIRA') {
    return (
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.5}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.7}
        enableDamping
        dampingFactor={0.06}
      />
    );
  }

  return null;
}
