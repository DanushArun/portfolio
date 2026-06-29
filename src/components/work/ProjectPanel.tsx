'use client';

import { panelCopy } from '@/lib/copy';
import { panelHues } from '@/lib/design-tokens';
import { workPanelDetails, type WorkPanelMetric } from '@/lib/work-panel-data';
import type { PortfolioProjectPhase } from '@/lib/portfolio-book';

import styles from './ProjectPanel.module.css';

type ProjectPanelProps = Readonly<{
  phaseId: PortfolioProjectPhase;
}>;

function MetricRow({ metrics }: { metrics: readonly WorkPanelMetric[] }): React.JSX.Element {
  return (
    <div className={styles.metricGrid}>
      {metrics.map((metric) => (
        <div className={styles.metric} key={metric.label}>
          <div className={styles.label}>{metric.label}</div>
          <div className={styles.value}>{metric.value}</div>
        </div>
      ))}
    </div>
  );
}

function ProofList({ proof }: { proof: readonly string[] }): React.JSX.Element {
  return (
    <div className={styles.proof}>
      <div className={styles.label}>Proof</div>
      <ul className={styles.proofList}>
        {proof.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function StackList({ stack }: { stack: readonly string[] }): React.JSX.Element {
  return (
    <div className={styles.stack}>
      <div className={styles.label}>Stack</div>
      <div className={styles.chipRow}>
        {stack.map((item) => <span className={styles.chip} key={item}>{item}</span>)}
      </div>
    </div>
  );
}

export default function ProjectPanel({ phaseId }: ProjectPanelProps): React.JSX.Element {
  const copy = panelCopy[phaseId];
  const detail = workPanelDetails[phaseId];
  const hue = panelHues[phaseId];
  const titleId = `${phaseId.toLowerCase()}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={styles.root}
      style={{
        '--panel-accent': hue.accent,
        '--panel-primary': hue.primary,
      } as React.CSSProperties}
    >
      <div className={styles.identity}>
        <div className={styles.eyebrow}>
          <span className={styles.number}>{copy.number}</span>
          <span>{copy.eyebrow}</span>
        </div>
        <h1 className={styles.title} id={titleId}>{copy.title}</h1>
        <p className={styles.lead}>{detail.lead}</p>
        <p className={styles.body}>{copy.body}</p>
        <p className={styles.body}>{detail.role}</p>
        <div className={styles.trail} aria-label="Project flow">
          {copy.trail.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>

      <div className={styles.detail}>
        <MetricRow metrics={detail.metrics} />
        <ProofList proof={detail.proof} />
        <StackList stack={detail.stack} />
      </div>
    </section>
  );
}
