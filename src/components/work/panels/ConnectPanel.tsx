import { panelCopy } from '@/lib/copy';
import { panelHues } from '@/lib/design-tokens';
import { workPanelDetails } from '@/lib/work-panel-data';

import styles from './FinalePanels.module.css';

type ConnectLink = (typeof panelCopy.W09_CONNECT.links)[number];

function isExternalLink(link: ConnectLink): boolean {
  return link.href.startsWith('http');
}

function linkByLabel(label: ConnectLink['label']): ConnectLink {
  const link = panelCopy.W09_CONNECT.links.find((item) => item.label === label);
  if (!link) throw new Error(`Missing ${label} contact link`);
  return link;
}

function secondaryLinks(): readonly ConnectLink[] {
  return panelCopy.W09_CONNECT.links.filter((link) => link.label !== 'EMAIL');
}

function HandoffLink({ link, index }: { link: ConnectLink; index: number }): React.JSX.Element {
  const external = isExternalLink(link);
  return (
    <a
      aria-label={`${link.label.toLowerCase()} contact path`}
      className={`${styles.secondaryLink} ${styles.staggerReveal}`}
      style={{ '--stagger-index': index + 1 } as React.CSSProperties}
      href={link.href}
      rel={external ? 'noopener noreferrer' : undefined}
      target={external ? '_blank' : undefined}
    >
      <span>{link.label}</span>
      <small>{external ? 'External profile' : 'Direct message'}</small>
    </a>
  );
}

function SignalHeader({ titleId }: { titleId: string }): React.JSX.Element {
  const copy = panelCopy.W09_CONNECT;
  const detail = workPanelDetails.W09_CONNECT;

  return (
    <>
      <p className={styles.eyebrow}>
        <span>{copy.number}</span>
        {copy.eyebrow}
      </p>
      <h1 className={styles.signalTitle} id={titleId}>{copy.title}</h1>
      {copy.body && <p className={styles.connectLead}>{copy.body}</p>}
      {detail.lead && <p className={styles.connectBody}>{detail.lead}</p>}
      {detail.role && <p className={styles.connectBody}>{detail.role}</p>}
    </>
  );
}

function PrimaryEmailLink(): React.JSX.Element {
  const email = linkByLabel('EMAIL');

  return (
    <a 
      className={`${styles.primaryCta} ${styles.staggerReveal}`} 
      style={{ '--stagger-index': 0 } as React.CSSProperties}
      href={email.href}
    >
      <span>Email Danush</span>
      <strong>danusharun999@gmail.com</strong>
    </a>
  );
}

function SecondaryLinks(): React.JSX.Element {
  return (
    <div className={styles.secondaryGrid} aria-label="Secondary handoff links">
      {secondaryLinks().map((link, i) => <HandoffLink key={link.label} link={link} index={i} />)}
    </div>
  );
}

function ClosingQuote(): React.JSX.Element {
  return (
    <div 
      className={`${styles.nextStep} ${styles.staggerReveal}`} 
      style={{ '--stagger-index': 4 } as React.CSSProperties}
      aria-label="Alan Kay quote"
    >
      <span>Alan Kay</span>
      <strong>The best way to predict the future is to invent it.</strong>
    </div>
  );
}

export default function ConnectPanel(): React.JSX.Element {
  const hue = panelHues.W09_CONNECT;
  const titleId = 'w09_connect-title';

  return (
    <section
      aria-labelledby={titleId}
      className={`${styles.root} ${styles.connectRoot}`}
      style={{
        '--panel-accent': hue.accent,
        '--panel-primary': hue.primary,
      } as React.CSSProperties}
    >
      <div className={styles.signalFrame}>
        <SignalHeader titleId={titleId} />
        <PrimaryEmailLink />
        <SecondaryLinks />
        <ClosingQuote />
      </div>
    </section>
  );
}
