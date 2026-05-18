import { makePSet, type PSet, mulberry32, gauss, fastTurbulence } from './buffers';
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
  const thickness = 0.05;
  
  const rotX = 15 * Math.PI / 180;
  const rotZ = 45 * Math.PI / 180;
  
  const cx = Math.cos(rotX); const sx = Math.sin(rotX);
  const cz = Math.cos(rotZ); const sz = Math.sin(rotZ);
  
  // Group loop particles into hundreds of microscopic, parallel filaments
  const numStrands = Math.max(50, Math.floor(count / 150));
  const strands = Array.from({length: numStrands}, () => {
    return {
      ox: (rng() - 0.5) * 0.2, // Reduced from 0.8
      oy: (rng() - 0.5) * 0.2, // Reduced from 0.8
      noiseOffset: rng() * 100.0,
      isShedding: rng() < 0.15
    };
  });
  
  for (let i = 0; i < count; i++) {
    const strand = strands[i % numStrands];
    const isShedding = strand.isShedding;
    
    // Position along the loop
    const t = rng() * Math.PI * 2;
    
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const denom = 1 + sinT * sinT;
    
    const bx = a * cosT / denom;
    const by = a * sinT * cosT / denom;
    const bz = 0;

    const dt = 0.01;
    const t2 = t + dt;
    const sinT2 = Math.sin(t2);
    const cosT2 = Math.cos(t2);
    const denom2 = 1 + sinT2 * sinT2;
    const bx2 = a * cosT2 / denom2;
    const by2 = a * sinT2 * cosT2 / denom2;
    const tx = bx2 - bx;
    const ty = by2 - by;
    const tz = 0;
    
    const lenT = Math.sqrt(tx*tx + ty*ty + tz*tz) || 1;
    const Tx = tx / lenT; const Ty = ty / lenT; const Tz = tz / lenT;
    
    // Constant random basis per particle to give some cylindrical volume to the strand
    const rx = 0.5; const ry = 0.5; const rz = 0.5; 
    let crossX = Ty * rz - Tz * ry;
    let crossY = Tz * rx - Tx * rz;
    let crossZ = Tx * ry - Ty * rx;
    const crossLen = Math.sqrt(crossX*crossX + crossY*crossY + crossZ*crossZ) || 1;
    crossX /= crossLen; crossY /= crossLen; crossZ /= crossLen;
    
    let b2X = Ty * crossZ - Tz * crossY;
    let b2Y = Tz * crossX - Tx * crossZ;
    let b2Z = Tx * crossY - Ty * crossX;
    const b2Len = Math.sqrt(b2X*b2X + b2Y*b2Y + b2Z*b2Z) || 1;
    b2X /= b2Len; b2Y /= b2Len; b2Z /= b2Len;
    
    const sx_pos = bx + crossX * strand.ox + b2X * strand.oy;
    const sy_pos = by + crossY * strand.ox + b2Y * strand.oy;
    const sz_pos = bz + crossZ * strand.ox + b2Z * strand.oy;
    
    const offset = Math.abs(gauss(rng)) * thickness;
    const angle = rng() * Math.PI * 2;
    
    const pxFinal = sx_pos + Math.cos(angle) * offset;
    const pyFinal = sy_pos + Math.sin(angle) * offset;
    const pzFinal = sz_pos + (rng() - 0.5) * offset;
    
    const y1 = pyFinal * cx - pzFinal * sx;
    const z1 = pyFinal * sx + pzFinal * cx;
    const x1 = pxFinal;
    
    const x2 = x1 * cz - y1 * sz;
    const y2 = x1 * sz + y1 * cz;
    const z2 = z1;
    
    let px = enKnot.pos[0] + x2;
    let py = enKnot.pos[1] + y2;
    let pz = enKnot.pos[2] + z2;
    
    // Structural breakdown & micro-chaos via trigonometric noise to weave the strands
    const curl = fastTurbulence(px, py, pz, strand.noiseOffset, 1.5);
    const curl2 = fastTurbulence(px, py, pz, strand.noiseOffset * 2.0, 3.0);
    
    px += curl[0] * (isShedding ? 0.8 : 0.2) + curl2[0] * 0.05;
    py += curl[1] * (isShedding ? 0.8 : 0.2) + curl2[1] * 0.05;
    pz += curl[2] * (isShedding ? 0.8 : 0.2) + curl2[2] * 0.05;
    
    const idx = i * 3;
    out.pos[idx] = px;
    out.pos[idx+1] = py;
    out.pos[idx+2] = pz;
    
    out.color[idx] = rgb[0];
    out.color[idx+1] = rgb[1];
    out.color[idx+2] = rgb[2];
    
    out.isCore[i] = 0.0;
    out.isLoop[i] = 1.0;
    out.densityLevel[i] = isShedding ? 0.2 : 0.9;
  }
  
  return out;
}
