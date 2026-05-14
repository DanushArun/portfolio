'use client';

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { detectQualityProfile, useMiraState } from '@/lib/mira-state';
import { generateHubs } from './mira/generate-hubs';
import { generateTendrils } from './mira/generate-tendrils';
import { generateLemniscate } from './mira/generate-lemniscate';
import { mergePSets, WORLD_SCALE, type PSet } from './mira/buffers';
import { KNOTS_W, type Quality } from './mira/knot-config';
import { vert, frag } from './mira/shader.glsl';
import { KnotLabels } from './mira/KnotLabels';
import { CoreBillboards } from './mira/CoreBillboards';

// ─── Module-level generation cache ───────────────────────────────────────

interface GeneratedBuffers {
  positions: Float32Array;
  colors: Float32Array;
  isCores: Float32Array;
  isLoops: Float32Array;
  densityLevels: Float32Array;
  count: number;
}

const CACHE = new Map<Quality, GeneratedBuffers>();

function generate(quality: Quality): GeneratedBuffers {
  const hit = CACHE.get(quality);
  if (hit) return hit;

  const hubs = generateHubs(quality);
  const tendrils = generateTendrils(quality);
  const lemniscate = generateLemniscate(quality);

  const merged = mergePSets([hubs, tendrils, lemniscate]);

  const out: GeneratedBuffers = {
    positions:     merged.pos,
    colors:        merged.color,
    isCores:       merged.isCore,
    isLoops:       merged.isLoop,
    densityLevels: merged.densityLevel,
    count: merged.isCore.length,
  };
  CACHE.set(quality, out);
  return out;
}

// ─── Idle scheduling ─────────────────────────────────────────────────────

type IdleHandle = number;

function scheduleIdle(cb: () => void): IdleHandle {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(cb, { timeout: 600 });
  }
  return window.setTimeout(cb, 0);
}

function cancelIdle(handle: IdleHandle): void {
  const w = window as unknown as { cancelIdleCallback?: (h: number) => void };
  if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(handle);
  else window.clearTimeout(handle);
}

export interface MiraSuperclusterProps {
  reveal: number;
}

interface ReadyState {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

function buildReadyState(buf: GeneratedBuffers, pixelRatio: number): ReadyState {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position',      new THREE.BufferAttribute(buf.positions,     3));
  g.setAttribute('aColor',        new THREE.BufferAttribute(buf.colors,        3));
  g.setAttribute('aIsCore',       new THREE.BufferAttribute(buf.isCores,       1));
  g.setAttribute('aIsLoop',       new THREE.BufferAttribute(buf.isLoops,       1));
  g.setAttribute('aDensityLevel', new THREE.BufferAttribute(buf.densityLevels, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6 * WORLD_SCALE);

  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime:         { value: 0 },
      uPixelRatio:   { value: pixelRatio },
      uReveal:       { value: 0 },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { geometry: g, material: m };
}

export default function MiraSupercluster(
  { reveal }: MiraSuperclusterProps,
): React.ReactElement | null {
  const pointsRef = useRef<THREE.Points>(null);
  const revealRef = useRef<number>(-1);
  const activeLang = useMiraState((s) => s.activeLang);
  const density = useMiraState((s) => s.density);

  const quality = useMemo<Quality>(() => {
    if (typeof window === 'undefined') return 'high';
    return detectQualityProfile({ width: window.innerWidth, search: window.location.search });
  }, []);

  const pixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 1.75);
  }, []);

  const [ready, setReady] = useState<ReadyState | null>(() => {
    if (typeof window === 'undefined') return null;
    const buf = CACHE.get(quality);
    if (!buf) return null;
    return buildReadyState(buf, pixelRatio);
  });

  useEffect(() => {
    if (ready) return;
    const handle = scheduleIdle(() => {
      const buf = generate(quality);
      setReady(buildReadyState(buf, pixelRatio));
    });
    return () => cancelIdle(handle);
  }, [ready, quality, pixelRatio]);

  useEffect(() => {
    if (!ready) return;
    return () => {
      ready.geometry.dispose();
      ready.material.dispose();
    };
  }, [ready]);

  useFrame((state) => {
    if (!ready) return;
    ready.material.uniforms.uTime.value = state.clock.elapsedTime;
    if (revealRef.current === reveal) return;
    revealRef.current = reveal;
    ready.material.uniforms.uReveal.value = reveal;
  });

  if (!ready || reveal < 0.18) return null;
  return (
    <group>
      <points
        ref={pointsRef}
        geometry={ready.geometry}
        material={ready.material}
        frustumCulled={false}
      />
      <CoreBillboards reveal={reveal} activeLang={activeLang} density={density} />
      <KnotLabels reveal={reveal} />
    </group>
  );
}
