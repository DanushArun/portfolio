'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useScene, phaseTime } from '@/lib/scene-state';

const BH_POS  = new THREE.Vector3(0, 0, 0);
const IDLE_POS = new THREE.Vector3(0, 2, 30);

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * CameraRig — drives camera position and FOV for every phase.
 *
 * VOID           Holds at IDLE_POS looking at BH, FOV 50
 * EVENT_HORIZON  Slow orbital breath + scroll-based approach toward BH
 * DESCENT        Rapid forward push into event horizon, FOV crush 50→120
 * Cosmic scenes  Each has its own cinematic camera position
 */
// FOV to snap to at the START of each phase (prevents drift from DESCENT's 120° FOV)
const PHASE_FOV: Record<string, number> = {
  VOID: 50, EVENT_HORIZON: 50, DESCENT: 50,
  MIRA_PULSAR: 55, DRIVEX_QUASAR: 60, TWIN_BUILD: 58,
  FORMULA_RINGS: 80, QUANTUM_PLANET: 52, SINGULARITY: 48,
};

export default function CameraRig() {
  const { camera } = useThree();
  const tmp      = useRef(new THREE.Vector3());
  const breathe  = useRef(Math.random() * 100);
  const camZ     = useRef(18);

  useFrame((state, dt) => {
    const pcam = camera as THREE.PerspectiveCamera;
    breathe.current += dt;
    const bt = breathe.current;

    // Read global scroll progress directly from the DOM
    const max = typeof window !== 'undefined'
      ? document.documentElement.scrollHeight - window.innerHeight : 1;
    const progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;

    // R3F canvas mounts at progress >= 1/6.
    // Map progress from [1/6, 1.0] to [0, 1.0]
    const r3fProgress = Math.max(0, Math.min(1, (progress - (1 / 6)) * 1.2));

    // Target Z goes from 18 down to -432 (450 total travel distance across 5 stages)
    const targetZ = 18 - r3fProgress * 450;
    camZ.current += (targetZ - camZ.current) * 0.08;

    // Calculate look target based on current stage
    const r3fContinuous = r3fProgress * 5;
    const r3fIdx = Math.floor(r3fContinuous);
    const local = r3fContinuous - r3fIdx;
    
    const currentStageZ = -r3fIdx * 90;
    const nextStageZ = -Math.min(5, r3fIdx + 1) * 90;
    const lookZ = currentStageZ + (nextStageZ - currentStageZ) * local;

    // Base position with a slight breathing drift
    tmp.current.set(
      Math.sin(bt * 0.08) * 0.8,
      Math.sin(bt * 0.06) * 0.4,
      camZ.current
    );

    camera.position.lerp(tmp.current, 0.1);
    camera.lookAt(new THREE.Vector3(0, 0, lookZ));

    // Smooth FOV transitions based on the stage we are looking at
    // Pulsar(55), DriveX(60), Twin(58), Formula(80), Quantum(52), Singularity(48)
    const FOVS = [55, 60, 58, 80, 52, 48];
    const currentFov = FOVS[r3fIdx];
    const nextFov = FOVS[Math.min(5, r3fIdx + 1)];
    const targetFov = currentFov + (nextFov - currentFov) * local;
    
    pcam.fov = THREE.MathUtils.lerp(pcam.fov, targetFov, 0.05);
    pcam.updateProjectionMatrix();
  });

  return null;
}
