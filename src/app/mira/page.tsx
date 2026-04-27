import Link from 'next/link';

const MONO: React.CSSProperties = {
  fontFamily:    'var(--font-space-mono, monospace)',
  fontSize:      '9px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  color:         'rgba(232,228,216,0.4)',
};

const SECTION: React.CSSProperties = {
  borderTop:  '1px solid rgba(232,228,216,0.08)',
  paddingTop: '3rem',
  marginTop:  '3rem',
};

const METRICS = [
  { label: 'End-to-end latency', value: '92ms',            accent: true  },
  { label: 'Environment',        value: 'Production',       accent: false },
  { label: 'Domain',             value: 'Lead Conversion',  accent: false },
  { label: 'Model integration',  value: 'Multi-LLM',        accent: false },
];

const STACK = [
  { layer: 'Voice pipeline', tech: 'Pipecat'             },
  { layer: 'Transport',      tech: 'WebSockets'           },
  { layer: 'API layer',      tech: 'FastAPI'              },
  { layer: 'LLM routing',    tech: 'Multi-model'          },
  { layer: 'Deployment',     tech: 'Production · DriveX'  },
];

export default function MiraPage() {
  return (
    <main
      style={{
        background: '#0B0D10',
        minHeight:  '100vh',
        color:      '#E8E4D8',
        fontFamily: 'var(--font-space-grotesk, sans-serif)',
        padding:    'clamp(2rem, 6vw, 6rem) clamp(1.5rem, 8vw, 12rem)',
        maxWidth:   '1200px',
        margin:     '0 auto',
      }}
    >
      <Link
        href="/"
        style={{
          ...MONO,
          color:          'rgba(232,228,216,0.25)',
          textDecoration: 'none',
          display:        'block',
          marginBottom:   '4rem',
        }}
      >
        ← DANUSH ARUN
      </Link>

      <div style={MONO}>01 · MIRA · VOICE AI AGENT</div>
      <h1
        style={{
          fontFamily:    'var(--font-syne, serif)',
          fontWeight:    800,
          fontSize:      'clamp(2.4rem, 6vw, 5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          lineHeight:    1,
          margin:        '1rem 0 0.5rem',
          color:         '#E8E4D8',
        }}
      >
        Mira
      </h1>
      <div style={{ ...MONO, color: 'rgba(232,228,216,0.55)', fontSize: '10px' }}>
        Real-time agentic conversation · Production at DriveX · 2025
      </div>

      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap:                 '2px',
          marginTop:           '4rem',
        }}
      >
        {METRICS.map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              background: 'rgba(232,228,216,0.03)',
              padding:    '1.5rem 2rem',
              border:     '1px solid rgba(232,228,216,0.06)',
            }}
          >
            <div style={MONO}>{label}</div>
            <div
              style={{
                fontFamily: 'var(--font-syne, serif)',
                fontWeight: 800,
                fontSize:   'clamp(1.4rem, 2.5vw, 2rem)',
                marginTop:  '0.5rem',
                color:      accent ? '#B8FF3C' : '#E8E4D8',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={SECTION}>
        <div style={MONO}>The Problem</div>
        <p
          style={{
            fontSize:   'clamp(1rem, 1.5vw, 1.2rem)',
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth:   '72ch',
            marginTop:  '1.5rem',
            color:      'rgba(232,228,216,0.75)',
          }}
        >
          DriveX runs high-volume sales operations. Lead qualification was manual, slow, and
          inconsistent. Voice AI agents existed but consistently failed at sub-200ms latency —
          too slow for natural conversation. The system needed to feel like talking to a human
          expert, not a chatbot.
        </p>
      </div>

      <div style={SECTION}>
        <div style={MONO}>Technical Stack</div>
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap:                 '2px',
            marginTop:           '1.5rem',
          }}
        >
          {STACK.map(({ layer, tech }) => (
            <div
              key={layer}
              style={{ padding: '1rem 1.5rem', border: '1px solid rgba(232,228,216,0.06)' }}
            >
              <div style={MONO}>{layer}</div>
              <div
                style={{
                  fontFamily:    'var(--font-space-mono, monospace)',
                  fontSize:      '11px',
                  letterSpacing: '0.15em',
                  color:         '#E8E4D8',
                  marginTop:     '0.4rem',
                }}
              >
                {tech}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={SECTION}>
        <div style={MONO}>Result</div>
        <p
          style={{
            fontSize:   'clamp(1rem, 1.5vw, 1.2rem)',
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth:   '72ch',
            marginTop:  '1.5rem',
            color:      'rgba(232,228,216,0.75)',
          }}
        >
          Sub-100ms end-to-end latency in production. Handles real-time lead qualification
          and finance appointment booking. Integrated into DriveX operations pipeline.
          Architecture is replicable across voice-driven conversion systems.
        </p>
        <div style={{ marginTop: '2rem', ...MONO, color: '#B8FF3C', fontSize: '10px' }}>
          SUB-100MS · PRODUCTION GRADE · REAL-TIME CONVERSION
        </div>
      </div>

      <div
        style={{
          ...SECTION,
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
        }}
      >
        <Link
          href="/"
          style={{ ...MONO, color: 'rgba(232,228,216,0.35)', textDecoration: 'none' }}
        >
          ← BACK TO SINGULARITY
        </Link>
        <a
          href="https://github.com/DanushArun"
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...MONO, color: 'rgba(232,228,216,0.35)', textDecoration: 'none' }}
        >
          GITHUB ↗
        </a>
      </div>
    </main>
  );
}
