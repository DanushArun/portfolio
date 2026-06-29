'use client';

export default function EmergeIndicator() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-composer)',
        fontSize: '12px',
        letterSpacing: '0.16em',
        color: 'rgba(240, 228, 210, 0.6)',
        textTransform: 'uppercase',
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: '16px', animation: 'bounce 2s infinite' }}>↑</span>
      <span>Projects</span>
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          60% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
