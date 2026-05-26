'use client';

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import { detectQualityProfile, useMiraState, type MiraLang } from '@/lib/mira-state';
import { MIRA_WORLD_EDGES, getMiraWorldNode, type MiraVec3 } from '@/lib/mira-world';
import { gauss, hexToRgb, mulberry32, mixVec, type Rng } from './buffers';
import { LANG_INDEX, type Quality } from './knot-config';

const signalVert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aEnergy;
  attribute float aFlow;
  attribute float aLangIndex;
  attribute float aSeed;

  uniform float uActive;
  uniform float uPixelRatio;
  uniform float uReveal;
  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;

  float isSelected(float idx, float target) {
    return step(0.0, target) * (1.0 - step(0.5, abs(idx - target)));
  }

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    float selected = isSelected(aLangIndex, uActive);
    float lane = fract(aFlow - uTime * (0.10 + aEnergy * 0.035) + aSeed);
    float head = pow(1.0 - abs(lane - 0.5) * 2.0, 4.0);
    float wake = pow(1.0 - abs(fract(lane + 0.22) - 0.5) * 2.0, 2.0);
    float depth = max(1.0, -mv.z);

    vColor = aColor * (0.62 + selected * 0.48 + head * 0.72);
    vAlpha = uReveal * (0.10 + aEnergy * 0.10 + selected * 0.16) * (0.38 + head + wake * 0.22);
    gl_PointSize = clamp((0.58 + head * 1.82) * uPixelRatio * (34.0 / depth), 0.25, 2.8);
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
    float soft = pow(1.0 - r, 2.1);
    gl_FragColor = vec4(vColor * soft * vAlpha, soft * vAlpha);
  }
`;

interface SignalMesh {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

function useQuality(): Quality {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);
}

function countFor(quality: Quality): number {
  return quality === 'high' ? 18_000 : 4_200;
}

function bezier(a: MiraVec3, b: MiraVec3, c1: MiraVec3, c2: MiraVec3, t: number): MiraVec3 {
  const ab = mixVec(a, c1, t);
  const bc = mixVec(c1, c2, t);
  const cd = mixVec(c2, b, t);
  return mixVec(mixVec(ab, bc, t), mixVec(bc, cd, t), t);
}

function edgeLangIndex(edgeIndex: number): number {
  const edge = MIRA_WORLD_EDGES[edgeIndex % MIRA_WORLD_EDGES.length];
  if (edge.from in LANG_INDEX) return LANG_INDEX[edge.from as MiraLang];
  if (edge.to in LANG_INDEX) return LANG_INDEX[edge.to as MiraLang];
  return -1;
}

function bowedPoint(base: MiraVec3, bow: MiraVec3, amount: number): MiraVec3 {
  return [
    base[0] + bow[0] * amount,
    base[1] + bow[1] * amount,
    base[2] + bow[2] * amount,
  ];
}

function writeSignal(
  attrs: Record<'color' | 'flow' | 'energy' | 'lang' | 'seed' | 'pos', Float32Array>,
  index: number,
  rng: Rng,
): void {
  const edgeIndex = index % MIRA_WORLD_EDGES.length;
  const edge = MIRA_WORLD_EDGES[edgeIndex];
  const from = getMiraWorldNode(edge.from).position;
  const to = getMiraWorldNode(edge.to).position;
  const c1 = bowedPoint(mixVec(from, to, 0.32), edge.bow, 0.72);
  const c2 = bowedPoint(mixVec(from, to, 0.68), edge.bow, 1);
  const t = (Math.floor(index / MIRA_WORLD_EDGES.length) % 512) / 511;
  const point = bezier(from, to, c1, c2, t);
  const ptr = index * 3;
  const color = hexToRgb(edge.color);

  attrs.pos[ptr] = point[0] + gauss(rng) * 0.035;
  attrs.pos[ptr + 1] = point[1] + gauss(rng) * 0.035;
  attrs.pos[ptr + 2] = point[2] + gauss(rng) * 0.018;
  attrs.color.set(color, ptr);
  attrs.flow[index] = t;
  attrs.energy[index] = edge.energy;
  attrs.lang[index] = edgeLangIndex(edgeIndex);
  attrs.seed[index] = rng();
}

function createGeometry(count: number): THREE.BufferGeometry {
  const attrs = {
    color: new Float32Array(count * 3),
    energy: new Float32Array(count),
    flow: new Float32Array(count),
    lang: new Float32Array(count),
    pos: new Float32Array(count * 3),
    seed: new Float32Array(count),
  };
  const rng = mulberry32(0x51A9A1);
  for (let i = 0; i < count; i++) writeSignal(attrs, i, rng);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(attrs.pos, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(attrs.color, 3));
  geometry.setAttribute('aEnergy', new THREE.BufferAttribute(attrs.energy, 1));
  geometry.setAttribute('aFlow', new THREE.BufferAttribute(attrs.flow, 1));
  geometry.setAttribute('aLangIndex', new THREE.BufferAttribute(attrs.lang, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(attrs.seed, 1));
  return geometry;
}

function createSignalMesh(count: number, pixelRatio: number): SignalMesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uActive: { value: 0 },
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
  const activeLang = useMiraState((state) => state.activeLang);
  const focusId = useMiraState((state) => state.focusId);
  const reducedMotion = useReducedMotion();
  const quality = useQuality();
  const mesh = useMemo(() => createSignalMesh(countFor(quality), 1.5), [quality]);

  useEffect(() => () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }, [mesh]);

  useFrame((state) => {
    const focusBoost = focusId === 'OVERVIEW' ? 0.16 : 0.92;
    mesh.material.uniforms.uActive.value = LANG_INDEX[activeLang];
    mesh.material.uniforms.uReveal.value = Math.max(0, Math.min(1, (reveal - 0.70) / 0.30))
      * focusBoost;
    mesh.material.uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime;
  });

  if (reveal < 0.70) return null;
  return <points geometry={mesh.geometry} material={mesh.material} frustumCulled={false} />;
}
