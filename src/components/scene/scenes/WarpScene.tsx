'use client';

/**
 * WarpScene — "INTO THE VOID"
 *
 * 5-second cinematic transition directed in the spirit of Nolan/Fraser.
 * Picks up where the BH canvas left off (chromatic line on black) and
 * carries the audience through a spacetime tunnel into STRANGEON.
 *
 *   BEAT 1 (0.0–1.0s)  THE TEAR        Reality rips open from horizontal line
 *   BEAT 2 (0.8–2.7s)  THE TUNNEL      Spacetime conduit, FBM-warped walls, rings rushing
 *   BEAT 3 (1.5–3.6s)  ACCELERATION    LineSegments2 streaks racing past at relativistic speed
 *   BEAT 4 (3.4–4.0s)  THE FLASH       Anamorphic horizontal flare, overexposed peak
 *   BEAT 5 (4.0–5.0s)  REVEAL          New universe stars + 200ms black before STRANGEON
 *
 * Post-processing: Bloom + Chromatic Aberration + Vignette (mounted at
 * SceneManager level so it covers the whole canvas).
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';

const DURATION = 5.0;

// ─── Asymmetric easing (Nolan-style timing curves) ──────────────────────────
const easeOutExpo  = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInQuart  = (t: number) => t * t * t * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const ss = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
// pow rise / pow fall — asymmetric flash (not gaussian)
const flashCurve = (t: number) =>
  t < 0.5
    ? Math.pow(t * 2, 6)            // sharp rise
    : Math.pow(1 - (t - 0.5) * 2, 3); // gentler fall

// ─── Tunnel shader: FBM-warped, vignette-faded ───────────────────────────────
const TUNNEL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TUNNEL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  // Hash + noise + FBM (Inigo Quilez style)
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    // vUv.y = along the tube (0 = front near camera, 1 = back/far)
    // vUv.x = around the tube
    float along  = vUv.y;
    float around = vUv.x;

    // FBM-warp the UV coordinates (kills "shader toy" sin look)
    vec2 warpUv = vec2(around * 6.0, along * 4.0 - uTime * 0.6);
    float warp  = fbm(warpUv) * 0.25;

    // Concentric rings rushing forward (FBM-modulated, not pure sin)
    float ring1 = sin((along - uTime * 1.4 + warp) * 80.0) * 0.5 + 0.5;
    float ring2 = sin((along - uTime * 2.8 + warp * 0.5) * 30.0) * 0.5 + 0.5;
    ring1 = pow(ring1, 3.0);
    ring2 = pow(ring2, 6.0);

    // Striations — broken-up by FBM
    float stri = fbm(vec2(around * 18.0, along * 6.0 - uTime * 0.5));

    // Vignette: corners go dark, central tube channel stays bright
    // distFromCenter is the angular distance from the tube's "axis"
    // For a tube viewed from inside, the "axis" runs along Y (UV.y)
    // so x distance = abs(around - 0.5)
    float distFromAxis = abs(around - 0.5) * 2.0;
    float vignette = 1.0 - pow(distFromAxis, 2.5);

    // Color gradient: deep cobalt distance → cyan → white-hot
    vec3 deep = vec3(0.04, 0.08, 0.35);
    vec3 mid  = vec3(0.18, 0.55, 1.0);
    vec3 hot  = vec3(1.0, 0.92, 0.7);
    vec3 col  = mix(deep, mid, smoothstep(0.0, 0.6, along));
    col = mix(col, hot, ring1);
    col += hot * ring2 * 0.9;
    col *= 0.45 + stri * 0.9;

    // Distance fade — far end darkens
    float fade = 1.0 - smoothstep(0.0, 0.92, along);
    col *= vignette * fade * uIntensity * 2.4;

    gl_FragColor = vec4(col, fade * vignette * uIntensity);
  }
`;

// ─── Streak shader (billboarded stretched planes) ────────────────────────────
const STREAK_VERT = /* glsl */ `
  attribute float aSeed;
  attribute vec3  aBase;
  uniform float   uT;
  uniform float   uSpeed;
  uniform float   uIntensity;
  varying float   vAlpha;
  varying float   vLife;

  void main() {
    float life = fract(aSeed + uT * uSpeed);
    vec3 pos = aBase;
    pos.z = mix(-180.0, 25.0, life); // far → near (toward camera at z=0+)

    vAlpha = uIntensity * smoothstep(0.0, 0.06, life) * smoothstep(1.0, 0.85, life);
    vLife  = life;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mv;
    // Stretch by velocity — bigger when near camera (relativistic streak)
    gl_PointSize = (3.0 + (1.0 - life) * 8.0) * 240.0 / max(-mv.z, 1.0);
  }
`;

const STREAK_FRAG = /* glsl */ `
  varying float vAlpha;
  varying float vLife;
  void main() {
    if (vAlpha < 0.01) discard;
    vec2 uv = gl_PointCoord - 0.5;
    // Streak: very narrow horizontal, tall vertical (stretched line)
    uv.x *= 8.0;  // squish horizontal → narrow
    float r = length(uv);
    if (r > 0.5) discard;
    float a = vAlpha * (1.0 - r * 2.0);
    // Color: blue/cyan when far, white-hot when near
    vec3 col = mix(vec3(0.55, 0.85, 1.0), vec3(1.0, 0.97, 0.92), 1.0 - vLife);
    gl_FragColor = vec4(col, a);
  }
`;

// ─── Anamorphic flare shader (Fraser signature horizontal streak) ────────────
const FLARE_FRAG = /* glsl */ `
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    // Horizontal anamorphic streak: very wide, very thin
    float horiz = exp(-pow(c.y * 60.0, 2.0)) * exp(-pow(c.x * 1.5, 2.0));
    // Central core
    float core  = exp(-pow(length(c) * 8.0, 2.0));
    float v = horiz * 1.5 + core * 0.8;
    vec3 col = vec3(1.0, 0.97, 0.95) * v * uIntensity;
    gl_FragColor = vec4(col, v * uIntensity);
  }
`;

const FLARE_VERT = TUNNEL_VERT;

// ─── COUNTS ─────────────────────────────────────────────────────────────────
const STREAK_COUNT = 6000;
const REVEAL_STARS = 4000;

export default function WarpScene() {
  const setPhase = useScene((s) => s.setPhase);
  const setVeil  = useScene((s) => s.setVeil);
  const { gl }   = useThree();

  const elapsed   = useRef(0);
  const fired     = useRef(false);
  const veilFired = useRef(false);

  const tearRef    = useRef<THREE.Mesh>(null);
  const tunnelRef  = useRef<THREE.Mesh>(null);
  const flareRef   = useRef<THREE.Mesh>(null);
  const flashRef   = useRef<THREE.Mesh>(null);

  // ACES tone mapping for filmic look
  useEffect(() => {
    const prevTone     = gl.toneMapping;
    const prevExposure = gl.toneMappingExposure;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.15;
    return () => {
      gl.toneMapping = prevTone;
      gl.toneMappingExposure = prevExposure;
    };
  }, [gl]);

  // ── TEAR: bright thin plane, opens reality ─────────────────────────────────
  const tearMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);
  const tearGeo = useMemo(() => new THREE.PlaneGeometry(60, 1.2), []);

  // ── TUNNEL ─────────────────────────────────────────────────────────────────
  // Engineer's correction: 6 (front, near camera) → 40 (back, far) so it
  // converges toward the vanishing point as you rush through.
  const tunnelMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: TUNNEL_VERT, fragmentShader: TUNNEL_FRAG,
    uniforms: {
      uTime:      { value: 0 },
      uIntensity: { value: 0 },
    },
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
  }), []);
  const tunnelGeo = useMemo(
    () => new THREE.CylinderGeometry(6, 40, 220, 64, 96, true),
    [],
  );

  // ── STREAKS ────────────────────────────────────────────────────────────────
  const { streakGeo, streakMat } = useMemo(() => {
    const seeds = new Float32Array(STREAK_COUNT);
    const base  = new Float32Array(STREAK_COUNT * 3);
    const pos   = new Float32Array(STREAK_COUNT * 3);
    for (let i = 0; i < STREAK_COUNT; i++) {
      seeds[i] = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const r = 4 + Math.pow(Math.random(), 0.5) * 35;
      base[i * 3]     = Math.cos(theta) * r;
      base[i * 3 + 1] = Math.sin(theta) * r;
      base[i * 3 + 2] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos,  3));
    g.setAttribute('aSeed',    new THREE.Float32BufferAttribute(seeds, 1));
    g.setAttribute('aBase',    new THREE.Float32BufferAttribute(base,  3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 300);

    const m = new THREE.ShaderMaterial({
      vertexShader: STREAK_VERT, fragmentShader: STREAK_FRAG,
      uniforms: {
        uT:         { value: 0 },
        uSpeed:     { value: 0.3 },
        uIntensity: { value: 0 },
      },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { streakGeo: g, streakMat: m };
  }, []);

  // ── ANAMORPHIC FLARE ───────────────────────────────────────────────────────
  const flareMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: FLARE_VERT, fragmentShader: FLARE_FRAG,
    uniforms: { uIntensity: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), []);
  const flareGeo = useMemo(() => new THREE.PlaneGeometry(120, 60), []);

  // ── FLASH ──────────────────────────────────────────────────────────────────
  const flashMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  }), []);
  const flashGeo = useMemo(() => new THREE.PlaneGeometry(800, 800), []);

  // ── REVEAL STARS ───────────────────────────────────────────────────────────
  const { revealGeo, revealMat } = useMemo(() => {
    const pos = new Float32Array(REVEAL_STARS * 3);
    for (let i = 0; i < REVEAL_STARS; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 90 + Math.random() * 220;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      size: 0.6, sizeAttenuation: true, color: 0xeef2ff,
      transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { revealGeo: g, revealMat: m };
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    tearMat.dispose();   tearGeo.dispose();
    tunnelMat.dispose(); tunnelGeo.dispose();
    streakMat.dispose(); streakGeo.dispose();
    flareMat.dispose();  flareGeo.dispose();
    flashMat.dispose();  flashGeo.dispose();
    revealMat.dispose(); revealGeo.dispose();
  }, [tearMat, tearGeo, tunnelMat, tunnelGeo, streakMat, streakGeo,
      flareMat, flareGeo, flashMat, flashGeo, revealMat, revealGeo]);

  // ── Frame loop — directorial timeline ──────────────────────────────────────
  useFrame((_, dt) => {
    elapsed.current = Math.min(elapsed.current + dt, DURATION + 0.5);
    const p = elapsed.current;

    // ─ BEAT 1 (0.0–1.0s) — TEAR
    // The tear was reading as a fullscreen white-out: a 60×1.2 plane scaled
    // 7×50 with additive-blend opacity 1.0 in front of a bloom postprocess
    // basically guarantees a blown-out frame. Drop opacity to 0.18 and cap
    // the scale so the line stays a thin chromatic seam rather than a full
    // canvas takeover.
    const tearK = easeOutExpo(ss(0.0, 1.0, p));
    const tearOpacity = ss(0.0, 0.25, p) * ss(1.4, 0.7, p) * 0.18;
    tearMat.opacity = tearOpacity;
    if (tearRef.current) {
      tearRef.current.scale.set(1 + tearK * 4, 1 + tearK * 6, 1);
      tearRef.current.rotation.z = tearK * Math.PI * 0.5;
    }

    // ─ BEAT 2 (0.8–2.7s) — TUNNEL
    const tunnelI = ss(0.8, 1.6, p) * ss(3.6, 2.7, p);
    tunnelMat.uniforms.uTime.value     += dt;
    tunnelMat.uniforms.uIntensity.value = tunnelI;
    if (tunnelRef.current) {
      tunnelRef.current.rotation.z += dt * 0.35;
      // Pull tunnel toward camera as the rush deepens
      tunnelRef.current.position.z = THREE.MathUtils.lerp(-110, -40, ss(0.8, 3.0, p));
    }

    // ─ BEAT 3 (1.5–3.6s) — STREAKS
    streakMat.uniforms.uT.value     += dt;
    streakMat.uniforms.uIntensity.value = ss(1.5, 2.0, p) * ss(3.8, 3.2, p);
    streakMat.uniforms.uSpeed.value     = 0.3 + easeInQuart(ss(1.5, 3.5, p)) * 0.9;

    // ─ BEAT 4 — DISABLED.
    // The 800×800 fullscreen flash plane and the 120×60 anamorphic flare
    // plane both got amplified by PostFX bloom into a fullscreen white-out
    // (any positive intensity bloomed across the whole frame). The dramatic
    // beat now comes from the streaks peaking + tunnel cresting; the white
    // climax is gone because it was reading as a render bug, not cinema.
    flareMat.uniforms.uIntensity.value = 0;
    flashMat.opacity = 0;

    // ─ BEAT 5 (4.0–5.0s) — REVEAL
    // 200ms of pure black between flash death and reveal birth (4.0–4.2)
    revealMat.opacity = ss(4.2, 5.0, p) * 0.7;

    // Veil intentionally NOT raised here. Previously WarpScene set veil=1
    // at t=4.5s to mask the BH→cosmic canvas swap, but nothing ever reset
    // it to 0, so an opaque black div at zIndex 50 stayed on top of every
    // post-CROSSING frame. The BH-alpha crossfade in SceneManager now
    // handles the seam visually; the veil is kept as an unused safety net.
    void veilFired;
    void setVeil;

    if (p >= DURATION && !fired.current) {
      fired.current = true;
      // Hand off to the first cosmic scene. (Was 'STRANGEON' — the wrong
      // target phase since the cosmic chain begins at BOSON_STAR / Quantum.)
      setPhase('BOSON_STAR');
    }
  });

  return (
    <>
      <ambientLight intensity={0.015} />

      {/* TEAR — picks up the BH chromatic-line aesthetic */}
      <mesh ref={tearRef} geometry={tearGeo} material={tearMat} position={[0, 0, -3]} />

      {/* TUNNEL — spacetime conduit */}
      <mesh
        ref={tunnelRef}
        geometry={tunnelGeo}
        material={tunnelMat}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -110]}
      />

      {/* STREAKS — relativistic stars */}
      <points geometry={streakGeo} material={streakMat} frustumCulled={false} />

      {/* ANAMORPHIC FLARE — Fraser signature */}
      <mesh ref={flareRef} geometry={flareGeo} material={flareMat} position={[0, 0, -2]} />

      {/* FLASH — overexposed climax */}
      <mesh ref={flashRef} geometry={flashGeo} material={flashMat} position={[0, 0, -1.5]} />

      {/* REVEAL — new universe */}
      <points geometry={revealGeo} material={revealMat} />
    </>
  );
}
