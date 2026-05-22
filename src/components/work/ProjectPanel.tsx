'use client';

import type { WorkPhase } from '@/lib/scene-state';
import { panelCopy } from '@/lib/copy';
import { panelHues } from '@/lib/design-tokens';
import { workPanelDetails, type WorkPanelMetric } from '@/lib/work-panel-data';

import styles from './ProjectPanel.module.css';

type ProjectPanelProps = Readonly<{
  phaseId: WorkPhase;
}>;

type ConnectLink = Readonly<{
  label: string;
  href: string;
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

function getConnectLinks(phaseId: WorkPhase): readonly ConnectLink[] {
  if (phaseId !== 'W09_CONNECT') return [];
  return panelCopy.W09_CONNECT.links;
}

function LinkList({ links }: { links: readonly ConnectLink[] }): React.JSX.Element | null {
  if (links.length === 0) return null;
  return (
    <div className={styles.links}>
      <div className={styles.label}>Handoff</div>
      <div className={styles.linkRow}>
        {links.map((link) => {
          const external = link.href.startsWith('http');
          return (
            <a
              className={styles.link}
              href={link.href}
              key={link.label}
              rel={external ? 'noopener noreferrer' : undefined}
              target={external ? '_blank' : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectPanel({ phaseId }: ProjectPanelProps): React.JSX.Element {
  const copy = panelCopy[phaseId];
  const detail = workPanelDetails[phaseId];
  const hue = panelHues[phaseId];
  const titleId = `${phaseId.toLowerCase()}-title`;
  const links = getConnectLinks(phaseId);

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
        <LinkList links={links} />
      </div>
    </section>
  );
}
