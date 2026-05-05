'use client';

import dynamic from 'next/dynamic';
import LDRLoader from '@/components/ui/LDRLoader';

const Experience = dynamic(() => import('@/components/Experience'), {
  ssr: false,
  loading: () => <LDRLoader />,
});

export default function Home() {
  return (
    <>
      <Experience />
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
