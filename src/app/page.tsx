'use client';

import dynamic from 'next/dynamic';

const SceneManager = dynamic(() => import('@/components/scene/SceneManager'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(232,228,216,0.3)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 10,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
      }}
    >
      initialising spacetime metric…
    </div>
  ),
});

export default function Home() {
  return <SceneManager />;
}
