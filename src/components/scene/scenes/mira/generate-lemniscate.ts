import { makePSet, type PSet, mulberry32, gauss, curlNoise3D_JS } from './buffers';
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
  const thickness = 0.01; // thinner base strands
  
  // Rotation 35 deg around X, 25 deg around Z
  const rotX = 35 * Math.PI / 180;
  const rotZ = 25 * Math.PI / 180;
  
  const cx = Math.cos(rotX); const sx = Math.sin(rotX);
  const cz = Math.cos(rotZ); const sz = Math.sin(rotZ);
  
  const numStrands = 15;
  const strands = Array.from({length: numStrands}, () => {
    return {
      ox: (rng() - 0.5) * 0.15,
      oy: (rng() - 0.5) * 0.15,
    };
  });
  
  for (let i = 0; i < count; i++) {
    const strand = strands[Math.floor(rng() * numStrands)];
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
    
    // Create a perpendicular basis to apply the strand offset
    let b2X = Ty * crossZ - Tz * crossY;
    let b2Y = Tz * crossX - Tx * crossZ;
    let b2Z = Tx * crossY - Ty * crossX;
    const b2Len = Math.sqrt(b2X*b2X + b2Y*b2Y + b2Z*b2Z) || 1;
    b2X /= b2Len; b2Y /= b2Len; b2Z /= b2Len;
    
    // Base position on the strand
    const sx_pos = bx + crossX * strand.ox + b2X * strand.oy;
    const sy_pos = by + crossY * strand.ox + b2Y * strand.oy;
    const sz_pos = bz + crossZ * strand.ox + b2Z * strand.oy;
    
    const offset = Math.abs(gauss(rng)) * thickness;
    const angle = rng() * Math.PI * 2;
    
    const pxFinal = sx_pos + Math.cos(angle) * offset;
    const pyFinal = sy_pos + Math.sin(angle) * offset;
    const pzFinal = sz_pos + (rng() - 0.5) * offset;
    
    // Apply rotX
    const y1 = pyFinal * cx - pzFinal * sx;
    const z1 = pyFinal * sx + pzFinal * cx;
    const x1 = pxFinal;
    
    // Apply rotZ
    const x2 = x1 * cz - y1 * sz;
    const y2 = x1 * sz + y1 * cz;
    const z2 = z1;
    
    let px = hiKnot.pos[0] + x2;
    let py = hiKnot.pos[1] + y2;
    let pz = hiKnot.pos[2] + z2;
    
    const curl = curlNoise3D_JS(px * 0.4, py * 0.4, pz * 0.4);
    px += curl[0] * 0.2;
    py += curl[1] * 0.2;
    pz += curl[2] * 0.2;
    
    const idx = i * 3;
    out.pos[idx] = px;
    out.pos[idx+1] = py;
    out.pos[idx+2] = pz;
    
    out.color[idx] = rgb[0];
    out.color[idx+1] = rgb[1];
    out.color[idx+2] = rgb[2];
    
    out.isCore[i] = 0.0;
    out.isLoop[i] = 1.0;
    out.densityLevel[i] = 0.8;
  }
  
  return out;
}
