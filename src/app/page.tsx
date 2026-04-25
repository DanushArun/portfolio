'use client';

import dynamic from 'next/dynamic';

const SceneManager = dynamic(() => import('@/components/scene/SceneManager'), {
  ssr: false,
  loading: () => (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(232,228,216,0.3)', fontFamily: 'monospace',
      fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
    }}>
      initialising spacetime metric…
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <SceneManager />
      {/* CSS vignette — zero GPU cost, replaces PostFX Vignette effect */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.72) 100%)',
          pointerEvents: 'none',
          zIndex: 9,
        }}
      />
    </>
  );
}
