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

export type MiraArtifactVisualMode = 'filament-wake';

export interface MiraArtifactBeat {
  readonly id: MiraArtifactBeatId;
  readonly activeLanes: readonly MiraArtifactLane[];
  readonly coreIntensity: number;
  readonly outputs: readonly MiraArtifactLane[];
  readonly pulseRate: number;
}

const VISUAL_MODE: MiraArtifactVisualMode = 'filament-wake';

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
  }),
  beat({
    id: 'latency',
    activeLanes: ['vad', 'asr', 'llm'],
    coreIntensity: 0.88,
    outputs: ['llm'],
    pulseRate: 0.72,
  }),
  beat({
    id: 'languages',
    activeLanes: ['language', 'asr', 'llm'],
    coreIntensity: 0.70,
    outputs: ['llm'],
    pulseRate: 0.46,
  }),
  beat({
    id: 'voice',
    activeLanes: ['lead', 'vad', 'asr'],
    coreIntensity: 0.76,
    outputs: ['asr'],
    pulseRate: 0.58,
  }),
  beat({
    id: 'orchestration',
    activeLanes: ['asr', 'language', 'llm'],
    coreIntensity: 0.94,
    outputs: ['llm'],
    pulseRate: 0.64,
  }),
  beat({
    id: 'post-call',
    activeLanes: ['llm', 'crm', 'whatsapp'],
    coreIntensity: 0.82,
    outputs: ['crm', 'whatsapp'],
    pulseRate: 0.42,
  }),
  beat({
    id: 'ops',
    activeLanes: ['crm', 'whatsapp', 'deploy'],
    coreIntensity: 0.74,
    outputs: ['crm', 'whatsapp'],
    pulseRate: 0.50,
  }),
  beat({
    id: 'ownership',
    activeLanes: ['lead', 'llm', 'crm', 'whatsapp', 'deploy'],
    coreIntensity: 0.86,
    outputs: ['deploy'],
    pulseRate: 0.38,
  }),
] as const;

export function getMiraArtifactVisualMode(): MiraArtifactVisualMode {
  return VISUAL_MODE;
}

export function getMiraArtifactBeat(id: MiraArtifactBeatId): MiraArtifactBeat {
  const match = MIRA_ARTIFACT_BEATS.find((item) => item.id === id);
  if (!match) throw new Error(`Missing MIRA artifact beat ${id}`);
  return match;
}

export function getMiraArtifactBeatByIndex(index: number): MiraArtifactBeat {
  const safeIndex = Math.max(0, Math.min(MIRA_ARTIFACT_BEATS.length - 1, index));
  return MIRA_ARTIFACT_BEATS[safeIndex];
}
