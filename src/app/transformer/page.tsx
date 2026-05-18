import Link from 'next/link';
import TransformerViz from '@/components/transformer/TransformerViz';

export default function TransformerPage() {
  return (
    <main style={{
      background: 'var(--color-void)',
      minHeight: '100vh',
      color: 'var(--color-cream)',
      fontFamily: 'var(--font-composer), monospace',
      padding: 'clamp(1.5rem, 3vw, 3rem) clamp(1rem, 4vw, 4rem)',
      position: 'relative',
      zIndex: 10,
    }}>
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-composer), monospace',
          fontSize: '10px', letterSpacing: '0.18em',
          color: 'rgba(240,228,210,0.25)',
          textDecoration: 'none', display: 'block',
          marginBottom: '2.5rem', position: 'relative', zIndex: 1,
        }}
      >
        ← DANUSH ARUN
      </Link>

      <div style={{
        marginBottom: '2rem', position: 'relative', zIndex: 1,
        maxWidth: '960px', margin: '0 auto 2rem',
      }}>
        <div style={{
          fontFamily: 'var(--font-composer), monospace',
          fontSize: '9px', letterSpacing: '0.25em',
          color: 'rgba(255,168,92,0.6)',
          marginBottom: '0.4rem',
        }}>
          TRANSFORMER INFERENCE PIPELINE
        </div>
        <h1 style={{
          fontFamily: 'var(--font-composer), monospace',
          fontWeight: 400, fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)',
          letterSpacing: '0.01em', lineHeight: 1.2,
          color: 'var(--color-cream)',
        }}>
          How a Transformer Calculates<br />
          <span style={{ color: 'rgba(255,168,92,0.85)' }}>
            Next-Token Probabilities
          </span>
        </h1>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <TransformerViz />
      </div>
    </main>
  );
}
