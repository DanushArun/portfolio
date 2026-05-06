'use client';

import PanelChrome from '../PanelChrome';
import { ChipRow } from '../PanelChip';
import { panelCopy } from '@/lib/copy';
import { panelHues, type } from '@/lib/design-tokens';
import { useEffect, useRef } from 'react';

export default function MiraPanel() {
  const c = panelCopy.W01_MIRA;
  const hue = panelHues.W01_MIRA;

  return (
    <PanelChrome
      phaseId="W01_MIRA"
      number={c.number}
      eyebrow={c.eyebrow}
      title={c.title}
      body={c.body}
      trail={[...c.trail]}
    >
      <MiraVisualization />
      <MiraOverlay metric={c.metric} chips={c.chips} languages={c.languages} primary={hue.primary} accent={hue.accent} />
    </PanelChrome>
  );
}

function MiraVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d', { alpha: true })!;
    const dpr = window.devicePixelRatio || 1;
    const W = cvs.width = cvs.offsetWidth * dpr;
    const H = cvs.height = cvs.offsetHeight * dpr;
    let raf = 0;
    let t = 0;

    const PARTICLE_COUNT = 8000;
    // x, y, ix (initial x), iy (initial y), speed offset
    const particles = new Float32Array(PARTICLE_COUNT * 5); 
    
    // Create horizontal dense volumetric shape
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Clamped normal distribution for X
      let nx = (Math.random() + Math.random() + Math.random() - 1.5) * 2.0; 
      nx = Math.max(-1, Math.min(1, nx));
      const x = W/2 + nx * (W * 0.35); // Takes up center 70%
      
      // Envelope determines amplitude at position X (fat center, tapered ends)
      const env = Math.exp(-Math.pow(nx * 2.5, 2)); 
      
      let ny = (Math.random() + Math.random() + Math.random() - 1.5) * 2.0;
      const y = H/2 + ny * (H * 0.3) * env;

      particles[i*5]   = x;
      particles[i*5+1] = y;
      particles[i*5+2] = x;
      particles[i*5+3] = y;
      particles[i*5+4] = Math.random() * Math.PI * 2; // phase
    }

    function draw() {
      // Motion blur trailing
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(10, 8, 32, 0.4)'; 
      ctx.fillRect(0, 0, W, H);

      // Additive glow for dense particles
      ctx.globalCompositeOperation = 'lighter';
      
      const W2 = W/2;
      const H2 = H/2;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = particles[i*5+2];
        const iy = particles[i*5+3];
        const phaseOffset = particles[i*5+4];
        
        // Organic flow field movement
        const angle = Math.sin(ix * 0.005 + t) + Math.cos(iy * 0.005 + t * 0.8);
        const force = Math.sin(phaseOffset - t * 2) * 3 * dpr;
        
        const x = ix + Math.cos(angle) * force;
        // Central pulse ripple effect
        const pulse = Math.sin(ix * 0.02 - t * 4) * 8 * dpr * Math.exp(-Math.pow((ix - W2)/(W*0.1), 2));
        const y = iy + Math.sin(angle) * force + pulse;
        
        // Color gradient: hot pink core -> purple edges
        const dY = Math.abs(y - H2) / (H * 0.3);
        const dX = Math.abs(x - W2) / (W * 0.4);
        const dist = Math.sqrt(dY*dY + dX*dX);
        
        if (dist < 0.2) {
          ctx.fillStyle = '#F0ABFC'; // Magenta/Pink core
        } else if (dist < 0.5) {
          ctx.fillStyle = '#C084FC'; // Light Purple
        } else {
          ctx.fillStyle = '#6D28D9'; // Deep purple void edge
        }

        ctx.fillRect(x, y, dpr, dpr);
      }

      // Draw heartbeat EKG graphic on the right
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(232, 228, 216, 0.8)';
      ctx.lineWidth = 1.5 * dpr;
      
      const startX = W * 0.72;
      const endX = W * 0.9;
      const cy = H / 2;
      
      const spike1 = startX + W * 0.04;
      const spike2 = startX + W * 0.05;
      const spike3 = startX + W * 0.06;
      const spike4 = startX + W * 0.07;
      
      ctx.moveTo(startX, cy);
      ctx.lineTo(spike1, cy);
      ctx.lineTo(spike2, cy - 25 * dpr);
      ctx.lineTo(spike3, cy + 35 * dpr);
      ctx.lineTo(spike4, cy);
      ctx.lineTo(endX, cy);
      ctx.stroke();

      // Traveling bright dot on the heartbeat line
      ctx.beginPath();
      ctx.fillStyle = '#FFFFFF';
      
      // Dot loops back and forth along the spike
      const progress = (Math.sin(t * 3) + 1) / 2; // 0 to 1
      const dotX = startX + W * 0.02 + progress * (W * 0.08);
      
      let dotY = cy;
      if (dotX > spike1 && dotX <= spike2) {
        dotY = cy - 25 * dpr * ((dotX - spike1) / (spike2 - spike1));
      } else if (dotX > spike2 && dotX <= spike3) {
        dotY = cy - 25 * dpr + 60 * dpr * ((dotX - spike2) / (spike3 - spike2));
      } else if (dotX > spike3 && dotX <= spike4) {
        dotY = cy + 35 * dpr - 35 * dpr * ((dotX - spike3) / (spike4 - spike3));
      }
      
      ctx.arc(dotX, dotY, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Dot glow
      ctx.globalAlpha = 0.4;
      ctx.arc(dotX, dotY, 6 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      t += 0.015;
      raf = requestAnimationFrame(draw);
    }
    
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0A0820' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

function MiraOverlay({
  metric, chips, languages, primary, accent,
}: {
  metric: { label: string; value: string };
  chips: readonly string[];
  languages: readonly string[];
  primary: string;
  accent: string;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '8%', right: '8%', display: 'flex', flexDirection: 'column', gap: '0.6em', alignItems: 'flex-end' }}>
        {languages.map((l, i) => (
          <span key={l} style={{ fontFamily: type.body, fontSize: '1.4rem', color: i === 0 ? primary : accent, opacity: 0.5 + i * 0.1, textShadow: `0 0 12px ${primary}66` }}>
            {l}
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '6%', right: '6%', textAlign: 'right' }}>
        <div style={{ fontFamily: type.mono, fontSize: 9, letterSpacing: '0.32em', color: 'rgba(232,228,216,0.45)', textTransform: 'uppercase', marginBottom: '0.4em' }}>{metric.label}</div>
        <div style={{ fontFamily: type.display, fontSize: 'clamp(1.4rem, 2vw, 1.8rem)', fontWeight: 800, color: primary, textShadow: `0 0 16px ${primary}88` }}>{metric.value}</div>
      </div>
      <div style={{ position: 'absolute', bottom: '6%', left: '4%', maxWidth: '65%', pointerEvents: 'auto' }}>
        <ChipRow chips={chips} primary={primary} />
      </div>
    </div>
  );
}