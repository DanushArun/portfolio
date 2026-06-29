import type { PortfolioChapterId, PortfolioVec3 } from './portfolio-book';

export interface PortfolioArtifactPointConfig {
  readonly beatIndex: number;
  readonly center: PortfolioVec3;
  readonly id: PortfolioChapterId;
  readonly localIndex: number;
  readonly seed: number;
  readonly total: number;
}

const ARTIFACT_LABELS = {
  MIRA: 'VOICE AI',
  AIDEN: 'CALL INTEL',
  VANGUARD: 'QA GRAPH',
  INSPECTION: 'DEFECT QA',
  WAVEFIELD: 'O N LOG N',
  EMI: 'DB CURVES',
  FORMULA: 'RACE OPS',
} as const satisfies Record<PortfolioChapterId, string>;

function wave(seed: number, amplitude: number): number {
  return (Math.sin(seed * 9.37) * 0.5 + Math.cos(seed * 3.91) * 0.5) * amplitude;
}

function miraPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 180) / 179;
  const lane = Math.floor(config.localIndex / 180) % 7;
  const x = (t - 0.5) * 3.7;
  const bow = Math.sin(Math.PI * t) * (lane % 2 === 0 ? 0.34 : -0.22);
  const y = (lane - 3) * 0.16 + bow;
  return [
    config.center[0] + x,
    config.center[1] + y,
    config.center[2] + wave(config.seed, 0.34),
  ];
}

function gridPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const col = config.localIndex % 34;
  const row = Math.floor(config.localIndex / 34) % 14;
  const x = (col - 16.5) * 0.11;
  const y = (row - 6.5) * 0.13;
  return [config.center[0] + x, config.center[1] + y, config.center[2] + wave(row, 0.28)];
}

function graphPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 180) / 179;
  const branch = Math.floor(config.localIndex / 180) % 7;
  const x = (t - 0.5) * 3.3;
  const y = (branch - 3) * 0.24 + Math.sin(t * Math.PI * 3 + branch) * 0.16;
  return [config.center[0] + x, config.center[1] + y, config.center[2] + wave(branch, 0.32)];
}

function scanPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 220) / 219;
  const ring = Math.floor(config.localIndex / 220) % 6;
  const angle = t * Math.PI * 2;
  const radiusX = 1.45 + ring * 0.045;
  const radiusY = 0.54 + Math.sin(t * Math.PI * 4) * 0.08;
  return [
    config.center[0] + Math.cos(angle) * radiusX,
    config.center[1] + Math.sin(angle) * radiusY - 0.04,
    config.center[2] + wave(config.seed, 0.22),
  ];
}

function wavefieldPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const col = config.localIndex % 52;
  const row = Math.floor(config.localIndex / 52) % 18;
  const x = (col - 25.5) * 0.08;
  const y = (row - 8.5) * 0.08;
  const z = Math.sin(col * 0.42 + config.beatIndex) * 0.35;
  return [config.center[0] + x, config.center[1] + y, config.center[2] + z];
}

function ringPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 260) / 259;
  const ring = Math.floor(config.localIndex / 260) % 8;
  const angle = t * Math.PI * 2;
  const radius = 0.42 + ring * 0.15;
  return [
    config.center[0] + Math.cos(angle) * radius * 1.6,
    config.center[1] + Math.sin(angle) * radius * 0.72,
    config.center[2] + (ring - 3.5) * 0.06,
  ];
}

function trackPoint(config: PortfolioArtifactPointConfig): PortfolioVec3 {
  const t = (config.localIndex % 320) / 319;
  const angle = t * Math.PI * 2;
  const x = Math.sin(angle) * 1.55;
  const y = Math.sin(angle * 2) * 0.68;
  return [config.center[0] + x, config.center[1] + y, config.center[2] + wave(t, 0.2)];
}

export function getPortfolioArtifactLabel(id: PortfolioChapterId): string {
  return ARTIFACT_LABELS[id];
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
