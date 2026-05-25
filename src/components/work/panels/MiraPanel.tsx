'use client';

import type { CSSProperties } from 'react';

import { MIRA_CALLOUTS, MIRA_RAIL } from '@/lib/mira-canonical';
import { panelCopy } from '@/lib/copy';
import {
  KNOT_TABLE,
  setActiveLang,
  setHoverLang,
  useMiraState,
  type MiraLang,
} from '@/lib/mira-state';
import styles from './MiraPanel.module.css';

const LANG_ORDER: readonly MiraLang[] = ['EN', 'HI', 'TA', 'KN', 'TE'];

export default function MiraPanel(): React.JSX.Element {
  const activeLang = useMiraState((s) => s.activeLang);

  return (
    <section className={styles.root} aria-label="MIRA Virgo Linguistic Supercluster">
      <Metadata />
      <TitleBlock />
      <LanguageLegend activeLang={activeLang} />
      <CalloutStack />
      <InteractionRail />
    </section>
  );
}

function Metadata(): React.JSX.Element {
  return (
    <>
      <div className={styles.metaLeft} aria-hidden="true">
        <span>VLS-001</span>
        <span>MIRA</span>
        <span>ONLINE</span>
        <span>RA 12h 35m</span>
        <span>DEC -05° 12&apos;</span>
        <span>Z = 0.0067</span>
      </div>
      <div className={styles.metaRight} aria-hidden="true">AUDIO OFF ✣✧</div>
    </>
  );
}

function TitleBlock(): React.JSX.Element {
  const copy = panelCopy.W01_MIRA;

  return (
    <div className={styles.titleBlock}>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.subtitle}>Virgo Linguistic Supercluster</p>
      <p className={styles.body}>
        Real-time voice AI agent that listens, understands
        <br />
        and responds in 5 languages.
        <br />
        English and 4 South Indian regional languages —
        <br />
        at sub-100ms latency.
      </p>
    </div>
  );
}

function LanguageLegend({ activeLang }: { activeLang: MiraLang }): React.JSX.Element {
  return (
    <div className={styles.legend} aria-label="MIRA language knots">
      {KNOT_TABLE.map((knot) => (
        <button
          aria-pressed={activeLang === knot.lang}
          className={styles.legendRow}
          key={knot.lang}
          onBlur={() => setHoverLang(null)}
          onClick={() => setActiveLang(knot.lang)}
          onFocus={() => setHoverLang(knot.lang)}
          onPointerEnter={() => setHoverLang(knot.lang)}
          onPointerLeave={() => setHoverLang(null)}
          style={{ '--mira-color': knot.hue } as CSSProperties}
          type="button"
        >
          <span className={styles.legendDot} />
          <span className={styles.legendCode}>{knot.lang}</span>
          <span className={styles.legendName}>{panelCopy.W01_MIRA.languages[langIndex(knot.lang)]}</span>
        </button>
      ))}
    </div>
  );
}

function CalloutStack(): React.JSX.Element {
  return (
    <div className={styles.callouts} aria-hidden="true">
      {MIRA_CALLOUTS.map((callout) => (
        <div
          className={`${styles.callout} ${styles[callout.placement]}`}
          key={callout.label}
        >
          <span className={styles.calloutRule} />
          <span className={styles.calloutLabel}>{callout.label}</span>
          <span className={styles.calloutDetail}>{callout.detail}</span>
        </div>
      ))}
    </div>
  );
}

function InteractionRail(): React.JSX.Element {
  return (
    <div className={styles.rail} aria-hidden="true">
      {MIRA_RAIL.map((label, index) => (
        <span className={styles.railItem} key={label}>
          <span className={index === 3 ? styles.railSquare : styles.railGlyph} />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

function langIndex(lang: MiraLang): number {
  return LANG_ORDER.indexOf(lang);
}
