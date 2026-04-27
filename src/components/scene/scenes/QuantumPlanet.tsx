'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

// ─────────────────────────────────────────────────────────────────────────────
// Scene constants
// ─────────────────────────────────────────────────────────────────────────────

const PLANET_RADIUS = 2;
const PLANET_COLOR = '#D8D8D8';
const EQUATION_GOLD = '#D4AF37';
const DRIFT_SPEED = 0.08; // world-units / second, right → left
const START_X = 12;
const END_X = -14;
const PLANET_Y = 1.2;
const PLANET_Z = 4;

type EquationDef = {
  id: 'einstein' | 'maxwell' | 'schrodinger' | 'vonneumann' | 'uncertainty';
  tex: string;
  title: string;
  desc: string;
};

const EQUATIONS: EquationDef[] = [
  {
    id: 'einstein',
    tex: 'Rμν − ½gμνR = 8πG/c⁴ · Tμν',
    title: 'SCHELKUNOFF EM SHIELDING',
    desc: 'Vectorized physics engine, published research',
  },
  {
    id: 'maxwell',
    tex: '∇ × B = μ₀J + μ₀ε₀ ∂E/∂t',
    title: 'MAXWELL — CURL OF B',
    desc: 'Ampère–Maxwell law, displacement current term',
  },
  {
    id: 'schrodinger',
    tex: 'H|ψ⟩ = E|ψ⟩',
    title: 'MONTE CARLO QUANTUM',
    desc: 'Qiskit, 70% acceleration, variational algorithms',
  },
  {
    id: 'vonneumann',
    tex: 'S = -Tr(ρ log ρ)',
    title: 'VON NEUMANN ENTROPY',
    desc: 'Quantum information, density matrix formalism',
  },
  {
    id: 'uncertainty',
    tex: 'ΔE · Δt ≥ ℏ/2',
    title: 'HEISENBERG UNCERTAINTY',
    desc: 'Energy-time uncertainty, quantum vacuum fluctuations',
  },
];

type EquationId = EquationDef['id'];

// ─────────────────────────────────────────────────────────────────────────────
// Boson Star Shader (Replaces standard PlanetMesh)
// ─────────────────────────────────────────────────────────────────────────────

const BOSON_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const BOSON_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  // T-03 Lensing: Erase shell line-by-line over time
  // Create a high-frequency horizontal banding pattern
  float lines = sin(gl_FragCoord.y * 0.8 + uTime * 5.0);
  
  // Outer shell dissolves based on a slow sine wave cycle
  float eraseCycle = (sin(uTime * 0.4) + 1.0) * 0.5; // 0 to 1
  
  // The core is a dense, glowing interior sphere
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = dot(normal, viewDir);
  
  // "Light bends inward" - extreme edge glow (inverse fresnel)
  float rim = pow(1.0 - max(fresnel, 0.0), 3.0);
  
  // Core glow (solid center)
  float core = smoothstep(0.4, 0.9, fresnel);
  
  // The shell erases line-by-line when lines < eraseCycle
  if (rim < 0.8 && core < 0.2 && lines < eraseCycle * 2.0 - 1.0) {
    discard; // Erases the outer shell
  }
  
  vec3 shellColor = vec3(0.1, 0.2, 0.4) * rim * 2.0;
  vec3 coreColor = vec3(0.9, 0.8, 1.0) * core * 1.5;
  
  gl_FragColor = vec4(shellColor + coreColor, 1.0);
}
`;

function PlanetMesh({
  positionRef,
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    uniforms.uTime.value += dt;
    meshRef.current.position.x -= DRIFT_SPEED * dt;
    if (meshRef.current.position.x < END_X) {
      meshRef.current.position.x = START_X;
    }
    meshRef.current.rotation.y += dt * 0.06;
    positionRef.current.copy(meshRef.current.position);
  });

  return (
    <group>
      <mesh ref={meshRef} position={[START_X, PLANET_Y, PLANET_Z]}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={BOSON_VERT}
          fragmentShader={BOSON_FRAG}
          uniforms={uniforms}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#cce0ff" />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShatterOverlay — 8 000 luminous dots, scatter then fade
// ─────────────────────────────────────────────────────────────────────────────

type ShatterPhase = 'scatter' | 'converge' | 'done';

function ShatterCanvas({ phase }: { phase: ShatterPhase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (phase === 'done' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const DOT_COUNT = 8000;
    const dots = Array.from({ length: DOT_COUNT }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 320,
      vy: (Math.random() - 0.5) * 320,
    }));

    const startTime = performance.now();

    function draw() {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= 0.8) return;

      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      const t     = elapsed < 0.4 ? elapsed / 0.4 : 1 - (elapsed - 0.4) / 0.4;
      const alpha = elapsed < 0.1 ? elapsed / 0.1
                  : elapsed < 0.4 ? 1
                  : Math.max(0, 1 - (elapsed - 0.4) / 0.4);

      ctx!.fillStyle = `rgba(212,175,55,${(alpha * 0.85).toFixed(3)})`;

      for (const dot of dots) {
        const cx = dot.x + dot.vx * t * 0.4;
        const cy = dot.y + dot.vy * t * 0.4;
        ctx!.fillRect(cx - 1, cy - 1, 2, 2);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        100,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GlassPanel — draggable frosted-glass info card
// ─────────────────────────────────────────────────────────────────────────────

type PanelProps = {
  title: string;
  desc: string;
  initialX: number;
  initialY: number;
  onClose: () => void;
};

function GlassPanel({ title, desc, initialX, initialY, onClose }: PanelProps) {
  const dragState = useRef<{ dragging: boolean; ox: number; oy: number } | null>(null);
  const [pos, setPos] = useState({ x: initialX, y: initialY });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-close]')) return;
      e.preventDefault();
      dragState.current = { dragging: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    },
    [pos],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current?.dragging) return;
      setPos({ x: e.clientX - dragState.current.ox, y: e.clientY - dragState.current.oy });
    };
    const onUp = () => {
      if (dragState.current) dragState.current.dragging = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 60,
        cursor: 'grab',
        userSelect: 'none',
        width: 320,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '18px 20px',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <button
        data-close
        onClick={onClose}
        aria-label="Close panel"
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 16,
          cursor: 'pointer',
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: EQUATION_GOLD,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'rgba(232,228,216,0.78)',
          lineHeight: 1.6,
          letterSpacing: '0.06em',
        }}
      >
        {desc}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 9,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.22)',
          textTransform: 'uppercase',
        }}
      >
        DRAG TO REPOSITION
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EquationTrail — DOM equations anchored to planet screen position
// ─────────────────────────────────────────────────────────────────────────────

type TrailProps = {
  planetScreenPos: { x: number; y: number };
  onEquationClick: (id: EquationId, sx: number, sy: number) => void;
};

function EquationTrail({ planetScreenPos, onEquationClick }: TrailProps) {
  const [hoveredId, setHoveredId] = useState<EquationId | null>(null);

  return (
    <>
      {EQUATIONS.map((eq, i) => {
        // Trail extends rightward — the planet moves left so right = behind
        const trailX = planetScreenPos.x + 80 + i * 110;
        const trailY = planetScreenPos.y + (i - 2) * 26;
        const opacity = 1 - (i / (EQUATIONS.length - 1)) * 0.72;
        const isHovered = hoveredId === eq.id;

        return (
          <div
            key={eq.id}
            onMouseEnter={() => setHoveredId(eq.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: 'fixed',
              left: trailX,
              top: trailY,
              transform: 'translateY(-50%)',
              zIndex: 50,
              cursor: 'pointer',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 13,
                color: EQUATION_GOLD,
                opacity: isHovered ? 1 : opacity,
                textShadow: isHovered
                  ? `0 0 20px rgba(212,175,55,1), 0 0 40px rgba(212,175,55,0.6)`
                  : `0 0 12px rgba(212,175,55,0.8)`,
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s, text-shadow 0.2s',
                letterSpacing: '0.05em',
              }}
            >
              {eq.tex}
            </span>
            {isHovered && (
              <button
                onClick={() => onEquationClick(eq.id, trailX, trailY)}
                style={{
                  background: 'rgba(212,175,55,0.15)',
                  border: `1px solid rgba(212,175,55,0.5)`,
                  color: EQUATION_GOLD,
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                EXPAND
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMOverlay — R3F component; projects 3D → screen, portals DOM to body
//
// Reason for being inside Canvas: useThree() and useFrame() require the R3F
// context, which only exists inside <Canvas>. createPortal from react-dom
// lets us escape the canvas DOM node while keeping the R3F context intact.
// ─────────────────────────────────────────────────────────────────────────────

function DOMOverlay({
  planetWorldPos,
}: {
  planetWorldPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const { camera } = useThree();
  const [screenPos, setScreenPos] = useState({ x: 800, y: 400 });
  const [openPanels, setOpenPanels] = useState<Map<EquationId, { x: number; y: number }>>(
    new Map(),
  );
  const shatterActive = useScene((s) => s.shatterActive);
  const setShatter = useScene((s) => s.setShatter);
  const [shatterPhase, setShatterPhase] = useState<ShatterPhase>('done');

  const prevX = useRef(0);
  const prevY = useRef(0);

  useFrame(() => {
    const v = planetWorldPos.current.clone();
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    if (Math.abs(x - prevX.current) > 0.5 || Math.abs(y - prevY.current) > 0.5) {
      prevX.current = x;
      prevY.current = y;
      setScreenPos({ x, y });
    }
  });

  useEffect(() => {
    if (!shatterActive) return;
    setShatterPhase('scatter');
    const t1 = setTimeout(() => setShatterPhase('converge'), 400);
    const t2 = setTimeout(() => {
      setShatterPhase('done');
      setShatter(false);
    }, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [shatterActive, setShatter]);

  const handleEquationClick = useCallback(
    (id: EquationId, x: number, y: number) => {
      if (id === 'schrodinger') setShatter(true);
      setOpenPanels((prev) => {
        const next = new Map(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.set(id, { x: x + 20, y: y - 60 });
        }
        return next;
      });
    },
    [setShatter],
  );

  const handleClosePanel = useCallback((id: EquationId) => {
    setOpenPanels((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  if (typeof document === 'undefined') return null;

  return (
    <Html fullscreen zIndexRange={[50, 100]}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <EquationTrail planetScreenPos={screenPos} onEquationClick={handleEquationClick} />
        {Array.from(openPanels.entries()).map(([id, pos]) => {
          const eq = EQUATIONS.find((e) => e.id === id);
          if (!eq) return null;
          return (
            <GlassPanel
              key={id}
              title={eq.title}
              desc={eq.desc}
              initialX={pos.x}
              initialY={pos.y}
              onClose={() => handleClosePanel(id)}
            />
          );
        })}
        <ShatterCanvas phase={shatterPhase} />
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NebulaBackground — CSS gradient mounted via DOM side-effect
// ─────────────────────────────────────────────────────────────────────────────

function NebulaBackground() {
  useEffect(() => {
    const div = document.createElement('div');
    div.id = 'quantum-nebula-bg';
    Object.assign(div.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '-1',
      pointerEvents: 'none',
      background:
        'radial-gradient(ellipse at 30% 60%, rgba(40,20,80,0.4) 0%, rgba(20,10,40,1) 70%)',
    });
    document.body.appendChild(div);
    return () => {
      document.getElementById('quantum-nebula-bg')?.remove();
    };
  }, []);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// QuantumPlanet — default export (mounted inside SceneManager's Canvas)
// ─────────────────────────────────────────────────────────────────────────────

export default function QuantumPlanet() {
  const planetWorldPos = useRef<THREE.Vector3>(new THREE.Vector3(START_X, PLANET_Y, PLANET_Z));

  return (
    <>
      <NebulaBackground />
      <PlanetMesh positionRef={planetWorldPos} />
      <DOMOverlay planetWorldPos={planetWorldPos} />
    </>
  );
}
