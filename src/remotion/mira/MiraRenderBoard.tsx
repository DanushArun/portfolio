import { ThreeCanvas } from '@remotion/three';
import { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

import {
  MIRA_ARTIFACT_BEATS,
  getMiraArtifactBeatByIndex,
  type MiraArtifactBeat,
} from '../../components/scene/scenes/mira/mira-artifact-model';
import {
  buildMiraArtifactVisuals,
  type ArtifactBuffer,
} from '../../components/scene/scenes/mira/mira-artifact-visuals';
import {
  gauss,
  mixVec,
  mulberry32,
  type Rng,
  type Vec3,
} from '../../components/scene/scenes/mira/buffers';

const VOID = '#08070a';
const FRAMES_PER_BEAT = 19;

interface GeometryPair {
  readonly lineGeometry: THREE.BufferGeometry;
  readonly pointGeometry: THREE.BufferGeometry;
}

function beatIndexForFrame(frame: number): number {
  return Math.min(MIRA_ARTIFACT_BEATS.length - 1, Math.floor(frame / FRAMES_PER_BEAT));
}

function buildGeometry(buffer: ArtifactBuffer): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(buffer.position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(buffer.color, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 9);
  return geometry;
}

function useArtifactGeometry(beat: MiraArtifactBeat): GeometryPair {
  return useMemo(() => {
    const buffers = buildMiraArtifactVisuals(beat, {
      lineCopies: 12,
      pointCount: 34_000,
    });
    return {
      lineGeometry: buildGeometry(buffers.lines),
      pointGeometry: buildGeometry(buffers.points),
    };
  }, [beat]);
}

function backdropColor(rng: Rng): Vec3 {
  const blue: Vec3 = [0.02, 0.14, 0.5];
  const violet: Vec3 = [0.16, 0.06, 0.42];
  const gold: Vec3 = [0.8, 0.44, 0.16];
  if (rng() > 0.88) return mixVec(gold, [1, 0.66, 0.28], rng());
  if (rng() > 0.72) return mixVec(violet, blue, rng() * 0.6);
  return mixVec([0.005, 0.035, 0.22], blue, rng());
}

function writeBackdropPoint(buffer: ArtifactBuffer, index: number, rng: Rng): void {
  const offset = index * 3;
  const arc = rng() * Math.PI * 2;
  const radius = 2.4 + rng() * 3.8;
  const point: Vec3 = [
    Math.cos(arc) * radius + gauss(rng) * 0.28,
    Math.sin(arc * 0.78) * radius * 0.38 + gauss(rng) * 0.2,
    -1.7 + gauss(rng) * 0.38,
  ];
  buffer.position.set(point, offset);
  buffer.color.set(backdropColor(rng), offset);
}

function buildBackdropPoints(count: number): ArtifactBuffer {
  const rng = mulberry32(0x5CA11E);
  const buffer = {
    color: new Float32Array(count * 3),
    position: new Float32Array(count * 3),
  };
  for (let index = 0; index < count; index++) writeBackdropPoint(buffer, index, rng);
  return buffer;
}

function buildBackdropLines(count: number): ArtifactBuffer {
  const rng = mulberry32(0xF11A);
  const buffer = {
    color: new Float32Array(count * 6),
    position: new Float32Array(count * 6),
  };
  for (let index = 0; index < count; index++) {
    const offset = index * 6;
    const x = -4.8 + rng() * 9.6;
    const y = -2.6 + rng() * 5.2;
    const color = backdropColor(rng);
    buffer.position.set([x, y, -1.9, x + 0.6 + rng() * 1.6, y + gauss(rng) * 0.24, -1.9], offset);
    buffer.color.set([...color, ...color], offset);
  }
  return buffer;
}

function BackdropField(): React.JSX.Element {
  const points = useMemo(() => buildGeometry(buildBackdropPoints(24_000)), []);
  const lines = useMemo(() => buildGeometry(buildBackdropLines(180)), []);

  return (
    <group rotation={[0.02, -0.08, -0.02]} scale={[1.18, 1.18, 1.18]}>
      <lineSegments geometry={lines} frustumCulled={false}>
        <lineBasicMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.08}
          transparent
          vertexColors
        />
      </lineSegments>
      <points geometry={points} frustumCulled={false}>
        <pointsMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.18}
          size={0.01}
          sizeAttenuation
          transparent
          vertexColors
        />
      </points>
    </group>
  );
}

function ArtifactField(): React.JSX.Element {
  const frame = useCurrentFrame();
  const beat = getMiraArtifactBeatByIndex(beatIndexForFrame(frame));
  const progress = (frame % FRAMES_PER_BEAT) / (FRAMES_PER_BEAT - 1);
  const geometry = useArtifactGeometry(beat);

  return (
    <group
      position={[-0.28, -0.14, 0]}
      rotation={[0.04, -0.2 + progress * 0.025, Math.sin(progress * Math.PI) * 0.018]}
      scale={[1.2, 1.2, 1.2]}
    >
      <lineSegments geometry={geometry.lineGeometry} frustumCulled={false}>
        <lineBasicMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.24}
          transparent
          vertexColors
        />
      </lineSegments>
      <points geometry={geometry.pointGeometry} frustumCulled={false}>
        <pointsMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.72}
          size={0.018}
          sizeAttenuation
          transparent
          vertexColors
        />
      </points>
    </group>
  );
}

function CopyLayer(): React.JSX.Element {
  const frame = useCurrentFrame();
  const beatIndex = beatIndexForFrame(frame);
  const beat = getMiraArtifactBeatByIndex(beatIndex);
  const fade = interpolate(frame % FRAMES_PER_BEAT, [0, 5, 18], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div style={styles.vignette} />
      <div style={styles.eyebrow}>CHAPTER 01 / MIRA SYSTEM RENDER BOARD</div>
      <h1 style={styles.title}>MIRA</h1>
      <div style={styles.card}>
        <span style={styles.kicker}>{beatIndex + 1}/8</span>
        <h2 style={styles.cardTitle}>{beat.id.replace('-', ' ')}</h2>
        <strong style={styles.metric}>{beat.outputs.join(' + ') || 'signal'}</strong>
        <p style={styles.body}>
          Voice intake, orchestration, and operational outputs rendered as a system artifact.
        </p>
      </div>
    </AbsoluteFill>
  );
}

export function MiraRenderBoard(): React.JSX.Element {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: VOID }}>
      <ThreeCanvas
        camera={{ fov: 38, far: 100, near: 0.1, position: [0, 0.1, 8.2] }}
        gl={{ alpha: true, antialias: true }}
        height={height}
        width={width}
      >
        <color attach="background" args={[VOID]} />
        <BackdropField />
        <ArtifactField />
      </ThreeCanvas>
      <CopyLayer />
    </AbsoluteFill>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    color: 'rgba(240, 228, 210, 0.78)',
    fontFamily: 'Georgia, serif',
    fontSize: 28,
    fontStyle: 'italic',
    lineHeight: 1.35,
    margin: '18px 0 0',
    maxWidth: 650,
  },
  card: {
    backdropFilter: 'blur(18px)',
    background: 'rgba(8, 7, 10, 0.68)',
    border: '1px solid rgba(255, 168, 92, 0.52)',
    borderRadius: 8,
    left: 1180,
    padding: 34,
    position: 'absolute',
    top: 340,
    width: 520,
  },
  cardTitle: {
    color: 'rgba(240, 228, 210, 0.92)',
    fontFamily: 'Georgia, serif',
    fontSize: 54,
    fontStyle: 'italic',
    fontWeight: 400,
    lineHeight: 1,
    margin: '18px 0',
    textTransform: 'capitalize',
  },
  eyebrow: {
    color: 'rgba(255, 168, 92, 0.82)',
    fontFamily: 'monospace',
    fontSize: 24,
    left: 112,
    letterSpacing: 0,
    position: 'absolute',
    top: 138,
  },
  kicker: {
    color: 'rgba(240, 228, 210, 0.64)',
    fontFamily: 'monospace',
    fontSize: 22,
  },
  metric: {
    color: 'rgba(255, 168, 92, 0.92)',
    display: 'block',
    fontFamily: 'Georgia, serif',
    fontSize: 56,
    fontStyle: 'italic',
    fontWeight: 400,
    lineHeight: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: 'rgba(240, 228, 210, 0.86)',
    fontFamily: 'Georgia, serif',
    fontSize: 182,
    fontStyle: 'italic',
    fontWeight: 400,
    left: 108,
    letterSpacing: 0,
    lineHeight: 0.85,
    margin: 0,
    position: 'absolute',
    top: 176,
  },
  vignette: {
    background: 'radial-gradient(circle at 62% 44%, rgba(255,168,92,0.16), transparent 34%)',
    inset: 0,
    position: 'absolute',
  },
};
