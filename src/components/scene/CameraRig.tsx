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
  const prevPhase = useRef<string>('');

  useFrame((state, dt) => {
    const pcam = camera as THREE.PerspectiveCamera;
    const { phase, phaseStart } = useScene.getState();
    breathe.current += dt;
    const bt = breathe.current;

    // Snap FOV on phase change so DESCENT's 120° doesn't bleed into the next scene
    if (phase !== prevPhase.current) {
      const snapFov = PHASE_FOV[phase] ?? 55;
      pcam.fov = snapFov;
      pcam.updateProjectionMatrix();
      prevPhase.current = phase;
    }

    switch (phase) {
      case 'VOID': {
        // Hold at IDLE, gentle drift, FOV 50
        tmp.current.set(
          IDLE_POS.x + Math.sin(bt * 0.08) * 0.8,
          IDLE_POS.y + Math.sin(bt * 0.06) * 0.3,
          IDLE_POS.z + Math.cos(bt * 0.08) * 0.5
        );
        camera.position.lerp(tmp.current, 0.015);
        camera.lookAt(BH_POS);
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 50, 0.04);
        pcam.updateProjectionMatrix();
        break;
      }

      case 'EVENT_HORIZON': {
        const t = bt * 0.06;
        // Scroll-driven approach: read scroll from window directly
        const max = typeof window !== 'undefined'
          ? document.documentElement.scrollHeight - window.innerHeight : 1;
        const scrollT = max > 0 ? window.scrollY / max : 0;

        // Orbital breath around BH
        tmp.current.set(
          IDLE_POS.x + Math.sin(t) * 1.0,
          IDLE_POS.y + Math.sin(t * 0.7) * 0.35,
          IDLE_POS.z + Math.cos(t) * 0.6
        );
        // Scroll pushes camera toward BH
        const approachZ = THREE.MathUtils.lerp(IDLE_POS.z, 3.5, scrollT * scrollT);
        tmp.current.z = approachZ;

        camera.position.lerp(tmp.current, 0.025);
        camera.lookAt(BH_POS);
        // Slight FOV crush as user approaches
        pcam.fov = THREE.MathUtils.lerp(50, 72, scrollT * scrollT);
        pcam.updateProjectionMatrix();
        break;
      }

      case 'DESCENT': {
        // WarpScene is running in this canvas. Camera rushes forward through
        // spacetime: starts at z=20 (wide view of warp field), accelerates to
        // z=-8 (inside the event horizon), FOV widens for tunnel immersion.
        const t = phaseTime(phaseStart);
        const k = smoothstep(0, 5.0, t);
        // Cubic ease-in: slow at start, then gravitational acceleration takes over
        const kk = k * k * k;
        camera.position.set(
          Math.sin(bt * 0.15) * 0.4 * (1 - kk), // slight lateral drift decays
          Math.cos(bt * 0.10) * 0.2 * (1 - kk),
          THREE.MathUtils.lerp(20, -8, kk),
        );
        camera.lookAt(new THREE.Vector3(0, 0, -200));
        // FOV: 50° → 90° as you rush toward singularity
        pcam.fov = THREE.MathUtils.lerp(50, 90, smoothstep(0, 3.5, t));
        pcam.updateProjectionMatrix();
        break;
      }

      case 'MIRA_PULSAR': {
        // Looking at pulsar slightly off-center — dramatic angle
        tmp.current.set(
          8 + Math.sin(bt * 0.03) * 0.8,
          3 + Math.sin(bt * 0.02) * 0.4,
          18
        );
        camera.position.lerp(tmp.current, 0.02);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 55, 0.04);
        pcam.updateProjectionMatrix();
        break;
      }

      case 'DRIVEX_QUASAR': {
        tmp.current.set(
          Math.sin(bt * 0.025) * 3,
          Math.sin(bt * 0.018) * 1.5,
          22
        );
        camera.position.lerp(tmp.current, 0.02);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 60, 0.04);
        pcam.updateProjectionMatrix();
        break;
      }

      case 'TWIN_BUILD': {
        // Position stays relatively fixed — drag drives orbit angle via store
        tmp.current.set(
          Math.sin(bt * 0.015) * 1.5,
          Math.cos(bt * 0.012) * 1.0 + 2,
          20
        );
        camera.position.lerp(tmp.current, 0.02);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 58, 0.04);
        pcam.updateProjectionMatrix();
        break;
      }

      case 'FORMULA_RINGS': {
        // Inside ring plane, low elevation
        tmp.current.set(
          Math.sin(bt * 0.04) * 2,
          0.8,
          14 + Math.cos(bt * 0.04) * 2
        );
        camera.position.lerp(tmp.current, 0.03);
        camera.lookAt(new THREE.Vector3(0, 0.5, 0));
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 80, 0.04); // wide for speed feel
        pcam.updateProjectionMatrix();
        break;
      }

      case 'QUANTUM_PLANET': {
        tmp.current.set(
          -5 + Math.sin(bt * 0.02) * 1,
          3 + Math.sin(bt * 0.015) * 0.5,
          20
        );
        camera.position.lerp(tmp.current, 0.015);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 52, 0.04);
        pcam.updateProjectionMatrix();
        break;
      }

      case 'SINGULARITY': {
        // Pull back to wide shot — witness the convergence
        tmp.current.set(0, 4, 35);
        camera.position.lerp(tmp.current, 0.012);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        pcam.fov = THREE.MathUtils.lerp(pcam.fov, 48, 0.03);
        pcam.updateProjectionMatrix();
        break;
      }
    }
  });

  return null;
}
