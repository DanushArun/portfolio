'use client';

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import { detectQualityProfile, useMiraState, type MiraLang } from '@/lib/mira-state';
import { PARTICLE_BUDGET, getKnot, type Quality } from './mira/knot-config';

const plumeVert = /* glsl */ `
  attribute float aArc;
  attribute float aBand;
  attribute float aNoise;
  attribute float aSide;

  uniform vec3 uDir;
  uniform vec3 uHue;
  uniform vec3 uKnotPos;
  uniform vec3 uLift;
  uniform float uPixelRatio;
  uniform float uProgress;
  uniform float uReveal;
  uniform float uTime;

  varying float vAlpha;
  varying float vBand;
  varying vec3 vHue;

  void main() {
    float s = aArc;
    float outward = smoothstep(0.0, 0.46, uProgress);
    float returning = smoothstep(0.46, 0.92, uProgress);
    float formed = smoothstep(s - 0.16, s + 0.05, outward);
    float held = 1.0 - smoothstep(0.94, 1.0, uProgress);
    vec3 side = normalize(cross(uDir, vec3(0.0, 0.0, 1.0)) + vec3(0.001));

    float body = sin(s * 3.14159265);
    float ribbon = body * (2.35 - returning * 0.95);
    float curl = sin(s * 8.0 + aNoise * 6.283 + uProgress * 5.5) * 0.20;
    float thickness = (0.04 + body * 0.22) * aSide;
    vec3 arc = uDir * (ribbon + s * 0.42 * (1.0 - returning));
    arc += uLift * ((s - 0.18) * 1.35 * (1.0 - returning) + body * returning * 1.15);
    arc += side * (thickness + curl * body);

    vec3 pos = uKnotPos + arc;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = max(1.0, -mv.z);
    gl_PointSize = clamp((0.92 + body * 1.9) * uPixelRatio * (24.0 / depth), 0.3, 3.2);
    vAlpha = formed * held * uReveal * (0.18 + body * 0.68);
    vBand = aBand;
    vHue = uHue;
  }
`;

const plumeFrag = /* glsl */ `
  precision highp float;

  varying float vAlpha;
  varying float vBand;
  varying vec3 vHue;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float r = dot(c, c) * 4.0;
    if (r > 1.0) discard;

    vec3 cyan = vec3(0.12, 0.62, 1.0);
    vec3 hot = vec3(1.0, 0.72, 0.36);
    vec3 color = mix(mix(cyan, vHue, 0.35), hot, vBand);
    float alpha = pow(1.0 - r, 2.2) * vAlpha * 0.72;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

interface PlumeGeometry {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

function useQuality(): Quality {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);
}

function createGeometry(count: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const arc = new Float32Array(count);
  const band = new Float32Array(count);
  const noise = new Float32Array(count);
  const side = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    arc[i] = (i % 512) / 511;
    band[i] = Math.floor(i / 7) % 2;
    noise[i] = ((i * 16807) % 2147483647) / 2147483647;
    side[i] = (noise[i] - 0.5) * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aArc', new THREE.BufferAttribute(arc, 1));
  geometry.setAttribute('aBand', new THREE.BufferAttribute(band, 1));
  geometry.setAttribute('aNoise', new THREE.BufferAttribute(noise, 1));
  geometry.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  return geometry;
}

function createPlume(pixelRatio: number, count: number): PlumeGeometry {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uDir: { value: new THREE.Vector3(1, 0, 0) },
      uHue: { value: new THREE.Color('#ff9933') },
      uKnotPos: { value: new THREE.Vector3() },
      uLift: { value: new THREE.Vector3(0, 1, 0) },
      uPixelRatio: { value: pixelRatio },
      uProgress: { value: 0 },
      uReveal: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: plumeVert,
    fragmentShader: plumeFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { geometry: createGeometry(count), material };
}

function plumeDirection(lang: MiraLang): THREE.Vector3 {
  const knot = getKnot(lang);
  const outward = new THREE.Vector3(knot.pos[0], knot.pos[1], 0).normalize();
  if (outward.lengthSq() < 0.1) return new THREE.Vector3(1, 0.3, 0).normalize();
  return outward;
}

function cycleProgress(cycleStartMs: number): number {
  if (typeof performance === 'undefined') return 0;
  return Math.min(1, Math.max(0, (performance.now() - cycleStartMs) / 3000));
}

export default function MiraPlume({ reveal }: { reveal: number }): React.JSX.Element | null {
  const activeLang = useMiraState((state) => state.activeLang);
  const cycleStartMs = useMiraState((state) => state.cycleStartMs);
  const reducedMotion = useReducedMotion();
  const quality = useQuality();
  const count = PARTICLE_BUDGET[quality].plume;
  const plume = useMemo(() => createPlume(1.5, Math.max(1, count)), [count]);

  useEffect(() => () => {
    plume.geometry.dispose();
    plume.material.dispose();
  }, [plume]);

  useFrame((state) => {
    const knot = getKnot(activeLang);
    plume.material.uniforms.uKnotPos.value.set(...knot.pos);
    plume.material.uniforms.uHue.value.setRGB(knot.hue[0], knot.hue[1], knot.hue[2]);
    plume.material.uniforms.uDir.value.copy(plumeDirection(activeLang));
    plume.material.uniforms.uLift.value.set(0.12, 1.0, 0.08).normalize();
    plume.material.uniforms.uProgress.value = cycleProgress(cycleStartMs);
    plume.material.uniforms.uReveal.value = reveal;
    plume.material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  if (count === 0 || reducedMotion || reveal < 0.85) return null;

  return <points geometry={plume.geometry} material={plume.material} frustumCulled={false} />;
}
