'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

const TOKENS = ['The', 'quick', 'brown', 'fox'];
const HUES = [30, 170, 210, 340];
const STAGES = [
  { id: 'tokenize', label: '01', title: 'TOKENIZE', desc: 'Split text into discrete tokens' },
  { id: 'embed', label: '02', title: 'EMBED', desc: 'Map tokens to dense vectors' },
  { id: 'attention', label: '03', title: 'SELF-ATTENTION', desc: 'Tokens communicate via Q·K·V' },
  { id: 'ffn', label: '04', title: 'FEED-FORWARD', desc: 'Independent MLP transformation' },
  { id: 'output', label: '05', title: 'OUTPUT', desc: 'Project to vocabulary distribution' },
] as const;

type StageId = typeof STAGES[number]['id'];

function TokenNode({ position, token, hue, isActive }: {
  position: [number, number, number];
  token: string;
  hue: number;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
  });

  return (
    <group position={position}>
      {/* Glow sphere */}
      <mesh ref={glowRef} scale={isActive ? 1.3 : 1}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color={`hsl(${hue}, 70%, 60%)`}
          transparent
          opacity={isActive ? 0.2 : 0.05}
        />
      </mesh>

      {/* Main token sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={`hsl(${hue}, 60%, 50%)`}
          roughness={0.2}
          metalness={0.8}
          emissive={`hsl(${hue}, 60%, 30%)`}
          emissiveIntensity={isActive ? 0.5 : 0.1}
        />
      </mesh>

      {/* Token label */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.2}
        color="#F0E4D2"
        anchorX="center"
        anchorY="middle"
      >
        {token}
      </Text>
    </group>
  );
}

function EmbeddingBars({ position, token, hue, isActive }: {
  position: [number, number, number];
  token: string;
  hue: number;
  isActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const barCount = 8;
  const barWidth = 0.1;
  const barSpacing = 0.15;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: barCount }).map((_, i) => {
        const height = 0.4 + Math.sin(i * 0.8 + hue * 0.1) * 0.3;
        return (
          <mesh
            key={i}
            position={[(i - barCount / 2) * barSpacing, height / 2, 0]}
          >
            <boxGeometry args={[barWidth, height, barWidth]} />
            <meshStandardMaterial
              color={`hsl(${hue + i * 10}, 60%, 50%)`}
              transparent
              opacity={isActive ? 0.9 : 0.3}
              emissive={`hsl(${hue + i * 10}, 60%, 30%)`}
              emissiveIntensity={isActive ? 0.5 : 0.1}
            />
          </mesh>
        );
      })}
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.15}
        color="#F0E4D2"
        anchorX="center"
        anchorY="middle"
      >
        {token}
      </Text>
    </group>
  );
}

function QKVLayer({ position, label, hue, isActive }: {
  position: [number, number, number];
  label: string;
  hue: number;
  isActive: boolean;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2.5, 0.08, 0.6]} />
        <meshStandardMaterial
          color={`hsl(${hue}, 60%, 40%)`}
          transparent
          opacity={isActive ? 0.7 : 0.2}
          emissive={`hsl(${hue}, 60%, 20%)`}
          emissiveIntensity={isActive ? 0.4 : 0.05}
        />
      </mesh>
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.2}
        color={`hsl(${hue}, 70%, 70%)`}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function AttentionLine({ from, to, weight, hue }: {
  from: [number, number, number];
  to: [number, number, number];
  weight: number;
  hue: number;
}) {
  const points = useMemo(() => [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ], [from, to]);

  const opacity = weight * 0.5;

  return (
    <line>
      <bufferGeometry setFromPoints={points} />
      <lineBasicMaterial
        color={`hsl(${hue}, 70%, 60%)`}
        linewidth={Math.max(1, weight * 2)}
        transparent
        opacity={opacity}
      />
    </line>
  );
}

function OutputBars({ position, probs, isActive }: {
  position: [number, number, number];
  probs: number[];
  isActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const vocab = ['jumps', 'runs', 'sleeps', 'hides', 'leaps'];
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {probs.map((p, i) => (
        <group key={i} position={[(i - probs.length / 2) * 0.5, 0, 0]}>
          <mesh position={[0, p * 2 / 2, 0]}>
            <boxGeometry args={[0.3, p * 2, 0.3]} />
            <meshStandardMaterial
              color={colors[i]}
              transparent
              opacity={isActive ? 0.9 : 0.3}
              emissive={colors[i]}
              emissiveIntensity={isActive ? 0.5 : 0.1}
            />
          </mesh>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.1}
            color="#F0E4D2"
            anchorX="center"
            anchorY="middle"
          >
            {vocab[i]}
          </Text>
          <Text
            position={[0, p * 2 + 0.2, 0]}
            fontSize={0.1}
            color={colors[i]}
            anchorX="center"
            anchorY="middle"
          >
            {(p * 100).toFixed(0)}%
          </Text>
        </group>
      ))}
    </group>
  );
}

function SceneContent({ stage }: { stage: StageId }) {
  const { camera } = useThree();
  const stageIndex = STAGES.findIndex((s) => s.id === stage);

  useFrame((state) => {
    const targetX = stageIndex * 6;
     
    state.camera.position.x += (targetX - state.camera.position.x) * 0.05;
     
    state.camera.position.y += (3 - state.camera.position.y) * 0.05;
    state.camera.lookAt(targetX, 0, 0);
  });

  const attentionWeights = [
    [0.54, 0.20, 0.16, 0.10],
    [0.14, 0.63, 0.09, 0.14],
    [0.09, 0.14, 0.64, 0.13],
    [0.20, 0.14, 0.09, 0.57],
  ];

  const outputProbs = [0.31, 0.18, 0.12, 0.08, 0.06];

  const [particles] = useState(() => 
    Array.from({ length: 200 }).map(() => [
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 15 - 5,
    ] as [number, number, number])
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <pointLight position={[0, 0, 10]} intensity={1} />

      {/* Background particles */}
      {particles.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
        >
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#F0E4D2" transparent opacity={0.15} />
        </mesh>
      ))}

      {/* Stage 1: Tokenize */}
      <group position={[0, 0, 0]}>
        {TOKENS.map((token, i) => (
          <TokenNode
            key={i}
            position={[i * 2 - 3, 0, 0]}
            token={token}
            hue={HUES[i]}
            isActive={stageIndex >= 0}
          />
        ))}
        <Text
          position={[0, -2, 0]}
          fontSize={0.15}
          color="rgba(240,228,210,0.6)"
          anchorX="center"
          anchorY="middle"
        >
          Input: "The quick brown fox"
        </Text>
      </group>

      {/* Stage 2: Embed */}
      <group position={[6, 0, 0]}>
        {TOKENS.map((token, i) => (
          <EmbeddingBars
            key={i}
            position={[i * 2 - 3, 0, 0]}
            token={token}
            hue={HUES[i]}
            isActive={stageIndex >= 1}
          />
        ))}
        <Text
          position={[0, -2, 0]}
          fontSize={0.15}
          color="rgba(240,228,210,0.6)"
          anchorX="center"
          anchorY="middle"
        >
          Token → Vector (d_model=8)
        </Text>
      </group>

      {/* Stage 3: Attention */}
      <group position={[12, 0, 0]}>
        {/* Q, K, V layers */}
        <QKVLayer position={[-2.5, 2, 0]} label="Q (Query)" hue={30} isActive={stageIndex >= 2} />
        <QKVLayer position={[-2.5, 0, 0]} label="K (Key)" hue={170} isActive={stageIndex >= 2} />
        <QKVLayer position={[-2.5, -2, 0]} label="V (Value)" hue={210} isActive={stageIndex >= 2} />

        {/* Token nodes */}
        {TOKENS.map((token, i) => (
          <TokenNode
            key={i}
            position={[i * 2 - 3, -3.5, 0]}
            token={token}
            hue={HUES[i]}
            isActive={stageIndex >= 2}
          />
        ))}

        {/* Attention connections */}
        {stageIndex >= 2 && TOKENS.map((_, i) =>
          TOKENS.map((_, j) => (
            <AttentionLine
              key={`${i}-${j}`}
              from={[i * 2 - 3, -3.5, 0] as [number, number, number]}
              to={[j * 2 - 3, -3.5, 0] as [number, number, number]}
              weight={attentionWeights[i][j]}
              hue={HUES[i]}
            />
          ))
        )}

        <Text
          position={[0, 3.5, 0]}
          fontSize={0.15}
          color="rgba(240,228,210,0.6)"
          anchorX="center"
          anchorY="middle"
        >
          A = softmax(Q·Kᵀ / √d)
        </Text>
      </group>

      {/* Stage 4: FFN */}
      <group position={[18, 0, 0]}>
        {TOKENS.map((token, i) => (
          <EmbeddingBars
            key={i}
            position={[i * 2 - 3, 0, 0]}
            token={token}
            hue={HUES[i] + 30}
            isActive={stageIndex >= 3}
          />
        ))}
        <Text
          position={[0, -2, 0]}
          fontSize={0.15}
          color="rgba(240,228,210,0.6)"
          anchorX="center"
          anchorY="middle"
        >
          Linear → ReLU → Linear
        </Text>
      </group>

      {/* Stage 5: Output */}
      <group position={[24, 0, 0]}>
        <OutputBars
          position={[0, 0, 0]}
          probs={outputProbs}
          isActive={stageIndex >= 4}
        />
        <Text
          position={[0, -2, 0]}
          fontSize={0.15}
          color="rgba(240,228,210,0.6)"
          anchorX="center"
          anchorY="middle"
        >
          softmax(logits) → probabilities
        </Text>
      </group>

      {/* Stage indicators */}
      {STAGES.map((s, i) => (
        <Float key={s.id} speed={2} rotationIntensity={0} floatIntensity={0.5}>
          <Text
            position={[i * 6, 4.5, 0]}
            fontSize={0.2}
            color={i <= stageIndex ? '#FFA85C' : 'rgba(240,228,210,0.2)'}
            anchorX="center"
            anchorY="middle"
          >
            {s.label}
          </Text>
        </Float>
      ))}
    </>
  );
}

export default function TransformerViz() {
  const [stage, setStage] = useState<StageId>('tokenize');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ width: '100%', height: '700px', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 3, 12], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <SceneContent stage={stage} />
      </Canvas>

      {/* 2D Overlay - Stage Navigation */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        padding: '15px',
        background: 'rgba(8,7,10,0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        border: '1px solid rgba(240,228,210,0.15)',
      }}>
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStage(s.id)}
            style={{
              fontFamily: 'var(--font-composer), monospace',
              fontSize: '11px',
              letterSpacing: '0.1em',
              padding: '8px 16px',
              background: stage === s.id ? 'rgba(255,168,92,0.25)' : 'transparent',
              border: stage === s.id ? '1px solid rgba(255,168,92,0.5)' : '1px solid rgba(240,228,210,0.15)',
              borderRadius: '5px',
              color: stage === s.id ? '#FFA85C' : 'rgba(240,228,210,0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Stage description overlay */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: 'var(--font-composer), monospace',
          fontSize: '14px',
          letterSpacing: '0.25em',
          color: '#FFA85C',
          marginBottom: '10px',
        }}>
          {STAGES.find((s) => s.id === stage)?.label} · {STAGES.find((s) => s.id === stage)?.title}
        </div>
        <div style={{
          fontFamily: 'var(--font-composer), monospace',
          fontSize: '16px',
          color: 'rgba(240,228,210,0.8)',
        }}>
          {STAGES.find((s) => s.id === stage)?.desc}
        </div>
      </div>
    </div>
  );
}
