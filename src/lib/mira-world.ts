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
    id: 'hero',
    title: 'MIRA',
    recruiterQuestion: 'What is the project?',
    metric: 'Production voice AI',
    proof: [
      'MIRA is a production voice AI intake system for multilingual lead qualification.',
    ],
    anchor: CENTER,
    radius: 3.4,
    color: '#ffe2a6',
    fov: 39,
    labelPosition: { left: '45%', top: '36%' },
    relatedLangs: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'problem',
    title: 'Operational Problem',
    recruiterQuestion: 'What bottleneck did operations have?',
    metric: 'Manual qualification delay',
    proof: ['Manual SDR follow-ups on DriveX leads were slow and unscalable.'],
    anchor: blend(EN, TA, 0.28),
    radius: 3.2,
    color: '#ffe2a6',
    fov: 42,
    labelPosition: { left: '48%', top: '40%' },
    relatedLangs: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'system',
    title: 'System I Built',
    recruiterQuestion: 'How is the system built?',
    metric: 'WebSocket -> VAD -> ASR -> LLM',
    proof: ['Full-duplex audio stream orchestration across multiple models.'],
    anchor: blend(EN, TE, 0.54),
    radius: 2.0,
    color: '#ffcf77',
    fov: 35,
    labelPosition: { left: '45%', top: '50%' },
    relatedLangs: ['EN', 'TE'],
  },
  {
    id: 'build',
    title: 'Build',
    recruiterQuestion: 'What components run the pipeline?',
    metric: 'FastAPI, Redis, Kubernetes',
    proof: ['Distributed, containerized services handle audio, intent, and sync.'],
    anchor: CENTER,
    radius: 4.6,
    color: '#d6b6ff',
    fov: 37,
    labelPosition: { left: '39%', top: '26%' },
    relatedLangs: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'challenge',
    title: 'Hard Technical Challenge',
    recruiterQuestion: 'What was the hardest engineering constraint?',
    metric: '7s -> <500ms TTFB',
    proof: ['Pipelining ASR and LLM execution collapsed first-byte response time.'],
    anchor: blend(EN, TA, 0.42),
    radius: 1.65,
    color: '#78b8ff',
    fov: 34,
    labelPosition: { left: '31%', top: '44%' },
    relatedLangs: ['EN', 'TA'],
  },
  {
    id: 'proof',
    title: 'Proof of Execution',
    recruiterQuestion: 'What proves it shipped?',
    metric: '68 Days, 5 Languages',
    proof: ['One core flow handles English, Hindi, Tamil, Kannada, and Telugu.'],
    anchor: [0.05, 0.1, 1.42],
    radius: 1.75,
    color: '#a48cff',
    fov: 33,
    labelPosition: { left: '50%', top: '45%' },
    relatedLangs: ['EN', 'HI', 'TA', 'KN', 'TE'],
  },
  {
    id: 'reflection',
    title: 'Reflection',
    recruiterQuestion: 'What changed and what would improve next?',
    metric: 'Operational actions, not transcripts',
    proof: ['CRM sync and WhatsApp automation turned calls into actionable workflows.'],
    anchor: blend(HI, KN, 0.35),
    radius: 2.25,
    color: '#ffc56f',
    fov: 34,
    labelPosition: { left: '67%', top: '35%' },
    relatedLangs: ['HI', 'KN'],
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
  if (id === 'proof') return knotAnchor(activeLang);
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
