'use client';

import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';

import { MiraSystemArtifact } from '@/components/scene/scenes/mira/MiraSystemArtifact';
import {
  MIRA_ARTIFACT_BEATS,
  getMiraArtifactBeatByIndex,
  type MiraArtifactBeat,
} from '@/components/scene/scenes/mira/mira-artifact-model';
import styles from './MiraRenderBoardClient.module.css';

const DEFAULT_BEAT_INDEX = 5;
const FRAMES_PER_BEAT = 19;

function titleForBeat(beat: MiraArtifactBeat): string {
  return beat.id.replace('-', ' ');
}

function outputLabel(beat: MiraArtifactBeat): string {
  if (beat.outputs.length === 0) return 'signal';
  return beat.outputs.join(' + ');
}

function frameForBeat(index: number): number {
  return index * FRAMES_PER_BEAT + Math.floor(FRAMES_PER_BEAT / 2);
}

function ArtifactCanvas({ beatIndex }: { readonly beatIndex: number }): React.JSX.Element {
  return (
    <Canvas
      camera={{ fov: 40, far: 100, near: 0.1, position: [0, 0.1, 8] }}
      dpr={[1, 2]}
      gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#08070a']} />
      <ambientLight intensity={0.62} />
      <directionalLight intensity={1.8} position={[3, 4, 5]} />
      <pointLight color="#ffa85c" intensity={2.8} position={[1.4, 0.8, 2.4]} />
      <pointLight color="#78b8ff" intensity={1.4} position={[-3.4, 1.1, 2.2]} />
      <MiraSystemArtifact beatIndex={beatIndex} forceVisible progress={1} reveal={1} />
    </Canvas>
  );
}

function BeatTimeline(config: {
  readonly activeIndex: number;
  readonly onSelect: (index: number) => void;
}): React.JSX.Element {
  return (
    <nav aria-label="MIRA render beats" className={styles.timeline}>
      {MIRA_ARTIFACT_BEATS.map((beat, index) => {
        const active = index === config.activeIndex;
        const className = active
          ? `${styles.beatButton} ${styles.activeBeat}`
          : styles.beatButton;

        return (
          <button
            aria-pressed={active}
            className={className}
            key={beat.id}
            onClick={() => config.onSelect(index)}
            type="button"
          >
            <span className={styles.label}>{index + 1}/8</span>
            <span className={styles.beatTitle}>{titleForBeat(beat)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Readout({ beat, beatIndex }: {
  readonly beat: MiraArtifactBeat;
  readonly beatIndex: number;
}): React.JSX.Element {
  return (
    <aside className={styles.readout}>
      <p className={styles.eyebrow}>REMOTION BOARD / FRAME {frameForBeat(beatIndex)}</p>
      <h1 className={styles.title}>MIRA</h1>
      <p className={styles.frame}>{beatIndex + 1}/8</p>
      <h2 className={styles.beatName}>{titleForBeat(beat)}</h2>
      <strong className={styles.metric}>{outputLabel(beat)}</strong>
      <p className={styles.copy}>
        Voice intake, orchestration, and operational outputs rendered as one inspectable system.
      </p>
    </aside>
  );
}

export default function MiraRenderBoardClient(): React.JSX.Element {
  const [beatIndex, setBeatIndex] = useState(DEFAULT_BEAT_INDEX);
  const beat = useMemo(() => getMiraArtifactBeatByIndex(beatIndex), [beatIndex]);

  return (
    <main className={styles.page}>
      <section className={styles.stage}>
        <div className={styles.canvasShell} data-testid="mira-artifact-canvas">
          <ArtifactCanvas beatIndex={beatIndex} />
        </div>
        <Readout beat={beat} beatIndex={beatIndex} />
      </section>
      <BeatTimeline activeIndex={beatIndex} onSelect={setBeatIndex} />
    </main>
  );
}
