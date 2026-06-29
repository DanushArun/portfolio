import {
  MIRA_ARTIFACT_BEATS,
  type MiraArtifactBeatId,
} from '@/components/scene/scenes/mira/mira-artifact-model';

export type MiraFlowStageId =
  | 'lead'
  | 'telephony'
  | 'speech'
  | 'language'
  | 'orchestration'
  | 'handoff';

export interface MiraFlowStage {
  readonly id: MiraFlowStageId;
  readonly label: string;
  readonly shortLabel: string;
  readonly input: string;
  readonly action: string;
  readonly output: string;
  readonly proof: string;
  readonly tags: readonly string[];
}

export interface MiraFlowBeat {
  readonly activeStageId: MiraFlowStageId;
  readonly beatId: MiraArtifactBeatId;
  readonly index: number;
  readonly metric: string;
  readonly title: string;
}

export interface MiraFlowSnapshot extends MiraFlowBeat {
  readonly activeStage: MiraFlowStage;
}

const BEAT_TITLES: Record<MiraArtifactBeatId, string> = {
  shipped: 'Production System',
  latency: 'Latency Collapse',
  languages: 'Language Intelligence',
  voice: 'Realtime Voice Intake',
  orchestration: 'Orchestration Core',
  'post-call': 'Post-Call Intelligence',
  ops: 'Ops Automation Loop',
  ownership: 'End-to-End Ownership',
};

const BEAT_STAGE_MAP: Record<MiraArtifactBeatId, MiraFlowStageId> = {
  shipped: 'lead',
  latency: 'speech',
  languages: 'language',
  voice: 'telephony',
  orchestration: 'orchestration',
  'post-call': 'handoff',
  ops: 'handoff',
  ownership: 'handoff',
};

const BEAT_METRICS: Record<MiraArtifactBeatId, string> = {
  shipped: 'Production voice agent',
  latency: '7s -> <500ms',
  languages: '5 languages',
  voice: 'VAD + streaming ASR',
  orchestration: 'LLM + tool routing',
  'post-call': 'Structured intent',
  ops: 'CRM + WhatsApp',
  ownership: 'Kubernetes ownership',
};

export const MIRA_FLOW_STAGES: readonly MiraFlowStage[] = [
  {
    id: 'lead',
    label: 'Lead Context',
    shortLabel: 'Lead',
    input: 'Fresh DriveX sales lead with caller, source, and vehicle context.',
    action: 'Create a live call job and keep the lead state visible to operations.',
    output: 'A connected outbound conversation ready for the voice pipeline.',
    proof: 'Production outbound voice AI for live DriveX lead conversion.',
    tags: ['Lead', 'DriveX', 'Sales'],
  },
  {
    id: 'telephony',
    label: 'Telephony',
    shortLabel: 'Call',
    input: 'Customer audio enters through the telephony connection.',
    action: 'Stream the call into the agent runtime with turn timing preserved.',
    output: 'Clean voice packets for speech detection and transcription.',
    proof: 'Telephony WebSockets, Pipecat, and FastAPI sit in the live response path.',
    tags: ['VoBiz', 'WebSocket', 'Pipecat'],
  },
  {
    id: 'speech',
    label: 'VAD / ASR',
    shortLabel: 'Speech',
    input: 'Live customer audio with pauses, noise, and turn boundaries.',
    action: 'Detect speech and convert it into a streaming transcript.',
    output: 'Language-aware text that can be routed to the agent core.',
    proof: 'Part of the rebuilt path that reduced first response from 7s to <500ms.',
    tags: ['VAD', 'ASR', 'Streaming'],
  },
  {
    id: 'language',
    label: 'Language Routing',
    shortLabel: 'Language',
    input: 'Transcript and detected user language.',
    action: 'Route the conversation through the correct language lane.',
    output: 'Agent context aligned to English, Hindi, Tamil, Kannada, or Telugu.',
    proof: 'One production flow handles five Indian languages.',
    tags: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'orchestration',
    label: 'LLM Orchestration',
    shortLabel: 'Agent',
    input: 'Transcript, lead context, intent, and conversation state.',
    action: 'Coordinate model calls, tool routing, response timing, and turn control.',
    output: 'A spoken answer plus structured state for downstream automation.',
    proof: 'The response path went through four architecture iterations over 68 days.',
    tags: ['LLM', 'Tools', 'State'],
  },
  {
    id: 'handoff',
    label: 'CRM + WhatsApp',
    shortLabel: 'Ops',
    input: 'Call result, intent, confidence, reminder dates, and seller state.',
    action: 'Sync Zoho CRM and create WhatsApp operational handoffs.',
    output: 'Actionable sales workflow instead of an isolated AI conversation.',
    proof: 'Zoho sync, WhatsApp groups, reminders, and seller retry logic are automated.',
    tags: ['Zoho', 'WhatsApp', 'Retries'],
  },
] as const;

function clampBeatIndex(index: number): number {
  return Math.max(0, Math.min(MIRA_ARTIFACT_BEATS.length - 1, index));
}

function getStage(id: MiraFlowStageId): MiraFlowStage {
  const stage = MIRA_FLOW_STAGES.find((item) => item.id === id);
  if (!stage) throw new Error(`Missing MIRA flow stage ${id}`);
  return stage;
}

export function getMiraFlowBeatByIndex(index: number): MiraFlowBeat {
  const safeIndex = clampBeatIndex(index);
  const beatId = MIRA_ARTIFACT_BEATS[safeIndex].id;
  return {
    activeStageId: BEAT_STAGE_MAP[beatId],
    beatId,
    index: safeIndex,
    metric: BEAT_METRICS[beatId],
    title: BEAT_TITLES[beatId],
  };
}

export function getMiraFlowSnapshot(index: number): MiraFlowSnapshot {
  const beat = getMiraFlowBeatByIndex(index);
  return {
    ...beat,
    activeStage: getStage(beat.activeStageId),
  };
}
