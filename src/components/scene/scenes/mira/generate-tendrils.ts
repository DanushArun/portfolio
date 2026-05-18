import { makePSet, type PSet, slicePSet, mulberry32, gauss } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type Quality } from './knot-config';
import { KNOT_TABLE } from '@/lib/mira-state';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

// Cubic Bezier interpolation
function getBezierPoint(t: number, p0: number[], p1: number[], p2: number[], p3: number[]): number[] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  let p = [
    uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
    uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2],
  ];
  return p;
}

export function generateTendrils(quality: Quality): PSet {
  const count = PARTICLE_BUDGET[quality].Tendrils;
  const out = makePSet(count);
  const rng = mulberry32(0x9999);
  
  let placed = 0;

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

  // Deep electric blue for the void web
  const voidColor = [0.05, 0.20, 1.0]; 

  for (const edge of edges) {
    const edgeParticles = Math.floor((edge.len / totalLen) * count);
    const A = [KNOTS_W[edge.a].pos[0], KNOTS_W[edge.a].pos[1], KNOTS_W[edge.a].pos[2]];
    const B = [KNOTS_W[edge.b].pos[0], KNOTS_W[edge.b].pos[1], KNOTS_W[edge.b].pos[2]];
    
    // Generate 3 main "trunks" per edge for organic bundling
    const numTrunks = 3;
    const trunks = [];
    
    for(let k = 0; k < numTrunks; k++) {
      // Trunk control points push out sideways to create curved sweeping lines
      const mid = [(A[0]+B[0])/2, (A[1]+B[1])/2, (A[2]+B[2])/2];
      const ortho = [
        (rng() - 0.5) * edge.len * 0.4,
        (rng() - 0.5) * edge.len * 0.4,
        (rng() - 0.5) * edge.len * 0.4,
      ];
      
      trunks.push({
        c1: [A[0] + (mid[0]-A[0])*0.5 + ortho[0], A[1] + (mid[1]-A[1])*0.5 + ortho[1], A[2] + (mid[2]-A[2])*0.5 + ortho[2]],
        c2: [B[0] + (mid[0]-B[0])*0.5 + ortho[0], B[1] + (mid[1]-B[1])*0.5 + ortho[1], B[2] + (mid[2]-B[2])*0.5 + ortho[2]],
      });
    }

    // Generate hundreds of individual micro-strands that follow the trunks
    const numStrands = Math.max(50, Math.floor(edgeParticles / 200));
    const strands = [];
    for(let s = 0; s < numStrands; s++) {
      const parentTrunk = trunks[Math.floor(rng() * trunks.length)];
      // Strands deviate slightly from their parent trunk
      const deviation = 0.5;
      strands.push({
        c1: [
          parentTrunk.c1[0] + gauss(rng) * deviation,
          parentTrunk.c1[1] + gauss(rng) * deviation,
          parentTrunk.c1[2] + gauss(rng) * deviation,
        ],
        c2: [
          parentTrunk.c2[0] + gauss(rng) * deviation,
          parentTrunk.c2[1] + gauss(rng) * deviation,
          parentTrunk.c2[2] + gauss(rng) * deviation,
        ],
        thickness: Math.abs(gauss(rng)) * 0.05,
      });
    }

    for (let i = 0; i < edgeParticles && placed < count; i++) {
      const strand = strands[i % numStrands];
      // Exponentiate t slightly to cluster more particles near the hubs
      let tRaw = rng();
      const t = tRaw < 0.5 ? 0.5 * Math.pow(2 * tRaw, 1.5) : 1 - 0.5 * Math.pow(2 * (1 - tRaw), 1.5);
      
      const p = getBezierPoint(t, A, strand.c1, strand.c2, B);
      
      // Micro-scatter for strand thickness
      const angle1 = rng() * Math.PI * 2;
      const angle2 = Math.acos(2 * rng() - 1);
      p[0] += Math.sin(angle2) * Math.cos(angle1) * strand.thickness;
      p[1] += Math.sin(angle2) * Math.sin(angle1) * strand.thickness;
      p[2] += Math.cos(angle2) * strand.thickness;

      // Color mapping: Starts at Hub A, fades to Deep Blue Void, ends at Hub B
      const distFromEnd = Math.abs(t - 0.5) * 2.0; // 0 in middle, 1 at ends
      const endColor = [
        edge.colorA[0] * (1 - t) + edge.colorB[0] * t,
        edge.colorA[1] * (1 - t) + edge.colorB[1] * t,
        edge.colorA[2] * (1 - t) + edge.colorB[2] * t
      ];

      // Sharp mix into electric blue web
      const mixFactor = Math.pow(distFromEnd, 2.5);
      let cR = voidColor[0] * (1 - mixFactor) + endColor[0] * mixFactor;
      let cG = voidColor[1] * (1 - mixFactor) + endColor[1] * mixFactor;
      let cB = voidColor[2] * (1 - mixFactor) + endColor[2] * mixFactor;

      const idx = placed * 3;
      out.pos[idx] = p[0];
      out.pos[idx+1] = p[1];
      out.pos[idx+2] = p[2];
      
      out.color[idx] = cR;
      out.color[idx+1] = cG;
      out.color[idx+2] = cB;
      
      out.isCore[placed] = 0.0;
      out.isLoop[placed] = 0.0;
      out.densityLevel[placed] = 0.5 + mixFactor * 0.5; // Brighter near hubs
      
      placed++;
    }
  }

  return slicePSet(out, placed);
}