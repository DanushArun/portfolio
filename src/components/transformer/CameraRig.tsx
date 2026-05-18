'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useTransformer } from '@/lib/transformer-store';

const CAMERA_POSITIONS: { pos: [number, number, number]; target: [number, number, number] }[] = [
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 3, 10], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 8], target: [0, 0, 0] },
  { pos: [0, 2, 10], target: [0, 0, 0] },
];

export default function CameraRig() {
  const { camera } = useThree();
  const currentStage = useTransformer((s) => s.currentStage);
  const scrollProgress = useTransformer((s) => s.scrollProgress);

  useFrame(() => {
    const stageCam = CAMERA_POSITIONS[currentStage];
    const nextCam = CAMERA_POSITIONS[Math.min(currentStage + 1, 6)];
    const t = scrollProgress;

    const targetX = stageCam.pos[0] + (nextCam.pos[0] - stageCam.pos[0]) * t;
    const targetY = stageCam.pos[1] + (nextCam.pos[1] - stageCam.pos[1]) * t;
    const targetZ = stageCam.pos[2] + (nextCam.pos[2] - stageCam.pos[2]) * t;

    camera.position.set(
      camera.position.x + (targetX - camera.position.x) * 0.05,
      camera.position.y + (targetY - camera.position.y) * 0.05,
      camera.position.z + (targetZ - camera.position.z) * 0.05,
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}
