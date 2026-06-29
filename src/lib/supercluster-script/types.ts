import type { PortfolioChapterId } from '@/lib/portfolio-book';

export type SuperclusterBehavior =
  | 'condense'
  | 'route'
  | 'carve'
  | 'pulse'
  | 'shear'
  | 'rejoin';

export type SuperclusterComplexity = 'low' | 'medium' | 'high' | 'very-high';

export interface SuperclusterTiming {
  readonly cameraLeadMs: number;
  readonly chapterExitPullbackFov: number;
  readonly entryExtractMs: number;
  readonly entryLocateMs: number;
  readonly exitPulseMs: number;
  readonly exitRejoinMs: number;
  readonly exitShearMs: number;
  readonly morphMs: { readonly max: number; readonly min: number };
  readonly proofFadeInDelayMs: number;
  readonly proofFadeOutLeadMs: number;
  readonly wavefieldTransformMinMs: number;
}

export interface SuperclusterColorIdentity {
  readonly emotion: string;
  readonly primary: string;
  readonly secondary: string;
}

export interface SuperclusterDot {
  readonly answer: string;
  readonly behaviors: readonly SuperclusterBehavior[];
  readonly body: string;
  readonly camera: string;
  readonly id: string;
  readonly label: string;
  readonly question: string;
  readonly tags: readonly string[];
  readonly title: string;
  readonly visual: string;
}

export interface SuperclusterChapter {
  readonly catalogueLabel: string;
  readonly colors: SuperclusterColorIdentity;
  readonly complexity: SuperclusterComplexity;
  readonly dotCount: number;
  readonly dots: readonly SuperclusterDot[];
  readonly id: PortfolioChapterId;
  readonly mostDemandingDotId: string;
  readonly particlePoolPercent: number;
  readonly title: string;
}
