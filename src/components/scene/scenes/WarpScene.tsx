'use client';

// Direct port of o2bomb/space-warp's Scene.tsx, adapted for our scroll trigger.
//   Source: https://github.com/o2bomb/space-warp/blob/main/src/Scene.tsx
//
// Upstream's motion model preserved (z += velocity, wrap, z-stretch, depth-fade).
// Three deviations vs upstream:
//   1. `velocity` is driven by an acceleration curve over scroll progress
//      (slow start → fast peak) instead of an exponential decay over time.
//   2. Visible particle count scales with scroll: starts at 5%, grows to 100%
//      as the user scrolls deeper into the warp. The "tunnel fills in" feel.
//   3. Per-instance spectral colors (cool blue-white dominant, occasional warm
//      and full-spectrum accents) instead of pure white. Reads as "warp streaks"
//      rather than uniform stars.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const COUNT = 2500;
const XY_BOUNDS = 40;
const Z_BOUNDS = 20;
const MAX_SPEED_FACTOR = 2;
const MAX_SCALE_FACTOR = 50;
const PARTICLE_RADIUS = 0.025;     // half of upstream's 0.05 per request

// Combined progress through C05+C06.
//   C05_WARP    → cosmic 0.50..0.65
//   C06_ANOMALY → cosmic 0.65..0.75
function combinedProgress(cosmicProgress: number): number {
  return Math.max(0, Math.min(1, (cosmicProgress - 0.50) / 0.25));
}

function generatePos() {
  return (Math.random() - 0.5) * XY_BOUNDS;
}

export default function WarpScene() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Per-particle base color (set once at mount).
  // Pure white — chromatic aberration in PostFX splits each streak into RGB
  // components along the motion direction, producing the rainbow-tinged
  // streaks in the reference imagery. Colouring the particles directly
  // breaks that effect (you get RGB shifts of an already-tinted streak,
  // which reads muddy instead of spectral).
  //
  // Slight blue-white variance (98% pure white, 2% faint amber) just to
  // avoid the streaks looking like a uniform pixel-grid.
  const baseColors = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      if (Math.random() < 0.02) {
        c.setHSL(0.08, 0.5, 0.85);   // sparse warm accent
      } else {
        c.setRGB(1, 1, 1);
      }
      arr[i * 3 + 0] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const t = new THREE.Object3D();
    let j = 0;
    for (let i = 0; i < COUNT * 3; i += 3) {
      t.position.x = generatePos();
      t.position.y = generatePos();
      t.position.z = (Math.random() - 0.5) * Z_BOUNDS;
      t.updateMatrix();
      meshRef.current.setMatrixAt(j++, t.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const temp       = useMemo(() => new THREE.Matrix4(), []);
  const tempPos    = useMemo(() => new THREE.Vector3(), []);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor  = useMemo(() => new THREE.Color(), []);

  useFrame((_state, delta) => {
    const m = meshRef.current;
    if (!m) return;
    const phase  = useScene.getState().phase;
    const cosmic = useScene.getState().cosmicProgress;
    const isActive = phase === 'C05_WARP' || phase === 'C06_ANOMALY';
    if (!isActive) {
      m.visible = false;
      return;
    }
    m.visible = true;

    const cp = combinedProgress(cosmic);

    // ── Accelerate then decelerate ───────────────────────────────────────
    // Velocity rises 0.05 → 1.0 over cp 0..0.75 (the "we are accelerating"
    // feel), then drops 1.0 → 0.45 over cp 0.75..1.0 (the "we are slowing
    // down as we approach exit" feel). Without the deceleration, the warp
    // jumps straight into the white flash and the transition reads as a
    // hard cut instead of a natural arrival.
    const BASE_V = 0.05;
    let accelOut: number;
    if (cp < 0.75) {
      const t = cp / 0.75;
      accelOut = Math.pow(t, 2.0);          // 0 → 1
    } else {
      const t = (cp - 0.75) / 0.25;
      accelOut = 1 - 0.55 * Math.pow(t, 1.5); // 1 → 0.45
    }
    const velocity = BASE_V + (1 - BASE_V) * accelOut;

    // ── Density ramp: ~8 particles at engulfment → 2500 by cp 0.75 ───────
    // Peaks with the velocity curve so the tunnel is fullest at peak speed.
    // Holds full density through the deceleration so the user still sees a
    // dense field as they slow into the flash.
    const fillT = Math.min(1, cp / 0.75);
    const fill = 0.003 + 0.997 * Math.pow(fillT, 2.6);
    const activeCount = Math.max(8, Math.floor(COUNT * fill));
    m.count = activeCount;

    // ── Brightness boost over the last 12% of cp → screen-blowout flash ──
    // Drives bloom into a sustained white-out which the SceneManager's
    // warpFlash overlay then takes over and holds.
    const flashLead = Math.max(0, (cp - 0.88) / 0.12);
    const brightnessBoost = 1 + 7 * (flashLead * flashLead);

    for (let i = 0; i < activeCount; i++) {
      m.getMatrixAt(i, temp);

      tempObject.scale.set(1, 1, Math.max(1, velocity * MAX_SCALE_FACTOR));

      tempPos.setFromMatrixPosition(temp);
      if (tempPos.z > Z_BOUNDS / 2) {
        tempPos.z = -Z_BOUNDS / 2;
      } else {
        tempPos.z += Math.max(delta, velocity * MAX_SPEED_FACTOR);
      }
      tempObject.position.set(tempPos.x, tempPos.y, tempPos.z);

      tempObject.updateMatrix();
      m.setMatrixAt(i, tempObject.matrix);

      // Brightness: white at z>0, fades to black by z=-Z/2 (upstream rule).
      // Tinted by per-instance baseColors and boosted into HDR for the final
      // flash so bloom drives the picture to white-out at the transition.
      const brightness = tempPos.z > 0 ? 1 : 1 - tempPos.z / (-Z_BOUNDS / 2);
      const b = brightness * brightnessBoost;
      tempColor.setRGB(
        baseColors[i * 3 + 0] * b,
        baseColors[i * 3 + 1] * b,
        baseColors[i * 3 + 2] * b,
      );
      m.setColorAt(i, tempColor);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <>
      {/* Pitch black scene background. */}
      <color attach="background" args={['#000000']} />
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, COUNT]}
        matrixAutoUpdate
        frustumCulled={false}
      >
        <sphereGeometry args={[PARTICLE_RADIUS]} />
        <meshBasicMaterial
          color={[1.5, 1.5, 1.5] as unknown as THREE.ColorRepresentation}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}
