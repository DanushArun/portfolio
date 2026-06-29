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
  type PortfolioSuperclusterModel,
} from '@/lib/portfolio-supercluster';
import { getPortfolioStepTransition } from '@/lib/portfolio-step-transition';
import { useScene } from '@/lib/scene-state';

import { portfolioFrag, portfolioVert } from './portfolio-shader.glsl';

interface PortfolioSuperclusterProps {
  readonly reveal: number;
}

function buildUniforms(): Record<string, THREE.IUniform<number>> {
  return {
    uActiveBeat: { value: -1 },
    uActiveProject: { value: -1 },
    uBeatMorph: { value: 0 },
    uFromBeat: { value: -1 },
    uFromProject: { value: -1 },
    uGlyphMorph: { value: 0 },
    uMotion: { value: 1 },
    uPixelRatio: { value: 1 },
    uProjectMorph: { value: 0 },
    uRelease: { value: 0 },
    uReveal: { value: 0 },
    uStepMorph: { value: 1 },
    uTitleMorph: { value: 0 },
    uToBeat: { value: -1 },
    uToProject: { value: -1 },
    uTime: { value: 0 },
    uTransitionActive: { value: 0 },
  };
}

function useMorphUniforms(
  materialRef: React.RefObject<THREE.ShaderMaterial | null>,
  reducedMotion: boolean,
  reveal: number,
): void {
  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    const scene = useScene.getState();
    const morph = getPortfolioMorphState(
      scene.phase,
      scene.localProgress,
      scene.journeyProgress,
      getPortfolioStepTransition(),
    );
    const uniforms = material.uniforms;
    uniforms.uActiveBeat.value = morph.activeBeat;
    uniforms.uActiveProject.value = morph.activeProject;
    uniforms.uBeatMorph.value = reducedMotion ? 1 : morph.beatMorph;
    uniforms.uFromBeat.value = morph.fromBeat;
    uniforms.uFromProject.value = morph.fromProject;
    uniforms.uGlyphMorph.value = reducedMotion ? 0.82 : morph.glyphMorph;
    uniforms.uMotion.value = reducedMotion ? 0 : 1;
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.5);
    uniforms.uProjectMorph.value = reducedMotion ? 1 : morph.projectMorph;
    uniforms.uRelease.value = reducedMotion ? 0 : morph.release;
    uniforms.uReveal.value = reveal;
    uniforms.uStepMorph.value = reducedMotion ? 1 : morph.stepMorph;
    uniforms.uTitleMorph.value = morph.titleMorph;
    uniforms.uToBeat.value = morph.toBeat;
    uniforms.uToProject.value = morph.toProject;
    uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    uniforms.uTransitionActive.value = reducedMotion || !morph.isTransitioning ? 0 : 1;
  });
}

function usePortfolioDebug(config: {
  readonly model: PortfolioSuperclusterModel;
}): void {
  useEffect(() => () => {
    delete (window as Window & { __portfolioDebug?: unknown }).__portfolioDebug;
  }, []);

  useFrame(() => {
    if (process.env.NODE_ENV === 'production') return;
    const scene = useScene.getState();
    const transition = getPortfolioStepTransition();
    const morph = getPortfolioMorphState(
      scene.phase,
      scene.localProgress,
      scene.journeyProgress,
      transition,
    );
    const stop = getPortfolioStopForProgress(scene.journeyProgress);
    const target = window as Window & { __portfolioDebug?: unknown };
    target.__portfolioDebug = {
      activeBeat: morph.activeBeat,
      activeProject: morph.activeProject,
      activeProjectId: morph.activeProjectId,
      activeStopIndex: stop.activeStopIndex,
      cameraLocked: stop.cameraLocked,
      glyphMorph: morph.glyphMorph,
      particleCount: config.model.count,
      projectMorph: morph.projectMorph,
      stepMorph: morph.stepMorph,
      titleMorph: morph.titleMorph,
      transitionActive: transition.active,
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
  const reducedMotion = useReducedMotion();
  const model = useMemo(() => {
    const width = typeof window === 'undefined' ? 1440 : window.innerWidth;
    return buildPortfolioSuperclusterModel({
      particlesPerBeat: getPortfolioParticlesPerBeatForViewport(width),
    });
  }, []);
  const uniforms = useMemo(() => buildUniforms(), []);
  const attrs = model.attributes;

  useMorphUniforms(materialRef, reducedMotion, reveal);
  usePortfolioDebug({ model });

  return (
    <group>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.homePosition, 3]} />
          <bufferAttribute
            attach="attributes-aArtifactPosition"
            args={[attrs.artifactPosition, 3]}
          />
          <bufferAttribute attach="attributes-aArtifactAlpha" args={[attrs.artifactAlpha, 1]} />
          <bufferAttribute attach="attributes-aArtifactScale" args={[attrs.artifactScale, 1]} />
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
