'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Dynamic imports — every section uses browser-only APIs (canvas, GSAP,
// IntersectionObserver, Lenis), so we disable SSR across the board.
const Loader = dynamic(() => import('@/components/Loader'), { ssr: false });
const Hero = dynamic(() => import('@/components/Hero'), { ssr: false });
const Manifesto = dynamic(() => import('@/components/Manifesto'), { ssr: false });
const Mira = dynamic(() => import('@/components/Mira'), { ssr: false });
const Projects = dynamic(() => import('@/components/Projects'), { ssr: false });
const Numbers = dynamic(() => import('@/components/Numbers'), { ssr: false });
const Formula = dynamic(() => import('@/components/Formula'), { ssr: false });
const Contact = dynamic(() => import('@/components/Contact'), { ssr: false });
const Nav = dynamic(() => import('@/components/Nav'), { ssr: false });
const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false });
const LenisProvider = dynamic(
  () => import('@/components/LenisProvider'),
  { ssr: false },
);

export default function Home() {
  const [loaderDone, setLoaderDone] = useState(false);

  // Register ScrollTrigger once on mount (client-only). Doing it here rather
  // than at module scope keeps the side-effect inside React's lifecycle and
  // cooperates cleanly with StrictMode double-invocation.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  return (
    <>
      <Cursor />
      {!loaderDone && <Loader onComplete={() => setLoaderDone(true)} />}

      <LenisProvider>
        <Nav />
        <main>
          <section id="hero">
            <Hero />
          </section>
          <section id="manifesto">
            <Manifesto />
          </section>
          <section id="mira">
            <Mira />
          </section>
          <section id="projects">
            <Projects />
          </section>
          <section id="numbers">
            <Numbers />
          </section>
          <section id="formula">
            <Formula />
          </section>
          <section id="contact">
            <Contact />
          </section>
        </main>
      </LenisProvider>
    </>
  );
}
