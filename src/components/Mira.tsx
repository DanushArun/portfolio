'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BG = '#101014';
const RED = '255,59,47';
const CREAM = '#E8E4D8';

// Shared module-level references to the live mic analyser. Drawing code runs
// in a render loop created outside React; using a ref here (vs. passing
// analyser through a dozen function boundaries) keeps the hot path fast.
const micAnalyser: { ref: AnalyserNode | null } = { ref: null };
const micBuf: { ref: Uint8Array } = { ref: new Uint8Array(256) };
const micActive: { ref: boolean } = { ref: false };

type WaveCtx = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
};

function drawGrid({ ctx, w, h }: WaveCtx) {
  ctx.strokeStyle = `rgba(${RED},0.05)`;
  ctx.lineWidth = 0.5;
  const cols = 8;
  const rows = 4;
  for (let i = 1; i < cols; i++) {
    const x = (w / cols) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i++) {
    const y = (h / rows) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawInputWave({ ctx, w, h, t }: WaveCtx) {
  // If the mic is active, replace the synthetic waveform with live time-domain
  // data. We sample analyser.getByteTimeDomainData (0..255, center=128) and map
  // each byte to a y offset. This is the "wow factor": the oscilloscope now
  // responds to the visitor's voice in real time.
  if (micActive.ref && micAnalyser.ref) {
    const buf = micBuf.ref;
    micAnalyser.ref.getByteTimeDomainData(buf as unknown as Uint8Array<ArrayBuffer>);
    const len = buf.length;

    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const sampleIdx = Math.floor((x / w) * len);
      const byte = buf[sampleIdx];
      // Map 0..255 with 128 center → -1..1, then to pixels. Amplitude gain
      // of h * 0.22 makes quiet speech visible without clipping loud audio.
      const v = ((byte - 128) / 128) * h * 0.22;
      if (x === 0) ctx.moveTo(x, h * 0.22 + v);
      else ctx.lineTo(x, h * 0.22 + v);
    }
    ctx.strokeStyle = `rgba(${RED},0.9)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return;
  }

  // Synthetic fallback.
  // Ghost trail (previous frame)
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const tg = t - 0.07;
    const voice = Math.sin((Math.PI * x) / w) * Math.sin(tg * 3.8 + x * 0.06) * h * 0.045;
    const carrier = Math.sin((x / w) * Math.PI * 2 * 6 + tg * 2.2) * h * 0.1;
    const v = carrier + voice;
    if (x === 0) ctx.moveTo(x, h * 0.22 + v);
    else ctx.lineTo(x, h * 0.22 + v);
  }
  ctx.strokeStyle = `rgba(${RED},0.08)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Live input wave
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const voice = Math.sin((Math.PI * x) / w) * Math.sin(t * 3.8 + x * 0.06) * h * 0.045;
    const carrier = Math.sin((x / w) * Math.PI * 2 * 6 + t * 2.2) * h * 0.1;
    const v = carrier + voice;
    if (x === 0) ctx.moveTo(x, h * 0.22 + v);
    else ctx.lineTo(x, h * 0.22 + v);
  }
  ctx.strokeStyle = `rgba(${RED},0.8)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawEmbedWave({ ctx, w, h, t }: WaveCtx) {
  const step = Math.max(Math.floor(w / 20), 4);
  ctx.beginPath();
  let started = false;
  for (let x = 0; x < w; x += step) {
    const v = Math.sin(x * 0.05 + t * 1.3) * h * 0.06;
    const y = h * 0.52 + v;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
    ctx.lineTo(x + step * 0.88, y);
    ctx.lineTo(x + step, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawOutputWave({ ctx, w, h, t }: WaveCtx) {
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const v = Math.sin((x / w) * Math.PI * 2 * 3.5 + t * 1.9) * h * 0.09;
    if (x === 0) ctx.moveTo(x, h * 0.8 + v);
    else ctx.lineTo(x, h * 0.8 + v);
  }
  ctx.strokeStyle = `rgba(${RED},0.48)`;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawScanLine({ ctx, w, h, t }: WaveCtx) {
  const sx = (t * 80) % w;
  ctx.fillStyle = `rgba(${RED},0.07)`;
  ctx.fillRect(sx, 0, 1.5, h);
}

function drawFrame(wctx: WaveCtx) {
  const { ctx, w, h } = wctx;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  drawGrid(wctx);
  drawInputWave(wctx);
  drawEmbedWave(wctx);
  drawOutputWave(wctx);
  drawScanLine(wctx);
}

function useOscilloscope(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const t = (now - start) / 1000;
      drawFrame({ ctx, w: canvas.clientWidth, h: canvas.clientHeight, t });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}

function useLatencyTicker(ref: React.RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id = 0;
    const tick = () => {
      const v = Math.floor(82 + Math.random() * 28);
      el.textContent = `${v}ms`;
      id = window.setTimeout(tick, 180 + Math.random() * 220);
    };
    tick();
    return () => clearTimeout(id);
  }, [ref]);
}

export default function Mira({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const latencyRef = useRef<HTMLSpanElement>(null);

  // UI state for the mic button. Keep handles in refs so we can tear down
  // cleanly (important: unreleased MediaStream tracks keep the browser's
  // recording indicator on even after navigation).
  const [micState, setMicState] = useState<'idle' | 'requesting' | 'listening' | 'denied'>(
    'idle'
  );
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useOscilloscope(canvasRef);
  useLatencyTicker(latencyRef);

  // Tear down audio on unmount. getUserMedia tracks must be explicitly
  // stopped; relying on GC leaves the tab's recording indicator lit.
  useEffect(() => {
    return () => {
      micActive.ref = false;
      micAnalyser.ref = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  const toggleMic = async () => {
    if (micState === 'listening') {
      micActive.ref = false;
      micAnalyser.ref = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      setMicState('idle');
      return;
    }
    if (micState === 'requesting') return;
    setMicState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtxCtor();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      streamRef.current = stream;
      micAnalyser.ref = analyser;
      micBuf.ref = new Uint8Array(analyser.frequencyBinCount);
      micActive.ref = true;
      setMicState('listening');
    } catch {
      setMicState('denied');
      setTimeout(() => setMicState('idle'), 2000);
    }
  };

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const title = titleRef.current;
    if (!section || !canvas || !title) return;

    const ctx = gsap.context(() => {
      gsap.set(canvas, { opacity: 0 });
      gsap.set(title, { y: 40, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true,
        },
      });
      tl.to(canvas, { opacity: 1, duration: 0.6, ease: 'power2.out' })
        .to(
          title,
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          0.2,
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={className}
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: BG,
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Top-left legend */}
      <div
        style={{
          position: 'absolute',
          top: '2.5vh',
          left: '2rem',
          display: 'flex',
          gap: '1.4rem',
          fontFamily: '"Space Mono", monospace',
          fontSize: 7,
          letterSpacing: '0.25em',
          color: `rgba(${RED},0.75)`,
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        <span>INPUT</span>
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>EMBED</span>
        <span>OUTPUT</span>
      </div>

      {/* Top-right latency */}
      <div
        style={{
          position: 'absolute',
          top: '2.5vh',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontFamily: '"Space Mono", monospace',
          fontSize: 11,
          color: `rgb(${RED})`,
          letterSpacing: '0.1em',
          pointerEvents: 'none',
        }}
      >
        <span style={{ opacity: 0.5 }}>LAT</span>
        <span ref={latencyRef}>98ms</span>
      </div>

      {/* Bottom-right: tap-to-speak button. Wires the visitor's real voice
          into the oscilloscope via Web Audio API. Sits above the REC LED. */}
      <button
        type="button"
        onClick={toggleMic}
        aria-pressed={micState === 'listening'}
        aria-label={micState === 'listening' ? 'Stop microphone' : 'Activate microphone'}
        style={{
          position: 'absolute',
          bottom: 'calc(2.5vh + 28px)',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          padding: '0.5rem 0.8rem',
          background: micState === 'listening' ? `rgba(${RED},0.12)` : 'rgba(255,255,255,0.03)',
          border: `1px solid rgba(${RED},${micState === 'listening' ? 0.7 : 0.35})`,
          color: `rgba(${RED},0.95)`,
          fontFamily: '"Space Mono", monospace',
          fontSize: 8,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: `rgb(${RED})`,
            boxShadow: micState === 'listening' ? `0 0 10px rgba(${RED},0.9)` : 'none',
            animation: micState === 'listening' ? 'mira-pulse 0.9s ease-in-out infinite' : 'none',
          }}
        />
        <span>
          {micState === 'listening'
            ? 'LISTENING'
            : micState === 'requesting'
            ? 'CONNECTING'
            : micState === 'denied'
            ? 'MIC BLOCKED'
            : 'TAP TO SPEAK'}
        </span>
      </button>

      {/* Bottom-right blinking LED */}
      <div
        style={{
          position: 'absolute',
          bottom: '2.5vh',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: '"Space Mono", monospace',
          fontSize: 9,
          color: `rgba(${RED},0.8)`,
          letterSpacing: '0.2em',
          pointerEvents: 'none',
        }}
      >
        <span>REC</span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: `rgb(${RED})`,
            boxShadow: `0 0 8px rgba(${RED},0.7)`,
            animation: 'mira-blink 1.2s steps(2, end) infinite',
          }}
        />
      </div>

      {/* Bottom-left overlay title */}
      <div
        ref={titleRef}
        style={{
          position: 'absolute',
          bottom: '6vh',
          left: '2rem',
          color: CREAM,
          pointerEvents: 'none',
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.3em',
            opacity: 0.55,
            marginBottom: '1rem',
            textTransform: 'uppercase',
          }}
        >
          Agentic AI &middot; DriveX &middot; 2025
        </div>
        <h2
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(5rem, 14vw, 12rem)',
            lineHeight: 0.85,
            letterSpacing: '-0.03em',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          MIRA
          <br />
          LIVE
        </h2>
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '1.2rem',
            fontFamily: '"Space Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          <span>Pipecat &middot; WebSockets</span>
          <span>Sub-100ms latency</span>
        </div>
      </div>

      <style>{`
        @keyframes mira-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.2; }
        }
        @keyframes mira-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.55; }
        }
      `}</style>
    </section>
  );
}
