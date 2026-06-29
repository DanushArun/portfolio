import { panelCopy } from '@/lib/copy';
import { panelHues } from '@/lib/design-tokens';
import { workPanelDetails, type WorkPanelMetric } from '@/lib/work-panel-data';

import styles from './FinalePanels.module.css';



function MetricStrip({ metrics }: { metrics: readonly WorkPanelMetric[] }): React.JSX.Element {
  return (
    <div className={styles.metricStrip} aria-label="Engineer profile">
      {metrics.map((metric, index) => (
        <div 
          className={`${styles.metricCell} ${styles.staggerReveal}`} 
          style={{ '--stagger-index': index } as React.CSSProperties}
          key={metric.label}
        >
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}



function SkillCloud({ skills }: { skills: readonly string[] }): React.JSX.Element {
  return (
    <div className={styles.skillCloud} aria-label="Skill areas">
      {skills.map((skill, index) => (
        <span 
          key={skill}
          className={styles.staggerReveal}
          style={{ '--stagger-index': 7 + (index % 5) } as React.CSSProperties}
        >
          {skill}
        </span>
      ))}
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


        <SkillCloud skills={copy.skills} />
      </div>
    </section>
  );
}
