'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ORBIT_RADIUS = 5;
const STAR_RADIUS = 0.9;
const FURYX_COLOR  = '#3A7BD5';
const VERONICA_COLOR = '#D8D8D8';
const DRAG_SENSITIVITY = 0.007; // radians per pixel

// Angle band boundaries in radians (0 → 2π)
const DEG = Math.PI / 180;
const FRONT_MAX    =  45 * DEG;
const FURYX_MAX    = 135 * DEG;
const REAR_MAX     = 225 * DEG;
const VERONICA_MAX = 315 * DEG;

// ─────────────────────────────────────────────────────────────────────────────
// Ghost UI panel shader — flat translucent grid orbiting FuryX
// ─────────────────────────────────────────────────────────────────────────────

const panelVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const panelFrag = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec3  uColor;

void main() {
  float gridX = step(0.95, fract(vUv.x * 8.0));
  float gridY = step(0.95, fract(vUv.y * 5.0));
  float grid  = max(gridX, gridY);

  float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x)
             * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);

  float scan = 0.5 + 0.5 * sin(vUv.y * 14.0 - uTime * 2.2);
  float alpha = edge * (0.1 + 0.07 * scan + 0.2 * grid);
  gl_FragColor = vec4(uColor * (0.65 + 0.35 * scan), alpha);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Data bridge shader — flowing pulse along spiral tube
// ─────────────────────────────────────────────────────────────────────────────

const bridgeVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const bridgeFrag = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform float uTime;

void main() {
  float flow  = fract(vUv.y * 4.0 - uTime * 1.3);
  float pulse = smoothstep(0.0, 0.18, flow) * smoothstep(0.45, 0.18, flow);
  float cross_ = abs(vUv.x - 0.5) * 2.0;
  float core   = 1.0 - smoothstep(0.0, 1.0, cross_);
  float intensity = core * (0.35 + 0.85 * pulse);
  // rgba(184,255,60) — bridge accent
  gl_FragColor = vec4(0.72, 1.0, 0.235, intensity * 0.52);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Magnetic field arc shader — visible only during rear view
// ─────────────────────────────────────────────────────────────────────────────

const fieldVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fieldFrag = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform float uAlpha;

void main() {
  float cross_ = abs(vUv.x - 0.5) * 2.0;
  float core   = 1.0 - smoothstep(0.0, 1.0, cross_);
  float wave   = 0.5 + 0.5 * sin(vUv.y * 22.0 - uTime * 3.5);
  float alpha  = uAlpha * core * (0.28 + 0.5 * wave);
  gl_FragColor = vec4(0.78, 0.2, 1.0, alpha);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Geometry builders
// ─────────────────────────────────────────────────────────────────────────────

function buildBridgeCurve(turns: number, helixRadius: number): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const STEPS = 80;
  for (let i = 0; i <= STEPS; i++) {
    const u = i / STEPS;
    const x = -ORBIT_RADIUS + u * ORBIT_RADIUS * 2;
    const angle = u * Math.PI * 2 * turns;
    const taper = 1 - Math.abs(u - 0.5) * 1.6;
    pts.push(new THREE.Vector3(
      x,
      Math.sin(angle) * helixRadius * taper,
      Math.cos(angle) * helixRadius * taper,
    ));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

function buildFieldArc(archHeight: number, flip: boolean): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const sign = flip ? -1 : 1;
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const x = -ORBIT_RADIUS + u * ORBIT_RADIUS * 2;
    pts.push(new THREE.Vector3(x, sign * Math.sin(u * Math.PI) * archHeight, 0));
  }
  return new THREE.CatmullRomCurve3(pts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel / schematic configs
// ─────────────────────────────────────────────────────────────────────────────

type PanelCfg = { orbitR: number; speed: number; phase: number; w: number; h: number };
type SchematicCfg = { orbitR: number; speed: number; phase: number; rx: number; ry: number };

const PANEL_CFGS: PanelCfg[] = [
  { orbitR: 1.8, speed: 0.9, phase: 0.0, w: 1.4, h: 0.7  },
  { orbitR: 2.2, speed: 0.6, phase: 2.1, w: 1.1, h: 0.5  },
  { orbitR: 1.5, speed: 1.3, phase: 1.0, w: 0.9, h: 0.42 },
];

const SCHEMATIC_CFGS: SchematicCfg[] = [
  { orbitR: 1.9, speed: 0.7,  phase: 0.5, rx: 0.9,  ry: 0.45 },
  { orbitR: 2.4, speed: 0.45, phase: 3.7, rx: 0.65, ry: 0.32 },
  { orbitR: 1.6, speed: 1.1,  phase: 1.8, rx: 0.5,  ry: 0.25 },
];

// ─────────────────────────────────────────────────────────────────────────────
// View band classifier
// ─────────────────────────────────────────────────────────────────────────────

type ViewBand = 'front' | 'furyx' | 'rear' | 'veronica';

function classifyAngle(raw: number): ViewBand {
  const a = ((raw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (a < FRONT_MAX || a >= VERONICA_MAX) return 'front';
  if (a < FURYX_MAX) return 'furyx';
  if (a < REAR_MAX) return 'rear';
  return 'veronica';
}

// ─────────────────────────────────────────────────────────────────────────────
// R3F component — rendered inside the existing Canvas
// ─────────────────────────────────────────────────────────────────────────────

export default function TwinBuild() {
  const furyxRef    = useRef<THREE.Mesh>(null);
  const veronicaRef = useRef<THREE.Mesh>(null);

  const panelGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const schematicGroupRefs = useRef<(THREE.Group | null)[]>([]);

  // Build panel plane geometries once
  const panelGeos = useMemo(
    () => PANEL_CFGS.map((c) => new THREE.PlaneGeometry(c.w, c.h)),
    [],
  );

  // Build schematic torus geometries once
  const schematicGeos = useMemo(
    () => SCHEMATIC_CFGS.map((c) => new THREE.TorusGeometry(c.rx, 0.012, 8, 56)),
    [],
  );

  // Bridge tube geometries
  const bridgeGeos = useMemo(() => {
    const c1 = buildBridgeCurve(2.5,  0.55);
    const c2 = buildBridgeCurve(-1.8, 0.38);
    return [
      new THREE.TubeGeometry(c1, 80, 0.022, 8, false),
      new THREE.TubeGeometry(c2, 80, 0.016, 8, false),
    ];
  }, []);

  // Magnetic field arc geometries
  const fieldGeos = useMemo(() => {
    const a1 = buildFieldArc(3.5, false);
    const a2 = buildFieldArc(3.5, true);
    return [
      new THREE.TubeGeometry(a1, 60, 0.03, 8, false),
      new THREE.TubeGeometry(a2, 60, 0.03, 8, false),
    ];
  }, []);

  // Bridge shader materials
  const bridgeMats = useMemo(() => [
    new THREE.ShaderMaterial({
      vertexShader: bridgeVert,
      fragmentShader: bridgeFrag,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
    new THREE.ShaderMaterial({
      vertexShader: bridgeVert,
      fragmentShader: bridgeFrag,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  ], []);

  // Field arc shader materials
  const fieldMats = useMemo(() => [
    new THREE.ShaderMaterial({
      vertexShader: fieldVert,
      fragmentShader: fieldFrag,
      uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
    new THREE.ShaderMaterial({
      vertexShader: fieldVert,
      fragmentShader: fieldFrag,
      uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  ], []);

  // Panel shader materials (FuryX ghost UI)
  const panelMats = useMemo(() =>
    PANEL_CFGS.map(() => new THREE.ShaderMaterial({
      vertexShader: panelVert,
      fragmentShader: panelFrag,
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(FURYX_COLOR) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })),
  []);

  // Schematic shader materials (Veronica vehicle rings)
  const schematicMats = useMemo(() =>
    SCHEMATIC_CFGS.map(() => new THREE.ShaderMaterial({
      vertexShader: panelVert,
      fragmentShader: panelFrag,
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(VERONICA_COLOR) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })),
  []);

  // Dispose all GPU resources on unmount
  useEffect(() => () => {
    panelGeos.forEach((g) => g.dispose());
    schematicGeos.forEach((g) => g.dispose());
    bridgeGeos.forEach((g) => g.dispose());
    fieldGeos.forEach((g) => g.dispose());
    bridgeMats.forEach((m) => m.dispose());
    fieldMats.forEach((m) => m.dispose());
    panelMats.forEach((m) => m.dispose());
    schematicMats.forEach((m) => m.dispose());
  }, [panelGeos, schematicGeos, bridgeGeos, fieldGeos, bridgeMats, fieldMats, panelMats, schematicMats]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    // Auto-orbit: 11-second revolution period, layered on top of drag orbitAngle.
    // We do NOT modify orbitAngle in the store from here — that is the user's
    // drag-driven value. Instead, the group rotation encodes the auto-orbit.
    const autoAngle = (t / 11) * Math.PI * 2;

    // Star self-spin
    if (furyxRef.current)    furyxRef.current.rotation.y   += dt * 1.1;
    if (veronicaRef.current)  veronicaRef.current.rotation.x += dt * 0.8;

    // Advance bridge shader time
    for (const m of bridgeMats) m.uniforms.uTime.value += dt;

    // Field arc visibility fades in/out based on view band
    const inRear = classifyAngle(useScene.getState().orbitAngle) === 'rear';
    const targetFieldAlpha = inRear ? 1.0 : 0.0;
    for (const m of fieldMats) {
      m.uniforms.uTime.value += dt;
      const cur = m.uniforms.uAlpha.value as number;
      m.uniforms.uAlpha.value = cur + (targetFieldAlpha - cur) * Math.min(1, dt * 3);
    }

    // Advance panel + schematic shader times
    for (const m of panelMats)     m.uniforms.uTime.value += dt;
    for (const m of schematicMats) m.uniforms.uTime.value += dt;

    // Compute star positions from auto-orbit + drag angle
    const dragAngle = useScene.getState().orbitAngle;
    const totalAngle = autoAngle + dragAngle;

    const furyxX    = Math.sin(totalAngle + Math.PI) * ORBIT_RADIUS;
    const furyxZ    = Math.cos(totalAngle + Math.PI) * ORBIT_RADIUS;
    const veronicaX = Math.sin(totalAngle) * ORBIT_RADIUS;
    const veronicaZ = Math.cos(totalAngle) * ORBIT_RADIUS;

    if (furyxRef.current) {
      furyxRef.current.position.set(furyxX, 0, furyxZ);
    }
    if (veronicaRef.current) {
      veronicaRef.current.position.set(veronicaX, 0, veronicaZ);
    }

    // Orbit panels around FuryX
    PANEL_CFGS.forEach((cfg, i) => {
      const grp = panelGroupRefs.current[i];
      if (!grp) return;
      const a = t * cfg.speed + cfg.phase;
      grp.position.set(
        furyxX + Math.sin(a) * cfg.orbitR,
        Math.cos(a) * 0.55,
        furyxZ + Math.cos(a) * cfg.orbitR,
      );
      grp.lookAt(furyxX, 0, furyxZ);
    });

    // Orbit schematics around Veronica
    SCHEMATIC_CFGS.forEach((cfg, i) => {
      const grp = schematicGroupRefs.current[i];
      if (!grp) return;
      const a = t * cfg.speed + cfg.phase;
      grp.position.set(
        veronicaX + Math.sin(a) * cfg.orbitR,
        Math.cos(a) * 0.45,
        veronicaZ + Math.cos(a) * cfg.orbitR,
      );
      grp.rotation.x = t * 0.35 + cfg.phase;
      grp.rotation.y = t * 0.28 + cfg.phase * 0.5;
    });

  });

  // Initial render positions — will be overwritten by useFrame on the first tick
  const initFuryxPos: [number, number, number]  = [-ORBIT_RADIUS, 0, 0];
  const initVeronicaPos: [number, number, number] = [ORBIT_RADIUS, 0, 0];

  return (
    <group>
      {/* Ambient point lights on each star */}
      <pointLight position={initFuryxPos}    color={FURYX_COLOR}    intensity={1.2} distance={20} />
      <pointLight position={initVeronicaPos} color={VERONICA_COLOR} intensity={0.9} distance={20} />

      {/* ── FuryX neutron star — UI-blue ── */}
      <mesh ref={furyxRef} position={initFuryxPos}>
        <sphereGeometry args={[STAR_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#6AAAE8"
          emissive={FURYX_COLOR}
          emissiveIntensity={2.4}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Ghost UI panels orbiting FuryX */}
      {PANEL_CFGS.map((_, i) => (
        <group
          key={i}
          ref={(el) => { panelGroupRefs.current[i] = el; }}
        >
          <mesh geometry={panelGeos[i]} material={panelMats[i]} />
        </group>
      ))}

      {/* ── Veronica neutron star — clinical white ── */}
      <mesh ref={veronicaRef} position={initVeronicaPos}>
        <sphereGeometry args={[STAR_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#EFEFEF"
          emissive={VERONICA_COLOR}
          emissiveIntensity={1.8}
          roughness={0.25}
          metalness={0.35}
        />
      </mesh>

      {/* Vehicle schematic rings orbiting Veronica */}
      {SCHEMATIC_CFGS.map((_, i) => (
        <group
          key={i}
          ref={(el) => { schematicGroupRefs.current[i] = el; }}
        >
          <mesh geometry={schematicGeos[i]} material={schematicMats[i]} />
        </group>
      ))}

      {/* ── Data bridge — two spiral tubes connecting stars ── */}
      {bridgeGeos.map((geo, i) => (
        <mesh key={i} geometry={geo} material={bridgeMats[i]} />
      ))}

      {/* ── Magnetic field arcs — fade in during rear view ── */}
      {fieldGeos.map((geo, i) => (
        <mesh key={i} geometry={geo} material={fieldMats[i]} />
      ))}

      {/* Accretion torus enclosing the whole binary system */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ORBIT_RADIUS + 0.8, 0.028, 12, 120]} />
        <meshBasicMaterial
          color={new THREE.Color(0.72, 1.0, 0.235)}
          transparent
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM overlay — drag interaction capture + content cards
// Rendered as a sibling of <Canvas> by SceneManager, identical to the
// DriveXQuasarOverlay pattern already wired there.
// ─────────────────────────────────────────────────────────────────────────────

export function TwinBuildOverlay() {
  const phase        = useScene((s) => s.phase);
  const orbitAngle   = useScene((s) => s.orbitAngle);
  const setOrbitAngle = useScene((s) => s.setOrbitAngle);

  const dragging = useRef(false);
  const lastX    = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setOrbitAngle(useScene.getState().orbitAngle + dx * DRAG_SENSITIVITY);
  }, [setOrbitAngle]);

  const stopDrag = useCallback(() => { dragging.current = false; }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    lastX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    setOrbitAngle(useScene.getState().orbitAngle + dx * DRAG_SENSITIVITY);
  }, [setOrbitAngle]);

  if (phase !== 'EINSTEIN_CROSS') return null;

  const band = classifyAngle(orbitAngle);

  const MONO: React.CSSProperties = {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 10,
    color: '#E8E4D8',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.7,
  };

  const CARD: React.CSSProperties = {
    ...MONO,
    position: 'fixed' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    pointerEvents: 'none' as const,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(232,228,216,0.12)',
    backdropFilter: 'blur(6px)',
    padding: '18px 22px',
    maxWidth: 260,
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={stopDrag}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5,
        cursor: 'grab',
      }}
    >
      {band === 'furyx' && (
        <div style={{ ...CARD, left: '5vw' }}>
          <div style={{ fontSize: 12, color: FURYX_COLOR, marginBottom: 10, letterSpacing: '0.22em' }}>
            FURYX
          </div>
          <div>Glassmorphic office communication portal</div>
          <div style={{ opacity: 0.6, marginTop: 6 }}>Chrome Extension · Strapi CMS integration</div>
          <div style={{ opacity: 0.6 }}>Automated internal news distribution</div>
          <div style={{ opacity: 0.6 }}>Bidirectional secure feedback loop</div>
        </div>
      )}

      {band === 'veronica' && (
        <div style={{ ...CARD, right: '5vw', left: 'auto' }}>
          <div style={{ fontSize: 12, color: VERONICA_COLOR, marginBottom: 10, letterSpacing: '0.22em' }}>
            VERONICA
          </div>
          <div>AI vehicle inspection agent</div>
          <div style={{ opacity: 0.6, marginTop: 6 }}>1,047+ components analyzed per cycle</div>
          <div style={{ opacity: 0.6 }}>Automated QA test case generation</div>
          <div style={{ color: 'rgba(232,228,216,0.35)' }}>Manual inspection: DEPRECATED</div>
        </div>
      )}
    </div>
  );
}
