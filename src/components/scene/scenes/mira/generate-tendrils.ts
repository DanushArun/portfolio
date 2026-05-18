import { makePSet, type PSet, slicePSet, mulberry32, fastTurbulence, gauss } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type Quality } from './knot-config';
import { KNOT_TABLE } from '@/lib/mira-state';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export function generateTendrils(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].Tendrils;
  const out = makePSet(count);
  const rng = mulberry32(0x9999);
  
  let placed = 0;

  // 100% budget to filaments to increase density
  const edges: { a: number, b: number, len: number, colorA: number[], colorB: number[] }[] = [];
  let totalLen = 0;
  for (let i = 0; i < KNOTS_W.length; i++) {
    const kSpecA = KNOT_TABLE.find(k => k.lang === KNOTS_W[i].lang);
    const colorA = kSpecA ? hexToRgb(kSpecA.hue) : [1, 1, 1];
    
    for (let j = i + 1; j < KNOTS_W.length; j++) {
      const a = KNOTS_W[i].pos;
      const b = KNOTS_W[j].pos;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];
      const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      const kSpecB = KNOT_TABLE.find(k => k.lang === KNOTS_W[j].lang);
      const colorB = kSpecB ? hexToRgb(kSpecB.hue) : [1, 1, 1];
      
      edges.push({ a: i, b: j, len, colorA, colorB });
      totalLen += len;
    }
  }

  for (const edge of edges) {
    const edgeParticles = Math.floor((edge.len / totalLen) * count);
    const A = KNOTS_W[edge.a].pos;
    const B = KNOTS_W[edge.b].pos;
    
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const dz = B[2] - A[2];
    
    const upX = 0; const upY = 1; const upZ = 0;
    let p1X = dy * upZ - dz * upY;
    let p1Y = dz * upX - dx * upZ;
    let p1Z = dx * upY - dy * upX;
    const p1Len = Math.sqrt(p1X*p1X + p1Y*p1Y + p1Z*p1Z) || 1;
    p1X /= p1Len; p1Y /= p1Len; p1Z /= p1Len;
    
    let p2X = dy * p1Z - dz * p1Y;
    let p2Y = dz * p1X - dx * p1Z;
    let p2Z = dx * p1Y - dy * p1X;
    const p2Len = Math.sqrt(p2X*p2X + p2Y*p2Y + p2Z*p2Z) || 1;
    p2X /= p2Len; p2Y /= p2Len; p2Z /= p2Len;

    const numStrands = Math.max(25, Math.floor(edgeParticles / 80));
    const strands = [];
    for(let s = 0; s < numStrands; s++) {
      strands.push({
        radius: Math.abs(gauss(rng)) * 0.5, 
        angle: rng() * Math.PI * 2,
        noiseOffset: rng() * 100.0,
        fossilized: rng() < 0.05
      });
    }

    for (let i = 0; i < edgeParticles && placed < count; i++) {
      const strand = strands[i % numStrands];
      const t = rng(); 
      
      const bulge = Math.sin(t * Math.PI); 
      const currentRadius = strand.radius * (0.1 + 0.9 * bulge);
      
      let px = A[0] + dx * t + p1X * currentRadius * Math.cos(strand.angle) + p2X * currentRadius * Math.sin(strand.angle);
      let py = A[1] + dy * t + p1Y * currentRadius * Math.cos(strand.angle) + p2Y * currentRadius * Math.sin(strand.angle);
      let pz = A[2] + dz * t + p1Z * currentRadius * Math.cos(strand.angle) + p2Z * currentRadius * Math.sin(strand.angle);

      const curl1 = fastTurbulence(px, py, pz, strand.noiseOffset, 0.3);
      const curl2 = fastTurbulence(px, py, pz, strand.noiseOffset * 2.0, 1.5);

      px += curl1[0] * 1.5 * bulge + curl2[0] * 0.3 * bulge;
      py += curl1[1] * 1.5 * bulge + curl2[1] * 0.3 * bulge;
      pz += curl1[2] * 1.5 * bulge + curl2[2] * 0.3 * bulge;

      const distFromEnd = Math.abs(t - 0.5) * 2.0; 
      const endColor = [
        edge.colorA[0] * (1 - t) + edge.colorB[0] * t,
        edge.colorA[1] * (1 - t) + edge.colorB[1] * t,
        edge.colorA[2] * (1 - t) + edge.colorB[2] * t
      ];

      // Fade out into pitch black
      const mixFactor = Math.pow(distFromEnd, 0.8);
      let cR = endColor[0] * mixFactor;
      let cG = endColor[1] * mixFactor;
      let cB = endColor[2] * mixFactor;

      if (strand.fossilized) { cR *= 0.1; cG *= 0.1; cB *= 0.2; }

      const idx = placed * 3;
      out.pos[idx] = px;
      out.pos[idx+1] = py;
      out.pos[idx+2] = pz;
      
      out.color[idx] = cR;
      out.color[idx+1] = cG;
      out.color[idx+2] = cB;
      
      out.isCore[placed] = 0.0;
      out.isLoop[placed] = 0.0;
      out.densityLevel[placed] = strand.fossilized ? -1.0 : Math.max(0.0, 1.0 - currentRadius * 1.5) * mixFactor; 
      
      placed++;
    }
  }

  return slicePSet(out, placed);
}
