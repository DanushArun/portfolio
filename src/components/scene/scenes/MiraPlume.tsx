'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMiraState, KNOT_TABLE, ingestForLang, advanceCycle } from '@/lib/mira-state';
import { WORLD_SCALE } from './mira/buffers';

const COMPUTE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const COMPUTE_FRAG = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uDelta;
  uniform vec3 uKnotPos;
  uniform float uFrame;
  varying vec2 vUv;

  // Canonical 3D simplex noise
  vec3 mod289_3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289_4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute4(vec4 x){return mod289_4(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.792843-0.853735*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,0.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g_=step(x0.yzx,x0.xyz);
    vec3 l=1.-g_;
    vec3 i1=min(g_.xyz,l.zxy);
    vec3 i2=max(g_.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289_3(i);
    vec4 p=permute4(permute4(permute4(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  vec3 snoiseVec3( vec3 x ){
    float s  = snoise(vec3( x ));
    float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
    float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
    vec3 c = vec3( s , s1 , s2 );
    return c;
  }

  vec3 curlNoise( vec3 p ){
    const float e = .1;
    vec3 dx = vec3( e   , 0.0 , 0.0 );
    vec3 dy = vec3( 0.0 , e   , 0.0 );
    vec3 dz = vec3( 0.0 , 0.0 , e   );

    vec3 p_x0 = snoiseVec3( p - dx );
    vec3 p_x1 = snoiseVec3( p + dx );
    vec3 p_y0 = snoiseVec3( p - dy );
    vec3 p_y1 = snoiseVec3( p + dy );
    vec3 p_z0 = snoiseVec3( p - dz );
    vec3 p_z1 = snoiseVec3( p + dz );

    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    const float divisor = 1.0 / ( 2.0 * e );
    return normalize( vec3( x , y , z ) * divisor );
  }

  vec3 hash33(vec3 p) {
    p = fract(p * vec3(.1031, .1030, .0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  void main() {
    vec4 data = texture2D(uTexture, vUv);
    vec3 pos = data.rgb;
    float life = data.a;

    if (uFrame < 1.0 || life >= 1.0) {
      // Spawn at knot with jitter
      vec3 spawnOffset = (hash33(vec3(vUv, uTime)) - 0.5) * 0.15;
      pos = uKnotPos + spawnOffset;
      life = fract(vUv.x * 43.0 + vUv.y * 79.0); // Random offset lives
    } else {
      life += uDelta * 0.7; // 1.4s cycle
      
      vec3 curl = curlNoise(pos * 0.8 + vec3(0.0, uTime * 0.1, 0.0));
      
      if (life < 0.5) {
        // Outward phase: follow curl noise field
        pos += curl * 2.0 * uDelta;
        // Mild outward pressure to ensure expansion
        pos += normalize(pos - uKnotPos + vec3(0.001)) * 0.5 * uDelta;
      } else {
        // Return phase: curve back along inverse field + gravity
        vec3 toKnot = uKnotPos - pos;
        pos -= curl * 0.5 * uDelta; 
        pos += normalize(toKnot) * length(toKnot) * 2.5 * uDelta;
      }
    }

    gl_FragColor = vec4(pos, life);
  }
`;

const RENDER_VERT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uPointSize;
  uniform vec3 uKnotColor;
  varying float vLife;
  varying vec3 vColor;

  void main() {
    vec4 data = texture2D(uTexture, uv);
    vLife = data.a;
    
    // Mix warm knot color with cool cyan
    float cohort = step(0.6, fract(uv.x * 123.4 + uv.y * 567.8));
    vColor = mix(uKnotColor, vec3(0.2, 0.6, 1.0), cohort);

    vec4 mvPosition = modelViewMatrix * vec4(data.rgb, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Scale size by life: peaks in middle, fades at ends
    float size = (1.0 - abs(vLife - 0.5) * 2.0);
    gl_PointSize = uPointSize * size * (20.0 / -mvPosition.z);
  }
`;

const RENDER_FRAG = /* glsl */ `
  varying float vLife;
  varying vec3 vColor;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float alpha = (0.5 - r) * 2.0;
    gl_FragColor = vec4(vColor, alpha * 0.8);
  }
`;

export default function MiraPlume({ reveal }: { reveal: number }) {
  const { gl } = useThree();
  const activeLang = useMiraState((s) => s.activeLang);
  const cycleStartMs = useMiraState((s) => s.cycleStartMs);
  const ingestedRef = useRef(false);

  const size = 64; // 4096 particles
  
  const [isReady, setIsReady] = useState(false);
  const computeMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const renderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const readRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const writeRef = useRef<THREE.WebGLRenderTarget | null>(null);

  useEffect(() => {
    const rt1 = new THREE.WebGLRenderTarget(size, size, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    const rt2 = rt1.clone();

    const cMat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uDelta: { value: 0 },
        uKnotPos: { value: new THREE.Vector3() },
        uFrame: { value: 0 },
      },
      vertexShader: COMPUTE_VERT,
      fragmentShader: COMPUTE_FRAG,
    });

    const rMat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uPointSize: { value: gl.getPixelRatio() * 12.0 },
        uKnotColor: { value: new THREE.Color() },
      },
      vertexShader: RENDER_VERT,
      fragmentShader: RENDER_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(size * size * 3);
    const uvs = new Float32Array(size * size * 2);
    for (let i = 0; i < size * size; i++) {
      uvs[i * 2] = (i % size) / size;
      uvs[i * 2 + 1] = Math.floor(i / size) / size;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    computeMaterialRef.current = cMat;
    renderMaterialRef.current = rMat;
    geometryRef.current = g;
    readRef.current = rt1;
    writeRef.current = rt2;

    setIsReady(true);

    return () => {
      rt1.dispose();
      rt2.dispose();
      cMat.dispose();
      rMat.dispose();
      g.dispose();
    };
  }, [gl]);

  const computeScene = useMemo(() => {
    // eslint-disable-next-line react-hooks/refs
    if (!isReady || !computeMaterialRef.current) return null;
    const s = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // eslint-disable-next-line react-hooks/refs
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), computeMaterialRef.current);
    s.add(mesh);
    return { s, cam };
  }, [isReady]);

  const frameRef = useRef(0);

  useFrame((state, delta) => {
    const cMat = computeMaterialRef.current;
    const rMat = renderMaterialRef.current;
    if (!cMat || !rMat || !computeScene || !readRef.current || !writeRef.current || reveal < 0.85) return;

    // 1. Cycle & Ingestion logic
    const sinceCycleStart = performance.now() - cycleStartMs;
    
    if (sinceCycleStart >= 3000 && !ingestedRef.current) {
      ingestedRef.current = true;
      ingestForLang(activeLang);
      advanceCycle();
    } else if (sinceCycleStart < 3000) {
      ingestedRef.current = false;
    }

    // 2. GPGPU Compute
    const knot = KNOT_TABLE.find(k => k.lang === activeLang)!;
    cMat.uniforms.uTexture.value = readRef.current.texture;
    cMat.uniforms.uTime.value = state.clock.elapsedTime;
    cMat.uniforms.uDelta.value = Math.min(delta, 0.1);
    cMat.uniforms.uKnotPos.value.set(
      knot.position[0] * WORLD_SCALE,
      knot.position[1] * WORLD_SCALE,
      knot.position[2] * WORLD_SCALE
    );
    cMat.uniforms.uFrame.value = frameRef.current;

    gl.setRenderTarget(writeRef.current);
    gl.render(computeScene.s, computeScene.cam);
    gl.setRenderTarget(null);

    // Swap
    const tmp = readRef.current;
    readRef.current = writeRef.current;
    writeRef.current = tmp;

    // 3. Render setup
    rMat.uniforms.uTexture.value = readRef.current.texture;
    rMat.uniforms.uKnotColor.value.set(knot.hue);
    frameRef.current++;
  });

  if (!isReady || reveal < 0.85 || !geometryRef.current || !renderMaterialRef.current) return null;

  return (
    <points
      geometry={geometryRef.current}
      material={renderMaterialRef.current}
      frustumCulled={false}
    />
  );
}
