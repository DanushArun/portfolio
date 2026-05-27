import { mulberry32, type Rng, type Vec3 } from './buffers';
import { getTendrilCurves } from './generate-tendrils';
import { type Quality } from './knot-config';
import { webColor } from './tendril-appearance';
import { curvePoint, TAU, type Curve } from './tendril-geometry';

export interface TendrilLineSet {
  readonly color: Float32Array;
  readonly count: number;
  readonly pos: Float32Array;
}

export const TENDRIL_LINE_CONFIG = {
  high: {
    segments: 18,
    stride: 1,
  },
  low: {
    segments: 10,
    stride: 5,
  },
} as const satisfies Record<Quality, { segments: number; stride: number }>;

const THICK_LINE_WIDTH = 0.045;

function flattenCurves(): readonly Curve[] {
  const curves = getTendrilCurves();
  return [...curves.blue, ...curves.violet, ...curves.gold];
}

function copiesFor(curve: Curve): number {
  if (curve.width < THICK_LINE_WIDTH) return 1;
  if (curve.layer === 'gold') return 2;
  return 3;
}

function selectedCurves(quality: Quality): readonly Curve[] {
  const stride = TENDRIL_LINE_CONFIG[quality].stride;
  return flattenCurves().filter((_, index) => index % stride === 0);
}

function vertexCount(curves: readonly Curve[], quality: Quality): number {
  const segments = TENDRIL_LINE_CONFIG[quality].segments;
  return curves.reduce((sum, curve) => sum + copiesFor(curve) * segments * 2, 0);
}

function offsetPoint(point: Vec3, curve: Curve, copy: number): Vec3 {
  if (copy === 0) return point;
  const angle = curve.noise + (copy * TAU) / 3;
  const amount = curve.width * (0.34 + copy * 0.24);
  return [
    point[0] + Math.cos(angle) * amount,
    point[1] + Math.sin(angle) * amount,
    point[2] + Math.sin(angle * 0.7) * amount * 0.28,
  ];
}

function writeVertex(
  out: TendrilLineSet,
  vertex: number,
  point: Vec3,
  color: Vec3,
): void {
  const ptr = vertex * 3;
  out.pos[ptr] = point[0];
  out.pos[ptr + 1] = point[1];
  out.pos[ptr + 2] = point[2];
  out.color[ptr] = color[0] * 0.72;
  out.color[ptr + 1] = color[1] * 0.72;
  out.color[ptr + 2] = color[2] * 0.72;
}

function writeSegment(
  out: TendrilLineSet,
  vertex: number,
  curve: Curve,
  copy: number,
  t: number,
  step: number,
  rng: Rng,
): number {
  const a = offsetPoint(curvePoint(curve, t), curve, copy);
  const b = offsetPoint(curvePoint(curve, Math.min(1, t + step)), curve, copy);
  const color = webColor(curve, t, rng);
  writeVertex(out, vertex, a, color);
  writeVertex(out, vertex + 1, b, color);
  return vertex + 2;
}

function writeCurve(
  out: TendrilLineSet,
  vertex: number,
  curve: Curve,
  quality: Quality,
  rng: Rng,
): number {
  const copies = copiesFor(curve);
  const segments = TENDRIL_LINE_CONFIG[quality].segments;
  const step = 1 / segments;
  let cursor = vertex;
  for (let copy = 0; copy < copies; copy++) {
    for (let i = 0; i < segments; i++) {
      cursor = writeSegment(out, cursor, curve, copy, i / segments, step, rng);
    }
  }
  return cursor;
}

export function generateTendrilLines(quality: Quality): TendrilLineSet {
  const curves = selectedCurves(quality);
  const count = vertexCount(curves, quality);
  const out = {
    color: new Float32Array(count * 3),
    count,
    pos: new Float32Array(count * 3),
  };
  const rng = mulberry32(0x17A1E5);
  let vertex = 0;
  curves.forEach((curve) => {
    vertex = writeCurve(out, vertex, curve, quality, rng);
  });
  return out;
}
