import type { PortfolioChapterId, PortfolioVec3 } from './portfolio-book';

export interface PortfolioArtifactPointConfig {
  readonly beatIndex: number;
  readonly center: PortfolioVec3;
  readonly id: PortfolioChapterId;
  readonly localIndex: number;
  readonly seed: number;
  readonly total: number;
}

export interface PortfolioArtifactProfile {
  readonly alpha: number;
  readonly position: PortfolioVec3;
  readonly scale: number;
}

const ARTIFACT_LABELS = {
  MIRA: 'VOICE AI',
  AIDEN: 'CALL INTEL',
  VANGUARD: 'QA GRAPH',
  INSPECTION: 'DEFECT QA',
  WAVEFIELD: 'O(N LOG N)',
  EMI: 'DB CURVES',
  FORMULA: 'RACE OPS',
} as const satisfies Record<PortfolioChapterId, string>;

const TAU = Math.PI * 2;

function wave(seed: number, amplitude: number): number {
  return (Math.sin(seed * 9.37) * 0.5 + Math.cos(seed * 3.91) * 0.5) * amplitude;
}

function profile(position: PortfolioVec3, alpha: number, scale: number): PortfolioArtifactProfile {
  return { alpha, position, scale };
}

function ellipticalFalloff(
  position: PortfolioVec3,
  center: PortfolioVec3,
  rx: number,
  ry: number
): number {
  const dx = (position[0] - center[0]) / rx;
  const dy = (position[1] - center[1]) / ry;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, Math.min(1, 1 - distance));
}

function miraPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 360) / 359;
  const lane = Math.floor(config.localIndex / 360) % 9;
  const phase = lane * 0.37 + config.beatIndex * 0.23;
  const envelope = Math.sin(Math.PI * t);
  const carrier = Math.sin(t * TAU * (1.08 + lane * 0.035) + phase);
  const x = (t - 0.5) * 6.4 + wave(config.seed + lane, 0.08);
  const y = (lane - 4) * 0.105 + carrier * envelope * 0.16 + wave(config.seed, 0.055);
  return [
    config.center[0] + x,
    config.center[1] + y,
    config.center[2] - 0.46 + (lane - 4) * 0.018 + wave(config.seed, 0.09),
  ];
}

function gridPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 240) / 239;
  const lane = Math.floor(config.localIndex / 240) % 8;
  const x = (t - 0.5) * 4.8 + wave(config.seed, 0.07);
  const y = (lane - 3.5) * 0.16 + Math.sin(t * TAU + lane) * 0.045;
  return [config.center[0] + x, config.center[1] + y, config.center[2] - 0.38 + wave(lane, 0.12)];
}

function graphPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 210) / 209;
  const branch = Math.floor(config.localIndex / 210) % 9;
  const bend = Math.sin(t * Math.PI * (1.4 + branch * 0.07) + branch);
  const x = (t - 0.5) * 4.4 + wave(config.seed, 0.09);
  const y = (branch - 4) * 0.15 + bend * 0.12;
  return [config.center[0] + x, config.center[1] + y, config.center[2] - 0.42 + wave(branch, 0.16)];
}

function scanPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 280) / 279;
  const ring = Math.floor(config.localIndex / 280) % 7;
  const angle = t * Math.PI * 2;
  const sweep = Math.sin(t * Math.PI * 3 + ring) * 0.06;
  const radiusX = 1.75 + ring * 0.06 + sweep;
  const radiusY = 0.62 + Math.sin(t * Math.PI * 4) * 0.05;
  return [
    config.center[0] + Math.cos(angle) * radiusX,
    config.center[1] + Math.sin(angle) * radiusY - 0.04,
    config.center[2] - 0.36 + (ring - 3) * 0.035 + wave(config.seed, 0.08),
  ];
}

function wavefieldPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const col = config.localIndex % 72;
  const row = Math.floor(config.localIndex / 72) % 18;
  const x = (col - 35.5) * 0.072 + wave(config.seed + col, 0.055);
  const y = (row - 8.5) * 0.075 + wave(config.seed + row * 3, 0.045);
  const interference = Math.sin(col * 0.34 + row * 0.47 + config.beatIndex);
  return [
    config.center[0] + x,
    config.center[1] + y,
    config.center[2] - 0.44 + interference * 0.16,
  ];
}

function ringPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 300) / 299;
  const ring = Math.floor(config.localIndex / 300) % 9;
  const angle = t * Math.PI * 2;
  const radius = 0.58 + ring * 0.13 + wave(config.seed, 0.025);
  return [
    config.center[0] + Math.cos(angle) * radius * 1.78,
    config.center[1] + Math.sin(angle) * radius * 0.66,
    config.center[2] - 0.34 + (ring - 4) * 0.035,
  ];
}

function trackPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 420) / 419;
  const angle = t * Math.PI * 2;
  const racingLine = Math.sin(angle * 2.0 + 0.35) * 0.18;
  const x = Math.sin(angle) * 1.85 + racingLine;
  const y = Math.sin(angle * 2) * 0.7 + wave(config.seed, 0.04);
  return [config.center[0] + x, config.center[1] + y, config.center[2] - 0.34 + wave(t, 0.08)];
}

export function getPortfolioArtifactLabel(id: PortfolioChapterId): string {
  return ARTIFACT_LABELS[id];
}

export function portfolioArtifactProfile(
  config: PortfolioArtifactPointConfig,
): PortfolioArtifactProfile {
  const baseAlpha = config.id === 'MIRA' ? 0.14 : 0.16;
  const baseScale = config.id === 'MIRA' ? 0.50 : 0.54;
  const position = portfolioArtifactPoint(config);
  const falloff = ellipticalFalloff(position, config.center, 3.2, 1.24);
  const alpha = baseAlpha * (0.12 + falloff * 0.88);
  const scale = baseScale * (0.78 + falloff * 0.22);
  return profile(position, alpha, scale);
}

export function portfolioArtifactPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  if (config.id === 'MIRA') return miraPoint(config);
  if (config.id === 'AIDEN') return gridPoint(config);
  if (config.id === 'VANGUARD') return graphPoint(config);
  if (config.id === 'INSPECTION') return scanPoint(config);
  if (config.id === 'WAVEFIELD') return wavefieldPoint(config);
  if (config.id === 'EMI') return ringPoint(config);
  return trackPoint(config);
}
