'use client';

/**
 * WarpScene — Physically-grounded event horizon crossing, in THREE.js.
 *
 * Timeline (5.0s total):
 *   0.0–1.8s  Accretion disk crossing: intense orange-amber radiation flash.
 *             You've entered the equatorial plane of the disk at relativistic speed.
 *   0.4–3.8s  Relativistic beaming: 30k stars compress toward your forward direction.
 *             Real aberration formula — at v→c all photons blueshift and concentrate
 *             into a shrinking cone ahead. Stars shoot radially past in streams.
 *   1.6–3.4s  Einstein ring: gravitational lensing collapses ALL background light
 *             into a single bright ring around the singularity. The ring contracts
 *             as you pass through the photon sphere (r = 1.5 Rs).
 *   3.0–5.0s  Interior darkness: spacetime curvature produces gravitational waves —
 *             expanding metric perturbations visible as concentric blue-white rings.
 *             Stars reform in the distance (new universe).
 *   4.6s      Veil fires (covers DESCENT→MIRA_PULSAR scene swap within R3F canvas)
 *   5.0s      setPhase('MIRA_PULSAR')
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const DURATION = 5.0;

function ss(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// ── Relativistic star burst ────────────────────────────────────────────────
// Stars loop outward from origin along biased-forward directions.
// Forward bias simulates relativistic aberration: at v→c the entire sky
// contracts to a forward disc.
const STARS_VERT = /* glsl */ `
  attribute float aOff;
  attribute float aSpd;
  attribute vec3  aDir;
  attribute float aSz;
  uniform float   uT;
  uniform float   uBright;
  varying float   vA;

  void main() {
    float life = fract(aOff + uT * aSpd);
    vec3  pos  = aDir * life * 60.0;
    // Fade in at birth, fade out at death; overall brightness driven by uBright
    vA = uBright
       * smoothstep(0.0, 0.06, life)
       * smoothstep(1.0, 0.55, life);
    vec4 mv    = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mv;
    gl_PointSize = aSz * 220.0 / max(-mv.z, 1.0);
  }
`;
const STARS_FRAG = /* glsl */ `
  varying float vA;
  void main() {
    if (vA < 0.01) discard;
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float a = vA * (1.0 - r * 2.0);
    // Doppler: blue-white forward, amber at periphery — already handled by forward bias
    gl_FragColor = vec4(0.94, 0.97, 1.0, a);
  }
`;

const N = 30_000;

export default function WarpScene() {
  const setPhase  = useScene((s) => s.setPhase);
  const elapsed   = useRef(0);
  const fired     = useRef(false);
  const veilFired = useRef(false);

  // ── Star burst geometry ────────────────────────────────────────────────────
  const { sGeo, sMat } = useMemo(() => {
    const off = new Float32Array(N);
    const spd = new Float32Array(N);
    const dir = new Float32Array(N * 3);
    const sz  = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      off[i] = Math.random();
      spd[i] = 0.25 + Math.random() * 0.75;
      sz[i]  = 0.6  + Math.random() * 1.4;

      // ~70 % of stars biased into forward hemisphere (aberration effect)
      const fwd   = Math.random() < 0.70;
      const phi   = fwd
        ? Math.acos(1 - Math.random() * 0.85)       // tight forward cone
        : Math.acos(1 - 0.85 - Math.random() * 1.15); // remaining hemisphere
      const theta = Math.random() * Math.PI * 2;

      dir[i * 3]     = Math.sin(phi) * Math.cos(theta);
      dir[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      dir[i * 3 + 2] = -Math.cos(phi); // -z = forward in Three.js default cam
    }

    const g = new THREE.BufferGeometry();
    // position unused by shader but BufferGeometry requires one
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 1));
    g.setAttribute('aSpd', new THREE.Float32BufferAttribute(spd, 1));
    g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3));
    g.setAttribute('aSz',  new THREE.Float32BufferAttribute(sz,  1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);

    const m = new THREE.ShaderMaterial({
      vertexShader: STARS_VERT, fragmentShader: STARS_FRAG,
      uniforms: { uT: { value: 0 }, uBright: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return { sGeo: g, sMat: m };
  }, []);
  useEffect(() => () => { sGeo.dispose(); sMat.dispose(); }, [sGeo, sMat]);

  // ── Disk flash: massive plane, additive amber ──────────────────────────────
  const diskMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.55, 0.08),
    side: THREE.DoubleSide, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }), []);
  useEffect(() => () => diskMat.dispose(), [diskMat]);

  // ── Second disk flash (inner orange ring cross-section) ────────────────────
  const disk2Mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.85, 0.4),
    side: THREE.DoubleSide, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }), []);
  useEffect(() => () => disk2Mat.dispose(), [disk2Mat]);

  // ── Einstein ring ──────────────────────────────────────────────────────────
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.8, 2.0, 1.0),
    transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }), []);
  const ringRef = useRef<THREE.Mesh>(null);
  useEffect(() => () => ringMat.dispose(), [ringMat]);

  // ── Gravity waves ──────────────────────────────────────────────────────────
  const GW = 8;
  const gwMats = useMemo(() =>
    Array.from({ length: GW }, (_, i) => new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.55 + i * 0.05, 0.75, 1.0),
      transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })),
  []);
  const gwRefs = useRef<(THREE.Mesh | null)[]>(Array(GW).fill(null));
  useEffect(() => () => gwMats.forEach(m => m.dispose()), [gwMats]);

  // ── Re-emergence star field (far background) ───────────────────────────────
  const { rGeo, rMat } = useMemo(() => {
    const pos = new Float32Array(5000 * 3);
    const sz  = new Float32Array(5000);
    for (let i = 0; i < 5000; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r  = 80 + Math.random() * 120;
      pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pos[i*3+2] = r * Math.cos(ph);
      sz[i] = 0.5 + Math.random() * 1.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('size', new THREE.Float32BufferAttribute(sz, 1));
    const m = new THREE.PointsMaterial({
      size: 0.25, sizeAttenuation: true,
      color: new THREE.Color(0.9, 0.93, 1.0),
      transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return { rGeo: g, rMat: m };
  }, []);
  useEffect(() => () => { rGeo.dispose(); rMat.dispose(); }, [rGeo, rMat]);

  // ── Geometry ───────────────────────────────────────────────────────────────
  const diskGeo  = useMemo(() => new THREE.PlaneGeometry(400, 400), []);
  const disk2Geo = useMemo(() => new THREE.PlaneGeometry(80, 80), []);
  const eGeo     = useMemo(() => new THREE.TorusGeometry(1, 0.14, 8, 256), []);
  const gwGeo    = useMemo(() => new THREE.RingGeometry(0.97, 1.0, 192), []);
  useEffect(() => () => {
    diskGeo.dispose(); disk2Geo.dispose(); eGeo.dispose(); gwGeo.dispose();
  }, [diskGeo, disk2Geo, eGeo, gwGeo]);

  // ── Frame loop ─────────────────────────────────────────────────────────────
  useFrame((_, dt) => {
    elapsed.current = Math.min(elapsed.current + dt, DURATION + 0.5);
    const p = elapsed.current;

    // Stars: 0.4–3.8s
    sMat.uniforms.uT.value     += dt * 0.38;
    sMat.uniforms.uBright.value = ss(0.4, 1.4, p) * ss(3.8, 2.8, p);

    // Disk flash: peaks at 0.7s, gone by 2.0s
    diskMat.opacity  = ss(0.0, 0.4, p) * ss(2.0, 0.9, p) * 0.72;
    // Brighter inner cross-section: peaks at 0.5s
    disk2Mat.opacity = ss(0.0, 0.3, p) * ss(1.6, 0.6, p) * 0.55;

    // Einstein ring: appears at 1.6s, contracts from r=24→0.4, gone at 3.4s
    ringMat.opacity = ss(1.6, 2.3, p) * ss(3.4, 2.8, p) * 0.92;
    if (ringRef.current) {
      const scale = THREE.MathUtils.lerp(24, 0.4, ss(1.6, 3.4, p));
      ringRef.current.scale.setScalar(Math.max(scale, 0.01));
    }

    // Gravity waves: 3.0s → 8 waves, 0.38s apart
    for (let i = 0; i < GW; i++) {
      const wt = Math.max(0, p - 3.0 - i * 0.38);
      const wr = wt * 16;
      const wa = Math.max(0, 1 - wt / 1.3) * ss(3.0, 3.5, p);
      const mesh = gwRefs.current[i];
      if (mesh) {
        mesh.scale.setScalar(Math.max(0.001, wr));
        (mesh.material as THREE.MeshBasicMaterial).opacity = wa * 0.5;
      }
    }

    // Re-emergence stars: fade in from 3.8s
    rMat.opacity = ss(3.8, 5.0, p) * 0.6;

    // Veil pre-fires at 4.6s to cover the scene swap (DESCENT→MIRA_PULSAR)
    if (p >= 4.6 && !veilFired.current) {
      veilFired.current = true;
      useScene.getState().setVeil(1);
    }

    if (p >= DURATION && !fired.current) {
      fired.current = true;
      setPhase('MIRA_PULSAR');
    }
  });

  return (
    <>
      {/* Very faint ambient — interior should feel dark */}
      <ambientLight intensity={0.012} />

      {/* Accretion disk crossing flash — large plane facing camera */}
      <mesh geometry={diskGeo}  material={diskMat}  position={[0, 0, -12]} frustumCulled={false} />
      <mesh geometry={disk2Geo} material={disk2Mat} position={[0, 0, -4]}  frustumCulled={false} />

      {/* Relativistic star burst */}
      <points geometry={sGeo} material={sMat} frustumCulled={false} />

      {/* Einstein ring — contracts as photon sphere passes */}
      <mesh ref={ringRef} geometry={eGeo} material={ringMat} position={[0, 0, -10]} frustumCulled={false} />

      {/* Gravitational wave pulses */}
      {gwMats.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => { gwRefs.current[i] = el; }}
          geometry={gwGeo}
          material={m}
          rotation={[Math.PI / 2, 0, 0]}
          frustumCulled={false}
        />
      ))}

      {/* Re-emergence field */}
      <points geometry={rGeo} material={rMat} frustumCulled={false} />
    </>
  );
}
