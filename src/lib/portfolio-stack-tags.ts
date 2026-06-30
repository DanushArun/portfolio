import type { PortfolioStackTag } from './portfolio-book';

interface StackTagConfig {
  readonly description: string;
  readonly metric: string;
  readonly title: string;
}

const TAG_DETAIL_OVERRIDES: Readonly<Record<string, string>> = {
  'Voice AI':
    'Used for outbound qualification: live speech, lead intent, and response timing ' +
    'run as one loop.',
};

function tagDetail(label: string, config: StackTagConfig): string {
  const override = TAG_DETAIL_OVERRIDES[label];
  if (override) return override;
  return `${label} supported ${config.title}: ${config.metric}. ${config.description}`;
}

export function stackTags(
  labels: readonly string[],
  config: StackTagConfig,
): readonly PortfolioStackTag[] {
  return labels.map((label) => ({
    detail: tagDetail(label, config),
    label,
  }));
}
