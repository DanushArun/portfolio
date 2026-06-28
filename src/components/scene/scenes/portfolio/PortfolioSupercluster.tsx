'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useReducedMotion } from '@/lib/motion/use-reduced-motion';
import { getPortfolioStopForProgress } from '@/lib/portfolio-journey';
import {
  buildPortfolioSuperclusterModel,
  getPortfolioParticlesPerBeatForViewport,
  getPortfolioMorphState,
  type PortfolioMorphState,
  type PortfolioSuperclusterModel,
} from '@/lib/portfolio-supercluster';
import { useScene } from '@/lib/scene-state';

import { portfolioFrag, portfolioVert } from './portfolio-shader.glsl';

interface PortfolioSuperclusterProps {
  readonly reveal: number;
}

interface MorphUniformConfig {
  readonly materialRef: React.RefObject<THREE.ShaderMaterial | null>;
  readonly morph: PortfolioMorphState;
  readonly reducedMotion: boolean;
  readonly reveal: number;
}

function buildUniforms(): Record<string, THREE.IUniform<number>> {
  return {
    uActiveBeat: { value: -1 },
    uActiveProject: { value: -1 },
    uBeatMorph: { value: 0 },
    uGlyphMorph: { value: 0 },
    uMotion: { value: 1 },
    uPixelRatio: { value: 1 },
    uProjectMorph: { value: 0 },
    uRelease: { value: 0 },
    uReveal: { value: 0 },
    uTitleMorph: { value: 0 },
    uTime: { value: 0 },
  };
}

function useMorphUniforms(config: MorphUniformConfig): void {
  useFrame(({ clock }) => {
    const material = config.materialRef.current;
    if (!material) return;
    const uniforms = material.uniforms;
    uniforms.uActiveBeat.value = config.morph.activeBeat;
    uniforms.uActiveProject.value = config.morph.activeProject;
    uniforms.uBeatMorph.value = config.reducedMotion ? 1 : config.morph.beatMorph;
    uniforms.uGlyphMorph.value = config.reducedMotion ? 0.82 : config.morph.glyphMorph;
    uniforms.uMotion.value = config.reducedMotion ? 0 : 1;
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.5);
    uniforms.uProjectMorph.value = config.reducedMotion ? 1 : config.morph.projectMorph;
    uniforms.uRelease.value = config.reducedMotion ? 0 : config.morph.release;
    uniforms.uReveal.value = config.reveal;
    uniforms.uTitleMorph.value = config.morph.titleMorph;
    uniforms.uTime.value = config.reducedMotion ? 0 : clock.elapsedTime;
  });
}

function usePortfolioDebug(config: {
  readonly model: PortfolioSuperclusterModel;
  readonly morph: PortfolioMorphState;
  readonly progress: number;
}): void {
  useEffect(() => () => {
    delete (window as Window & { __portfolioDebug?: unknown }).__portfolioDebug;
  }, []);

  useFrame(() => {
    if (process.env.NODE_ENV === 'production') return;
    const stop = getPortfolioStopForProgress(config.progress);
    const target = window as Window & { __portfolioDebug?: unknown };
    target.__portfolioDebug = {
      activeBeat: config.morph.activeBeat,
      activeProject: config.morph.activeProject,
      activeProjectId: config.morph.activeProjectId,
      activeStopIndex: stop.activeStopIndex,
      cameraLocked: stop.cameraLocked,
      glyphMorph: config.morph.glyphMorph,
      particleCount: config.model.count,
      projectMorph: config.morph.projectMorph,
      titleMorph: config.morph.titleMorph,
    };
  });
}

function cursor(value: string): void {
  if (typeof document === 'undefined') return;
  document.body.style.cursor = value;
}

function ProjectHitboxes({
  model,
}: {
  readonly model: PortfolioSuperclusterModel;
}): React.JSX.Element {
  return (
    <>
      {model.projectRanges.map((project) => (
        <mesh
          key={project.id}
          onPointerOut={() => cursor('default')}
          onPointerOver={(event) => {
            event.stopPropagation();
            cursor('pointer');
          }}
          position={[project.center[0], project.center[1], project.center[2]]}
        >
          <sphereGeometry args={[1.35, 10, 10]} />
          <meshBasicMaterial depthWrite={false} opacity={0} transparent />
        </mesh>
      ))}
    </>
  );
}

export default function PortfolioSupercluster({
  reveal,
}: PortfolioSuperclusterProps): React.JSX.Element {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const phase = useScene((state) => state.phase);
  const local = useScene((state) => state.localProgress);
  const progress = useScene((state) => state.journeyProgress);
  const reducedMotion = useReducedMotion();
  const model = useMemo(() => {
    const width = typeof window === 'undefined' ? 1440 : window.innerWidth;
    return buildPortfolioSuperclusterModel({
      particlesPerBeat: getPortfolioParticlesPerBeatForViewport(width),
    });
  }, []);
  const uniforms = useMemo(() => buildUniforms(), []);
  const morph = getPortfolioMorphState(phase, local, progress);
  const attrs = model.attributes;

  useMorphUniforms({ materialRef, morph, reducedMotion, reveal });
  usePortfolioDebug({ model, morph, progress });

  return (
    <group>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.homePosition, 3]} />
          <bufferAttribute
            attach="attributes-aArtifactPosition"
            args={[attrs.artifactPosition, 3]}
          />
          <bufferAttribute attach="attributes-aBeatPosition" args={[attrs.beatPosition, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[attrs.color, 3]} />
          <bufferAttribute attach="attributes-aGlyphPosition" args={[attrs.glyphPosition, 3]} />
          <bufferAttribute
            attach="attributes-aTitleGlyphPosition"
            args={[attrs.titleGlyphPosition, 3]}
          />
          <bufferAttribute
            attach="attributes-aProjectPosition"
            args={[attrs.projectPosition, 3]}
          />
          <bufferAttribute attach="attributes-aBeatIndex" args={[attrs.beatIndex, 1]} />
          <bufferAttribute attach="attributes-aProjectIndex" args={[attrs.projectIndex, 1]} />
          <bufferAttribute attach="attributes-aRole" args={[attrs.role, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[attrs.seed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={portfolioFrag}
          transparent
          uniforms={uniforms}
          vertexShader={portfolioVert}
        />
      </points>
      <ProjectHitboxes model={model} />
    </group>
  );
}
