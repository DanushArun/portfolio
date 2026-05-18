import { makePSet, type PSet, mulberry32, fastTurbulence, gauss } from './buffers';
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
    
    const sigInner = 0.08; 
    const sigOuter = 1.2; 
    
    const knotSpec = KNOT_TABLE.find(k => k.lang === knot.lang);
    const rgb = knotSpec ? hexToRgb(knotSpec.hue) : [1, 1, 1];

    const numStrands = Math.max(10, Math.floor(count / 150));
    const strands = [];
    for(let s = 0; s < numStrands; s++) {
        strands.push({
            isInner: rng() < 0.20,
            baseR: Math.abs(gauss(rng)),
            thetaBase: Math.acos(2 * rng() - 1),
            phiBase: 2 * Math.PI * rng(),
            tLength: rng() * Math.PI * 1.5,
            noiseOffset: rng() * 100.0
        });
    }
    
    for (let j = 0; j < count; j++) {
      const strand = strands[j % numStrands];
      const isInner = strand.isInner;
      const t = rng(); 
      
      const currentPhi = strand.phiBase + t * strand.tLength;
      const currentTheta = strand.thetaBase + Math.sin(t * Math.PI) * 0.5;
      
      const r = strand.baseR * (isInner ? sigInner : sigOuter) * (0.8 + 0.4 * Math.sin(t * Math.PI));
      
      let dx = r * Math.sin(currentTheta) * Math.cos(currentPhi);
      let dy = r * Math.sin(currentTheta) * Math.sin(currentPhi);
      let dz = r * Math.cos(currentTheta);
      
      if (isInner) {
         const coreCurl = fastTurbulence(knot.pos[0]+dx, knot.pos[1]+dy, knot.pos[2]+dz, strand.noiseOffset, 6.0);
         dx += coreCurl[0] * 0.08;
         dy += coreCurl[1] * 0.08;
         dz += coreCurl[2] * 0.08;
      } else {
        const curl = fastTurbulence(knot.pos[0]+dx, knot.pos[1]+dy, knot.pos[2]+dz, strand.noiseOffset, 1.8);
        const curlMicro = fastTurbulence(knot.pos[0]+dx, knot.pos[1]+dy, knot.pos[2]+dz, strand.noiseOffset * 2.0, 4.0);
        
        dx += curl[0] * 0.8 + curlMicro[0] * 0.15;
        dy += curl[1] * 0.8 + curlMicro[1] * 0.15;
        dz += curl[2] * 0.8 + curlMicro[2] * 0.15;
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
      
      out.densityLevel[j] = isInner ? 1.2 : Math.max(0, 1.0 - (r / sigOuter));
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
