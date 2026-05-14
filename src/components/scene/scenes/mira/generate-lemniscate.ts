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
  
  const hiKnot = KNOTS_W.find(k => k.lang === 'HI');
  if (!hiKnot) return out;
  
  const hiSpec = KNOT_TABLE.find(k => k.lang === 'HI');
  const rgb = hiSpec ? hexToRgb(hiSpec.hue) : [1, 0.72, 0.3];
  
  const a = 1.11; // 25 / 22.5
  const thickness = 0.04;
  
  // Rotation 35 deg around X, 25 deg around Z
  const rotX = 35 * Math.PI / 180;
  const rotZ = 25 * Math.PI / 180;
  
  const cx = Math.cos(rotX); const sx = Math.sin(rotX);
  const cz = Math.cos(rotZ); const sz = Math.sin(rotZ);
  
  for (let i = 0; i < count; i++) {
    const t = rng() * Math.PI * 2;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const denom = 1 + sinT * sinT;
    
    const bx = a * cosT / denom;
    const by = a * sinT * cosT / denom;
    const bz = 0;
    
    // derivative for tangent
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
    
    // Tangent vector
    const lenT = Math.sqrt(tx*tx + ty*ty + tz*tz) || 1;
    const Tx = tx / lenT; const Ty = ty / lenT; const Tz = tz / lenT;
    
    const rx = rng() - 0.5; const ry = rng() - 0.5; const rz = rng() - 0.5;
    let crossX = Ty * rz - Tz * ry;
    let crossY = Tz * rx - Tx * rz;
    let crossZ = Tx * ry - Ty * rx;
    const crossLen = Math.sqrt(crossX*crossX + crossY*crossY + crossZ*crossZ) || 1;
    crossX /= crossLen; crossY /= crossLen; crossZ /= crossLen;
    
    const offset = Math.abs(gauss(rng)) * thickness;
    
    const pxFinal = bx + crossX * offset;
    const pyFinal = by + crossY * offset;
    const pzFinal = bz + crossZ * offset;
    
    // Apply rotX
    const y1 = pyFinal * cx - pzFinal * sx;
    const z1 = pyFinal * sx + pzFinal * cx;
    const x1 = pxFinal;
    
    // Apply rotZ
    const x2 = x1 * cz - y1 * sz;
    const y2 = x1 * sz + y1 * cz;
    const z2 = z1;
    
    const idx = i * 3;
    out.pos[idx] = hiKnot.pos[0] + x2;
    out.pos[idx+1] = hiKnot.pos[1] + y2;
    out.pos[idx+2] = hiKnot.pos[2] + z2;
    
    out.color[idx] = rgb[0];
    out.color[idx+1] = rgb[1];
    out.color[idx+2] = rgb[2];
    
    out.isCore[i] = 0.0;
    out.isLoop[i] = 1.0;
    out.densityLevel[i] = 0.8;
  }
  
  return out;
}
