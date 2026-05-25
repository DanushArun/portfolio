'use client';

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import {
  detectQualityProfile,
  setActiveLang,
  setHoverLang,
  useMiraState,
  type MiraLang,
} from '@/lib/mira-state';
import { WORLD_SCALE, mergePSets, type PSet } from './mira/buffers';
import { CoreBillboards } from './mira/CoreBillboards';
import { generateHalos } from './mira/generate-dust';
import { generateHubs } from './mira/generate-hubs';
import { generateTendrils } from './mira/generate-tendrils';
import { KNOTS_W, LANG_INDEX, type Quality } from './mira/knot-config';
import { KnotLabels } from './mira/KnotLabels';
import { frag, vert } from './mira/shader.glsl';

interface GeneratedBuffers extends PSet {
  count: number;
}

interface MiraSuperclusterProps {
  reveal: number;
}

interface ReadyState {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

const CACHE = new Map<Quality, GeneratedBuffers>();

function generate(quality: Quality): GeneratedBuffers {
  const hit = CACHE.get(quality);
  if (hit) return hit;
  const merged = mergePSets([generateTendrils(quality), generateHalos(quality), generateHubs(quality)]);
  const out = { ...merged, count: merged.densityLevel.length };
  CACHE.set(quality, out);
  return out;
}

function buildGeometry(buf: GeneratedBuffers): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(buf.pos, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(buf.color, 3));
  geometry.setAttribute('aDensityLevel', new THREE.BufferAttribute(buf.densityLevel, 1));
  geometry.setAttribute('aIsCore', new THREE.BufferAttribute(buf.isCore, 1));
  geometry.setAttribute('aIsHalo', new THREE.BufferAttribute(buf.isHalo, 1));
  geometry.setAttribute('aLangIndex', new THREE.BufferAttribute(buf.langIndex, 1));
  geometry.setAttribute('aWarpParams', new THREE.BufferAttribute(buf.warpParams, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 7 * WORLD_SCALE);
  return geometry;
}

function buildMaterial(pixelRatio: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uActive: { value: 0 },
      uDensity0: { value: 0.2 },
      uDensity1: { value: 0.2 },
      uDensity2: { value: 0.2 },
      uDensity3: { value: 0.2 },
      uDensity4: { value: 0.2 },
      uHover: { value: -1 },
      uMotion: { value: 1 },
      uPixelRatio: { value: pixelRatio },
      uReveal: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function buildReadyState(buf: GeneratedBuffers, pixelRatio: number): ReadyState {
  return {
    geometry: buildGeometry(buf),
    material: buildMaterial(pixelRatio),
  };
}

function useQuality(): Quality {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);
}

function usePixelRatio(): number {
  return useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }, []);
}

function langUniform(lang: MiraLang | null): number {
  return lang === null ? -1 : LANG_INDEX[lang];
}

function KnotInteractors(): React.ReactElement {
  return (
    <>
      {KNOTS_W.map((knot) => (
        <mesh
          key={knot.lang}
          onClick={(event) => { event.stopPropagation(); setActiveLang(knot.lang); }}
          onPointerOut={() => setHoverLang(null)}
          onPointerOver={(event) => { event.stopPropagation(); setHoverLang(knot.lang); }}
          position={[knot.pos[0], knot.pos[1], knot.pos[2]]}
        >
          <sphereGeometry args={[0.72 * knot.scale, 10, 10]} />
          <meshBasicMaterial depthWrite={false} opacity={0} transparent />
        </mesh>
      ))}
    </>
  );
}

export default function MiraSupercluster({ reveal }: MiraSuperclusterProps): React.ReactElement | null {
  const reducedMotion = useReducedMotion();
  const activeLang = useMiraState((state) => state.activeLang);
  const hoverLang = useMiraState((state) => state.hoverLang);
  const density = useMiraState((state) => state.density);
  const quality = useQuality();
  const pixelRatio = usePixelRatio();
  const revealRef = useRef(-1);
  const ready = useMemo(
    () => buildReadyState(generate(quality), pixelRatio),
    [quality, pixelRatio],
  );

  useEffect(() => {
    return () => {
      ready.geometry.dispose();
      ready.material.dispose();
    };
  }, [ready]);

  useFrame((state) => {
    ready.material.uniforms.uActive.value = langUniform(activeLang);
    ready.material.uniforms.uHover.value = langUniform(hoverLang);
    ready.material.uniforms.uMotion.value = reducedMotion ? 0 : 1;
    ready.material.uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime;
    ready.material.uniforms.uDensity0.value = density.EN;
    ready.material.uniforms.uDensity1.value = density.HI;
    ready.material.uniforms.uDensity2.value = density.TA;
    ready.material.uniforms.uDensity3.value = density.KN;
    ready.material.uniforms.uDensity4.value = density.TE;
    if (revealRef.current === reveal) return;
    revealRef.current = reveal;
    ready.material.uniforms.uReveal.value = reveal;
  });

  if (reveal < 0.18) return null;

  return (
    <group>
      <points geometry={ready.geometry} material={ready.material} frustumCulled={false} />
      <CoreBillboards reveal={reveal} activeLang={activeLang} hoverLang={hoverLang} density={density} />
      <KnotLabels reveal={reveal} />
      {reveal >= 0.85 && <KnotInteractors />}
    </group>
  );
}
