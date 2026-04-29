'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useScene, phaseTime, type ScenePhase } from '@/lib/scene-state';

const BH_POS  = new THREE.Vector3(0, 0, 0);
const IDLE_POS = new THREE.Vector3(0, 2, 30);

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * CameraRig — drives camera position and FOV for every phase.
 *
 * COVER     Holds at IDLE_POS looking at BH, FOV 50
 * APPROACH  Slow orbital breath + scroll-based approach toward BH
 * CROSSING  Rapid forward push into event horizon, FOV crush 50→120
 * Cosmic scenes (BOSON_STAR → CYGNUS_LOOP) each have their own FOV
 */
// FOV to snap to at the START of each phase (prevents drift from CROSSING's 120° FOV).
// Typed Record<ScenePhase, number> so future phase renames fail at compile time.
const PHASE_FOV: Record<ScenePhase, number> = {
  COVER: 50,
  APPROACH: 50,
  CROSSING: 50,
  BOSON_STAR: 52,
  STRANGEON: 55,
  BINARY_MERGER: 60,
  EINSTEIN_CROSS: 58,
  HAUMEA: 80,
  MANIFEST: 50,
  CYGNUS_LOOP: 48,
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

    // The cosmic chain (BOSON_STAR..CYGNUS_LOOP) lives at scroll ∈ [3/9, 1.0].
    // r3fProgress 0 = camera at idle perch (z=18, looking at QuantumPlanet at
    // z=0). r3fProgress 1 = past Singularity at z=-540. Previously this
    // started at scroll=1/6 (mid-APPROACH) which put the camera 72 units past
    // QuantumPlanet by the time BOSON_STAR began — that's why every cosmic
    // frame rendered black.
    const r3fProgress = Math.max(0, Math.min(1, (progress - (1 / 3)) / (2 / 3)));

    // 7 cosmic scenes spaced 90 units apart on -Z (0, -90, …, -540). Camera
    // trails its lookTarget by 18 units so QuantumPlanet (z=0) is framed
    // from z=18 at the start, and Singularity (z=-540) is framed from
    // z=-522 at the end. Total travel = 540 units of lookZ.
    const lookZ        = -r3fProgress * 540;
    const targetZ      = lookZ + 18;
    camZ.current     += (targetZ - camZ.current) * 0.08;

    // Stage index for FOV interpolation. 7 scenes → 6 segments.
    const r3fContinuous = r3fProgress * 6;
    const r3fIdx        = Math.min(6, Math.floor(r3fContinuous));
    const local         = r3fContinuous - r3fIdx;

    // Base position with a slight breathing drift
    tmp.current.set(
      Math.sin(bt * 0.08) * 0.8,
      Math.sin(bt * 0.06) * 0.4 + 1.2,
      camZ.current,
    );

    camera.position.lerp(tmp.current, 0.1);
    camera.lookAt(new THREE.Vector3(0, 0.6, lookZ));

    // FOV per scene, indexed by r3fIdx. Order matches scene placement on -Z:
    // Quantum(0), Pulsar(-90), DriveX(-180), Twin(-270), Formula(-360),
    // Manifest(-450, no R3F scene), Singularity(-540).
    const FOVS = [52, 55, 60, 58, 80, 50, 48];
    const currentFov = FOVS[r3fIdx];
    const nextFov    = FOVS[Math.min(6, r3fIdx + 1)];
    const targetFov  = currentFov + (nextFov - currentFov) * local;

    pcam.fov = THREE.MathUtils.lerp(pcam.fov, targetFov, 0.05);
    pcam.updateProjectionMatrix();
  });

  return null;
}
