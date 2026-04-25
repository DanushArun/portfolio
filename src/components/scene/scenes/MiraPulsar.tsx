'use client';

/**
 * MiraPulsar — Act II: The Clockwork.
 *
 * Neutron star spinning at center, beam SNAPS every 92ms (not sweeps —
 * hard flash, exponential decay). Data lines hard-cut into frame on each beat.
 * Spacebar/click fires a manual pulse. On unmount, pulsarActive stays true
 * so downstream scenes can use the 92ms metronome.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const BEAT_S  = 0.092;   // seconds between beats
const BEAM_S  = 0.080;   // beam visible duration

const DATA_LINES = [
  { label: 'SYSTEM',   value: 'MIRA — VOICE AI AGENT',        accent: false },
  { label: 'LATENCY',  value: '92ms · END TO END',             accent: true  },
  { label: 'STACK',    value: 'PIPECAT · WEBSOCKETS · FASTAPI',accent: false },
  { label: 'FUNCTION', value: 'REAL-TIME LEAD CONVERSION',     accent: false },
  { label: 'FUNCTION', value: 'FINANCE APPOINTMENT BOOKING',   accent: false },
  { label: 'RESULT',   value: 'SUB-100MS · PRODUCTION GRADE',  accent: true  },
];

const BEAM_FRAG = /* glsl */ `
uniform float uAlpha;
void main() { gl_FragColor = vec4(0.52, 0.80, 1.0, uAlpha); }
`;
const PLAIN_VERT = /* glsl */ `
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

function StarScene({ onBeat }: { onBeat: () => void }) {
  const starRef    = useRef<THREE.Mesh>(null);
  const lightRef   = useRef<THREE.PointLight>(null);
  const lastBeat   = useRef(0);
  const lastBeamOn = useRef(-1);
  const manual     = useRef(false);
  const beamUni    = useMemo(() => ({ uAlpha: { value: 0.0 } }), []);
  const beamGeo    = useMemo(() => new THREE.BoxGeometry(80, 0.06, 0.06), []);

  useFrame((state) => {
    const t  = state.clock.elapsedTime;
    const fire = (t - lastBeat.current >= BEAT_S) || manual.current;
    if (fire) {
      lastBeat.current   = t;
      lastBeamOn.current = t;
      manual.current     = false;
      onBeat();
    }

    const age = t - lastBeamOn.current;
    const a   = age < BEAM_S ? Math.exp(-age / (BEAM_S * 0.28)) * 0.92 : 0.0;
    beamUni.uAlpha.value            = a;
    if (lightRef.current) lightRef.current.intensity = a * 7;
    if (starRef.current)  starRef.current.rotation.y += 0.045;
  });

  useEffect(() => {
    const onKey   = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); manual.current = true; } };
    const onClick = () => { manual.current = true; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click',   onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click',   onClick);
    };
  }, []);

  return (
    <>
      <ambientLight intensity={0.04} color="#001122" />
      <directionalLight position={[10, 5, 8]} color="#2255aa" intensity={0.7} />
      <pointLight ref={lightRef} position={[0, 0, 0]} color="#88ccff" intensity={0} distance={55} />

      <mesh ref={starRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#8B3A1A" emissive="#C84B20" emissiveIntensity={2.5} roughness={0.7} />
      </mesh>

      <mesh geometry={beamGeo}>
        <shaderMaterial
          vertexShader={PLAIN_VERT}
          fragmentShader={BEAM_FRAG}
          uniforms={beamUni}
          transparent depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// DOM overlay — exported so SceneManager can mount it outside the Canvas
export function MiraPulsarOverlay() {
  const beats = useScene((s) => s.pulsarBeat);
  const n = Math.min(beats, DATA_LINES.length);
  return (
    <div style={{
      position: 'fixed', bottom: '14vh', left: '4vw',
      zIndex: 15, fontFamily: 'var(--font-mono, monospace)',
      fontSize: 11, letterSpacing: '0.22em', lineHeight: 2.0,
      pointerEvents: 'none', textTransform: 'uppercase',
    }}>
      {DATA_LINES.slice(0, n).map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: '1.5em' }}>
          <span style={{ color: 'rgba(232,228,216,0.35)', minWidth: '7em' }}>{l.label}</span>
          <span style={{ color: l.accent ? '#B8FF3C' : '#E8E4D8' }}>{l.value}</span>
        </div>
      ))}
      {n > 0 && n < DATA_LINES.length && (
        <span style={{ color: 'rgba(232,228,216,0.45)' }}>▋</span>
      )}
    </div>
  );
}

// Canvas component — pure Three.js only, no DOM elements
export default function MiraPulsar() {
  const tickPulsar = useScene((s) => s.tickPulsar);

  useEffect(() => {
    useScene.setState({ pulsarActive: true });
  }, []);

  return <StarScene onBeat={tickPulsar} />;
}
