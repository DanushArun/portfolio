'use client';

import * as THREE from 'three';

export default function BlueprintGrid() {
  return (
    <group>
      <gridHelper args={[20, 20, 0x222233, 0x111122]} position={[0, -3, 0]} />
      <line>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-10, -3, 0, 10, -3, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x334455} />
      </line>
      <line>
        <bufferGeometry>
          <float32BufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -3, -10, 0, -3, 10]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x334455} />
      </line>
    </group>
  );
}
