import {
  KNOT_TABLE,
  MIRA_RECRUITER_JOURNEY,
  type MiraFocusId,
  type MiraLang,
  type MiraWorkRegionId,
} from './mira-state';

export type MiraVec3 = readonly [number, number, number];

export interface MiraLabelPosition {
  readonly left: string;
  readonly top: string;
}

export interface MiraWorkRegion {
  readonly id: MiraWorkRegionId;
  readonly title: string;
  readonly recruiterQuestion: string;
  readonly metric: string;
  readonly proof: readonly string[];
  readonly anchor: MiraVec3;
  readonly radius: number;
  readonly color: string;
  readonly fov: number;
  readonly labelPosition: MiraLabelPosition;
  readonly relatedLangs: readonly MiraLang[];
}

export interface MiraCameraStop {
  readonly position: MiraVec3;
  readonly lookAt: MiraVec3;
  readonly fov: number;
}

const WORLD_SCALE = 2.35;
const CENTER: MiraVec3 = [0, 0, 0.85];
const DEFAULT_STOP: MiraCameraStop = {
  position: [0, 0, 16.2],
  lookAt: [0, 0, 0],
  fov: 46,
};

function scalePosition(position: readonly [number, number, number]): MiraVec3 {
  return [position[0] * WORLD_SCALE, position[1] * WORLD_SCALE, position[2] * WORLD_SCALE];
}

function knotAnchor(lang: MiraLang): MiraVec3 {
  const knot = KNOT_TABLE.find((item) => item.lang === lang);
  if (!knot) throw new Error(`Missing MIRA knot for ${lang}`);
  return scalePosition(knot.position);
}

function blend(a: MiraVec3, b: MiraVec3, amount: number): MiraVec3 {
  return [
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ];
}

const EN = knotAnchor('EN');
const HI = knotAnchor('HI');
const TA = knotAnchor('TA');
const KN = knotAnchor('KN');
const TE = knotAnchor('TE');

export const MIRA_WORK_REGIONS: readonly MiraWorkRegion[] = [
  {
    id: 'SHIPPED',
    title: 'Production System',
    recruiterQuestion: 'Did this ship?',
    metric: 'Production voice agent',
    proof: ['Production outbound voice AI for sales-call conversion.'],
    anchor: CENTER,
    radius: 3.2,
    color: '#ffe2a6',
    fov: 42,
    labelPosition: { left: '48%', top: '40%' },
    relatedLangs: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'LATENCY',
    title: 'Latency Collapse',
    recruiterQuestion: 'Did it measurably improve?',
    metric: '7s -> <500ms',
    proof: [
      'First response reduced from 7s to under 500ms.',
      'Four architecture iterations over 68 days.',
    ],
    anchor: blend(EN, TE, 0.54),
    radius: 2.0,
    color: '#ffcf77',
    fov: 35,
    labelPosition: { left: '45%', top: '50%' },
    relatedLangs: ['EN', 'TE'],
  },
  {
    id: 'LANGUAGES',
    title: 'Language Intelligence',
    recruiterQuestion: 'Could it work across users?',
    metric: '5 languages',
    proof: ['Five Indian languages: English, Hindi, Tamil, Kannada, Telugu.'],
    anchor: CENTER,
    radius: 4.6,
    color: '#d6b6ff',
    fov: 37,
    labelPosition: { left: '39%', top: '26%' },
    relatedLangs: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'VOICE_INTAKE',
    title: 'Realtime Voice Intake',
    recruiterQuestion: 'What was technically hard?',
    metric: 'speech pipeline',
    proof: ['VAD, streaming ASR, telephony WebSockets, Pipecat and FastAPI.'],
    anchor: blend(EN, TA, 0.42),
    radius: 1.65,
    color: '#78b8ff',
    fov: 34,
    labelPosition: { left: '31%', top: '44%' },
    relatedLangs: ['EN', 'TA'],
  },
  {
    id: 'ORCHESTRATION',
    title: 'Orchestration Core',
    recruiterQuestion: 'Was this systems architecture?',
    metric: 'multi-model control',
    proof: ['Distributed call orchestration with multi-model response control.'],
    anchor: [0.05, 0.1, 1.42],
    radius: 1.75,
    color: '#a48cff',
    fov: 33,
    labelPosition: { left: '50%', top: '45%' },
    relatedLangs: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'POST_CALL',
    title: 'Post-Call Intelligence',
    recruiterQuestion: 'Did it produce usable business data?',
    metric: 'structured intent',
    proof: ['Post-call intent classification with confidence and ISO dates.'],
    anchor: blend(TA, TE, 0.62),
    radius: 1.7,
    color: '#8ee7ff',
    fov: 34,
    labelPosition: { left: '44%', top: '66%' },
    relatedLangs: ['TA', 'TE'],
  },
  {
    id: 'OPS_AUTOMATION',
    title: 'Ops Automation Loop',
    recruiterQuestion: 'Did it connect to the business?',
    metric: 'CRM + WhatsApp',
    proof: ['Zoho CRM sync, WhatsApp auto-group creation, live bot and retries.'],
    anchor: blend(HI, KN, 0.35),
    radius: 2.25,
    color: '#ffc56f',
    fov: 34,
    labelPosition: { left: '67%', top: '35%' },
    relatedLangs: ['HI', 'KN'],
  },
  {
    id: 'PRODUCTION',
    title: 'End-to-End Ownership',
    recruiterQuestion: 'Was this fully owned?',
    metric: 'architecture -> Kubernetes',
    proof: ['Owned architecture, implementation, testing and Kubernetes deployment.'],
    anchor: blend(KN, TE, 0.42),
    radius: 2.45,
    color: '#ffe8bc',
    fov: 39,
    labelPosition: { left: '58%', top: '62%' },
    relatedLangs: ['KN', 'TE'],
  },
] as const;

export function getMiraWorkRegion(id: MiraWorkRegionId): MiraWorkRegion {
  const region = MIRA_WORK_REGIONS.find((item) => item.id === id);
  if (!region) throw new Error(`Missing MIRA work region ${id}`);
  return region;
}

export function getMiraRegionIndex(id: MiraWorkRegionId): number {
  return MIRA_RECRUITER_JOURNEY.indexOf(id);
}

export function getMiraFocusAnchor(id: MiraFocusId, activeLang: MiraLang): MiraVec3 {
  if (id === 'OVERVIEW') return CENTER;
  if (id === 'LANGUAGES') return knotAnchor(activeLang);
  return getMiraWorkRegion(id).anchor;
}

export function getMiraCameraStop(
  id: MiraFocusId,
  activeLang: MiraLang = 'EN',
): MiraCameraStop {
  if (id === 'OVERVIEW') return DEFAULT_STOP;
  const region = getMiraWorkRegion(id);
  const anchor = getMiraFocusAnchor(id, activeLang);
  return {
    position: [anchor[0] * 0.72, anchor[1] * 0.72, 6.4 + anchor[2] * 0.32],
    lookAt: anchor,
    fov: region.fov,
  };
}
