'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Project = {
  tag: string;
  name: string;
  meta: string;
  stats: string[];
  accent: string;
  year: string;
};

const PROJECTS: Project[] = [
  {
    tag: 'AGENTIC AI',
    name: 'MIRA',
    meta: 'Pipecat · WebSockets · Sub-100ms latency',
    stats: ['REAL-TIME VOICE AGENT', 'GEMINI LIVE · VERTEX AI', 'LATENCY — 92MS'],
    accent: '#FF3B2F',
    year: '2025',
  },
  {
    tag: 'COMPUTATIONAL PHYSICS',
    name: 'EMI SHIELD',
    meta: 'Schelkunoff · React Native',
    stats: ['FREQ RANGE — 100KHZ→10GHZ', 'MULTI-LAYER SE MODEL', 'FIELD-READY TOOLKIT'],
    accent: '#B8FF3C',
    year: '2025',
  },
  {
    tag: 'AI VEHICLE INSPECTION',
    name: 'VERONICA',
    meta: 'Automated QA · Vision pipeline',
    stats: ['1,047 PARTS TRACKED', 'AGENT-DRIVEN INSPECTION', 'DRIVEX PRODUCTION'],
    accent: '#60A5FA',
    year: '2025',
  },
  {
    tag: 'QUANTUM FINANCE',
    name: 'QUANTUM OPTIONS',
    meta: 'Qiskit · Monte Carlo',
    stats: ['70% SIMULATION SPEEDUP', 'DERIVATIVES PRICING', 'AMPLITUDE ESTIMATION'],
    accent: '#A78BFA',
    year: '2024',
  },
  {
    tag: 'AUTONOMOUS EV',
    name: 'FORMULA MANIPAL',
    meta: 'FM23e · 1st Formula Bharat',
    stats: ['₹60L SPONSORSHIP SECURED', 'FULL AUTONOMY STACK', 'NATIONAL CHAMPIONS'],
    accent: '#F59E0B',
    year: '2024',
  },
];

export default function Projects() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const getScrollDistance = () =>
        Math.max(0, track.scrollWidth - window.innerWidth);

      const horizontalTween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      const cards = cardsRef.current.filter(Boolean);
      gsap.set(cards, { x: 60, autoAlpha: 0 });
      gsap.to(cards, {
        x: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
        },
      });

      return () => {
        horizontalTween.scrollTrigger?.kill();
        horizontalTween.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="projects-section relative min-h-screen w-full overflow-hidden bg-[#0B0D10]"
      aria-label="Selected work"
    >
      <header className="projects-header flex h-20 items-center justify-between px-[6vw] pt-10">
        <div className="flex items-center gap-6">
          <span className="font-mono text-[9px] tracking-[0.2em] text-[rgba(232,228,216,0.4)]">
            05 / 07
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#B8FF3C]">
            WORK
          </span>
        </div>
        <div className="font-mono text-[9px] tracking-[0.2em] text-[rgba(232,228,216,0.3)]">
          &larr; DRAG TO EXPLORE &rarr;
        </div>
      </header>

      <div className="projects-viewport relative flex h-[calc(100vh-5rem)] items-center">
        <div
          ref={trackRef}
          className="projects-track flex items-center gap-6 will-change-transform"
          style={{ padding: '0 10vw' }}
        >
          {PROJECTS.map((project, index) => (
            <article
              key={project.name}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              className="project-card group relative flex shrink-0 flex-col justify-between"
              style={
                {
                  width: '340px',
                  height: '420px',
                  background: '#1C2028',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 0,
                  padding: '1.5rem',
                  // Hide the native pointer so the custom Cursor component owns
                  // the visual cue. Applied on the card (not the section) so
                  // the Drag-to-explore header text still shows a default arrow
                  // if the Cursor component is inactive.
                  cursor: 'none',
                  transition:
                    'border-color 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                  ['--accent' as string]: project.accent,
                } as React.CSSProperties
              }
            >
              <div
                className="project-card-tag font-mono uppercase"
                style={{
                  fontSize: '8px',
                  letterSpacing: '0.2em',
                  color: project.accent,
                }}
              >
                {project.tag}
              </div>

              <div className="project-card-body flex flex-col gap-4">
                <h3
                  className="project-card-name text-[#E8E4D8]"
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: '2rem',
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {project.name}
                </h3>
                <ul className="project-card-stats flex flex-col gap-1.5">
                  {project.stats.map((stat) => (
                    <li
                      key={stat}
                      className="font-mono"
                      style={{
                        fontSize: '9px',
                        letterSpacing: '0.18em',
                        color: 'rgba(232,228,216,0.4)',
                      }}
                    >
                      {stat}
                    </li>
                  ))}
                </ul>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '9px',
                    letterSpacing: '0.18em',
                    color: 'rgba(232,228,216,0.25)',
                  }}
                >
                  {project.meta}
                </div>
              </div>

              <div className="project-card-footer flex flex-col gap-3">
                <div
                  className="project-card-line"
                  style={{
                    width: '100%',
                    height: '1.5px',
                    background: project.accent,
                    opacity: 0.25,
                  }}
                />
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '8px',
                      letterSpacing: '0.2em',
                      color: 'rgba(232,228,216,0.4)',
                    }}
                  >
                    {project.year}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '8px',
                      letterSpacing: '0.2em',
                      color: 'rgba(232,228,216,0.25)',
                    }}
                  >
                    0{index + 1}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .project-card:hover {
          border-color: color-mix(in srgb, var(--accent) 40%, transparent) !important;
          transform: scale(1.02);
        }
      `}</style>
    </section>
  );
}
