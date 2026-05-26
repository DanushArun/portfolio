'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import type * as THREE from 'three';

function AidenModel(): React.JSX.Element {
  const { scene } = useGLTF('/models/aiden/aiden-observatory.glb') as {
    scene: THREE.Group;
  };

  return <primitive object={scene} rotation={[0.16, -0.34, -0.04]} scale={1.08} />;
}

function PreviewScene(): React.JSX.Element {
  return (
    <Canvas
      camera={{ position: [0.2, 0.05, 8.2], fov: 42, near: 0.01, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#08070a']} />
      <ambientLight intensity={0.42} />
      <directionalLight color="#f0e4d2" intensity={2.6} position={[3, 4, 5]} />
      <pointLight color="#72f7ff" intensity={18} position={[-2.4, 1.6, 2.8]} />
      <pointLight color="#ffb45c" intensity={8} position={[2.6, -1.4, 1.8]} />
      <Suspense fallback={null}>
        <AidenModel />
        <Environment preset="night" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.45} enableDamping />
    </Canvas>
  );
}

export default function AidenModelViewer(): React.JSX.Element {
  return (
    <main style={{ background: '#08070a', color: '#f0e4d2', height: '100vh' }}>
      <PreviewScene />
      <div
        style={{
          bottom: 24,
          fontFamily: 'var(--font-composer), ui-monospace, monospace',
          fontSize: 11,
          left: 24,
          letterSpacing: '0.14em',
          opacity: 0.72,
          position: 'fixed',
          textTransform: 'uppercase',
        }}
      >
        AIDEN lensing instrument · drag to inspect · scroll to zoom
      </div>
    </main>
  );
}

useGLTF.preload('/models/aiden/aiden-observatory.glb');
