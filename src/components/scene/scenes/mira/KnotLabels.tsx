import { Html } from '@react-three/drei';

import { MIRA_LABEL_OFFSETS } from '@/lib/mira-canonical';
import { KNOTS_W, NATIVE_SCRIPT, type KnotW } from './knot-config';

interface KnotLabelsProps {
  reveal: number;
}

function labelPosition(knot: KnotW): [number, number, number] {
  const offset = MIRA_LABEL_OFFSETS[knot.lang];
  return [
    knot.pos[0] + offset[0],
    knot.pos[1] + offset[1],
    knot.pos[2] + offset[2],
  ];
}

function labelOpacity(reveal: number): number {
  if (reveal <= 0.84) return 0;
  return Math.min(1, (reveal - 0.84) / 0.12);
}

export function KnotLabels({ reveal }: KnotLabelsProps): React.JSX.Element {
  const opacity = labelOpacity(reveal);

  return (
    <>
      {KNOTS_W.map((knot) => (
        <Html
          center
          distanceFactor={9}
          key={knot.lang}
          position={labelPosition(knot)}
          style={{ opacity, pointerEvents: 'none', transition: 'opacity 180ms ease' }}
          zIndexRange={[10, 0]}
        >
          <div
            style={{
              color: 'rgba(240, 228, 210, 0.86)',
              fontFamily: 'var(--font-dop), Georgia, Cambria, "Times New Roman", serif',
              lineHeight: 1,
              textAlign: 'center',
              textShadow: '0 0 12px rgba(0, 0, 0, 0.82)',
            }}
          >
            <div style={{ fontSize: 22, letterSpacing: 0 }}>{knot.lang}</div>
            <div
              style={{
                borderTop: '1px solid rgba(240, 228, 210, 0.34)',
                fontFamily: 'var(--font-composer), ui-monospace, monospace',
                fontSize: 9,
                letterSpacing: '0.08em',
                marginTop: 4,
                paddingTop: 3,
              }}
            >
              {NATIVE_SCRIPT[knot.lang]}
            </div>
          </div>
        </Html>
      ))}
    </>
  );
}
