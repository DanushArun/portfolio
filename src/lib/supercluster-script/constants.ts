import type {
  SuperclusterBehavior,
  SuperclusterColorIdentity,
  SuperclusterTiming,
} from './types';

export const SUPERCLUSTER_PARTICLE_FIELD = {
  ambientBaseColor: '#0A1628',
  chapterPoolPercentRange: { max: 18, min: 10 },
  desktop: 800_000,
  goldTraceColor: '#C9A84C',
  mobile: 200_000,
  starPointRatio: 0.001,
} as const;

export const SUPERCLUSTER_TIMING: SuperclusterTiming = {
  cameraLeadMs: 200,
  chapterExitPullbackFov: 0.5,
  entryExtractMs: 1000,
  entryLocateMs: 2000,
  exitPulseMs: 500,
  exitRejoinMs: 1200,
  exitShearMs: 800,
  morphMs: { max: 1200, min: 800 },
  proofFadeInDelayMs: 400,
  proofFadeOutLeadMs: 200,
  wavefieldTransformMinMs: 1500,
};

export const SUPERCLUSTER_BEHAVIORS: readonly SuperclusterBehavior[] = [
  'condense',
  'route',
  'carve',
  'pulse',
  'shear',
  'rejoin',
];

export const SUPERCLUSTER_ENTRY_SEQUENCE = [
  'locate',
  'pulse',
  'extract',
  'beat-1',
] as const;

export const SUPERCLUSTER_EXIT_SEQUENCE = [
  'pulse',
  'shear',
  'rejoin',
  'travel',
] as const;

export const SUPERCLUSTER_CHAPTER_COLORS = {
  AIDEN: {
    emotion: 'Data, conversation, clarity',
    primary: '#00D4FF',
    secondary: '#A8D8FF',
  },
  EMI: {
    emotion: 'Electromagnetic, physics',
    primary: '#9FE870',
    secondary: '#00FFD1',
  },
  FORMULA: {
    emotion: 'Competition, achievement',
    primary: '#FF2400',
    secondary: '#FFD700',
  },
  INSPECTION: {
    emotion: 'Sweep, heat, evidence',
    primary: '#A8D8FF',
    secondary: '#FF4500',
  },
  MIRA: {
    emotion: 'Signal, warmth, voice',
    primary: '#C9A84C',
    secondary: '#FF9500',
  },
  VANGUARD: {
    emotion: 'Test, fail, reroute',
    primary: '#8B2FC9',
    secondary: '#00FF7F',
  },
  WAVEFIELD: {
    emotion: 'Mathematics, abstraction',
    primary: '#7B2FBE',
    secondary: '#4A0080',
  },
} as const satisfies Record<string, SuperclusterColorIdentity>;
