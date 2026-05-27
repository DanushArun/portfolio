'use client';

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { MiraNebulaField } from './mira/MiraNebulaField';
import { MiraTendrilLines } from './mira/MiraTendrilLines';
import { generateHalos } from './mira/generate-dust';
import { generateHubs } from './mira/generate-hubs';
import { generateTendrils } from './mira/generate-tendrils';
import { KNOTS_W, LANG_INDEX, type Quality } from './mira/knot-config';
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

interface UniformInput {
  activeLang: MiraLang;
  density: Record<MiraLang, number>;
  hoverLang: MiraLang | null;
  ready: ReadyState | null;
  reducedMotion: boolean;
  reveal: number;
}

const CACHE = new Map<Quality, GeneratedBuffers>();
const BUFFER_PROMISES = new Map<Quality, Promise<GeneratedBuffers>>();
let nextWorkerRequestId = 0;

function generate(quality: Quality): GeneratedBuffers {
  const hit = CACHE.get(quality);
  if (hit) return hit;
  const merged = mergePSets([
    generateTendrils(quality),
    generateHalos(quality),
    generateHubs(quality),
  ]);
  const out = { ...merged, count: merged.densityLevel.length };
  CACHE.set(quality, out);
  return out;
}

function loadGeneratedBuffers(quality: Quality): Promise<GeneratedBuffers> {
  const hit = CACHE.get(quality);
  if (hit) return Promise.resolve(hit);
  const pending = BUFFER_PROMISES.get(quality);
  if (pending) return pending;
  const promise = loadGeneratedBuffersInWorker(quality).catch(() => generate(quality));
  BUFFER_PROMISES.set(quality, promise);
  promise.finally(() => BUFFER_PROMISES.delete(quality));
  return promise;
}

function loadGeneratedBuffersInWorker(quality: Quality): Promise<GeneratedBuffers> {
  if (typeof Worker === 'undefined') return Promise.reject(new Error('Workers unavailable'));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./mira/mira-buffer.worker.ts', import.meta.url), {
      type: 'module',
    });
    const id = nextWorkerRequestId++;
    worker.onmessage = ({ data }: MessageEvent<{
      id: number;
      payload?: GeneratedBuffers;
      error?: string;
    }>) => {
      if (data.id !== id) return;
      worker.terminate();
      if (!data.payload) {
        reject(new Error(data.error ?? 'MIRA worker returned no buffers'));
        return;
      }
      CACHE.set(quality, data.payload);
      resolve(data.payload);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage({ id, quality });
  });
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
          onClick={(event) => {
            event.stopPropagation();
            setActiveLang(knot.lang);
          }}
          onPointerOut={() => setHoverLang(null)}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHoverLang(knot.lang);
          }}
          position={[knot.pos[0], knot.pos[1], knot.pos[2]]}
        >
          <sphereGeometry args={[0.72 * knot.scale, 10, 10]} />
          <meshBasicMaterial depthWrite={false} opacity={0} transparent />
        </mesh>
      ))}
    </>
  );
}

function useReadyState(quality: Quality, pixelRatio: number): ReadyState | null {
  const [buffers, setBuffers] = useState<GeneratedBuffers | null>(() => CACHE.get(quality) ?? null);
  const ready = useMemo(
    () => (buffers ? buildReadyState(buffers, pixelRatio) : null),
    [buffers, pixelRatio],
  );

  useEffect(() => {
    let cancelled = false;
    loadGeneratedBuffers(quality).then((next) => {
      if (!cancelled) setBuffers(next);
    });
    return () => {
      cancelled = true;
    };
  }, [quality]);

  useEffect(() => () => {
    ready?.geometry.dispose();
    ready?.material.dispose();
  }, [ready]);

  return ready;
}

function useClusterUniforms(input: UniformInput): void {
  const revealRef = useRef(-1);

  useFrame((state) => {
    if (!input.ready) return;
    input.ready.material.uniforms.uActive.value = langUniform(input.activeLang);
    input.ready.material.uniforms.uHover.value = langUniform(input.hoverLang);
    input.ready.material.uniforms.uMotion.value = input.reducedMotion ? 0 : 1;
    input.ready.material.uniforms.uTime.value = input.reducedMotion ? 0 : state.clock.elapsedTime;
    input.ready.material.uniforms.uDensity0.value = input.density.EN;
    input.ready.material.uniforms.uDensity1.value = input.density.HI;
    input.ready.material.uniforms.uDensity2.value = input.density.TA;
    input.ready.material.uniforms.uDensity3.value = input.density.KN;
    input.ready.material.uniforms.uDensity4.value = input.density.TE;
    if (revealRef.current === input.reveal) return;
    revealRef.current = input.reveal;
    input.ready.material.uniforms.uReveal.value = input.reveal;
  });
}

export default function MiraSupercluster(
  { reveal }: MiraSuperclusterProps,
): React.ReactElement | null {
  const reducedMotion = useReducedMotion();
  const activeLang = useMiraState((state) => state.activeLang);
  const hoverLang = useMiraState((state) => state.hoverLang);
  const density = useMiraState((state) => state.density);
  const quality = useQuality();
  const pixelRatio = usePixelRatio();
  const ready = useReadyState(quality, pixelRatio);

  useClusterUniforms({ activeLang, density, hoverLang, ready, reducedMotion, reveal });

  if (reveal < 0.18) return null;

  return (
    <group>
      <MiraNebulaField quality={quality} reveal={reveal} />
      <MiraTendrilLines reveal={reveal} />
      {ready && (
        <points
          geometry={ready.geometry}
          material={ready.material}
          frustumCulled={false}
        />
      )}
      <CoreBillboards
        reveal={reveal}
        activeLang={activeLang}
        hoverLang={hoverLang}
        density={density}
      />
      {reveal >= 0.85 && <KnotInteractors />}
    </group>
  );
}
