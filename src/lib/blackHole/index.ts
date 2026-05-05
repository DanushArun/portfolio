/** Black Hole
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
  EffectComposer, RenderPass, EffectPass,
  BloomEffect, VignetteEffect, NoiseEffect,
  BlendFunction,
} from 'postprocessing';
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
const STARS = 50_000;

export function createBlackHole(opts: BlackHoleOptions): BlackHoleHandle {
  const target = opts.target;
  const inner = new THREE.Color(opts.innerColor ?? '#ff8080');
  const outer = new THREE.Color(opts.outerColor ?? '#3633ff');

  // ── Sizing ──────────────────────────────────────────────────────────────────
  const rect = target.getBoundingClientRect();
  let width = rect.width || window.innerWidth;
  let height = rect.height || window.innerHeight;
  const dpr = Math.min(Math.max(window.devicePixelRatio, 1), 2);

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
  renderer.domElement.addEventListener('pointerup', () => { renderer.domElement.style.cursor = 'grab'; });
  renderer.domElement.addEventListener('pointercancel', () => { renderer.domElement.style.cursor = 'grab'; });
  target.appendChild(renderer.domElement);

  // ── Scenes ──────────────────────────────────────────────────────────────────
  const spaceScene = new THREE.Scene();
  const distortionScene = new THREE.Scene();

  // ── Camera ──────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  // Restore original off-axis angle
  camera.position.set(3, 2.5, 5);
  camera.lookAt(0, 0, 0);
  spaceScene.add(camera);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 4;
  controls.maxDistance = 12;
  controls.enabled = !opts.disableInteraction;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.15; // Slow, majestic rotation

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
    const noiseScene = new THREE.Scene();
    const noiseCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const noiseRT = new THREE.WebGLRenderTarget(128, 128, {
      generateMipmaps: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
    });
    const noiseMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: noisesVert,
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
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uNoiseTexture: { value: noiseTex },
      uInnerColor,
      uOuterColor,
      uCamAzimuth: { value: 0 },
    },
    vertexShader: discVert,
    fragmentShader: discFrag,
  });
  const discMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 1, 0, 64, 10, true),
    discMat,
  );
  // 0.75× world-scale so disc fits comfortably within viewport at default FOV
  discMesh.scale.setScalar(0.75);
  spaceScene.add(discMesh);

  // ── Event horizon sphere — the visible black "shadow" geometry ─────────────
  // Solid black sphere at origin. As the camera approaches in Phase A the sphere
  // grows naturally in screen space; in Phase B we *scale the sphere itself* to
  // engulf the camera (replaces the previous CSS veil hack). DoubleSide so the
  // sphere is still pure black when the camera is inside it (the swallow).
  const HORIZON_R = 0.42;
  const horizonGeo = new THREE.SphereGeometry(HORIZON_R, 64, 64);
  const horizonMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
  });
  const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
  // renderOrder -10 + depthWrite=true on horizon, depthTest=true on disc/particles
  // would do the proper occlusion — but disc/particles use depthTest:false so we
  // gate them via .visible flags during the swallow instead. Simpler, no shader fight.
  horizonMesh.renderOrder = -10;
  spaceScene.add(horizonMesh);

  // ── Photon ring — bright thin rim that always faces the camera ─────────────
  // This is what the user sees as "the edge glows" in storyboard panel 04. We
  // ramp it up across panels 02→04, peak at the swallow, fade with the sphere.
  const photonRingGeo = new THREE.RingGeometry(HORIZON_R * 1.0, HORIZON_R * 1.18, 128);
  const photonRingMat = new THREE.MeshBasicMaterial({
    color: 0xffb066,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
  spaceScene.add(photonRing);

  // ── Disc particles (50k, radial-spiral via vertex shader) ───────────────────
  const partGeo = new THREE.BufferGeometry();
  {
    const distArr = new Float32Array(PARTICLES);
    const sizeArr = new Float32Array(PARTICLES);
    const rndArr = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      distArr[i] = Math.random();
      sizeArr[i] = Math.random();
      rndArr[i] = Math.random();
    }
    partGeo.setAttribute('position', new THREE.Float32BufferAttribute(distArr, 1));
    partGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizeArr, 1));
    partGeo.setAttribute('aRandom', new THREE.Float32BufferAttribute(rndArr, 1));
    // 1-component position breaks auto bounding sphere; supply manually.
    partGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  }
  const partMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uInnerColor,
      uOuterColor,
      uViewHeight: { value: spaceRT.height },
      uSize: { value: 0.015 },
      uCamAzimuth: { value: 0 },
    },
    vertexShader: discParticlesVert,
    fragmentShader: discParticlesFrag,
  });
  const partPoints = new THREE.Points(partGeo, partMat);
  partPoints.frustumCulled = false;
  partPoints.scale.setScalar(0.75);   // match disc scale
  spaceScene.add(partPoints);

  // ── Stars (50k random points on r=400 sphere) ───────────────────────────────
  const starGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(STARS * 3);
    const sz = new Float32Array(STARS);
    const col = new Float32Array(STARS * 3);
    const c = new THREE.Color();
    for (let i = 0; i < STARS; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1.0);
      pos[i * 3] = Math.cos(theta) * Math.sin(phi) * 400;
      pos[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * 400;
      pos[i * 3 + 2] = Math.cos(phi) * 400;
      sz[i] = Math.random();
      // Near-white stars: tiny saturation hint only — keeps them silver/white so
      // the gravitational lensing secondary image stays warm amber (disc colour),
      // not rainbow (caused by sampling fully-saturated red/green/blue stars).
      c.setHSL(Math.random(), 0.15, 0.75 + Math.random() * 0.2);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    starGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
    starGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  }
  const starsMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uViewHeight: { value: spaceRT.height },
      uSize: { value: 0.001 },
    },
    vertexShader: starsVert,
    fragmentShader: starsFrag,
  });
  const starsPoints = new THREE.Points(starGeo, starsMat);
  starsPoints.frustumCulled = false;
  spaceScene.add(starsPoints);

  // ── Text Particles ("DANUSH ARUN") ──────────────────────────────────────────
  let textPoints: THREE.Points | null = null;
  const initTextParticles = async () => {
    // Wait for fonts to load
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 2048, 512);
    // Editorial italic — Instrument Serif italic 400. Fluid strokes,
    // yummy editorial vibe. Replaces the heavy 900-weight Cormorant.
    ctx.font = 'italic 400 240px "Instrument Serif", "Cormorant Garamond", "Times New Roman", serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '12px';
    ctx.fillText('Danush Arun', 1024, 256);

    const imgData = ctx.getImageData(0, 0, 2048, 512).data;
    const positions = [];
    const originalPos = [];
    const randoms = [];

    // We will parent the text directly to the camera, so it stays perfectly still on screen.
    // Because it's a child of the camera, we don't need any complex orientation quaternions.
    // Local Z is forward/backward relative to the screen. Local X/Y is right/up.

    for (let y = 0; y < 512; y += 6) {
      for (let x = 0; x < 2048; x += 6) {
        const i = (y * 2048 + x) * 4;
        if (imgData[i] > 128) {
          // Normalized coordinates (-1 to +1)
          const nx = (x / 2048) * 2.0 - 1.0;
          const ny = -(y / 512) * 2.0 + 1.0;

          const px = nx * 4.0;
          let py = ny * 0.8;
          py -= Math.pow(nx, 2.0) * 1.2; // arch curve
          py += 1.8; // elevation above disk rim

          const pz = 0;

          positions.push(px, py, pz);
          originalPos.push(px, py, pz);
          randoms.push(Math.random(), Math.random(), Math.random());
        }
      }
    }

    const textGeo = new THREE.BufferGeometry();
    textGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    textGeo.setAttribute('aOriginal', new THREE.Float32BufferAttribute(originalPos, 3));
    textGeo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 3));

    const textMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColor: { value: new THREE.Color('#F2EEE7') },
        uDestColor: { value: new THREE.Color('#ff8040') },
        uBlackHoleLocal: { value: new THREE.Vector3(0, 0, 0) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uBlackHoleLocal;
        attribute vec3 aOriginal;
        attribute vec3 aRandom;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float pull = pow(uProgress, 2.5);
          float individualPull = clamp(pull * (1.0 + aRandom.x * 0.5), 0.0, 1.0);
          
          vec3 pos = aOriginal;
          
          // Pull effect towards the black hole (transformed into camera local space)
          pos = mix(pos, uBlackHoleLocal, individualPull);
          
          if (individualPull > 0.1) {
             vec3 dir = normalize(uBlackHoleLocal - aOriginal);
             pos += dir * sin(uTime * 10.0 + aRandom.z * 10.0) * 0.2 * individualPull;
          }
          
          pos += (aRandom - 0.5) * 0.1 * individualPull;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          gl_PointSize = (4.0 * (1.0 - individualPull)) + (sin(uTime * 8.0 + aRandom.x * 100.0) * 1.0 + 1.0);
          vAlpha = 1.0 - pow(individualPull, 4.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uDestColor;
        uniform float uProgress;
        varying float vAlpha;
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          vec3 finalColor = mix(uColor, uDestColor, pow(uProgress, 2.0));
          gl_FragColor = vec4(finalColor, vAlpha * (1.0 - r * 2.0));
        }
      `
    });

    textPoints = new THREE.Points(textGeo, textMat);
    textPoints.frustumCulled = false;
    spaceScene.add(textPoints);
  };

  initTextParticles();

  // ──────────────────────────────────────────────────────────────────────────
  // WARP TUNNEL — pure radial streaks (no rings, no chromatic ringing)
  // The camera punches through after the engulf. Streaks live in a tube around
  // the camera's -Z axis; each is a short line segment aligned with Z so the
  // perspective projection naturally renders them as radial trails out of the
  // screen center. NO rings, NO chromatic aberration → no rainbow donut.
  // ──────────────────────────────────────────────────────────────────────────
  const STREAK_COUNT = 2400;
  const streakGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(STREAK_COUNT * 2 * 3); // 2 verts per streak
    const lif = new Float32Array(STREAK_COUNT * 2);     // 0 at tail, 1 at head
    const hue = new Float32Array(STREAK_COUNT * 2);     // shared per-streak hue
    for (let i = 0; i < STREAK_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      // Uniform-area distribution → tube cross-section evenly populated
      const r = 0.35 + Math.sqrt(Math.random()) * 6.0;
      const zHead = -2 - Math.random() * 240;
      const len = 1.6 + Math.random() * 4.5;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      // Tangential drift on the tail — breaks the axis-stacking artifact where
      // streaks at y≈cam_y all project to the same horizontal screen line. Each
      // streak now points slightly off pure-Z so they project to slightly
      // different screen Y, dispersing the light instead of stacking it.
      const tang = theta + Math.PI / 2;
      const drift = (Math.random() - 0.5) * 0.45;
      const tailX = x + Math.cos(tang) * drift;
      const tailY = y + Math.sin(tang) * drift;
      // Streak head (closer to camera = larger Z)
      pos[i * 6 + 0] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = zHead;
      // Streak tail (further from camera with tangential drift)
      pos[i * 6 + 3] = tailX;
      pos[i * 6 + 4] = tailY;
      pos[i * 6 + 5] = zHead - len;
      lif[i * 2 + 0] = 1;   // head
      lif[i * 2 + 1] = 0;   // tail
      const h = Math.random();
      hue[i * 2 + 0] = h;
      hue[i * 2 + 1] = h;
    }
    streakGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    streakGeo.setAttribute('aLife', new THREE.Float32BufferAttribute(lif, 1));
    streakGeo.setAttribute('aHue', new THREE.Float32BufferAttribute(hue, 1));
  }
  const streakMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uIntensity: { value: 1.0 } },
    vertexShader: /* glsl */`
      attribute float aLife;
      attribute float aHue;
      varying float vLife;
      varying float vHue;
      varying float vDist;
      void main() {
        vLife = aLife;
        vHue = aHue;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      uniform float uIntensity;
      varying float vLife;
      varying float vHue;
      varying float vDist;
      void main() {
        // Tail-to-head gradient: head bright, tail fades to nothing
        float a = pow(vLife, 1.4) * uOpacity * uIntensity;
        // Distance falloff so far streaks don't all stack at full bright
        a *= clamp(1.6 - vDist * 0.008, 0.0, 1.6);
        // Subtle hue spread: warm white → amber so streaks aren't monochrome
        vec3 warm = vec3(1.0, 0.96, 0.88);
        vec3 amber = vec3(1.0, 0.78, 0.42);
        vec3 col = mix(warm, amber, vHue * 0.6);
        gl_FragColor = vec4(col, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  streaks.frustumCulled = false;
  streaks.visible = false; // off until tunnel phase
  spaceScene.add(streaks);

  // ── Destination orb (the "MIRA emerge") ──────────────────────────────────
  // Pure-emissive sphere — no lights needed, no Standard material complexity.
  // Bloom will turn this into a halo when post-processing is wired up. Sized
  // to read clearly from camera z=-203 (Phase E final cam pos).
  const destGeo = new THREE.SphereGeometry(2.4, 64, 64);
  const destMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffe7b8'),
    transparent: true,
    opacity: 0,
  });
  const destOrb = new THREE.Mesh(destGeo, destMat);
  destOrb.position.set(0, 0, -210);
  destOrb.visible = false;
  spaceScene.add(destOrb);

  // ── Destination halo — billboard quad with radial soft glow ──────────────
  const haloUni = { uOpacity: { value: 0 } };
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: haloUni,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5));
        // Soft radial falloff, hot core, warm rim
        float core = exp(-d * 8.0);
        float rim  = exp(-pow(d * 4.0, 2.0));
        vec3 hot   = vec3(1.0, 0.92, 0.78);
        vec3 warm  = vec3(1.0, 0.62, 0.30);
        vec3 col = mix(warm, hot, core);
        float a = (core * 0.9 + rim * 0.6) * uOpacity;
        if (a < 0.001) discard;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const haloMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), haloMat);
  haloMesh.position.set(0, 0, -211);  // slightly behind orb so orb is in front
  haloMesh.visible = false;
  spaceScene.add(haloMesh);

  // ── Distortion (active = camera-facing, mask = horizontal disc) ─────────────
  const distActiveMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {},
    vertexShader: distortionVert,
    fragmentShader: distortionActiveFrag,
  });
  const distActiveMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), distActiveMat);
  distActiveMesh.scale.setScalar(10);
  distortionScene.add(distActiveMesh);

  const distMaskMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {},
    vertexShader: distortionVert,
    fragmentShader: distortionMaskFrag,
  });
  const distMaskMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), distMaskMat);
  distMaskMesh.scale.setScalar(10);
  distMaskMesh.rotation.x = Math.PI * 0.5;
  distortionScene.add(distMaskMesh);

  // ── Final composite (fullscreen quad with FinalMaterial) ────────────────────
  const finalUniforms = {
    uSpaceTexture: { value: spaceRT.texture },
    uDistortionTexture: { value: distortionRT.texture },
    uBlackHolePosition: { value: new THREE.Vector2() },
    uRGBShiftRadius: { value: 0.00001 },
    uDopplerBoost: { value: 0.0 },
  };
  const finalMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    depthWrite: false,
    depthTest: false,
    uniforms: finalUniforms,
    vertexShader: finalVert,
    fragmentShader: finalFrag,
  });
  const finalScene = new THREE.Scene();
  const finalPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), finalMat);
  finalPlane.frustumCulled = false;
  finalScene.add(finalPlane);
  const finalCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── Post-processing: bloom + vignette + film grain ──────────────────────────
  // Single biggest visual quality lift. Bloom turns the disc/streaks into
  // luminous bodies (instead of flat 2D rings), vignette frames the shot,
  // film grain adds cinematic micro-noise. Without this the BH looks
  // technically correct but visually "programmer-art" flat.
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(finalScene, finalCamera));
  // Bloom kept restrained — finalShader output is already LDR-clipped at 1.0 so
  // a high luminance threshold lets us highlight the brightest hot pixels only.
  const bloomEffect = new BloomEffect({
    intensity: 0.55,
    radius: 0.78,
    luminanceThreshold: 0.78,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
  });
  const vignetteEffect = new VignetteEffect({
    offset: 0.35,
    darkness: 0.45,
  });
  const noiseEffect = new NoiseEffect({
    premultiply: true,
    blendFunction: BlendFunction.SCREEN,
  });
  noiseEffect.blendMode.opacity.value = 0.025;
  composer.addPass(new EffectPass(finalCamera, bloomEffect, vignetteEffect, noiseEffect));

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
  let externalProgress = 0;
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

    // ── Five-phase storyboard execution ──────────────────────────────────────
    // Every variable is computed by the EXACT formula documented in the
    // approved storyboard. Boundary continuity verified mathematically before
    // writing this code (see commit message / storyboard doc).
    //
    //   Phase A  p ∈ [0.00, 0.20]   Orbital approach   spherical inward
    //   Phase B  p ∈ [0.20, 0.32]   Convergence        off-axis → on-axis blend
    //   Phase C  p ∈ [0.32, 0.50]   Crossing           z: 0.4 → -8
    //   Phase D  p ∈ [0.50, 0.78]   Inter-region       z: -8 → -160 (cubic ease-out)
    //   Phase E  p ∈ [0.78, 1.00]   Pulsar arrival     z: -160 → -198 (smoothstep)
    if (externalProgress > 0) {
      if (!approachOrigin) {
        approachOrigin = camera.position.clone();
        controls.enabled = false;
        controls.autoRotate = false;
      }
      const p = externalProgress;
      const phi = Math.atan2(approachOrigin.z, approachOrigin.x);
      const th0 = Math.atan2(
        approachOrigin.y,
        Math.sqrt(approachOrigin.x * approachOrigin.x + approachOrigin.z * approachOrigin.z),
      );
      const R0 = approachOrigin.length();

      let camX = 0, camY = 0, camZ = 0;
      let lookX = 0, lookY = 0, lookZ = 0;
      let fov = 45;
      let rgbShift = 0.00001;
      let dopplerBoost = 0;
      let diskScale = 0.75;
      // Sphere-driven swallow parameters — set per phase, applied after the if-chain
      let sphereScaleK = 1.0;       // multiplier on horizon sphere scale (1 = HORIZON_R)
      let photonRingOp = 0;         // photon ring opacity (0 = invisible, 1 = full glow)

      // Shared Phase A/B target angles — used twice so they MUST agree.
      // THETA_END=0.62 rad (~35°) keeps the camera elevated so the flat disc
      // never goes edge-on (the bug at p=0.20 where it collapsed to a line).
      const PHI_END = Math.PI / 2;
      const THETA_END = 0.62;
      if (p < 0.55) {
        // ── PHASE A — Orbital approach + push (Panels 01 → 04 HORIZON entry) ─
        // Slow angular convergence (linear-cubic across full Phase A) so the
        // disc stays oblique through panels 02/03 instead of snapping edge-on.
        const t = ss(0, 0.55, p);
        const tCubic = t * t * (3 - 2 * t);
        // Exponential radial decay R0 → 0.5 so we never enter the sphere
        const r = R0 * Math.pow(0.5 / R0, t);
        // Angular convergence stretched across all of Phase A (was p=0.25).
        const angConv = tCubic;
        const phiCur = phi + (PHI_END - phi) * angConv;
        const thCur = th0 + (THETA_END - th0) * angConv;
        camX = r * Math.cos(thCur) * Math.cos(phiCur);
        camY = r * Math.sin(thCur);
        camZ = r * Math.cos(thCur) * Math.sin(phiCur);

        lookX = 0; lookY = 0; lookZ = 0;
        fov = 45 + 30 * tCubic;                       // 45° → 75° dolly zoom
        // Chromatic aberration: starts subtle, peaks at the dramatic Panel 03.
        // Reduced peak from 0.006 → 0.004 to avoid coloured fringing artefacts.
        rgbShift = 0.00001 + 0.004 * Math.pow(tCubic, 2);
        dopplerBoost = 1.0 * tCubic;
        diskScale = 0.75;
        sphereScaleK = 1.0;
        photonRingOp = ss(0.30, 0.55, p) * 0.55;       // softer, peaks at 0.55 not 0.85
      } else if (p < 0.65) {
        // ── PHASE B — The Engulf (Panel 04 → black) ────────────────────────
        // Camera holds on the converged orbital vector; sphere scales up to
        // swallow the camera. No phi/theta change so there's no jump from A→B.
        const u = (p - 0.55) / 0.10;
        const eased = u * u * (3 - 2 * u);
        const r = 0.5;
        camX = r * Math.cos(THETA_END) * Math.cos(PHI_END);
        camY = r * Math.sin(THETA_END);
        camZ = r * Math.cos(THETA_END) * Math.sin(PHI_END);

        lookX = 0; lookY = 0; lookZ = 0;
        fov = 75 + 25 * eased;
        // Hard-zero chromatic shift during engulf — handled by the override below
        // anyway, but cleaner to set 0 here too.
        rgbShift = 0;
        dopplerBoost = 1.0 * (1 - eased);
        diskScale = 0.75;
        sphereScaleK = 1.0 + 29.0 * eased;
        // Photon ring fades aggressively as we go inside — no lingering rim
        photonRingOp = 0.55 * (1 - Math.pow(eased, 1.2));
      } else if (p < 0.78) {
        // ── PHASE C — Inside the tunnel (hidden behind the CSS black veil until p=0.72)
        // The camera jumps to the tunnel axis; no discontinuity visible (screen is black).
        // rgbShift = 0 so tunnel streaks and rings render SHARP, not blurred.
        const u = (p - 0.65) / 0.13;
        camX = 0; camY = 0;
        camZ = -2 - 12 * u;
        lookX = 0; lookY = 0; lookZ = -100 - 100 * u;

        fov = 110 + 40 * u + 20 * Math.sin(u * Math.PI);
        rgbShift = 0;
        dopplerBoost = 1.2 - 0.5 * u;
        diskScale = 0;
      } else if (p < 0.90) {
        // ── PHASE D — Full tunnel blast — peak warp speed ──────────────────
        const u = (p - 0.78) / 0.12;
        const k = 1 - Math.pow(1 - u, 3);
        camX = 0; camY = 0;
        camZ = -14 - 59 * k;
        lookX = 0; lookY = 0; lookZ = -200 - 50 * u;

        fov = 150 - 75 * k;
        rgbShift = 0;
        dopplerBoost = 0.65 - 0.45 * u;
        diskScale = 0;
      } else {
        // ── PHASE E — Destination emerge (decelerate, orb resolves) ────────
        // Camera decelerates into a viewing position close to the destination
        // orb. Streaks fade out, orb scales/brightens up. Settles into a held
        // shot ready for the panel to crossfade in over the top.
        const u = (p - 0.90) / 0.10;
        const k = u * u * (3 - 2 * u);
        camX = 0;
        camY = 0.4 * k;                          // gentle settle Y
        camZ = -73 - 130 * k;                    // -73 → -203 (closer to orb at -210)
        lookX = 0; lookY = 0; lookZ = -210;      // lock on destination
        fov = 75 - 25 * k;                       // 75° → 50° narrow
        rgbShift = 0;
        dopplerBoost = 0.20 * (1 - u);
        diskScale = 0.85;
      }

      // Destination orb opacity ramps in late: barely visible during warp,
      // emerges in Phase E as the streaks fade. Storyboard panel 08 EMERGE.
      const destOp = ss(0.86, 0.99, p);

      // Apply
      camera.position.set(camX, camY, camZ);
      camera.lookAt(lookX, lookY, lookZ);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      finalUniforms.uRGBShiftRadius.value = rgbShift;
      finalUniforms.uDopplerBoost.value = dopplerBoost;
      discMesh.scale.setScalar(Math.max(0.05, diskScale));
      partPoints.scale.setScalar(Math.max(0.05, diskScale));

      // Horizon sphere — the visible black mass. Scales up dramatically in Phase B.
      horizonMesh.scale.setScalar(sphereScaleK);
      horizonMesh.visible = p < 0.78;  // hide once camera teleports into tunnel

      // Photon ring — always faces camera, opacity follows the phase ramp above
      photonRing.lookAt(camera.position);
      photonRingMat.opacity = Math.max(0, Math.min(1, photonRingOp));
      photonRing.visible = photonRingOp > 0.001 && p < 0.70;

      // Warp streaks — the only tunnel visual. No rings, no chromatic ringing.
      // Phase B (0.55-0.65): faint hint as the engulf veil holds.
      // Phase C (0.65-0.78): streaks ramp in fast as we punch through.
      // Phase D (0.78-0.90): full warp blast.
      // Phase E (0.90-1.00): fade out as destination emerges.
      const inTunnel = p >= 0.55;
      streaks.visible = inTunnel;
      let streakOp = 0;
      let streakI = 1.0;
      if (p >= 0.55 && p < 0.65) {
        // Subtle streaks during the engulf hold — adds motion behind the black veil
        streakOp = ss(0.55, 0.65, p) * 0.25;
        streakI = 0.6;
      } else if (p < 0.78) {
        const u = (p - 0.65) / 0.13;
        streakOp = 0.25 + u * 0.75;
        streakI = 1.0 + u * 0.6;
      } else if (p < 0.90) {
        streakOp = 1.0;
        streakI = 1.6;
      } else {
        const u = (p - 0.90) / 0.10;
        streakOp = 1.0 - u;
        streakI = 1.6 - u * 0.8;
      }
      streakMat.uniforms.uOpacity.value = streakOp;
      streakMat.uniforms.uIntensity.value = streakI;

      // Destination orb + halo — emerge cleanly in Phase E.
      const destOn = destOp > 0.001;
      destOrb.visible = destOn;
      haloMesh.visible = destOn;
      if (destOn) {
        destMat.opacity = destOp;
        haloUni.uOpacity.value = destOp * 1.1;
        haloMesh.lookAt(camera.position);
        // Gentle drift on the orb so it doesn't feel static
        destOrb.rotation.y += 0.005;
      }
    } else if (approachOrigin) {
      approachOrigin = null;
      controls.enabled = true;
      controls.autoRotate = true;
      camera.fov = 45;
      camera.updateProjectionMatrix();
      finalUniforms.uRGBShiftRadius.value = 0.00001;
      finalUniforms.uDopplerBoost.value = 0;
      discMesh.scale.setScalar(0.75);
      partPoints.scale.setScalar(0.75);
      discMesh.visible = true;
      partPoints.visible = true;
      // Restore horizon sphere + photon ring to their idle state
      horizonMesh.scale.setScalar(1.0);
      horizonMesh.visible = true;
      photonRingMat.opacity = 0;
      photonRing.visible = false;
      streaks.visible = false;
      streakMat.uniforms.uOpacity.value = 0;
      destOrb.visible = false;
      haloMesh.visible = false;
      destMat.opacity = 0;
      haloUni.uOpacity.value = 0;
    }

    controls.update();

    // Update uniforms
    discMat.uniforms.uTime.value = t;
    partMat.uniforms.uTime.value = t + 9999.0;

    if (textPoints) {
      const mat = textPoints.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      // Text gets sucked in between progress 0.0 and 0.5
      mat.uniforms.uProgress.value = Math.max(0, Math.min(1, externalProgress * 2.0));

      // Calculate the black hole's position (0,0,0 world) in the text's local space
      const bhWorld = new THREE.Vector3(0, 0, 0);
      const bhLocal = textPoints.worldToLocal(bhWorld);
      mat.uniforms.uBlackHoleLocal.value.copy(bhLocal);

      // Hide text entirely once sucked in
      textPoints.visible = externalProgress < 0.6;
    }

    // Camera azimuth (angle around the disc spin axis) drives Doppler boost
    const camAz = Math.atan2(camera.position.z, camera.position.x);
    discMat.uniforms.uCamAzimuth.value = camAz;
    partMat.uniforms.uCamAzimuth.value = camAz;

    // Active distortion plane always faces camera
    distActiveMesh.lookAt(camera.position);

    // BH screen-space UV for the lensing center.
    // When the camera is past the BH (Phase B onwards) we hard-disable chromatic
    // aberration. The previous attempt to keep a "warp prismatic effect" produced
    // a rainbow donut around the tunnel rings (an explicitly-rejected anti-pattern).
    screenPos.set(0, 0, 0).project(camera);
    const bhBehindCamera = screenPos.z > 1.0 || screenPos.z < -1.0;
    if (bhBehindCamera || externalProgress >= 0.55) {
      finalUniforms.uBlackHolePosition.value.set(-2.0, -2.0);
      finalUniforms.uRGBShiftRadius.value = 0.0;
    } else {
      finalUniforms.uBlackHolePosition.value.set(
        screenPos.x * 0.5 + 0.5,
        screenPos.y * 0.5 + 0.5,
      );
    }

    // Disc + particles: hide once swallowed (camera inside expanded horizon
    // sphere) OR well past the BH. Both conditions point at "user shouldn't
    // see the disc" — gating both prevents the disc bleeding through during
    // the sphere engulfment.
    const pastBH = camera.position.z < -40.0;
    const cameraInsideHorizon =
      horizonMesh.visible &&
      camera.position.length() < HORIZON_R * horizonMesh.scale.x * 0.95;
    const hideDisc = pastBH || cameraInsideHorizon;
    discMesh.visible = !hideDisc;
    partPoints.visible = !hideDisc;
    // Once camera is inside the horizon, kill ALL chromatic shift / lensing —
    // there is no BH to lens, just black + photon ring fading.
    if (cameraInsideHorizon) {
      finalUniforms.uRGBShiftRadius.value = 0.0;
      finalUniforms.uBlackHolePosition.value.set(-2.0, -2.0);
    }

    // Pass 1: space scene → spaceRT
    renderer.autoClearColor = true;
    renderer.setRenderTarget(spaceRT);
    renderer.render(spaceScene, camera);

    // Pass 2: distortion scene → distortionRT
    // Skip the lensing render once we're past the BH — the distortion plane at
    // origin would otherwise still write data that the final shader samples,
    // causing remnant lensing rings around the destination scene.
    if (!bhBehindCamera) {
      renderer.setRenderTarget(distortionRT);
      renderer.render(distortionScene, camera);
    } else {
      // Clear the distortion RT to zero so any leftover sampling reads black.
      renderer.setRenderTarget(distortionRT);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, false, false);
      renderer.setClearColor(0x000000, 1);
    }

    // Pass 3: final composite → bloom/vignette/grain → screen via composer
    composer.render();

    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  // ── Resize ──────────────────────────────────────────────────────────────────
  function onResize() {
    const r = target.getBoundingClientRect();
    width = r.width || window.innerWidth;
    height = r.height || window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    spaceRT.setSize(width * 2, height * 2);
    distortionRT.setSize(Math.floor(width * 0.5), Math.floor(height * 0.5));
    partMat.uniforms.uViewHeight.value = spaceRT.height;
    starsMat.uniforms.uViewHeight.value = spaceRT.height;
    composer.setSize(width, height);
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
    horizonGeo.dispose();
    photonRingGeo.dispose();
    partPoints.geometry.dispose();
    starsPoints.geometry.dispose();
    distActiveMesh.geometry.dispose();
    distMaskMesh.geometry.dispose();
    finalPlane.geometry.dispose();
    streakGeo.dispose();
    destGeo.dispose();
    haloMesh.geometry.dispose();

    // Materials
    discMat.dispose();
    horizonMat.dispose();
    photonRingMat.dispose();
    partMat.dispose();
    starsMat.dispose();
    distActiveMat.dispose();
    distMaskMat.dispose();
    finalMat.dispose();
    streakMat.dispose();
    destMat.dispose();
    haloMat.dispose();

    if (noiseTex && (noiseTex as THREE.Texture).dispose) {
      (noiseTex as THREE.Texture).dispose();
    }

    composer.dispose();
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
