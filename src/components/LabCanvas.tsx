'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
// import WebGPURenderer from 'three/src/renderers/webgpu/WebGPURenderer.js'; // Requires specific imports depending on setup, falling back to standard gl with WebGPU config if possible.

export default function LabCanvas() {

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-auto bg-[#050608]">
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 45 }}
        // Explicitly requesting WebGPU where supported is tricky in Next.js without aggressive transpile.
        // For Phase 1, we initialize the canvas and use the standard Fallback WebGL2 with advanced post-proc
        // while we prep the compute shaders.
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          
          <Physics debug>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />

            {/* Station 2: The Proving Grounds - Temporary Physics Bounds */}
            <RigidBody type="fixed">
              <mesh position={[0, -1, 0]} receiveShadow>
                <boxGeometry args={[50, 1, 50]} />
                <meshStandardMaterial color="#0B0D10" roughness={0.1} metalness={0.8} />
              </mesh>
            </RigidBody>

            {/* Test Dynamic Object */}
            <RigidBody position={[0, 5, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={2} />
              </mesh>
            </RigidBody>
          </Physics>

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} />
            <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          </EffectComposer>

          <OrbitControls 
            enablePan={false}
            enableDamping
            maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going below ground
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
