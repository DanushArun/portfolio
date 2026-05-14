import { Html } from '@react-three/drei';
import { KNOTS_W, NATIVE_SCRIPT } from './knot-config';

export function KnotLabels({ reveal }: { reveal: number }) {
  return (
    <>
      {KNOTS_W.map((k) => (
        <Html
          key={k.lang}
          position={[k.pos[0], k.pos[1], k.pos[2]]}
          center
          distanceFactor={10}
          zIndexRange={[10, 0]}
          style={{
            pointerEvents: 'none',
            opacity: reveal > 0.85 ? (reveal - 0.85) / 0.15 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <div className="mira-knot-label" style={{ textAlign: 'center', color: 'white', textShadow: '0 0 4px black' }}>
            <div className="lang" style={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'monospace' }}>{k.lang}</div>
            <div className="script" style={{ fontSize: '14px', marginTop: '2px' }}>{NATIVE_SCRIPT[k.lang]}</div>
          </div>
        </Html>
      ))}
    </>
  );
}
