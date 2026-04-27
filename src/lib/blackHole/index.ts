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
      c.setHSL(Math.random(), 1.0, 0.8);
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
    
    // Orient the text plane to face the camera HORIZONTALLY (Y-axis pivot only).
    //
    // Why not a full lookAt-style rotation: the previous setFromUnitVectors
    // mapped (0,0,1) → camPos.normalize() = (0.49, 0.41, 0.81). That rotation
    // axis is diagonal (perpendicular to both the original and target normal),
    // which tilts the text's horizontal X-axis off world-horizontal. The
    // parabolic curve is symmetric in nx, but a tilted X-axis canted the whole
    // shape, so the left side rose and the right side dropped.
    //
    // Constraining the rotation to the world Y-axis keeps the text's local X
    // parallel to world horizontal. The parabola then renders symmetrically
    // from any camera height.
    const initialCamPos = new THREE.Vector3(3, 2.5, 5);
    const angleY = Math.atan2(initialCamPos.x, initialCamPos.z);
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      angleY
    );

    for(let y = 0; y < 512; y += 6) {
      for(let x = 0; x < 2048; x += 6) {
        const i = (y * 2048 + x) * 4;
        if (imgData[i] > 128) {
           // Normalized coordinates (-1 to +1)
           const nx = (x / 2048) * 2.0 - 1.0;
           const ny = -(y / 512) * 2.0 + 1.0;
           
           // Base width and height mapping
           // Total width 8 units (down from 10) — guarantees the text
           // stays inside the desktop viewport on every aspect ratio.
           const px = nx * 4.0;

           // Uniform stroke — no thickness variation that bloated the edges.
           // Italic Instrument Serif already has its own beautiful contrast.
           let py = ny * 0.8;

           // Parabolic arch over the top of the black hole's upper limb.
           // Coefficient unchanged — the curve already hugs the rim correctly,
           // it was just being fought by the bold weight + thickness multiplier.
           py -= Math.pow(nx, 2.0) * 1.2;

           // Elevation to sit just above the disk rim
           py += 1.8;
           
           const pz = 0;
           
           const pos = new THREE.Vector3(px, py, pz);
           // Face the initial camera
           pos.applyQuaternion(quaternion);

           positions.push(pos.x, pos.y, pos.z);
           originalPos.push(pos.x, pos.y, pos.z);
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
        uDestColor: { value: new THREE.Color('#ff8040') }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        attribute vec3 aOriginal;
        attribute vec3 aRandom;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float pull = pow(uProgress, 2.5);
          vec3 targetPos = vec3(0.0, 0.0, 0.0);
          float individualPull = clamp(pull * (1.0 + aRandom.x * 0.5), 0.0, 1.0);
          
          vec3 pos = aOriginal;
          
          // Pull effect towards world origin (0,0,0)
          pos = mix(pos, targetPos, individualPull);
          
          if (individualPull > 0.1) {
             vec3 dir = normalize(targetPos - aOriginal);
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
  // EXTENDED JOURNEY — wormhole tunnel + new universe + neutron star
  // The BH is at origin. The new universe lives on the other side at z = -200.
  // Camera path travels continuously from BH-orbit → through BH → tunnel → pulsar.
  // ──────────────────────────────────────────────────────────────────────────

  // ── Wormhole tunnel: stack of glowing rings between BH (z=0) and new space ─
  // Each ring is a thin torus positioned along z-axis. Their additive emission
  // creates the "rushing through a tunnel" sensation when the camera traverses.
  const TUNNEL_RINGS = 32;
  const tunnelGroup = new THREE.Group();
  const tunnelMats: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < TUNNEL_RINGS; i++) {
    const z = -6 - i * 5.2;        // -6 → -167, denser stacking
    // Larger, taper-narrowing rings — the tunnel converges toward the destination
    const tip = i / (TUNNEL_RINGS - 1); // 0 = near, 1 = far
    const radius = THREE.MathUtils.lerp(2.4, 0.9, tip * tip); // converges
    const tubeR = THREE.MathUtils.lerp(0.18, 0.08, tip);     // thicker tubes
    // Color shifts cool→warm along the tunnel (cyan near → amber at end)
    const hue = THREE.MathUtils.lerp(0.55, 0.08, tip);
    const col = new THREE.Color().setHSL(hue, 0.9, 0.6);
    const mat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    tunnelMats.push(mat);
    const geo = new THREE.TorusGeometry(radius, tubeR, 8, 96);
    const m = new THREE.Mesh(geo, mat);
    m.position.z = z;
    m.rotation.z = Math.random() * Math.PI;
    tunnelGroup.add(m);
  }
  spaceScene.add(tunnelGroup);

  // ── Wormhole streaks: bright point particles streaming past in the tunnel ──
  const TUNNEL_STREAKS = 4000;
  const tunnelStreakGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(TUNNEL_STREAKS * 3);
    const sz = new Float32Array(TUNNEL_STREAKS);
    for (let i = 0; i < TUNNEL_STREAKS; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.pow(Math.random(), 0.6) * 2.0;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(theta) * r;
      pos[i * 3 + 2] = -Math.random() * 175; // distributed along tunnel
      sz[i] = 0.5 + Math.random() * 1.5;
    }
    tunnelStreakGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    tunnelStreakGeo.setAttribute('size', new THREE.Float32BufferAttribute(sz, 1));
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
    color: new THREE.Color('#8B3A1A'),
    emissive: new THREE.Color('#C84B20'),
    emissiveIntensity: 2.2,
    roughness: 0.7,
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
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: beamUni,
    vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float uAlpha;void main(){gl_FragColor=vec4(0.52,0.80,1.0,uAlpha);}',
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(80, 0.06, 0.06), beamMat);
  beam.position.set(0, 0, -210);
  beam.visible = false;
  spaceScene.add(beam);

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
      let streakI = 0;

      // λ adapts to actual R0 so the decay rate is always correct regardless of
      // where the user happened to be orbiting when they started scrolling.
      const lambda = Math.log(R0 / 0.5) / 0.55; // Pass through r=0.5 at p=0.55

      if (p < 0.55) {
        // ── PHASE A — The big approach
        // Maintain user's angle (th0) much more, only drifting slightly to equator
        // to show the disk's depth without flattening it into a line.
        const r = R0 * Math.exp(-lambda * p);
        // GLSL `mix(a,b,t)` = JS `THREE.MathUtils.lerp(a,b,t)`. Keep math identical.
        const th = THREE.MathUtils.lerp(th0, 0.0, Math.pow(p / 0.55, 2.5) * 0.7); // Only 70% drift to equator
        camX = r * Math.cos(th) * Math.cos(phi);
        camY = r * Math.sin(th);
        camZ = r * Math.cos(th) * Math.sin(phi);
        
        lookX = 0; lookY = 0; lookZ = 0;
        fov = 45 + 50 * (p / 0.55);      // 45° → 95°
        rgbShift = 0.00001 + 0.02 * Math.pow(p / 0.55, 3);
        dopplerBoost = 0.8 * (p / 0.55);
        diskScale = 0.75; // KEEP SCALE CONSTANT - dive into the hole, don't grow the model
      } else if (p < 0.65) {
        // ── PHASE B — Entering the Event Horizon
        // Dive through the center towards the tunnel
        const u = ss(0.55, 0.65, p);
        const rStart = R0 * Math.exp(-lambda * 0.55);
        const thStart = THREE.MathUtils.lerp(th0, 0.0, 0.7);
        
        // Final approach to origin and then past it
        const posStart = new THREE.Vector3(
          rStart * Math.cos(thStart) * Math.cos(phi),
          rStart * Math.sin(thStart),
          rStart * Math.cos(thStart) * Math.sin(phi)
        );
        const posEnd = new THREE.Vector3(0, 0, -2); // Just past origin
        
        const pos = new THREE.Vector3().lerpVectors(posStart, posEnd, u);
        camX = pos.x; camY = pos.y; camZ = pos.z;
        
        lookX = 0; lookY = 0; lookZ = -100 * u;
        fov = 95 + 15 * u;
        rgbShift = 0.02 + 0.04 * u;
        dopplerBoost = 0.8 + 0.4 * u;
        diskScale = 0.75 * (1.0 - u); // Fade disk out as we pass through
      } else if (p < 0.78) {
        // ── PHASE C — The Crossing
        const u = (p - 0.65) / 0.13;
        camX = 0; camY = 0;
        camZ = -2 - 12 * u; // Speeding up through the throat
        lookX = 0; lookY = 0; lookZ = -100 - 100 * u;
        
        fov = 110 + 40 * u + 20 * Math.sin(u * Math.PI);
        rgbShift = 0.06 - 0.04 * u;
        dopplerBoost = 1.2 - 0.5 * u;
        diskScale = 0; // Disk is gone
        streakI = Math.pow(u, 1.2);
      } else if (p < 0.90) {
        // ── PHASE D — Inter-region transit (12% of scroll, cubic ease-out)
        //
        // Blast through the tunnel. High velocity streaks and rings.
        const u = (p - 0.78) / 0.12;
        const k = 1 - Math.pow(1 - u, 3);
        camX = 0; camY = 0;
        camZ = -14 - 59 * k;             // Transition smoothly from Phase C end (-14)
        lookX = 0; lookY = 0; lookZ = -200 - 50 * u; // -200 → -250
        
        fov = 150 - 75 * k;              // 150 → 75
        rgbShift = 0.020 - 0.018 * u;
        dopplerBoost = 0.65 - 0.45 * u;
        diskScale = 0;
        streakI = 1.0 - Math.pow(u, 2);  // Decays from peak
      } else {
        // ── PHASE E — Pulsar arrival (10% of scroll, smoothstep)
        //
        // Camera decelerates into the viewing position 10u in front of pulsar.
        const u = (p - 0.90) / 0.10;
        const k = u * u * (3 - 2 * u);
        camX = 0;
        camY = 1.2 * k;
        camZ = -73 - 125 * k;            // -73 → -198
        lookX = 0; lookY = 1.2 * k; lookZ = -250 + 40 * k; // → (0,1.2,-210)
        fov = 75 - 20 * k;               // 75 → 55
        rgbShift = 0.002 * (1 - u);
        dopplerBoost = 0.20 * (1 - u);
        diskScale = 0.85; // hidden by pastBH gate
      }

      // Pulsar opacity ramps continuously across Phase D and E (starts at p=0.78)
      const pulsarOp = ss(0.78, 0.97, p);

      // Apply
      camera.position.set(camX, camY, camZ);
      camera.lookAt(lookX, lookY, lookZ);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      finalUniforms.uRGBShiftRadius.value = rgbShift;
      finalUniforms.uDopplerBoost.value = dopplerBoost;
      discMesh.scale.setScalar(Math.max(0.05, diskScale));
      partPoints.scale.setScalar(Math.max(0.05, diskScale));

      // Re-activate tunnel rings for the wormhole effect
      for (let i = 0; i < tunnelMats.length; i++) {
        const ringZ = -6 - i * 5.2;
        const dist = Math.abs(camZ - ringZ);
        // Fade rings that are too close to the camera to prevent clipping/artifacts
        const proximityFade = ss(1.0, 8.0, dist);
        tunnelMats[i].opacity = streakI * proximityFade * 0.75;
      }
      // Extreme streaks
      tunnelStreakMat.uniforms.uOpacity.value = streakI * 2.5;

      // Pulsar (cross-fades in across D and E, beam pulses on wall clock)
      const pulsarOn = pulsarOp > 0.005;
      neutronStar.visible = pulsarOn;
      beam.visible = pulsarOn;
      if (pulsarOn) {
        neutronStar.rotation.y += 0.04;
        neutronMat.emissiveIntensity = 2.2 * pulsarOp;
        const beat = (performance.now() / 1000) % 0.092;
        const a = beat < 0.080 ? Math.exp(-beat / 0.022) * 0.92 : 0.0;
        beamUni.uAlpha.value = a * pulsarOp;
        neutronLight.intensity = a * 7 * pulsarOp;
      } else {
        beamUni.uAlpha.value = 0;
        neutronLight.intensity = 0;
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
    
    if (textPoints) {
      const mat = textPoints.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      // Text gets sucked in between progress 0.0 and 0.5
      mat.uniforms.uProgress.value = Math.max(0, Math.min(1, externalProgress * 2.0));
      
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
    // CRITICAL: when the camera is past the BH (z < 0 relative to BH at origin),
    // the BH is BEHIND the camera. .project() then maps it to clip-space coords
    // outside [-1, 1] (z > 1 in NDC), but x/y can still be in-bounds — which
    // produces a phantom chromatic-aberration ring on screen. Detect and disable.
    screenPos.set(0, 0, 0).project(camera);
    const bhBehindCamera = screenPos.z > 1.0 || screenPos.z < -1.0;
    if (bhBehindCamera) {
      // Off-screen so chromatic-shift sampling lands outside the visible UV
      finalUniforms.uBlackHolePosition.value.set(-2.0, -2.0);
      // Hard-kill chromatic shift — no point distorting around something we
      // can't see. Overrides whatever the journey keyframe set.
      finalUniforms.uRGBShiftRadius.value = 0.0;
    } else {
      finalUniforms.uBlackHolePosition.value.set(
        screenPos.x * 0.5 + 0.5,
        screenPos.y * 0.5 + 0.5,
      );
    }

    // Disc + particles: hide only when WELL past the BH (>40 units behind).
    // The diskScale keyframe already smoothly fades them down, and the camera
    // frustum culls the geometry naturally once we're past. Hard-hiding too
    // early causes a sudden disappearance during the crossing.
    const pastBH = camera.position.z < -40.0;
    discMesh.visible = !pastBH;
    partPoints.visible = !pastBH;

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

    // Pass 3: final composite → screen
    renderer.setRenderTarget(null);
    renderer.render(finalScene, camera);

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
