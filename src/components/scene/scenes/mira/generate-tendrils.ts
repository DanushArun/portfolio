import { makePSet, type PSet, slicePSet, mulberry32, gauss } from './buffers';
import { KNOTS_W, PARTICLE_BUDGET, type Quality } from './knot-config';
import { KNOT_TABLE } from '@/lib/mira-state';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

// Cubic Bezier interpolation - Still on CPU but very fast
function getBezierPoint(t: number, p0: number[], p1: number[], p2: number[], p3: number[]): number[] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return [
    uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
    uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2],
  ];
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

  const voidColor = [0.05, 0.20, 1.0];

  for (const edge of edges) {
    const edgeParticles = Math.floor((edge.len / totalLen) * count);
    const A = [KNOTS_W[edge.a].pos[0], KNOTS_W[edge.a].pos[1], KNOTS_W[edge.a].pos[2]];
    const B = [KNOTS_W[edge.b].pos[0], KNOTS_W[edge.b].pos[1], KNOTS_W[edge.b].pos[2]];

    const numTrunks = 5;
    const trunks = [];
    for(let k = 0; k < numTrunks; k++) {
      const mid = [(A[0]+B[0])/2, (A[1]+B[1])/2, (A[2]+B[2])/2];
      const sweepRadius = edge.len * 0.4;
      const ortho = [(rng()-0.5)*sweepRadius, (rng()-0.5)*sweepRadius, (rng()-0.5)*sweepRadius];
      trunks.push({
        c1: [A[0] + (mid[0]-A[0])*0.5 + ortho[0], A[1] + (mid[1]-A[1])*0.5 + ortho[1], A[2] + (mid[2]-A[2])*0.5 + ortho[2]],
        c2: [B[0] + (mid[0]-B[0])*0.5 + ortho[0], B[1] + (mid[1]-B[1])*0.5 + ortho[1], B[2] + (mid[2]-B[2])*0.5 + ortho[2]],
        noiseOffset: rng() * 1000,
        chaosScale: 2.0 + rng() * 4.0
      });
    }

    const numCaps = Math.max(100, Math.floor(edgeParticles / 200));
    const capillaries = [];
    for(let s = 0; s < numCaps; s++) {
      const parentTrunk = trunks[Math.floor(rng() * trunks.length)];
      const deviation = edge.len * 0.05;
      capillaries.push({
        c1: [parentTrunk.c1[0] + gauss(rng)*deviation, parentTrunk.c1[1] + gauss(rng)*deviation, parentTrunk.c1[2] + gauss(rng)*deviation],
        c2: [parentTrunk.c2[0] + gauss(rng)*deviation, parentTrunk.c2[1] + gauss(rng)*deviation, parentTrunk.c2[2] + gauss(rng)*deviation],
        thickness: Math.abs(gauss(rng)) * 0.1,
        noiseOffset: parentTrunk.noiseOffset,
        chaosScale: parentTrunk.chaosScale,
      });
    }

    for (let i = 0; i < edgeParticles && placed < count; i++) {
      const cap = capillaries[i % numCaps];
      const tRaw = rng();
      const t = tRaw < 0.5 ? 0.5 * Math.pow(2 * tRaw, 1.3) : 1 - 0.5 * Math.pow(2 * (1 - tRaw), 1.3);
      const p = getBezierPoint(t, A, cap.c1, cap.c2, B);

      const distFromEnd = Math.abs(t - 0.5) * 2.0;
      const mixFactor = Math.pow(distFromEnd, 1.5);

      const idx = placed * 3;
      out.pos[idx] = p[0]; out.pos[idx+1] = p[1]; out.pos[idx+2] = p[2];

      out.color[idx]   = voidColor[0] * (1 - mixFactor) + (edge.colorA[0] * (1-t) + edge.colorB[0] * t) * mixFactor;
      out.color[idx+1] = voidColor[1] * (1 - mixFactor) + (edge.colorA[1] * (1-t) + edge.colorB[1] * t) * mixFactor;
      out.color[idx+2] = voidColor[2] * (1 - mixFactor) + (edge.colorA[2] * (1-t) + edge.colorB[2] * t) * mixFactor;

      out.isCore[placed] = 0.0;
      out.isLoop[placed] = 0.0;
      out.densityLevel[placed] = mixFactor * 0.8 + 0.2;

      // Pass noise parameters to GPU
      out.warpParams[idx]   = cap.noiseOffset;
      out.warpParams[idx+1] = cap.chaosScale;
      out.warpParams[idx+2] = cap.thickness;

      placed++;
    }
  }
  return slicePSet(out, placed);
}
