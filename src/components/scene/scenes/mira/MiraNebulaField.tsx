'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { mulberry32, type Rng, type Vec3 } from './buffers';
import { getTendrilCurves } from './generate-tendrils';
import { type Quality } from './knot-config';
import { webColor } from './tendril-appearance';
import { curvePoint, type Curve, type Layer } from './tendril-geometry';

interface NebulaMesh {
  readonly geometry: THREE.BufferGeometry;
}

const COUNTS = {
  high: 260_000,
  low: 32_000,
} as const satisfies Record<Quality, number>;

function countFor(quality: Quality): number {
  return COUNTS[quality];
}

function layerFor(index: number, count: number): Layer {
  const ratio = index / count;
  if (ratio < 0.72) return 'blue';
  if (ratio < 0.88) return 'violet';
  return 'gold';
}

function curveFor(layer: Layer, index: number): Curve {
  const curves = getTendrilCurves()[layer];
  return curves[index % curves.length];
}

function particlePoint(curve: Curve, rng: Rng): Vec3 {
  const t = rng();
  const body = Math.sin(Math.PI * t);
  const point = curvePoint(curve, t);
  const angle = rng() * Math.PI * 2;
  const spread = curve.layer === 'gold' ? 0.095 : curve.layer === 'violet' ? 0.14 : 0.18;
  const radius = (rng() ** 1.65) * spread * (0.46 + body);
  return [
    point[0] + Math.cos(angle) * radius,
    point[1] + Math.sin(angle) * radius * 0.82,
    point[2] + (rng() - 0.5) * spread * 0.46,
  ];
}

function createNebulaGeometry(quality: Quality): THREE.BufferGeometry {
  const count = countFor(quality);
  const position = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const rng = mulberry32(0xC01D5E);

  for (let index = 0; index < count; index++) {
    const layer = layerFor(index, count);
    const curve = curveFor(layer, index);
    const point = particlePoint(curve, rng);
    const rgb = webColor(curve, rng(), rng);
    const ptr = index * 3;
    position.set(point, ptr);
    color[ptr] = rgb[0] * 0.82;
    color[ptr + 1] = rgb[1] * 0.84;
    color[ptr + 2] = rgb[2] * 0.94;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 18);
  return geometry;
}

function createNebulaMesh(quality: Quality): NebulaMesh {
  return { geometry: createNebulaGeometry(quality) };
}

export function MiraNebulaField({
  quality,
  reveal,
}: {
  quality: Quality;
  reveal: number;
}): React.JSX.Element {
  const mesh = useMemo(() => createNebulaMesh(quality), [quality]);

  useEffect(() => () => mesh.geometry.dispose(), [mesh]);

  return (
    <points geometry={mesh.geometry} frustumCulled={false}>
      <pointsMaterial
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.34 * Math.max(0, Math.min(1, reveal))}
        size={0.011}
        sizeAttenuation
        transparent
        vertexColors
      />
    </points>
  );
}
