import {
  PORTFOLIO_CHAPTERS,
  getPortfolioBookSnapshot,
  isPortfolioChapterPhase,
  type PortfolioChapterId,
  type PortfolioProjectPhase,
  type PortfolioVec3,
} from './portfolio-book';
import {
  buildPortfolioGlyphLayout,
  type PortfolioGlyphLayout,
} from './portfolio-glyphs';
import {
  getPortfolioArtifactLabel,
  portfolioArtifactProfile,
} from './portfolio-artifacts';
import { getPortfolioStopForProgress } from './portfolio-journey';
import type { ScenePhase } from './scene-state';

export const PORTFOLIO_PARTICLE_ROLE = {
  background: 0,
  nucleus: 1,
  filament: 2,
  beat: 3,
  glyph: 4,
} as const;

export interface PortfolioSuperclusterOptions {
  readonly particlesPerBeat?: number;
}

export interface PortfolioSuperclusterAttributes {
  readonly artifactAlpha: Float32Array;
  readonly artifactPosition: Float32Array;
  readonly artifactScale: Float32Array;
  readonly beatIndex: Float32Array;
  readonly color: Float32Array;
  readonly glyphPosition: Float32Array;
  readonly homePosition: Float32Array;
  readonly projectIndex: Float32Array;
  readonly projectPosition: Float32Array;
  readonly titleGlyphPosition: Float32Array;
  readonly beatPosition: Float32Array;
  readonly role: Float32Array;
  readonly seed: Float32Array;
}

export interface PortfolioSuperclusterProject {
  readonly center: PortfolioVec3;
  readonly count: number;
  readonly id: PortfolioChapterId;
  readonly index: number;
  readonly label: string;
  readonly start: number;
}

export interface PortfolioSuperclusterModel {
  readonly attributes: PortfolioSuperclusterAttributes;
  readonly count: number;
  readonly projectRanges: readonly PortfolioSuperclusterProject[];
  readonly projects: typeof PORTFOLIO_CHAPTERS;
}

export interface PortfolioMorphState {
  readonly activeBeat: number;
  readonly activeProject: number;
  readonly activeProjectId: PortfolioChapterId | null;
  readonly beatMorph: number;
  readonly glyphMorph: number;
  readonly projectMorph: number;
  readonly release: number;
  readonly titleMorph: number;
}

const DEFAULT_PARTICLES_PER_BEAT = 5200;
const MOBILE_PARTICLES_PER_BEAT = 2600;
const GLYPH_CELL_STEP = 0.043;
const GLYPH_ROLE_SHARE = 0.9;
const GLYPH_WORLD_MAX_HEIGHT = 2.1;
const GLYPH_WORLD_MAX_WIDTH = 4.25;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function hash01(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function wave(seed: number, amplitude: number): number {
  return (hash01(seed) - 0.5) * amplitude;
}

function hexToRgb(hex: string): PortfolioVec3 {
  const raw = hex.replace('#', '');
  const value = Number.parseInt(raw, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function writeVec(target: Float32Array, index: number, vec: PortfolioVec3): void {
  const offset = index * 3;
  target[offset] = vec[0];
  target[offset + 1] = vec[1];
  target[offset + 2] = vec[2];
}

function radialPoint(center: PortfolioVec3, seed: number, radius: number): PortfolioVec3 {
  const a = hash01(seed) * Math.PI * 2;
  const b = hash01(seed + 11.7) * Math.PI * 2;
  const r = radius * (0.24 + hash01(seed + 21.1) * 0.76);
  return [
    center[0] + Math.cos(a) * Math.sin(b) * r,
    center[1] + Math.sin(a) * Math.sin(b) * r,
    center[2] + Math.cos(b) * r * 0.72,
  ];
}

function beatCenter(center: PortfolioVec3, beatIndex: number, beatCount: number): PortfolioVec3 {
  const angle = (beatIndex / Math.max(1, beatCount)) * Math.PI * 2;
  const ring = 1.05 + (beatIndex % 3) * 0.26;
  return [
    center[0] + Math.cos(angle) * ring,
    center[1] + Math.sin(angle) * ring * 0.62,
    center[2] + wave(beatIndex + beatCount, 0.92),
  ];
}

function glyphPoint(
  layout: PortfolioGlyphLayout,
  center: PortfolioVec3,
  index: number,
  total: number,
): PortfolioVec3 {
  const glyphTotal = Math.max(1, Math.floor(total * GLYPH_ROLE_SHARE));
  const sample = Math.min(index, glyphTotal - 1) / Math.max(1, glyphTotal - 1);
  const cellIndex = Math.floor(sample * Math.max(0, layout.cells.length - 1));
  const cell = layout.cells[cellIndex] ?? {
    x: layout.width * 0.5,
    y: layout.height * 0.5,
  };
  const cellStep = Math.min(
    GLYPH_CELL_STEP,
    GLYPH_WORLD_MAX_HEIGHT / Math.max(1, layout.height),
    GLYPH_WORLD_MAX_WIDTH / Math.max(1, layout.width),
  );
  const jitterX = wave(index + total, 0.006);
  const jitterY = wave(index + total * 2, 0.006);
  return [
    center[0] + (cell.x - layout.width * 0.5) * cellStep + jitterX,
    center[1] + (layout.height * 0.5 - cell.y) * cellStep + jitterY,
    center[2] + 0.52 + wave(index * 2.1, 0.08),
  ];
}

function titleCenter(center: PortfolioVec3): PortfolioVec3 {
  return [center[0] + 0.42, center[1] + 0.06, center[2] + 0.1];
}

function roleFor(localIndex: number, total: number): number {
  const t = localIndex / Math.max(1, total - 1);
  if (t < GLYPH_ROLE_SHARE) return PORTFOLIO_PARTICLE_ROLE.glyph;
  if (t < 0.945) return PORTFOLIO_PARTICLE_ROLE.filament;
  if (t < 0.975) return PORTFOLIO_PARTICLE_ROLE.nucleus;
  return PORTFOLIO_PARTICLE_ROLE.beat;
}

function titleMorphFor(progress: number | undefined, localProgress: number): number {
  if (progress === undefined) return 0;
  const stop = getPortfolioStopForProgress(progress);
  if (stop.kind !== 'projectTitle') return 0;
  const release = smoothstep(0.84, 1, localProgress);
  return smoothstep(0.08, 0.14, localProgress) * (1 - release);
}

export function portfolioProjectIndex(id: PortfolioChapterId): number {
  return PORTFOLIO_CHAPTERS.findIndex((chapter) => chapter.id === id);
}

function particleCount(particlesPerBeat: number): number {
  return PORTFOLIO_CHAPTERS.reduce(
    (sum, chapter) => sum + chapter.beats.length * particlesPerBeat,
    0,
  );
}

function emptyAttributes(count: number): PortfolioSuperclusterAttributes {
  const vectors = count * 3;
  return {
    artifactAlpha: new Float32Array(count),
    artifactPosition: new Float32Array(vectors),
    artifactScale: new Float32Array(count),
    beatIndex: new Float32Array(count),
    color: new Float32Array(vectors),
    glyphPosition: new Float32Array(vectors),
    homePosition: new Float32Array(vectors),
    projectIndex: new Float32Array(count),
    projectPosition: new Float32Array(vectors),
    titleGlyphPosition: new Float32Array(vectors),
    beatPosition: new Float32Array(vectors),
    role: new Float32Array(count),
    seed: new Float32Array(count),
  };
}

function writeParticle(config: {
  attrs: PortfolioSuperclusterAttributes;
  beatCenter: PortfolioVec3;
  beatIndex: number;
  color: PortfolioVec3;
  center: PortfolioVec3;
  cursor: number;
  glyphLayout: PortfolioGlyphLayout;
  id: PortfolioChapterId;
  localIndex: number;
  particlesPerBeat: number;
  projectIndex: number;
  titleGlyphLayout: PortfolioGlyphLayout;
}): void {
  const seed = config.projectIndex * 1000 + config.beatIndex * 97 + config.localIndex;
  const artifact = portfolioArtifactProfile({
    beatIndex: config.beatIndex,
    center: config.center,
    id: config.id,
    localIndex: config.localIndex,
    seed,
    total: config.particlesPerBeat,
  });
  config.attrs.projectIndex[config.cursor] = config.projectIndex;
  config.attrs.beatIndex[config.cursor] = config.beatIndex;
  config.attrs.role[config.cursor] = roleFor(config.localIndex, config.particlesPerBeat);
  config.attrs.seed[config.cursor] = seed;
  config.attrs.artifactAlpha[config.cursor] = artifact.alpha;
  config.attrs.artifactScale[config.cursor] = artifact.scale;
  writeVec(config.attrs.color, config.cursor, config.color);
  writeVec(config.attrs.homePosition, config.cursor, radialPoint(config.center, seed, 4.2));
  writeVec(config.attrs.projectPosition, config.cursor, radialPoint(config.center, seed, 1.25));
  writeVec(config.attrs.beatPosition, config.cursor, radialPoint(config.beatCenter, seed, 0.46));
  writeVec(config.attrs.artifactPosition, config.cursor, artifact.position);
  writeVec(
    config.attrs.glyphPosition,
    config.cursor,
    glyphPoint(config.glyphLayout, config.center, config.localIndex, config.particlesPerBeat),
  );
  writeVec(
    config.attrs.titleGlyphPosition,
    config.cursor,
    glyphPoint(
      config.titleGlyphLayout,
      titleCenter(config.center),
      config.localIndex,
      config.particlesPerBeat,
    ),
  );
}

export function buildPortfolioSuperclusterModel(
  options: PortfolioSuperclusterOptions = {},
): PortfolioSuperclusterModel {
  const particlesPerBeat = options.particlesPerBeat ?? DEFAULT_PARTICLES_PER_BEAT;
  const count = particleCount(particlesPerBeat);
  const attrs = emptyAttributes(count);
  const ranges: PortfolioSuperclusterProject[] = [];
  let cursor = 0;

  PORTFOLIO_CHAPTERS.forEach((chapter, projectIndex) => {
    const start = cursor;
    const color = hexToRgb(chapter.node.color);
    const label = getPortfolioArtifactLabel(chapter.id);
    const titleGlyphLayout = buildPortfolioGlyphLayout(
      chapter.beats[0]?.particleLines ?? [chapter.id, label],
    );
    chapter.beats.forEach((beat, beatIndex) => {
      const target = beatCenter(chapter.node.anchor, beatIndex, chapter.beats.length);
      const glyphLayout = buildPortfolioGlyphLayout(beat.particleLines);
      for (let i = 0; i < particlesPerBeat; i += 1) {
        writeParticle({
          attrs,
          beatCenter: target,
          beatIndex,
          color,
          center: chapter.node.anchor,
          cursor,
          glyphLayout,
          id: chapter.id,
          localIndex: i,
          particlesPerBeat,
          projectIndex,
          titleGlyphLayout,
        });
        cursor += 1;
      }
    });
    ranges.push({
      center: chapter.node.anchor,
      count: cursor - start,
      id: chapter.id,
      index: projectIndex,
      label,
      start,
    });
  });

  return { attributes: attrs, count, projectRanges: ranges, projects: PORTFOLIO_CHAPTERS };
}

export function getPortfolioParticlesPerBeatForViewport(width: number): number {
  return width < 760 ? MOBILE_PARTICLES_PER_BEAT : DEFAULT_PARTICLES_PER_BEAT;
}

export function getPortfolioMorphState(
  phase: ScenePhase,
  localProgress: number,
  progress?: number,
): PortfolioMorphState {
  if (!isPortfolioChapterPhase(phase)) {
    return {
      activeBeat: -1,
      activeProject: -1,
      activeProjectId: null,
      beatMorph: 0,
      glyphMorph: 0,
      projectMorph: 0,
      release: 0,
      titleMorph: 0,
    };
  }
  const snapshot = getPortfolioBookSnapshot(phase as PortfolioProjectPhase, localProgress);
  const release = smoothstep(0.84, 1, localProgress);
  const titleMorph = titleMorphFor(progress, localProgress);
  return {
    activeBeat: snapshot.beatIndex,
    activeProject: snapshot.chapterIndex,
    activeProjectId: snapshot.chapter.id,
    beatMorph: smoothstep(0.18, 0.34, localProgress) * (1 - release),
    glyphMorph: titleMorph > 0
      ? 0
      : smoothstep(0.08, 0.16, snapshot.beatProgress) * (1 - release),
    projectMorph: smoothstep(0.04, 0.18, localProgress) * (1 - release),
    release,
    titleMorph,
  };
}
