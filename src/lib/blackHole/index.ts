/**
 * Faithful port of Bruno Simon's webgl-black-hole experience to a single
 * factory function. Mirrors the original architecture exactly:
 *
 *   - 3 scenes: space, distortion, overlay
 *   - 2 render targets: spaceRT (2x), distortionRT (0.5x, RedFormat float)
 *   - multi-pass: space → spaceRT → distortion → distortionRT → final composite
 *   - OrbitControls drives camera; mouse-drag = 360° orbit
 *
 * Reference: https://github.com/brunosimon/webgl-black-hole
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  discVert, discFrag,
  discParticlesVert, discParticlesFrag,
  starsVert, starsFrag,
  distortionVert, distortionActiveFrag, distortionMaskFrag,
  finalVert, finalFrag,
  noisesVert, noisesFrag,
} from './shaders';

export interface BlackHoleHandle {
  readonly canvas: HTMLCanvasElement;
  destroy: () => void;
  /** Drive the scroll-approach animation. 0 = at rest, 1 = threshold (DESCENT fires). */
  setProgress: (p: number) => void;
}

export interface BlackHoleOptions {
  /** Container element to mount the canvas inside */
  target: HTMLElement;
  /** Inner ring color (hot side near event horizon). Default '#ff8080'. */
  innerColor?: string;
  /** Outer ring color (cool side). Default '#3633ff'. */
  outerColor?: string;
  /** Disable user orbit interaction (still animates). Default false. */
  disableInteraction?: boolean;
}

const PARTICLES = 50_000;
const STARS     = 50_000;

export function createBlackHole(opts: BlackHoleOptions): BlackHoleHandle {
  const target = opts.target;
  const inner  = new THREE.Color(opts.innerColor ?? '#ff8080');
  const outer  = new THREE.Color(opts.outerColor ?? '#3633ff');

  // ── Sizing ──────────────────────────────────────────────────────────────────
  const rect = target.getBoundingClientRect();
  let width  = rect.width  || window.innerWidth;
  let height = rect.height || window.innerHeight;
  const dpr  = Math.min(Math.max(window.devicePixelRatio, 1), 2);

  // ── Renderer ────────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
  renderer.setClearColor(0x000000, 1);
  renderer.setSize(width, height);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  Object.assign(renderer.domElement.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    cursor: 'grab',  // overrides body { cursor: none } so the user sees a grab handle
  });
  renderer.domElement.addEventListener('pointerdown', () => { renderer.domElement.style.cursor = 'grabbing'; });
  renderer.domElement.addEventListener('pointerup',   () => { renderer.domElement.style.cursor = 'grab'; });
  renderer.domElement.addEventListener('pointercancel', () => { renderer.domElement.style.cursor = 'grab'; });
  target.appendChild(renderer.domElement);

  // ── Scenes ──────────────────────────────────────────────────────────────────
  const spaceScene      = new THREE.Scene();
  const distortionScene = new THREE.Scene();

  // ── Camera ──────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(5, 2, 5);
  camera.lookAt(0, 0, 0);
  spaceScene.add(camera);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom    = false;
  controls.enablePan     = false;
  controls.rotateSpeed   = 0.7;
  controls.minDistance   = 4;
  controls.maxDistance   = 12;
  controls.enabled       = !opts.disableInteraction;

  // ── Render targets ──────────────────────────────────────────────────────────
  const spaceRT = new THREE.WebGLRenderTarget(width * 2, height * 2, {
    magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter,
  });
  const distortionRT = new THREE.WebGLRenderTarget(
    Math.floor(width * 0.5), Math.floor(height * 0.5),
    {
      magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter,
      format: THREE.RedFormat, type: THREE.FloatType,
    },
  );

  // ── Noise texture (one-shot Perlin render to RT) ────────────────────────────
  const noiseTex = (() => {
    const noiseScene  = new THREE.Scene();
    const noiseCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const noiseRT     = new THREE.WebGLRenderTarget(128, 128, {
      generateMipmaps: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
    });
    const noiseMat = new THREE.RawShaderMaterial({
      glslVersion:    THREE.GLSL3,
      vertexShader:   noisesVert,
      fragmentShader: noisesFrag,
    });
    const noisePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), noiseMat);
    noisePlane.frustumCulled = false;
    noiseScene.add(noisePlane);

    renderer.setRenderTarget(noiseRT);
    renderer.render(noiseScene, noiseCamera);
    renderer.setRenderTarget(null);

    noiseMat.dispose();
    noisePlane.geometry.dispose();
    return noiseRT.texture;
  })();

  // ── Common uniforms (shared between disc + particles) ───────────────────────
  const uInnerColor = { value: inner };
  const uOuterColor = { value: outer };

  // ── Disc (Bruno's exact CylinderGeometry(5, 1, 0, 64, 10, true)) ────────────
  const discMat = new THREE.RawShaderMaterial({
    glslVersion:    THREE.GLSL3,
    side:           THREE.DoubleSide,
    blending:       THREE.AdditiveBlending,
    depthWrite:     false,
    depthTest:      false,
    transparent:    true,
    uniforms: {
      uTime:         { value: 0 },
      uNoiseTexture: { value: noiseTex },
      uInnerColor,
      uOuterColor,
      uCamAzimuth:   { value: 0 },
    },
    vertexShader:   discVert,
    fragmentShader: discFrag,
  });
  const discMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 1, 0, 64, 10, true),
    discMat,
  );
  // 0.75× world-scale so disc fits comfortably within viewport at default FOV
  discMesh.scale.setScalar(0.75);
  spaceScene.add(discMesh);

  // ── Disc particles (50k, radial-spiral via vertex shader) ───────────────────
  const partGeo = new THREE.BufferGeometry();
  {
    const distArr = new Float32Array(PARTICLES);
    const sizeArr = new Float32Array(PARTICLES);
    const rndArr  = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      distArr[i] = Math.random();
      sizeArr[i] = Math.random();
      rndArr[i]  = Math.random();
    }
    partGeo.setAttribute('position', new THREE.Float32BufferAttribute(distArr, 1));
    partGeo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sizeArr, 1));
    partGeo.setAttribute('aRandom',  new THREE.Float32BufferAttribute(rndArr,  1));
    // 1-component position breaks auto bounding sphere; supply manually.
    partGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  }
  const partMat = new THREE.RawShaderMaterial({
    glslVersion:    THREE.GLSL3,
    blending:       THREE.AdditiveBlending,
    depthWrite:     false,
    depthTest:      false,
    transparent:    true,
    uniforms: {
      uTime:       { value: 0 },
      uInnerColor,
      uOuterColor,
      uViewHeight: { value: spaceRT.height },
      uSize:       { value: 0.015 },
      uCamAzimuth: { value: 0 },
    },
    vertexShader:   discParticlesVert,
    fragmentShader: discParticlesFrag,
  });
  const partPoints = new THREE.Points(partGeo, partMat);
  partPoints.frustumCulled = false;
  partPoints.scale.setScalar(0.75);   // match disc scale
  spaceScene.add(partPoints);

  // ── Stars (50k random points on r=400 sphere) ───────────────────────────────
  const starGeo = new THREE.BufferGeometry();
  {
    const pos  = new Float32Array(STARS * 3);
    const sz   = new Float32Array(STARS);
    const col  = new Float32Array(STARS * 3);
    const c    = new THREE.Color();
    for (let i = 0; i < STARS; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi   = Math.acos(2 * Math.random() - 1.0);
      pos[i * 3]     = Math.cos(theta) * Math.sin(phi) * 400;
      pos[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * 400;
      pos[i * 3 + 2] = Math.cos(phi) * 400;
      sz[i] = Math.random();
      c.setHSL(Math.random(), 1.0, 0.8);
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    starGeo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sz,  1));
    starGeo.setAttribute('aColor',   new THREE.Float32BufferAttribute(col, 3));
  }
  const starsMat = new THREE.RawShaderMaterial({
    glslVersion:    THREE.GLSL3,
    depthWrite:     false,
    depthTest:      false,
    uniforms: {
      uViewHeight: { value: spaceRT.height },
      uSize:       { value: 0.001 },
    },
    vertexShader:   starsVert,
    fragmentShader: starsFrag,
  });
  const starsPoints = new THREE.Points(starGeo, starsMat);
  starsPoints.frustumCulled = false;
  spaceScene.add(starsPoints);

  // ──────────────────────────────────────────────────────────────────────────
  // EXTENDED JOURNEY — wormhole tunnel + new universe + neutron star
  // The BH is at origin. The new universe lives on the other side at z = -200.
  // Camera path travels continuously from BH-orbit → through BH → tunnel → pulsar.
  // ──────────────────────────────────────────────────────────────────────────

  // ── Wormhole tunnel: stack of glowing rings between BH (z=0) and new space ─
  // Each ring is a thin torus positioned along z-axis. Their additive emission
  // creates the "rushing through a tunnel" sensation when the camera traverses.
  const TUNNEL_RINGS = 24;
  const tunnelGroup  = new THREE.Group();
  const tunnelMats: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < TUNNEL_RINGS; i++) {
    const z = -8 - i * 7;          // -8 → -169
    const radius = 1.6 + (i % 5) * 0.25;
    const tubeR  = 0.04 + Math.random() * 0.05;
    // Color cycles cool→warm along the tunnel
    const hue    = 0.55 + i * 0.012;
    const col    = new THREE.Color().setHSL(hue, 0.85, 0.55);
    const mat    = new THREE.MeshBasicMaterial({
      color:        col,
      transparent:  true,
      opacity:      0,
      blending:     THREE.AdditiveBlending,
      depthWrite:   false,
    });
    tunnelMats.push(mat);
    const geo = new THREE.TorusGeometry(radius, tubeR, 6, 64);
    const m   = new THREE.Mesh(geo, mat);
    m.position.z = z;
    // Slight random rotation for organic variation
    m.rotation.z = Math.random() * Math.PI;
    tunnelGroup.add(m);
  }
  spaceScene.add(tunnelGroup);

  // ── Wormhole streaks: bright point particles streaming past in the tunnel ──
  const TUNNEL_STREAKS = 4000;
  const tunnelStreakGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(TUNNEL_STREAKS * 3);
    const sz  = new Float32Array(TUNNEL_STREAKS);
    for (let i = 0; i < TUNNEL_STREAKS; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r     = 0.3 + Math.pow(Math.random(), 0.6) * 2.0;
      pos[i * 3]     = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(theta) * r;
      pos[i * 3 + 2] = -Math.random() * 175; // distributed along tunnel
      sz[i] = 0.5 + Math.random() * 1.5;
    }
    tunnelStreakGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    tunnelStreakGeo.setAttribute('size',     new THREE.Float32BufferAttribute(sz, 1));
  }
  // Custom shader — clamps gl_PointSize so close streaks don't balloon into
  // chunky pixel blocks. They stay sub-4px at any distance and use opacity
  // for distance-based brightness instead. Star-like, not blocky.
  const tunnelStreakMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: /* glsl */`
      attribute float size;
      varying float vDist;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
        // Pixel size: would be size*30/dist with attenuation, clamp to [0.6, 3.5]
        float ps = size * 28.0 / max(vDist, 0.5);
        gl_PointSize = clamp(ps, 0.6, 3.5);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying float vDist;
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        float a = (1.0 - r * 2.0) * uOpacity;
        // Distance brightness: closer streaks brighter, far ones dim.
        // Inverted Doppler — feels like rushing through them.
        a *= clamp(1.4 - vDist * 0.006, 0.25, 1.4);
        gl_FragColor = vec4(0.95, 0.97, 1.0, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const tunnelStreakPoints = new THREE.Points(tunnelStreakGeo, tunnelStreakMat);
  tunnelStreakPoints.frustumCulled = false;
  spaceScene.add(tunnelStreakPoints);

  // ── Neutron star (the destination — MIRA_PULSAR) ──────────────────────────
  const neutronGeo = new THREE.SphereGeometry(0.9, 48, 48);
  const neutronMat = new THREE.MeshStandardMaterial({
    color:             new THREE.Color('#8B3A1A'),
    emissive:          new THREE.Color('#C84B20'),
    emissiveIntensity: 2.2,
    roughness:         0.7,
  });
  const neutronStar = new THREE.Mesh(neutronGeo, neutronMat);
  neutronStar.position.set(0, 0, -210);
  neutronStar.visible = false; // only revealed when journey progress is high
  spaceScene.add(neutronStar);

  // Point light at the neutron star — pulses with the beam
  const neutronLight = new THREE.PointLight('#88ccff', 0, 80);
  neutronLight.position.set(0, 0, -210);
  spaceScene.add(neutronLight);

  // Soft fill light for the neutron star
  const neutronFill = new THREE.DirectionalLight('#2255aa', 0.6);
  neutronFill.position.set(10, 5, -200);
  spaceScene.add(neutronFill);

  // ── Pulsar beam (BoxGeometry with shader, flashes every 92ms) ──────────────
  const beamUni = { uAlpha: { value: 0.0 } };
  const beamMat = new THREE.ShaderMaterial({
    transparent:  true,
    depthWrite:   false,
    blending:     THREE.AdditiveBlending,
    uniforms:     beamUni,
    vertexShader:   'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float uAlpha;void main(){gl_FragColor=vec4(0.52,0.80,1.0,uAlpha);}',
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(80, 0.06, 0.06), beamMat);
  beam.position.set(0, 0, -210);
  beam.visible = false;
  spaceScene.add(beam);

  // ── Distortion (active = camera-facing, mask = horizontal disc) ─────────────
  const distActiveMat = new THREE.RawShaderMaterial({
    glslVersion:    THREE.GLSL3,
    side:           THREE.DoubleSide,
    transparent:    true,
    uniforms:       {},
    vertexShader:   distortionVert,
    fragmentShader: distortionActiveFrag,
  });
  const distActiveMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), distActiveMat);
  distActiveMesh.scale.setScalar(10);
  distortionScene.add(distActiveMesh);

  const distMaskMat = new THREE.RawShaderMaterial({
    glslVersion:    THREE.GLSL3,
    side:           THREE.DoubleSide,
    transparent:    true,
    uniforms:       {},
    vertexShader:   distortionVert,
    fragmentShader: distortionMaskFrag,
  });
  const distMaskMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), distMaskMat);
  distMaskMesh.scale.setScalar(10);
  distMaskMesh.rotation.x = Math.PI * 0.5;
  distortionScene.add(distMaskMesh);

  // ── Final composite (fullscreen quad with FinalMaterial) ────────────────────
  const finalUniforms = {
    uSpaceTexture:      { value: spaceRT.texture },
    uDistortionTexture: { value: distortionRT.texture },
    uBlackHolePosition: { value: new THREE.Vector2() },
    uRGBShiftRadius:    { value: 0.00001 },
    uDopplerBoost:      { value: 0.0 },
  };
  const finalMat = new THREE.RawShaderMaterial({
    glslVersion:    THREE.GLSL3,
    depthWrite:     false,
    depthTest:      false,
    uniforms:       finalUniforms,
    vertexShader:   finalVert,
    fragmentShader: finalFrag,
  });
  const finalScene = new THREE.Scene();
  const finalPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), finalMat);
  finalPlane.frustumCulled = false;
  finalScene.add(finalPlane);

  // ── Continuous-curve helpers — used by the journey camera path ──────────────
  // smoothstep with explicit edges
  const ss = (e0: number, e1: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  // Keyframe interpolation: walks through sorted [p, value] pairs and
  // smoothsteps between adjacent ones. Single continuous curve across all
  // of p ∈ [0, 1]. Adjacent segments naturally agree at boundaries because
  // they share the same endpoint value. No piecewise discontinuities.
  const lerpKf = (p: number, kfs: [number, number][]): number => {
    if (p <= kfs[0][0]) return kfs[0][1];
    if (p >= kfs[kfs.length - 1][0]) return kfs[kfs.length - 1][1];
    for (let i = 0; i < kfs.length - 1; i++) {
      const [pa, va] = kfs[i];
      const [pb, vb] = kfs[i + 1];
      if (p >= pa && p <= pb) {
        return va + (vb - va) * ss(pa, pb, p);
      }
    }
    return kfs[kfs.length - 1][1];
  };

  // ── Scroll-approach state ────────────────────────────────────────────────────
  let externalProgress   = 0;
  let approachOrigin: THREE.Vector3 | null = null;

  // ── Animation loop ──────────────────────────────────────────────────────────
  const t0 = performance.now();
  let raf = 0;
  let stopped = false;
  const screenPos = new THREE.Vector3();

  // Cinematic time-lapse factor: scales physical seconds → visual seconds.
  // 0.35 ≈ inner-particle orbit every ~6s of screen time, equivalent to
  // ~150× time-lapse of Sgr A*'s real ISCO orbital period (~25 min). Matches
  // NASA Schnittman's pacing convention for educational disk visualizations.
  const TIME_SCALE = 0.35;

  function tick() {
    if (stopped) return;
    const elapsed = (performance.now() - t0) / 1000;
    const t = elapsed * TIME_SCALE;

    // ── Continuous journey camera path ───────────────────────────────────────
    // ONE shot — every value below is a SINGLE continuous function of p.
    // No segments. No piecewise jumps at boundaries. Every variable is
    // interpolated through keyframes with smoothstep, so adjacent frames
    // can't disagree about where the camera is or what's visible.
    if (externalProgress > 0) {
      if (!approachOrigin) {
        approachOrigin = camera.position.clone();
        controls.enabled = false;
      }
      const p = externalProgress;
      const az = Math.atan2(approachOrigin.z, approachOrigin.x);
      const initEl = Math.atan2(
        approachOrigin.y,
        Math.sqrt(approachOrigin.x * approachOrigin.x + approachOrigin.z * approachOrigin.z),
      );
      const originDist = approachOrigin.length();

      // Off-axis position (orbit) — only meaningful in p < ~0.30
      const offDist = THREE.MathUtils.lerp(originDist, 1.0, ss(0, 0.28, p));
      const offEl   = initEl * (1 - ss(0, 0.28, p));
      const offR    = offDist * Math.cos(offEl);
      const offX = offR * Math.cos(az);
      const offY = offDist * Math.sin(offEl);
      const offZ = offR * Math.sin(az);

      // Continuous on-axis Z keyframes — the journey's spatial spine.
      // Camera Z position is one smooth curve from orbit-Z to pulsar-view-Z.
      const onZ = lerpKf(p, [
        [0.00,  originDist],   // start: distance away from BH along view axis
        [0.20,  3.0],
        [0.32,  0.40],         // converging to BH approach
        [0.50, -8.0],          // through the singularity
        [0.65, -90.0],          // mid-tunnel
        [0.78, -160.0],         // exiting tunnel
        [0.92, -190.0],
        [1.00, -198.0],         // settled near pulsar (10u in front)
      ]);

      // Off→on-axis blend: 100% off-axis at p=0, 100% on-axis by p=0.32
      const onWeight = ss(0.18, 0.32, p);
      const settleY  = lerpKf(p, [
        [0.78, 0.0],
        [1.00, 1.2],
      ]);
      const camX = offX * (1 - onWeight);
      const camY = offY * (1 - onWeight) + settleY * onWeight;
      const camZ = offZ * (1 - onWeight) + onZ   * onWeight;

      // Continuous lookAt — single smooth curve down -z axis, settles up at pulsar
      const lookZ = lerpKf(p, [
        [0.00,    0.0],
        [0.20,    0.0],
        [0.35, -100.0],
        [0.55, -200.0],
        [0.78, -240.0],
        [1.00, -210.0],
      ]);
      const lookY = lerpKf(p, [
        [0.00, 0.0],
        [0.92, 0.0],
        [1.00, 0.6],
      ]);

      // Continuous FOV — one curve, no segment seams
      const fov = lerpKf(p, [
        [0.00, 45.0],
        [0.30, 90.0],
        [0.45, 110.0],
        [0.65, 90.0],
        [0.85, 65.0],
        [1.00, 55.0],
      ]);

      // Continuous chromatic aberration (peaks at horizon crossing)
      const rgbShift = lerpKf(p, [
        [0.00, 0.00001],
        [0.30, 0.012],
        [0.42, 0.030],   // peak — light is being torn apart
        [0.55, 0.020],
        [0.78, 0.005],
        [1.00, 0.00001],
      ]);

      // Continuous Doppler boost (Schnittman 2024 — forward brightening)
      const dopplerBoost = lerpKf(p, [
        [0.00, 0.00],
        [0.30, 0.55],
        [0.42, 0.90],   // peak — relativistic
        [0.55, 0.65],
        [0.78, 0.20],
        [1.00, 0.00],
      ]);

      // Disc scale — grows as we approach, fades behind us in tunnel
      const diskScale = lerpKf(p, [
        [0.00, 0.75],
        [0.30, 1.30],
        [0.55, 1.30],
        [0.78, 0.85],
        [1.00, 0.40],
      ]);

      // Tunnel ring/streak intensity — fades in mid-approach, peaks in tunnel,
      // fades out as we emerge. No on/off — pure cross-fade.
      const tunnelI = lerpKf(p, [
        [0.00, 0.0],
        [0.32, 0.0],
        [0.42, 0.55],   // entering — just past BH crossing
        [0.62, 1.00],
        [0.78, 0.85],
        [0.90, 0.30],
        [1.00, 0.0],
      ]);

      // Pulsar visibility — DIM from segment 3 (visible far ahead in tunnel),
      // bright at the destination. Cross-fade, no hard reveal.
      const pulsarOp = lerpKf(p, [
        [0.00, 0.0],
        [0.55, 0.0],
        [0.72, 0.30],
        [0.88, 0.85],
        [1.00, 1.00],
      ]);

      // Apply
      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, lookY, lookZ);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      finalUniforms.uRGBShiftRadius.value = rgbShift;
      finalUniforms.uDopplerBoost.value   = dopplerBoost;
      discMesh.scale.setScalar(Math.max(0.05, diskScale));
      partPoints.scale.setScalar(Math.max(0.05, diskScale));

      for (let i = 0; i < tunnelMats.length; i++) {
        tunnelMats[i].opacity = tunnelI * (0.5 + (i % 4) * 0.12);
      }
      tunnelGroup.rotation.z += 0.004;
      tunnelStreakMat.uniforms.uOpacity.value = tunnelI * 0.85;

      // Pulsar — visible and pulsing whenever pulsarOp > epsilon (cross-fades in)
      const pulsarOn = pulsarOp > 0.005;
      neutronStar.visible = pulsarOn;
      beam.visible        = pulsarOn;
      if (pulsarOn) {
        neutronStar.rotation.y += 0.04;
        neutronMat.emissiveIntensity = 2.2 * pulsarOp;
        // 92ms wall-clock locked beat — stable across frames
        const beatPhase = (performance.now() / 1000) % 0.092;
        const a = beatPhase < 0.080 ? Math.exp(-beatPhase / 0.022) * 0.92 : 0.0;
        beamUni.uAlpha.value     = a * pulsarOp;
        neutronLight.intensity   = a * 7 * pulsarOp;
      } else {
        beamUni.uAlpha.value   = 0;
        neutronLight.intensity = 0;
      }
    } else if (approachOrigin) {
      approachOrigin = null;
      controls.enabled = true;
      camera.fov = 45;
      camera.updateProjectionMatrix();
      finalUniforms.uRGBShiftRadius.value = 0.00001;
      finalUniforms.uDopplerBoost.value   = 0;
      discMesh.scale.setScalar(0.75);
      partPoints.scale.setScalar(0.75);
      tunnelMats.forEach((m) => { m.opacity = 0; });
      tunnelStreakMat.uniforms.uOpacity.value = 0;
      neutronStar.visible = false;
      beam.visible = false;
      neutronLight.intensity = 0;
    }

    controls.update();

    // Update uniforms
    discMat.uniforms.uTime.value = t;
    partMat.uniforms.uTime.value = t + 9999.0;

    // Camera azimuth (angle around the disc spin axis) drives Doppler boost
    const camAz = Math.atan2(camera.position.z, camera.position.x);
    discMat.uniforms.uCamAzimuth.value = camAz;
    partMat.uniforms.uCamAzimuth.value = camAz;

    // Active distortion plane always faces camera
    distActiveMesh.lookAt(camera.position);

    // BH screen-space UV for the lensing center
    screenPos.set(0, 0, 0).project(camera);
    finalUniforms.uBlackHolePosition.value.set(
      screenPos.x * 0.5 + 0.5,
      screenPos.y * 0.5 + 0.5,
    );

    // Pass 1: space scene → spaceRT
    renderer.autoClearColor = true;
    renderer.setRenderTarget(spaceRT);
    renderer.render(spaceScene, camera);

    // Pass 2: distortion scene → distortionRT
    renderer.setRenderTarget(distortionRT);
    renderer.render(distortionScene, camera);

    // Pass 3: final composite → screen
    renderer.setRenderTarget(null);
    renderer.render(finalScene, camera);

    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  // ── Resize ──────────────────────────────────────────────────────────────────
  function onResize() {
    const r = target.getBoundingClientRect();
    width  = r.width  || window.innerWidth;
    height = r.height || window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    spaceRT.setSize(width * 2, height * 2);
    distortionRT.setSize(Math.floor(width * 0.5), Math.floor(height * 0.5));
    partMat.uniforms.uViewHeight.value  = spaceRT.height;
    starsMat.uniforms.uViewHeight.value = spaceRT.height;
  }
  window.addEventListener('resize', onResize);

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);

    controls.dispose();
    spaceRT.dispose();
    distortionRT.dispose();

    // Geometries
    discMesh.geometry.dispose();
    partPoints.geometry.dispose();
    starsPoints.geometry.dispose();
    distActiveMesh.geometry.dispose();
    distMaskMesh.geometry.dispose();
    finalPlane.geometry.dispose();
    tunnelGroup.children.forEach((c) => {
      const m = c as THREE.Mesh;
      m.geometry.dispose();
    });
    tunnelStreakGeo.dispose();
    neutronGeo.dispose();
    beam.geometry.dispose();

    // Materials
    discMat.dispose();
    partMat.dispose();
    starsMat.dispose();
    distActiveMat.dispose();
    distMaskMat.dispose();
    finalMat.dispose();
    tunnelMats.forEach((m) => m.dispose());
    tunnelStreakMat.dispose();
    neutronMat.dispose();
    beamMat.dispose();

    if (noiseTex && (noiseTex as THREE.Texture).dispose) {
      (noiseTex as THREE.Texture).dispose();
    }

    renderer.dispose();
    if (renderer.domElement.parentElement === target) {
      target.removeChild(renderer.domElement);
    }
  }

  return {
    canvas: renderer.domElement,
    destroy,
    setProgress: (p: number) => { externalProgress = Math.max(0, Math.min(1, p)); },
  };
}
