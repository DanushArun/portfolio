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

    // Generate crisp "rays" emanating from the core
    const numRays = Math.max(50, Math.floor(count / 200));
    const rays = [];
    for(let s = 0; s < numRays; s++) {
        const theta = Math.acos(2 * rng() - 1);
        const phi = 2 * Math.PI * rng();
        rays.push({
            dirX: Math.sin(theta) * Math.cos(phi),
            dirY: Math.sin(theta) * Math.sin(phi),
            dirZ: Math.cos(theta),
            length: 0.3 + Math.abs(gauss(rng)) * 0.8,
            thickness: Math.abs(gauss(rng)) * 0.02
        });
    }
    
    for (let j = 0; j < count; j++) {
      // 80% of particles form the ultra-dense center
      const isCore = rng() < 0.80;
      
      let dx, dy, dz, r;
      
      if (isCore) {
        // Ultra-dense core sphere
        r = Math.abs(gauss(rng)) * 0.08;
        const theta = Math.acos(2 * rng() - 1);
        const phi = 2 * Math.PI * rng();
        dx = r * Math.sin(theta) * Math.cos(phi);
        dy = r * Math.sin(theta) * Math.sin(phi);
        dz = r * Math.cos(theta);
      } else {
        // Rays shooting outward
        const ray = rays[j % numRays];
        const t = rng(); // position along ray
        // Exponential distribution so more particles are near the center
        const tExp = t * t * t;
        r = tExp * ray.length;
        
        // Micro-scatter for ray thickness
        const angle1 = rng() * Math.PI * 2;
        const angle2 = Math.acos(2 * rng() - 1);
        
        dx = ray.dirX * r + Math.sin(angle2) * Math.cos(angle1) * ray.thickness;
        dy = ray.dirY * r + Math.sin(angle2) * Math.sin(angle1) * ray.thickness;
        dz = ray.dirZ * r + Math.cos(angle2) * ray.thickness;
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
      
      out.densityLevel[j] = isCore ? 1.5 : Math.max(0, 1.0 - (r / 1.5));
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
    off3 += n * 3; off1 += n;
  }
  return result;
}
