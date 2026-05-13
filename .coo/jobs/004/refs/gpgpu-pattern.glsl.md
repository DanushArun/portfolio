# GPGPU ping-pong pattern (extracted from deleted MiraAttractor.tsx)

Reference for Phase C (MiraPlume.tsx). The renderer-state save/restore block
is **non-negotiable** — without it the GPGPU texture leaks onto the screen.

## 1. Two render targets

```ts
const TEX_W = 256;  // 256×256 = 65 536 particles. Plume uses 128×128 ≈ 16k.

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
```

## 2. Offscreen compute scene (one fullscreen quad)

```ts
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
    depthTest:  false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { computeMaterial: material, computeScene: scene, computeCamera: camera };
}, []);
```

## 3. Particle geometry — one vertex per texel

```ts
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
```

## 4. THE SAVE/RESTORE BLOCK — copy verbatim

```ts
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

  // Swap read/write
  const tmp = readRef.current;
  readRef.current = writeRef.current;
  writeRef.current = tmp;

  renderMaterial.uniforms.uPositions.value = readRef.current.texture;
  frameRef.current += 1;
});
```

## 5. Cleanup

```ts
useEffect(() => () => {
  rtA.dispose();
  rtB.dispose();
  computeMaterial.dispose();
  renderMaterial.dispose();
  geometry.dispose();
}, [rtA, rtB, computeMaterial, renderMaterial, geometry]);
```

## Notes

- Per-particle state encoded in RGBA: RGB = position (or velocity), A = life
  ∈ [0, 1] for plume.
- Vertex shader of the render points samples the position texture at `aRef`
  to get its world-space position.
- The save/restore block prevents R3F's automatic main-scene render from
  running with the compute target's WebGL state — that bug shows as a grey
  square overlaying the canvas.

## Source

Extracted from `src/components/scene/scenes/MiraAttractor.tsx` at commit
`HEAD~` (deleted in Phase 0 of `.claude/plans/cheerful-napping-panda.md`).
Original technique credit: merrypranxter/strange_attractors (Apr 14 2026,
custom WebGL2 FBO ping-pong). MIT-equivalent — not copyrightable math.
