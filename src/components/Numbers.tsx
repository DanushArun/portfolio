'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Metric = {
  key: string;
  target: number;
  display: (v: number) => { number: string; unit: string };
  sub: string;
  sparkline: string;
};

const METRICS: Metric[] = [
  {
    key: 'LATENCY',
    target: 92,
    display: (v) => ({ number: Math.round(v).toString(), unit: 'ms' }),
    sub: 'Mira voice pipeline · Pipecat · WebSockets',
    sparkline: '▁▂▃▂▃▅▇█▇▆',
  },
  {
    key: 'PARTS INSPECTED',
    target: 1047,
    display: (v) => ({
      number: Math.round(v).toLocaleString('en-US'),
      unit: '',
    }),
    sub: 'Veronica AI agent · Vehicle inspection',
    sparkline: '▁▂▂▃▃▅▆▇▇█',
  },
  {
    key: 'SHARPE RATIO ↑',
    target: 15.3,
    display: (v) => ({ number: `+${v.toFixed(1)}`, unit: '%' }),
    sub: 'Deep Q-Learning · Azure · DRL',
    sparkline: '▁▂▃▃▅▆▅▆▇█',
  },
  {
    key: 'MONTE CARLO SPEEDUP',
    target: 70,
    display: (v) => ({ number: Math.round(v).toString(), unit: '%' }),
    sub: 'Quantum computing · Qiskit simulation',
    sparkline: '▁▂▃▅▆▇█▇█▇',
  },
  {
    key: 'SPONSORSHIP SECURED',
    target: 60,
    display: (v) => ({ number: `₹${Math.round(v)}`, unit: 'L' }),
    sub: 'Formula Manipal · 1st Formula Bharat 2024',
    sparkline: '▁▂▃▃▅▆▇▇█▇',
  },
];

export default function Numbers() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cellsRef = useRef<HTMLDivElement[]>([]);
  const valueRefs = useRef<HTMLSpanElement[]>([]);

  useGSAP(
    () => {
      const cells = cellsRef.current.filter(Boolean);
      const values = valueRefs.current.filter(Boolean);
      if (!cells.length) return;

      const valueEls = values.map((el) => ({
        numberEl: el.querySelector<HTMLElement>('[data-number]'),
        unitEl: el.querySelector<HTMLElement>('[data-unit]'),
      }));

      // Slam effect: numbers start huge (2x) + transparent + pushed down.
      // As they count, they scale down to 1x while fading in. The result
      // reads like the digits "land" into their final size in time with the
      // counter reaching its target value.
      gsap.set(values, {
        y: '100%',
        autoAlpha: 0,
        scale: 2,
        transformOrigin: 'left bottom',
      });
      gsap.set(
        cells.map((c) => c.querySelector('.numbers-cell-line')),
        { scaleX: 0, transformOrigin: 'left center' }
      );
      gsap.set(
        cells.map((c) => c.querySelector('.numbers-cell-spark')),
        { autoAlpha: 0 }
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          toggleActions: 'play none none reverse',
        },
      });

      tl.to(values, {
        y: '0%',
        autoAlpha: 1,
        scale: 1,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.09,
      });

      METRICS.forEach((metric, i) => {
        const proxy = { val: 0 };
        tl.to(
          proxy,
          {
            val: metric.target,
            duration: 1.6,
            ease: 'power3.out',
            onUpdate: () => {
              const refs = valueEls[i];
              if (!refs?.numberEl || !refs.unitEl) return;
              const out = metric.display(proxy.val);
              refs.numberEl.textContent = out.number;
              refs.unitEl.textContent = out.unit;
            },
          },
          `<+=${i * 0.09}`
        );
      });

      tl.to(
        cells.map((c) => c.querySelector('.numbers-cell-line')),
        {
          scaleX: 1,
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.09,
        },
        '-=1.2'
      );

      tl.to(
        cells.map((c) => c.querySelector('.numbers-cell-spark')),
        {
          autoAlpha: 1,
          duration: 0.6,
          ease: 'power1.out',
          stagger: 0.06,
        },
        '-=0.3'
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="numbers-section relative flex min-h-screen w-full flex-col bg-[#0B0D10]"
      aria-label="Metrics"
    >
      <header className="numbers-header flex h-[100px] items-center justify-between px-[6vw] pt-10">
        <div className="flex items-center gap-6">
          <span className="font-mono text-[9px] tracking-[0.2em] text-[rgba(232,228,216,0.4)]">
            06 / 07
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#B8FF3C]">
            DATA AS DESIGN
          </span>
        </div>
        <h2
          className="text-[#E8E4D8]"
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 5rem)',
            letterSpacing: '-0.02em',
            lineHeight: 0.9,
          }}
        >
          THE NUMBERS
        </h2>
        <div className="font-mono text-[9px] tracking-[0.2em] text-[rgba(232,228,216,0.25)]">
          05 METRICS
        </div>
      </header>

      <div
        className="numbers-grid grid my-auto w-full"
        style={{
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1px',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        {METRICS.map((metric, i) => (
          <div
            key={metric.key}
            ref={(el) => {
              if (el) cellsRef.current[i] = el;
            }}
            className="numbers-cell relative flex flex-col justify-between bg-[#0B0D10]"
            style={{ padding: '2.5rem 2rem' }}
          >
            <div>
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: '7px',
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.2)',
                  marginBottom: '1rem',
                }}
              >
                {metric.key}
              </div>

              <div
                className="numbers-cell-value-wrap"
                style={{ overflow: 'hidden', display: 'block' }}
              >
                <span
                  ref={(el) => {
                    if (el) valueRefs.current[i] = el;
                  }}
                  className="numbers-cell-value"
                  style={{
                    display: 'inline-block',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                    color: '#E8E4D8',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    willChange: 'transform, opacity',
                  }}
                >
                  <em
                    data-number
                    style={{
                      color: '#B8FF3C',
                      fontStyle: 'normal',
                    }}
                  >
                    0
                  </em>
                  <span
                    data-unit
                    style={{
                      color: '#E8E4D8',
                      marginLeft: '0.1em',
                    }}
                  />
                </span>
              </div>

              <div
                className="numbers-cell-sub font-mono"
                style={{
                  fontSize: '8px',
                  color: 'rgba(255,255,255,0.22)',
                  lineHeight: 1.6,
                  marginTop: '0.5rem',
                  letterSpacing: '0.05em',
                }}
              >
                {metric.sub}
              </div>
            </div>

            <div
              className="numbers-cell-spark font-mono"
              style={{
                fontSize: '14px',
                color: '#B8FF3C',
                marginTop: '0.4rem',
                letterSpacing: '0.05em',
              }}
              aria-hidden
            >
              {metric.sparkline}
            </div>

            <div
              className="numbers-cell-line"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '1px',
                background:
                  'linear-gradient(90deg, transparent, #B8FF3C, transparent)',
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
