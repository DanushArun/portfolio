import { makePSet, type PSet, slicePSet, mulberry32, gauss, curlNoise3D_JS } from './buffers';
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
  
  let placed = 0;
  // Deep space blue/purple void color for the dark tendrils
  const voidColor = [0.05, 0.15, 0.5]; 
  
  edges.forEach((edge) => {
    const edgeCount = Math.floor((edge.len / totalLen) * count);
    const A = KNOTS_W[edge.a].pos;
    const B = KNOTS_W[edge.b].pos;
    
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const dz = B[2] - A[2];
    
    // Perpendicular basis
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
    
    const P0 = A;
    const P3 = B;
    
    // Create distinct strands per edge to bundle particles into fibers
    const numStrands = 35;
    const strands = Array.from({length: numStrands}, () => {
      const spread = 2.0; 
      const off1X = (rng() - 0.5) * spread;
      const off1Y = (rng() - 0.5) * spread;
      const off2X = (rng() - 0.5) * spread;
      const off2Y = (rng() - 0.5) * spread;
      return { off1X, off1Y, off2X, off2Y };
    });
    
    for (let i = 0; i < edgeCount && placed < count; i++) {
      const strand = strands[Math.floor(rng() * numStrands)];
      const t = rng();
      
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;
      
      const P1 = [
        A[0] + dx * 0.35 + p1X * strand.off1X + p2X * strand.off1Y,
        A[1] + dy * 0.35 + p1Y * strand.off1X + p2Y * strand.off1Y,
        A[2] + dz * 0.35 + p1Z * strand.off1X + p2Z * strand.off1Y
      ];
      const P2 = [
        B[0] - dx * 0.35 + p1X * strand.off2X + p2X * strand.off2Y,
        B[1] - dy * 0.35 + p1Y * strand.off2X + p2Y * strand.off2Y,
        B[2] - dz * 0.35 + p1Z * strand.off2X + p2Z * strand.off2Y
      ];
      
      const bx = mt3*P0[0] + 3*mt2*t*P1[0] + 3*mt*t2*P2[0] + t3*P3[0];
      const by = mt3*P0[1] + 3*mt2*t*P1[1] + 3*mt*t2*P2[1] + t3*P3[1];
      const bz = mt3*P0[2] + 3*mt2*t*P1[2] + 3*mt*t2*P2[2] + t3*P3[2];
      
      // Tight scatter around the strand core
      const radius = 0.04;
      const offset = Math.abs(gauss(rng)) * radius;
      const angle = rng() * Math.PI * 2;
      
      let px = bx + Math.cos(angle) * offset;
      let py = by + Math.sin(angle) * offset;
      let pz = bz + (rng() - 0.5) * offset;
      
      // Powerful, low-frequency curl noise to twist strands organically
      const curl = curlNoise3D_JS(px * 0.3, py * 0.3, pz * 0.3);
      const curlAmp = 0.45;
      px += curl[0] * curlAmp;
      py += curl[1] * curlAmp;
      pz += curl[2] * curlAmp;
      
      const idx = placed * 3;
      out.pos[idx] = px;
      out.pos[idx+1] = py;
      out.pos[idx+2] = pz;
      
      const distFromEnd = Math.abs(t - 0.5) * 2.0; // 0 at mid, 1 at ends
      const density = 1.0 - distFromEnd * 0.6; 
      
      const endColor = [
        edge.colorA[0] * (1 - t) + edge.colorB[0] * t,
        edge.colorA[1] * (1 - t) + edge.colorB[1] * t,
        edge.colorA[2] * (1 - t) + edge.colorB[2] * t
      ];
      
      const mixFactor = Math.pow(distFromEnd, 1.5); 
      
      out.color[idx] = voidColor[0] * (1 - mixFactor) + endColor[0] * mixFactor;
      out.color[idx+1] = voidColor[1] * (1 - mixFactor) + endColor[1] * mixFactor;
      out.color[idx+2] = voidColor[2] * (1 - mixFactor) + endColor[2] * mixFactor;
      
      out.isCore[placed] = 0.0;
      out.isLoop[placed] = 0.0;
      out.densityLevel[placed] = density;
      
      placed++;
    }
  });
  
  if (placed < count) {
    return slicePSet(out, placed);
  }
  return out;
}
