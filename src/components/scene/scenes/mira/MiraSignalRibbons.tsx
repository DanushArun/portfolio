'use client';

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import {
  detectQualityProfile,
  useMiraState,
  type MiraWorkRegionId,
} from '@/lib/mira-state';
import {
  MIRA_WORK_REGIONS,
  getMiraRegionIndex,
  type MiraVec3,
} from '@/lib/mira-world';
import { gauss, hexToRgb, mulberry32, type Rng } from './buffers';
import type { Quality } from './knot-config';

export const signalVert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aEnergy;
  attribute float aFlow;
  attribute float aRegion;
  attribute float aSeed;

  uniform float uActiveRegion;
  uniform float uHoverRegion;
  uniform float uPixelRatio;
  uniform float uReveal;
  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;

  float selected(float idx, float target) {
    return step(0.0, target) * (1.0 - step(0.5, abs(idx - target)));
  }

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    float selectedRegion = selected(aRegion, uActiveRegion);
    float hover = selected(aRegion, uHoverRegion);
    float lane = fract(aFlow - uTime * (0.08 + aEnergy * 0.04) + aSeed);
    float head = pow(1.0 - abs(lane - 0.5) * 2.0, 4.2);
    float depth = max(1.0, -mv.z);
    float focus = 0.22 + selectedRegion * 0.86 + hover * 0.48;

    vColor = aColor * (0.48 + focus + head * 0.52);
    vAlpha = uReveal * (0.06 + aEnergy * 0.08) * (focus + head * 0.62);
    gl_PointSize = clamp((0.48 + head * 1.7) * uPixelRatio * (34.0 / depth), 0.2, 2.4);
  }
`;

const signalFrag = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float r = dot(p, p) * 4.0;
    if (r > 1.0) discard;
    float soft = pow(1.0 - r, 2.2);
    gl_FragColor = vec4(vColor * soft * vAlpha, soft * vAlpha);
  }
`;

interface SignalMesh {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

type AttrName = 'color' | 'energy' | 'flow' | 'pos' | 'region' | 'seed';
type SignalAttrs = Record<AttrName, Float32Array>;

function useQuality(): Quality {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);
}

function countFor(quality: Quality): number {
  return quality === 'high' ? 28_000 : 7_000;
}

function activeIndex(id: MiraWorkRegionId | 'OVERVIEW'): number {
  if (id === 'OVERVIEW') return -1;
  return getMiraRegionIndex(id);
}

function ringPoint(anchor: MiraVec3, radius: number, angle: number, squash: number): MiraVec3 {
  return [
    anchor[0] + Math.cos(angle) * radius,
    anchor[1] + Math.sin(angle) * radius * squash,
    anchor[2] + Math.sin(angle * 0.7) * radius * 0.18,
  ];
}

function latencyRadius(regionRadius: number, lane: number): number {
  const ring = lane % 4;
  return regionRadius * (0.15 + ring * 0.075);
}

function regionPoint(
  regionIndex: number,
  lane: number,
  flow: number,
  rng: Rng,
): MiraVec3 {
  const region = MIRA_WORK_REGIONS[regionIndex];
  const angle = flow * Math.PI * 2 * (1 + (regionIndex % 3)) + rng() * 0.24;
  const radius = region.id === 'LATENCY'
    ? latencyRadius(region.radius, lane)
    : region.radius * (0.18 + rng() * 0.18);
  const squash = region.id === 'OPS_AUTOMATION' ? 0.52 : 0.74;
  return ringPoint(region.anchor, radius, angle, squash);
}

function writeSignal(attrs: SignalAttrs, index: number, rng: Rng): void {
  const regionIndex = index % MIRA_WORK_REGIONS.length;
  const lane = Math.floor(index / MIRA_WORK_REGIONS.length);
  const flow = (lane % 768) / 767;
  const point = regionPoint(regionIndex, lane, flow, rng);
  const ptr = index * 3;
  const color = hexToRgb(MIRA_WORK_REGIONS[regionIndex].color);

  attrs.pos[ptr] = point[0] + gauss(rng) * 0.035;
  attrs.pos[ptr + 1] = point[1] + gauss(rng) * 0.035;
  attrs.pos[ptr + 2] = point[2] + gauss(rng) * 0.022;
  attrs.color.set(color, ptr);
  attrs.energy[index] = 0.8 + MIRA_WORK_REGIONS[regionIndex].radius * 0.16;
  attrs.flow[index] = flow;
  attrs.region[index] = regionIndex;
  attrs.seed[index] = rng();
}

function createGeometry(count: number): THREE.BufferGeometry {
  const attrs = {
    color: new Float32Array(count * 3),
    energy: new Float32Array(count),
    flow: new Float32Array(count),
    pos: new Float32Array(count * 3),
    region: new Float32Array(count),
    seed: new Float32Array(count),
  };
  const rng = mulberry32(0x51A9A1);
  for (let i = 0; i < count; i++) writeSignal(attrs, i, rng);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(attrs.pos, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(attrs.color, 3));
  geometry.setAttribute('aEnergy', new THREE.BufferAttribute(attrs.energy, 1));
  geometry.setAttribute('aFlow', new THREE.BufferAttribute(attrs.flow, 1));
  geometry.setAttribute('aRegion', new THREE.BufferAttribute(attrs.region, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(attrs.seed, 1));
  return geometry;
}

function createSignalMesh(count: number, pixelRatio: number): SignalMesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uActiveRegion: { value: -1 },
      uHoverRegion: { value: -1 },
      uPixelRatio: { value: pixelRatio },
      uReveal: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: signalVert,
    fragmentShader: signalFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { geometry: createGeometry(count), material };
}

export function MiraSignalRibbons({ reveal }: { reveal: number }): React.JSX.Element | null {
  const focusId = useMiraState((state) => state.focusId);
  const hoverRegion = useMiraState((state) => state.hoverRegion);
  const reducedMotion = useReducedMotion();
  const quality = useQuality();
  const mesh = useMemo(() => createSignalMesh(countFor(quality), 1.5), [quality]);

  useEffect(() => () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }, [mesh]);

  useFrame((state) => {
    mesh.material.uniforms.uActiveRegion.value = activeIndex(focusId);
    mesh.material.uniforms.uHoverRegion.value = hoverRegion ? getMiraRegionIndex(hoverRegion) : -1;
    mesh.material.uniforms.uReveal.value = Math.max(0, Math.min(1, (reveal - 0.55) / 0.35));
    mesh.material.uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime;
  });

  if (reveal < 0.55) return null;
  return <points geometry={mesh.geometry} material={mesh.material} frustumCulled={false} />;
}
