'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * BinaryMagnetar — represents EMI SHIELD (electromagnetic physics engine).
 *
 * Two neutron stars orbiting a common center, bound by a visible dipole
 * magnetic field. Field lines are the load-bearing visual: they show that
 * this body is "about fields", the same way the shield app models them.
 *
 * Physics analog:
 *   - Each star treated as a magnetic monopole in the visualization
 *     (blue = +, red = -); real magnetars are dipoles, but for scale and
 *     clarity the inter-star field is rendered as a classic monopole-pair
 *     dipole pattern (curves that loop from one pole to the other).
 *   - Field lines computed analytically from two opposite point charges in
 *     the plane containing both stars (and normal rotations to give volume).
 *
 * Spatial layout (local to group):
 *   - Stars orbit in XZ plane at orbital radius 1.2, period 3s.
 *   - Field lines live in the rotating frame — they spin with the binary.
 *   - A subtle torus in XZ plane encloses the system.
 */

const ORBITAL_RADIUS = 1.2;
const ORBITAL_PERIOD = 3.0; // seconds
const STAR_RADIUS = 0.4;
const NUM_FIELD_LINES = 14;
const POINTS_PER_LINE = 48;

/**
 * Compute one dipole field line.
 *
 * Strategy: parametrize lines by a starting angle θ₀ near star A's surface,
 * then shoot outward along the local field direction using RK4-ish small
 * steps. Since we need a closed curve to star B, we bias integration with a
 * sink at B. We only need a handful of points for a smooth tube — 48 is
 * plenty.
 *
 * For this stylized render we use an analytically parameterized curve rather
 * than true ODE integration. Each line is a cubic-ish arc from star A's
 * surface to star B's surface, with the mid-control points offset
 * perpendicular to the star-to-star axis and scaled by line index. This
 * reproduces the visual topology of a dipole field (outer lines bulge
 * farther, inner lines hug the axis) at O(1) per line.
 */
function buildDipoleFieldCurves(): THREE.CatmullRomCurve3[] {
  const curves: THREE.CatmullRomCurve3[] = [];
  // Star A at (-r, 0, 0), star B at (+r, 0, 0) in the rotating frame.
  const a = new THREE.Vector3(-ORBITAL_RADIUS, 0, 0);
  const b = new THREE.Vector3(ORBITAL_RADIUS, 0, 0);
  const axis = new THREE.Vector3().subVectors(b, a);
  const axisLen = axis.length();

  for (let i = 0; i < NUM_FIELD_LINES; i++) {
    // Azimuthal angle around the star-to-star axis — rotates each line into
    // its own meridional plane so the full 3D dipole volume is populated.
    const phi = (i / NUM_FIELD_LINES) * Math.PI * 2;
    // Latitude on each star where this line anchors (poles to equator).
    // Skip the exact equator and exact axis so we don't get degenerate arcs.
    const latIndex = (i % 7) - 3; // -3..+3
    const lat = (latIndex / 7) * (Math.PI * 0.7); // ±0.95 rad

    // "Height" of the arc — how far it bulges away from the axis.
    // Outer lines (larger |lat|) bulge more — same topology as real dipoles.
    const bulge = 0.4 + Math.abs(latIndex) * 0.35 + (i % 3) * 0.15;

    // Build the line in a local plane:
    //   x-axis = star-to-star axis
    //   y-axis = rotated by phi around the x-axis
    const yHat = new THREE.Vector3(0, Math.cos(phi), Math.sin(phi));
    const xHat = axis.clone().normalize();

    // Start point: on star A's surface, offset by latitude
    const startLocal = new THREE.Vector3(
      -axisLen / 2 + STAR_RADIUS * Math.cos(lat),
      STAR_RADIUS * Math.sin(lat),
      0,
    );
    // End point: on star B's surface, offset by opposite latitude
    const endLocal = new THREE.Vector3(
      axisLen / 2 - STAR_RADIUS * Math.cos(lat),
      STAR_RADIUS * Math.sin(lat),
      0,
    );

    const pts: THREE.Vector3[] = [];
    for (let j = 0; j < POINTS_PER_LINE; j++) {
      const u = j / (POINTS_PER_LINE - 1); // 0..1 along the arc
      // Linear interp along axis
      const axial = startLocal.clone().lerp(endLocal, u);
      // Sine bulge perpendicular to axis — peaks at u=0.5
      const bulgeAmt = Math.sin(u * Math.PI) * bulge * Math.sign(lat || 1);
      axial.y += bulgeAmt;
      // Map local (x, y, 0) into world: x along axis, y along yHat
      const worldPt = new THREE.Vector3()
        .addScaledVector(xHat, axial.x)
        .addScaledVector(yHat, axial.y);
      // Offset to binary center — a is already centered on -r so worldPt is
      // already correct in the group-local frame.
      pts.push(worldPt);
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    curves.push(curve);
  }
  return curves;
}

// ── Field line shader: scrolling UV to suggest charge flow along the line
const lineVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const lineFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec3  uColor;

void main() {
  // TubeGeometry uv.x runs around tube circumference, uv.y runs along length.
  // Scroll a bright pulse along length to evoke charge flow.
  float flow = fract(vUv.y * 3.0 - uTime * 0.6);
  float pulse = smoothstep(0.0, 0.15, flow) * smoothstep(0.4, 0.15, flow);

  // Radial falloff across tube cross-section — makes the line read as a
  // glowing filament rather than a solid tube.
  float cross_ = abs(vUv.x - 0.5) * 2.0;
  float coreLight = 1.0 - smoothstep(0.0, 1.0, cross_);

  // Base glow + flowing pulse
  float intensity = coreLight * (0.55 + 0.9 * pulse);

  gl_FragColor = vec4(uColor * intensity, intensity * 0.85);
}
`;

type BinaryMagnetarProps = {
  position?: [number, number, number];
  orbit?: { radius: number; speed: number; phase: number };
  receiveRim?: boolean;
};

export default function BinaryMagnetar({
  position = [-15, 3, -8],
  orbit,
  receiveRim = false,
}: BinaryMagnetarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null); // contains stars + field lines
  const starARef = useRef<THREE.Mesh>(null);
  const starBRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Build curves once — they live in the rotating frame, so the whole orbit
  // group spins and the lines follow rigidly (no per-frame geometry rebuild).
  const { tubeGeometries, materials } = useMemo(() => {
    const curves = buildDipoleFieldCurves();
    const geos = curves.map((c) => new THREE.TubeGeometry(c, 64, 0.018, 8, false));
    const mats = curves.map(
      () =>
        new THREE.ShaderMaterial({
          vertexShader: lineVert,
          fragmentShader: lineFrag,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#B8FF3C') },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
    );
    return { tubeGeometries: geos, materials: mats };
  }, []);

  // Dispose GPU resources on unmount — React 19 StrictMode will mount/unmount
  // twice in dev; leaking TubeGeometry + ShaderMaterial here would cost
  // ~400KB per mount cycle. useEffect cleanup (not useMemo) runs this.
  useEffect(() => {
    return () => {
      tubeGeometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, [tubeGeometries, materials]);

  useFrame((state, dt) => {
    // Advance flow animation on every field line
    for (const m of materials) {
      (m.uniforms.uTime.value as number) += dt;
    }

    if (!orbitRef.current) return;
    // Spin the whole orbit group around Y — stars + field lines rotate rigidly.
    orbitRef.current.rotation.y += (dt / ORBITAL_PERIOD) * Math.PI * 2;

    // Gentle self-rotation of each star for life — low rate, different axes
    if (starARef.current) starARef.current.rotation.y += dt * 0.8;
    if (starBRef.current) starBRef.current.rotation.x += dt * 0.6;

    // Subtle bob of the whole system on Y — like a slow binary precession
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      if (orbit) {
        groupRef.current.position.x = Math.cos(t * orbit.speed + orbit.phase) * orbit.radius;
        groupRef.current.position.z = Math.sin(t * orbit.speed + orbit.phase) * orbit.radius;
        groupRef.current.position.y = position[1] + Math.sin(t * 0.3) * 0.15;
      } else {
        groupRef.current.position.y = position[1] + Math.sin(t * 0.3) * 0.15;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <group ref={orbitRef}>
        {/* Star A — positive charge analog, blue-white */}
        <mesh
          ref={starARef}
          position={[-ORBITAL_RADIUS, 0, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[STAR_RADIUS, 32, 32]} />
          <meshStandardMaterial
            color="#CFE4FF"
            emissive="#4A90FF"
            emissiveIntensity={2.2}
            roughness={receiveRim ? 0.45 : 0.3}
            metalness={receiveRim ? 0.2 : 0.4}
          />
        </mesh>

        {/* Star B — negative charge analog, red-orange */}
        <mesh
          ref={starBRef}
          position={[ORBITAL_RADIUS, 0, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[STAR_RADIUS, 32, 32]} />
          <meshStandardMaterial
            color="#FFD4B0"
            emissive="#FF5A28"
            emissiveIntensity={2.2}
            roughness={receiveRim ? 0.45 : 0.3}
            metalness={receiveRim ? 0.2 : 0.4}
          />
        </mesh>

        {/* Field lines — 14 TubeGeometry arcs forming a dipole pattern */}
        {tubeGeometries.map((geo, i) => (
          <mesh
            key={i}
            geometry={geo}
            material={materials[i]}
          />
        ))}

        {/* Accretion ring — enclosing torus in orbital plane */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ORBITAL_RADIUS + 0.6, 0.025, 12, 96]} />
          <meshBasicMaterial
            color="#B8FF3C"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Faint ambient glow quad behind the system — helps bloom bite */}
        <mesh position={[0, 0, -0.5]}>
          <circleGeometry args={[2.4, 48]} />
          <meshBasicMaterial
            color="#1a2a18"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {hovered && (
        <Html
          position={[2.6, 2.0, 0]}
          transform
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              color: 'rgba(216, 236, 255, 0.92)',
              background: 'rgba(6, 18, 8, 0.72)',
              border: '1px solid rgba(184, 255, 60, 0.35)',
              padding: '10px 14px',
              letterSpacing: '0.22em',
              fontSize: 9,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: '0.14em',
                color: '#FFFFFF',
                marginBottom: 6,
              }}
            >
              EMI SHIELD
            </div>
            <div style={{ opacity: 0.75 }}>ELECTROMAGNETIC PHYSICS ENGINE</div>
            <div style={{ color: '#B8FF3C', marginTop: 6 }}>SCHELKUNOFF THEORY</div>
            <div style={{ opacity: 0.55, marginTop: 2 }}>100kHz → 10GHz</div>
            <div style={{ opacity: 0.4, marginTop: 2 }}>REACT NATIVE · PRODUCTION</div>
          </div>
        </Html>
      )}
    </group>
  );
}
