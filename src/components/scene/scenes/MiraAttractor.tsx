'use client';

/**
 * MiraAttractor — 65k particles bound to the Aizawa strange attractor.
 *
 * Inspired by merrypranxter/strange_attractors (Apr 14 2026, custom WebGL2
 * FBO ping-pong, NOT GPUComputationRenderer). We re-implement the math from
 * scratch using the public-domain Aizawa equations (Aizawa, 1985) — the
 * formulas are not copyrightable; the technique is well-known.
 *
 * Pipeline
 *   1. Two THREE.WebGLRenderTarget at 256×256, RGBAFormat + FloatType.
 *      RGB = particle position. A = life ∈ [0,1].
 *   2. Compute pass each frame: fullscreen quad fragment shader reads the
 *      "read" RT, integrates one RK4 step of the Aizawa ODE, writes to the
 *      "write" RT. Swap pointers.
 *   3. Render pass: <points> with a vertex shader that samples the position
 *      texture (current read RT) at aRef ∈ [0,1]² to get the world position.
 *   4. State preservation around the compute pass — save renderer state,
 *      do the compute render, restore. This is the documented fix for the
 *      "GPGPU texture leaks onto screen" bug that broke the prior MiraWisps.
 *
 * Aizawa equations (canonical parameters from Aizawa 1985):
 *   dx/dt = (z − b)·x − d·y
 *   dy/dt = d·x + (z − b)·y
 *   dz/dt = c + a·z − z³/3 − (x² + y²)·(1 + e·z) + f·z·x³
 * with a=0.95, b=0.7, c=0.6, d=3.5, e=0.25, f=0.1
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const TEX_W = 256;
const COUNT = TEX_W * TEX_W;        // 65 536 particles
const SCALE = 4.0;                  // attractor lives in ~±1.5; multiply for body wrap

// ─── Compute pass: integrate Aizawa ODE in a ping-pong FBO ──────────────────
const computeVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const computeFrag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform float uTime;
  uniform float uDelta;
  uniform float uFrame;       // 0 on first frame → spawn from random init

  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7,  74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  // Aizawa ODE derivative at point p.
  vec3 aizawa(vec3 p) {
    const float a = 0.95;
    const float b = 0.70;
    const float c = 0.60;
    const float d = 3.50;
    const float e = 0.25;
    const float f = 0.10;
    float dx = (p.z - b) * p.x - d * p.y;
    float dy = d * p.x + (p.z - b) * p.y;
    float dz = c + a * p.z - (p.z * p.z * p.z) / 3.0
             - (p.x * p.x + p.y * p.y) * (1.0 + e * p.z)
             + f * p.z * (p.x * p.x * p.x);
    return vec3(dx, dy, dz);
  }

  void main() {
    vec3 pos;
    float life;

    if (uFrame < 0.5) {
      // Initial spawn: random points in a small basin near origin so the
      // attractor pulls them onto its manifold within a few frames.
      vec3 r = hash3(vec3(vUv * 137.0, 1.0));
      pos = r * 0.6;
      life = fract(vUv.x * 17.0 + vUv.y * 23.0);
    } else {
      vec4 prev = texture2D(uPrev, vUv);
      pos = prev.xyz;
      life = prev.a;

      if (life > 1.0) {
        // Respawn: random point in basin. New life starts at 0.
        vec3 r = hash3(vec3(vUv * 1000.0, uTime));
        pos = r * 0.6;
        life = 0.0;
      } else {
        // RK4 integration. Step size tuned so the attractor reads as
        // smooth flow rather than chaotic noise; matches typical Aizawa
        // visualisations.
        float h = uDelta * 0.55;
        vec3 k1 = aizawa(pos);
        vec3 k2 = aizawa(pos + 0.5 * h * k1);
        vec3 k3 = aizawa(pos + 0.5 * h * k2);
        vec3 k4 = aizawa(pos + h * k3);
        pos += h * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;

        life += uDelta * 0.06;
      }
    }

    gl_FragColor = vec4(pos, life);
  }
`;

// ─── Render pass: points sample the position texture ────────────────────────
const renderVert = /* glsl */ `
  attribute vec2 aRef;
  uniform sampler2D uPositions;
  uniform float uScale;
  uniform float uPx;
  uniform float uSize;
  varying float vLife;
  varying vec3  vColor;

  void main() {
    vec4 p = texture2D(uPositions, aRef);
    vec3 pos = p.xyz * uScale;
    vLife = p.a;

    // Per-particle colour from a deterministic hash of its uv. Two-stop
    // ramp: cool blue → warm amber. Some particles read cool, some warm —
    // gives the field internal colour variation instead of monochrome.
    float h = fract(sin(aRef.x * 12.9898 + aRef.y * 78.233) * 43758.5453);
    vec3 cold = vec3(0.55, 0.78, 1.10);
    vec3 warm = vec3(1.15, 0.85, 0.55);
    vColor = mix(cold, warm, smoothstep(0.30, 0.70, h));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float ps = uSize * uPx * (14.0 / max(0.5, -mv.z));
    gl_PointSize = clamp(ps, 0.6, 4.5);
  }
`;

const renderFrag = /* glsl */ `
  varying float vLife;
  varying vec3  vColor;
  uniform float uReveal;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float disc = 1.0 - r * 2.0;

    // Life envelope: fade in / fade out so particle pops don't read as
    // hard cuts at respawn boundaries.
    float fadeIn  = smoothstep(0.00, 0.05, vLife);
    float fadeOut = 1.0 - smoothstep(0.85, 1.00, vLife);

    float a = disc * fadeIn * fadeOut * uReveal * 0.55;
    gl_FragColor = vec4(vColor * (0.65 + disc * 0.9), a);
  }
`;

export interface MiraAttractorProps {
  /** 0..1 reveal — alpha + activity ramps as user scrolls into MIRA. */
  reveal: number;
}

export default function MiraAttractor({ reveal }: MiraAttractorProps) {
  const { gl } = useThree();
  const pointsRef = useRef<THREE.Points>(null);

  // ── Two render targets (ping-pong) ───────────────────────────────────────
  const { rtA, rtB } = useMemo(() => {
    const opts: THREE.RenderTargetOptions = {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    };
    return {
      rtA: new THREE.WebGLRenderTarget(TEX_W, TEX_W, opts),
      rtB: new THREE.WebGLRenderTarget(TEX_W, TEX_W, opts),
    };
  }, []);

  const readRef  = useRef<THREE.WebGLRenderTarget>(rtA);
  const writeRef = useRef<THREE.WebGLRenderTarget>(rtB);
  const frameRef = useRef(0);

  // ── Compute pass: a tiny offscreen scene with one fullscreen quad ────────
  const { computeMaterial, computeScene, computeCamera } = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPrev:  { value: null },
        uTime:  { value: 0 },
        uDelta: { value: 0 },
        uFrame: { value: 0 },
      },
      vertexShader: computeVert,
      fragmentShader: computeFrag,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { computeMaterial: material, computeScene: scene, computeCamera: camera };
  }, []);

  // ── Render geometry: one vertex per particle, references its texel ───────
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const refs = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      refs[i * 2 + 0] = ((i % TEX_W) + 0.5) / TEX_W;
      refs[i * 2 + 1] = (Math.floor(i / TEX_W) + 0.5) / TEX_W;
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute('aRef', new THREE.BufferAttribute(refs, 2));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), SCALE * 5);
    return g;
  }, []);

  const renderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uPositions: { value: null },
      uScale:     { value: SCALE },
      uPx:        { value: 1.5 },
      uSize:      { value: 0.20 },
      uReveal:    { value: reveal },
    },
    vertexShader: renderVert,
    fragmentShader: renderFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useEffect(() => {
    renderMaterial.uniforms.uReveal.value = reveal;
  }, [reveal, renderMaterial]);

  // ── Per-frame: compute pass + render pass uniform bind ───────────────────
  // Bug we're avoiding: when render target / autoClear / scissor state are
  // mutated mid-frame without restoration, R3F's automatic render runs with
  // the wrong WebGL state and either skips the screen or composites the
  // compute target onto the canvas. The save/restore pattern below is the
  // documented fix (Three.js discourse 2023+).
  useFrame((state, delta) => {
    const dt = Math.min(1 / 30, Math.max(1 / 240, delta));
    computeMaterial.uniforms.uTime.value  = state.clock.elapsedTime;
    computeMaterial.uniforms.uDelta.value = dt;
    computeMaterial.uniforms.uFrame.value = frameRef.current;
    computeMaterial.uniforms.uPrev.value  = readRef.current.texture;

    const renderer = gl;
    const savedRT          = renderer.getRenderTarget();
    const savedAutoClear   = renderer.autoClear;
    const savedAutoClearC  = renderer.autoClearColor;
    const savedAutoClearD  = renderer.autoClearDepth;
    const savedAutoClearS  = renderer.autoClearStencil;
    const savedScissor     = renderer.getScissorTest();

    renderer.setRenderTarget(writeRef.current);
    renderer.autoClear        = true;
    renderer.autoClearColor   = true;
    renderer.autoClearDepth   = false;
    renderer.autoClearStencil = false;
    renderer.setScissorTest(false);
    renderer.render(computeScene, computeCamera);

    renderer.setRenderTarget(savedRT);
    renderer.autoClear        = savedAutoClear;
    renderer.autoClearColor   = savedAutoClearC;
    renderer.autoClearDepth   = savedAutoClearD;
    renderer.autoClearStencil = savedAutoClearS;
    renderer.setScissorTest(savedScissor);

    // Swap read/write.
    const tmp = readRef.current;
    readRef.current = writeRef.current;
    writeRef.current = tmp;

    // Hand the freshly-written texture to the render material.
    renderMaterial.uniforms.uPositions.value = readRef.current.texture;

    frameRef.current += 1;
  });

  useEffect(() => () => {
    rtA.dispose();
    rtB.dispose();
    computeMaterial.dispose();
    renderMaterial.dispose();
    geometry.dispose();
  }, [rtA, rtB, computeMaterial, renderMaterial, geometry]);

  return (
    <points ref={pointsRef} geometry={geometry} material={renderMaterial} frustumCulled={false} />
  );
}
