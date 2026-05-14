import { makePSet, type PSet, mulberry32, gauss, curlNoise3D_JS } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type Quality } from './knot-config';
import { KNOT_TABLE } from '@/lib/mira-state';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export function generateHubs(quality: Quality): PSet {
  const sets: PSet[] = [];
  
  KNOTS_W.forEach((knot, i) => {
    // Determine allocation
    const count = PARTICLE_BUDGET[quality][knot.lang];
    const out = makePSet(count);
    const rng = mulberry32(0x1000 + i * 42);
    
    const sigInner = 0.067;
    const sigOuter = 0.35; // increased for wider organic spread
    const knotSpec = KNOT_TABLE.find(k => k.lang === knot.lang);
    const rgb = knotSpec ? hexToRgb(knotSpec.hue) : [1, 1, 1];
    
    for (let j = 0; j < count; j++) {
      const isInner = rng() < 0.40;
      const r = Math.abs(gauss(rng)) * (isInner ? sigInner : sigOuter);
      
      const theta = Math.acos(2 * rng() - 1);
      const phi = 2 * Math.PI * rng();
      
      let dx = r * Math.sin(theta) * Math.cos(phi);
      let dy = r * Math.sin(theta) * Math.sin(phi);
      let dz = r * Math.cos(theta);
      
      if (!isInner) {
        // Apply curl noise to outer particles to make them swirl
        const curl = curlNoise3D_JS((knot.pos[0]+dx)*0.8, (knot.pos[1]+dy)*0.8, (knot.pos[2]+dz)*0.8);
        dx += curl[0] * 0.25;
        dy += curl[1] * 0.25;
        dz += curl[2] * 0.25;
      }
      
      const idx = j * 3;
      out.pos[idx] = knot.pos[0] + dx;
      out.pos[idx + 1] = knot.pos[1] + dy;
      out.pos[idx + 2] = knot.pos[2] + dz;
      
      out.color[idx] = rgb[0];
      out.color[idx + 1] = rgb[1];
      out.color[idx + 2] = rgb[2];
      
      out.isCore[j] = isInner ? 1.0 : 0.0;
      out.isLoop[j] = 0.0;
      out.densityLevel[j] = Math.max(0, 1.0 - (r / sigOuter));
    }
    
    sets.push(out);
  });
  
  // Quick merge
  const total = sets.reduce((a, s) => a + s.isCore.length, 0);
  const result = makePSet(total);
  let off1 = 0; let off3 = 0;
  for (const s of sets) {
    const n = s.isCore.length;
    result.pos.set(s.pos, off3);
    result.color.set(s.color, off3);
    result.isCore.set(s.isCore, off1);
    result.isLoop.set(s.isLoop, off1);
    result.densityLevel.set(s.densityLevel, off1);
    off3 += n * 3; off1 += n;
  }
  return result;
}
