import { panelCopy } from '@/lib/copy';
import { panelHues } from '@/lib/design-tokens';
import { workPanelDetails, type WorkPanelMetric } from '@/lib/work-panel-data';

import styles from './FinalePanels.module.css';

const OPERATING_LOOP = [
  {
    title: 'Find the bottleneck',
    body: 'Start from the real constraint: latency, handoff quality, reliability or proof.',
  },
  {
    title: 'Build the system',
    body: 'Turn the constraint into services, product surfaces and tests that operators can use.',
  },
  {
    title: 'Defend the tradeoff',
    body: 'Explain what shipped, what was rejected, where it fails and what improves next.',
  },
] as const;

function MetricStrip({ metrics }: { metrics: readonly WorkPanelMetric[] }): React.JSX.Element {
  return (
    <div className={styles.metricStrip} aria-label="Engineer profile">
      {metrics.map((metric) => (
        <div className={styles.metricCell} key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}

function OperatingLoop(): React.JSX.Element {
  return (
    <div className={styles.loopGrid} aria-label="Operating loop">
      {OPERATING_LOOP.map((beat, index) => (
        <article className={styles.loopCard} key={beat.title}>
          <span className={styles.loopIndex}>0{index + 1}</span>
          <h2>{beat.title}</h2>
          <p>{beat.body}</p>
        </article>
      ))}
    </div>
  );
}

function ProofRail({ proof }: { proof: readonly string[] }): React.JSX.Element {
  return (
    <ul className={styles.proofRail} aria-label="Proof points">
      {proof.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function SkillCloud({ skills }: { skills: readonly string[] }): React.JSX.Element {
  return (
    <div className={styles.skillCloud} aria-label="Skill areas">
      {skills.map((skill) => <span key={skill}>{skill}</span>)}
    </div>
  );
}

export default function AboutPanel(): React.JSX.Element {
  const copy = panelCopy.W08_ABOUT;
  const detail = workPanelDetails.W08_ABOUT;
  const hue = panelHues.W08_ABOUT;
  const titleId = 'w08_about-title';

  return (
    <section
      aria-labelledby={titleId}
      className={`${styles.root} ${styles.aboutRoot}`}
      style={{
        '--panel-accent': hue.accent,
        '--panel-primary': hue.primary,
      } as React.CSSProperties}
    >
      <div className={styles.heroBlock}>
        <p className={styles.eyebrow}>
          <span>{copy.number}</span>
          {copy.eyebrow}
        </p>
        <h1 className={styles.title} id={titleId}>{copy.title}</h1>
        <p className={styles.lead}>{detail.lead}</p>
        <p className={styles.body}>{copy.body}</p>
        <p className={styles.body}>{detail.role}</p>
      </div>

      <div className={styles.aboutDetail}>
        <MetricStrip metrics={detail.metrics} />
        <OperatingLoop />
        <ProofRail proof={detail.proof} />
        <SkillCloud skills={copy.skills} />
      </div>
    </section>
  );
}
