import { makePSet, type PSet, mulberry32, gauss } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type Quality } from './knot-config';
import { KNOT_TABLE } from '@/lib/mira-state';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export function generateLemniscate(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].HILoop;
  const out = makePSet(count);
  const rng = mulberry32(0x8888);
  
  const enKnot = KNOTS_W.find(k => k.lang === 'EN');
  if (!enKnot) return out;
  
  const enSpec = KNOT_TABLE.find(k => k.lang === 'EN');
  const rgb = enSpec ? hexToRgb(enSpec.hue) : [1, 0.72, 0.3];
  
  const a = 1.8; 
  
  const rotX = 15 * Math.PI / 180;
  const rotZ = 45 * Math.PI / 180;
  
  const cx = Math.cos(rotX); const sx = Math.sin(rotX);
  const cz = Math.cos(rotZ); const sz = Math.sin(rotZ);
  
  const numStrands = Math.max(50, Math.floor(count / 150));
  const strands = Array.from({length: numStrands}, () => {
    return {
      ox: (rng() - 0.5) * 0.1,
      oy: (rng() - 0.5) * 0.1,
      noiseOffset: rng() * 1000,
      thickness: Math.abs(gauss(rng)) * 0.02
    };
  });
  
  for (let i = 0; i < count; i++) {
    const strand = strands[i % numStrands];
    const t = rng() * Math.PI * 2;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const denom = 1 + sinT * sinT;
    
    const bx = a * cosT / denom;
    const by = a * sinT * cosT / denom;

    const dt = 0.01;
    const t2 = t + dt;
    const sinT2 = Math.sin(t2);
    const cosT2 = Math.cos(t2);
    const denom2 = 1 + sinT2 * sinT2;
    const bx2 = a * cosT2 / denom2;
    const by2 = a * sinT2 * cosT2 / denom2;
    const tx = bx2 - bx;
    const ty = by2 - by;
    const lenT = Math.sqrt(tx*tx + ty*ty) || 1;
    const Tx = tx / lenT; const Ty = ty / lenT;
    
    const crossX = Ty;
    const crossY = -Tx;
    
    const sx_pos = bx + crossX * strand.ox;
    const sy_pos = by + crossY * strand.ox;
    const sz_pos = (rng() - 0.5) * strand.thickness;
    
    const y1 = sy_pos * cx - sz_pos * sx;
    const z1 = sy_pos * sx + sz_pos * cx;
    const x1 = sx_pos;
    const x2 = x1 * cz - y1 * sz;
    const y2 = x1 * sz + y1 * cz;
    const z2 = z1;

    const idx = i * 3;
    out.pos[idx] = enKnot.pos[0] + x2;
    out.pos[idx+1] = enKnot.pos[1] + y2;
    out.pos[idx+2] = enKnot.pos[2] + z2;
    
    out.color[idx] = rgb[0];
    out.color[idx+1] = rgb[1];
    out.color[idx+2] = rgb[2];
    
    out.isCore[i] = 0.0;
    out.isLoop[i] = 1.0;
    out.densityLevel[i] = 0.9;

    out.warpParams[idx]   = strand.noiseOffset;
    out.warpParams[idx+1] = 0.4;
    out.warpParams[idx+2] = 0.0;
  }
  return out;
}
