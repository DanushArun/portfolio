import { makePSet, type PSet, mulberry32, gauss } from './buffers';
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
    const count = PARTICLE_BUDGET[quality][knot.lang]; 
    const out = makePSet(count);
    const rng = mulberry32(0x1000 + i * 42);
    
    const knotSpec = KNOT_TABLE.find(k => k.lang === knot.lang);
    const rgb = knotSpec ? hexToRgb(knotSpec.hue) : [1, 1, 1];

    const numRays = Math.max(100, Math.floor(count / 100));
    const rays = [];
    for(let s = 0; s < numRays; s++) {
        const theta = Math.acos(2 * rng() - 1);
        const phi = 2 * Math.PI * rng();
        rays.push({
            dirX: Math.sin(theta) * Math.cos(phi),
            dirY: Math.sin(theta) * Math.sin(phi),
            dirZ: Math.cos(theta),
            length: 0.8 + Math.abs(gauss(rng)) * 2.0,
            thickness: Math.abs(gauss(rng)) * 0.01,
            noiseOffset: rng() * 1000,
        });
    }
    
    for (let j = 0; j < count; j++) {
      const isCore = rng() < 0.50;
      let dx, dy, dz, r;
      const ray = rays[j % numRays];

      if (isCore) {
        r = Math.abs(gauss(rng)) * 0.05;
        const theta = Math.acos(2 * rng() - 1);
        const phi = 2 * Math.PI * rng();
        dx = r * Math.sin(theta) * Math.cos(phi);
        dy = r * Math.sin(theta) * Math.sin(phi);
        dz = r * Math.cos(theta);
      } else {
        const t = rng();
        const tExp = t * t;
        r = tExp * ray.length;
        const angle1 = rng() * Math.PI * 2;
        const angle2 = Math.acos(2 * rng() - 1);
        const scatterDist = Math.abs(gauss(rng)) * ray.thickness;
        dx = ray.dirX * r + Math.sin(angle2) * Math.cos(angle1) * scatterDist;
        dy = ray.dirY * r + Math.sin(angle2) * Math.sin(angle1) * scatterDist;
        dz = ray.dirZ * r + Math.cos(angle2) * scatterDist;
      }
      
      const idx = j * 3;
      out.pos[idx] = knot.pos[0] + dx;
      out.pos[idx + 1] = knot.pos[1] + dy;
      out.pos[idx + 2] = knot.pos[2] + dz;
      
      out.color[idx] = rgb[0];
      out.color[idx + 1] = rgb[1];
      out.color[idx + 2] = rgb[2];
      
      out.isCore[j] = isCore ? 1.0 : 0.0;
      out.isLoop[j] = 0.0;
      out.densityLevel[j] = isCore ? 1.5 : Math.max(0, 1.0 - (r / 2.0));

      out.warpParams[idx]   = isCore ? 0.0 : ray.noiseOffset;
      out.warpParams[idx+1] = isCore ? 0.0 : r * 0.8; // Grow chaos with distance
      out.warpParams[idx+2] = 0.0;
    }
    sets.push(out);
  });
  
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
    result.warpParams.set(s.warpParams, off3);
    off3 += n * 3; off1 += n;
  }
  return result;
}