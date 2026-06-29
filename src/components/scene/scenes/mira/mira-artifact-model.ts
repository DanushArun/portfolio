export type MiraArtifactBeatId =
  | 'shipped'
  | 'latency'
  | 'languages'
  | 'voice'
  | 'orchestration'
  | 'post-call'
  | 'ops'
  | 'ownership';

export type MiraArtifactLane =
  | 'lead'
  | 'vad'
  | 'asr'
  | 'language'
  | 'llm'
  | 'crm'
  | 'whatsapp'
  | 'deploy';

export interface MiraArtifactBeat {
  readonly id: MiraArtifactBeatId;
  readonly activeLanes: readonly MiraArtifactLane[];
  readonly coreIntensity: number;
  readonly outputs: readonly MiraArtifactLane[];
  readonly pulseRate: number;
  readonly waveform: readonly number[];
}

const BASE_WAVEFORM = [0.18, 0.42, 0.24, 0.68, 0.31, 0.76, 0.28, 0.54] as const;

function beat(config: MiraArtifactBeat): MiraArtifactBeat {
  return config;
}

export const MIRA_ARTIFACT_BEATS: readonly MiraArtifactBeat[] = [
  beat({
    id: 'shipped',
    activeLanes: ['lead', 'vad', 'asr', 'llm', 'crm'],
    coreIntensity: 0.62,
    outputs: ['crm'],
    pulseRate: 0.34,
    waveform: BASE_WAVEFORM,
  }),
  beat({
    id: 'latency',
    activeLanes: ['vad', 'asr', 'llm'],
    coreIntensity: 0.88,
    outputs: ['llm'],
    pulseRate: 0.72,
    waveform: [0.08, 0.74, 0.12, 0.82, 0.16, 0.78, 0.11, 0.69],
  }),
  beat({
    id: 'languages',
    activeLanes: ['language', 'asr', 'llm'],
    coreIntensity: 0.70,
    outputs: ['llm'],
    pulseRate: 0.46,
    waveform: [0.34, 0.58, 0.29, 0.64, 0.41, 0.73, 0.36, 0.62],
  }),
  beat({
    id: 'voice',
    activeLanes: ['lead', 'vad', 'asr'],
    coreIntensity: 0.76,
    outputs: ['asr'],
    pulseRate: 0.58,
    waveform: [0.12, 0.66, 0.19, 0.74, 0.22, 0.61, 0.17, 0.70],
  }),
  beat({
    id: 'orchestration',
    activeLanes: ['asr', 'language', 'llm'],
    coreIntensity: 0.94,
    outputs: ['llm'],
    pulseRate: 0.64,
    waveform: [0.28, 0.45, 0.39, 0.68, 0.51, 0.82, 0.43, 0.73],
  }),
  beat({
    id: 'post-call',
    activeLanes: ['llm', 'crm', 'whatsapp'],
    coreIntensity: 0.82,
    outputs: ['crm', 'whatsapp'],
    pulseRate: 0.42,
    waveform: [0.22, 0.52, 0.31, 0.49, 0.46, 0.58, 0.39, 0.55],
  }),
  beat({
    id: 'ops',
    activeLanes: ['crm', 'whatsapp', 'deploy'],
    coreIntensity: 0.74,
    outputs: ['crm', 'whatsapp'],
    pulseRate: 0.50,
    waveform: [0.26, 0.48, 0.33, 0.62, 0.40, 0.66, 0.35, 0.57],
  }),
  beat({
    id: 'ownership',
    activeLanes: ['lead', 'llm', 'crm', 'whatsapp', 'deploy'],
    coreIntensity: 0.86,
    outputs: ['deploy'],
    pulseRate: 0.38,
    waveform: [0.20, 0.50, 0.27, 0.60, 0.44, 0.71, 0.31, 0.64],
  }),
] as const;

export function getMiraArtifactBeat(id: MiraArtifactBeatId): MiraArtifactBeat {
  const match = MIRA_ARTIFACT_BEATS.find((item) => item.id === id);
  if (!match) throw new Error(`Missing MIRA artifact beat ${id}`);
  return match;
}

export function getMiraArtifactBeatByIndex(index: number): MiraArtifactBeat {
  const safeIndex = Math.max(0, Math.min(MIRA_ARTIFACT_BEATS.length - 1, index));
  return MIRA_ARTIFACT_BEATS[safeIndex];
}
