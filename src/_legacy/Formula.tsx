'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const RING_RADIUS = 232;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SECTOR_GAP = 6;
const SECTOR_LENGTH = (RING_CIRCUMFERENCE - SECTOR_GAP * 3) / 3;

const TICK_COUNT = 120;

// Circuit SVG native coords
const TRACK_VIEW_W = 540;
const TRACK_VIEW_H = 320;

// Rendered circuit size (bigger than before: 420 wide, preserving aspect)
const TRACK_RENDER_W = 420;
const TRACK_RENDER_H = Math.round((TRACK_RENDER_W * TRACK_VIEW_H) / TRACK_VIEW_W); // 249

// Estimated Formula Student lap at Kari Motor Speedway (2.3 km)
const LAP_TIME_SECONDS = 84.372; // ~ 1:24.372

// Sector pips: fractions of total path length where dot-markers should sit.
// S1 = T2 exit (end of main straight / right entry).
// S2 = Mickey Mouse entry (upper portion).
// S3 = Bowl exit (lower-left returning to S/F).
const SECTOR_PIP_FRACTIONS = [0.38, 0.7, 0.92];

export default function Formula() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pipsRef = useRef<SVGGElement>(null);
  const progressRef = useRef({ value: 0 });
  const [lapTime, setLapTime] = useState('00:00.000');

  useEffect(() => {
    const path = pathRef.current;
    const car = carRef.current;
    const section = sectionRef.current;
    const pipsGroup = pipsRef.current;
    if (!path || !car || !section || !pipsGroup) return;

    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

    // Place sector pips at real points on the circuit path.
    SECTOR_PIP_FRACTIONS.forEach((frac, idx) => {
      const pt = path.getPointAtLength(frac * length);
      const pip = pipsGroup.children[idx] as SVGCircleElement | undefined;
      if (pip) {
        pip.setAttribute('cx', String(pt.x));
        pip.setAttribute('cy', String(pt.y));
      }
    });

    const drawTween = gsap.to(path, {
      strokeDashoffset: 0,
      duration: 2.8,
      ease: 'power3.inOut',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        once: true,
      },
    });

    const scaleX = TRACK_RENDER_W / TRACK_VIEW_W;
    const scaleY = TRACK_RENDER_H / TRACK_VIEW_H;

    const carTween = gsap.to(progressRef.current, {
      value: 1,
      duration: LAP_TIME_SECONDS,
      repeat: -1,
      ease: 'none',
      delay: 3,
      onUpdate: () => {
        const frac = progressRef.current.value;
        const pt = path.getPointAtLength(frac * length);
        const x = pt.x * scaleX;
        const y = pt.y * scaleY;
        car.style.transform = `translate(${x - 5}px, ${y - 5}px)`;

        const seconds = frac * LAP_TIME_SECONDS;
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
        setLapTime(
          `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
        );
      },
    });

    return () => {
      drawTween.scrollTrigger?.kill();
      drawTween.kill();
      carTween.kill();
    };
  }, []);

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 360 - 90;
    const isMajor = i % 10 === 0;
    const innerR = isMajor ? 254 : 258;
    const outerR = 264;
    const rad = (angle * Math.PI) / 180;
    const cx = 290;
    const cy = 290;
    return (
      <line
        key={i}
        x1={cx + Math.cos(rad) * innerR}
        y1={cy + Math.sin(rad) * innerR}
        x2={cx + Math.cos(rad) * outerR}
        y2={cy + Math.sin(rad) * outerR}
        stroke={isMajor ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}
        strokeWidth={isMajor ? 1.5 : 1}
      />
    );
  });

  const sectorDasharray = `${SECTOR_LENGTH} ${RING_CIRCUMFERENCE - SECTOR_LENGTH}`;

  return (
    <section
      ref={sectionRef}
      id="formula"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#12151A',
        overflow: 'hidden',
        color: '#E8E4D8',
      }}
    >
      {/* Section marker top */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 32,
          right: 32,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: '"Space Mono", monospace',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          zIndex: 5,
        }}
      >
        <span>07 / 07</span>
        <span>FORMULA + CONTACT</span>
      </div>

      {/* HUD + Circuit stage — positioned center-left, larger */}
      <div
        className="fm-center"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-52%, -50%)',
          width: 580,
          height: 580,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* HUD ring — 480px diameter (radius 232 in 580x580 viewBox centered 290,290) */}
        <svg
          width={580}
          height={580}
          viewBox="0 0 580 580"
          style={{ position: 'absolute', inset: 0 }}
          aria-hidden
        >
          {/* Outer base ring */}
          <circle
            cx={290}
            cy={290}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={16}
          />

          {/* Sector 1 — green */}
          <circle
            cx={290}
            cy={290}
            r={RING_RADIUS}
            fill="none"
            stroke="#4ade80"
            strokeWidth={2}
            strokeDasharray={sectorDasharray}
            strokeDashoffset={0}
            transform="rotate(-90 290 290)"
            opacity={0.9}
          />
          {/* Sector 2 — yellow */}
          <circle
            cx={290}
            cy={290}
            r={RING_RADIUS}
            fill="none"
            stroke="#facc15"
            strokeWidth={2}
            strokeDasharray={sectorDasharray}
            strokeDashoffset={-(SECTOR_LENGTH + SECTOR_GAP)}
            transform="rotate(-90 290 290)"
            opacity={0.9}
          />
          {/* Sector 3 — red */}
          <circle
            cx={290}
            cy={290}
            r={RING_RADIUS}
            fill="none"
            stroke="#f87171"
            strokeWidth={2}
            strokeDasharray={sectorDasharray}
            strokeDashoffset={-(SECTOR_LENGTH * 2 + SECTOR_GAP * 2)}
            transform="rotate(-90 290 290)"
            opacity={0.9}
          />

          {/* Tick marks */}
          <g>{ticks}</g>
        </svg>

        {/* Circuit SVG wrapper */}
        <div
          style={{
            position: 'relative',
            width: TRACK_RENDER_W,
            height: TRACK_RENDER_H,
          }}
        >
          <svg
            ref={svgRef}
            id="trackSvg"
            width={TRACK_RENDER_W}
            height={TRACK_RENDER_H}
            viewBox={`0 0 ${TRACK_VIEW_W} ${TRACK_VIEW_H}`}
            style={{ display: 'block', overflow: 'visible' }}
            aria-label="Kari Motor Speedway circuit — Formula Manipal"
          >
            {/* Kari Motor Speedway — 2.3 km, 14-turn layout
                Main straight (bottom) → T1-T2 chicane → T3 sweep →
                T4 chicane → Mickey Mouse → The Bowl → return to S/F */}
            <path
              ref={pathRef}
              id="circuit"
              d="
                M 60,260
                L 440,260
                Q 468,260 472,238
                L 476,210
                Q 479,190 462,180
                L 440,172
                Q 420,164 416,146
                L 412,126
                Q 408,108 422,98
                L 438,90
                Q 454,82 452,64
                Q 448,44 428,40
                L 400,38
                Q 378,38 370,56
                Q 358,78 340,84
                Q 320,90 316,108
                Q 312,128 328,140
                Q 342,152 336,172
                Q 328,195 308,205
                Q 280,215 254,206
                Q 226,196 218,172
                Q 210,146 226,130
                Q 242,114 236,92
                Q 228,66 204,56
                Q 176,46 152,58
                Q 124,72 116,100
                Q 108,128 120,152
                Q 132,176 118,200
                Q 104,226 80,240
                Q 66,248 60,260
                Z
              "
              stroke="#B8FF3C"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter:
                  'drop-shadow(0 0 6px #B8FF3C) drop-shadow(0 0 16px rgba(184,255,60,0.3))',
              }}
            />

            {/* S/F start-finish line tick — perpendicular to main straight */}
            <line
              x1={80}
              y1={252}
              x2={80}
              y2={268}
              stroke="rgba(232,228,216,0.6)"
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />

            {/* 2.3 KM track-length label near main straight */}
            <text
              x={250}
              y={280}
              textAnchor="middle"
              fontFamily='"Space Mono", monospace'
              fontSize={11}
              letterSpacing={2}
              fill="rgba(232,228,216,0.55)"
            >
              2.3 KM · MAIN STRAIGHT 665M
            </text>

            {/* Sector pips — S1 / S2 / S3 */}
            <g ref={pipsRef}>
              <circle r={4} fill="#4ade80" stroke="#12151A" strokeWidth={1.5} />
              <circle r={4} fill="#facc15" stroke="#12151A" strokeWidth={1.5} />
              <circle r={4} fill="#f87171" stroke="#12151A" strokeWidth={1.5} />
            </g>
          </svg>

          {/* Car dot */}
          <div
            ref={carRef}
            id="carDot"
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#B8FF3C',
              boxShadow:
                '0 0 8px #B8FF3C, 0 0 20px rgba(184,255,60,0.6), 0 0 32px rgba(184,255,60,0.3)',
              pointerEvents: 'none',
              willChange: 'transform',
            }}
          />

          {/* Live lap timer — near car/circuit */}
          <div
            style={{
              position: 'absolute',
              top: -28,
              right: -8,
              fontFamily: '"Space Mono", monospace',
              fontSize: 13,
              letterSpacing: '0.08em',
              color: '#B8FF3C',
              textShadow: '0 0 8px rgba(184,255,60,0.4)',
              pointerEvents: 'none',
            }}
          >
            {lapTime}
          </div>
        </div>
      </div>

      {/* Right-side race HUD data */}
      <div
        style={{
          position: 'absolute',
          right: 'clamp(32px, 5vw, 80px)',
          top: 'clamp(64px, 10vh, 120px)',
          fontFamily: '"Space Mono", monospace',
          fontSize: 10,
          lineHeight: 2,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          textAlign: 'right',
          zIndex: 5,
        }}
      >
        <div>FM23e &middot; Electric Vehicle</div>
        <div>Kari Motor Speedway &middot; Coimbatore</div>
        <div>Autonomous Path Planning</div>
        <div>Formula Bharat 2024</div>
        <div style={{ marginTop: 8, color: '#B8FF3C' }}>1ST PLACE &middot; Overall</div>
        <div style={{ color: '#B8FF3C' }}>&#8377;60L Sponsorship</div>
      </div>

      {/* Title: FORMULA MANIPAL — massive, bottom-left */}
      <h2
        style={{
          position: 'absolute',
          bottom: 'clamp(32px, 5vw, 64px)',
          left: 'clamp(24px, 5vw, 64px)',
          margin: 0,
          fontFamily: '"Syne", sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(3rem, 8vw, 7rem)',
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: '#E8E4D8',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        FORMULA
        <br />
        MANIPAL
      </h2>
    </section>
  );
}
