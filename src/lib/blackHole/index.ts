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

  // ── Scroll-approach state ────────────────────────────────────────────────────
  // setProgress() is called from BlackHoleMount as the user scrolls during
  // EVENT_HORIZON. At 0 the BH sits at rest; at 1 the user is at the threshold
  // and DESCENT is about to fire. The animation disables OrbitControls and drives
  // the camera radially toward the BH center, widening the FOV and ramping up
  // chromatic aberration to simulate gravitational lensing pulling you in.
  let externalProgress   = 0;
  let approachOrigin: THREE.Vector3 | null = null;
  const INITIAL_DIST     = camera.position.length(); // ≈ 7.35

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

    // ── Scroll-approach animation ────────────────────────────────────────────
    if (externalProgress > 0) {
      // Capture the orbital position the user was at when they first scrolled.
      // We approach from that exact angle — makes the experience feel personal.
      if (!approachOrigin) {
        approachOrigin = camera.position.clone();
        controls.enabled = false;
      }

      // Cubic ease-in: slow start → dramatic rush near the event horizon.
      // Mirrors real gravitational acceleration — you barely feel it far out,
      // then it grips you at the last moment.
      const k = externalProgress * externalProgress * externalProgress;

      // Camera rushes inward: initial orbit distance → 2.5 units from singularity
      const originDist = approachOrigin.length();
      const targetDist = originDist * (1 - k) + 2.5 * k;
      camera.position.copy(approachOrigin).normalize().multiplyScalar(targetDist);
      camera.lookAt(0, 0, 0);

      // FOV widens (45° → 75°): creates the tunnel-rush immersion
      camera.fov = THREE.MathUtils.lerp(45, 75, k);
      camera.updateProjectionMatrix();

      // Chromatic aberration ramps up quadratically — sci-fi gravitational lensing
      finalUniforms.uRGBShiftRadius.value = 0.00001 + externalProgress * externalProgress * 0.006;

      // Accretion disk grows to fill the frame as you close in
      const diskScale = THREE.MathUtils.lerp(0.75, 1.3, k);
      discMesh.scale.setScalar(diskScale);
      partPoints.scale.setScalar(diskScale);
    } else {
      // At rest — restore neutral state if progress was reset
      if (approachOrigin) {
        approachOrigin = null;
        controls.enabled = true;
        camera.fov = 45;
        camera.updateProjectionMatrix();
        finalUniforms.uRGBShiftRadius.value = 0.00001;
        discMesh.scale.setScalar(0.75);
        partPoints.scale.setScalar(0.75);
      }
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

    // Materials
    discMat.dispose();
    partMat.dispose();
    starsMat.dispose();
    distActiveMat.dispose();
    distMaskMat.dispose();
    finalMat.dispose();

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
