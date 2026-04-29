'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from '@/lib/scene-state';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// --- CUSTOM SHADERS FOR PROCEDURAL SUN ---
const SunMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorMain: new THREE.Color('#ff8c00'),
    uColorAccent: new THREE.Color('#ffff00'),
    uIntensity: 1.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColorMain;
    uniform vec3 uColorAccent;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      // Create plasma effect using 3D noise
      float n = snoise(vPosition * 2.0 + uTime * 0.2);
      n += 0.5 * snoise(vPosition * 4.0 - uTime * 0.4);
      n += 0.25 * snoise(vPosition * 8.0 + uTime * 0.8);
      
      // Normalize noise
      n = n * 0.5 + 0.5;
      
      // Edge glow (fresnel)
      float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
      rim = smoothstep(0.6, 1.0, rim);
      
      vec3 color = mix(uColorMain, uColorAccent, n);
      color += uColorAccent * rim * 2.0;
      
      gl_FragColor = vec4(color * uIntensity, 1.0);
    }
  `
);

extend({ SunMaterial });

// --- ACCRETION DISK PARTICLES ---
function AccretionDisk({ color, radius }: { color: string, radius: number }) {
  const count = 3000;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const { positions, scales, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Dense near center, tapering off
      const r = radius + Math.random() * radius * 1.5;
      positions[i * 3 + 0] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2; // slight vertical scatter
      positions[i * 3 + 2] = Math.sin(angle) * r;
      
      scales[i] = Math.random();
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, scales, phases };
  }, [radius]);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3 + 0];
      const z = positions[i * 3 + 2];
      const r = Math.sqrt(x*x + z*z);
      
      // Rotate disk
      const angle = Math.atan2(z, x) + time * (1 / r) * 0.5;
      
      dummy.position.set(
        Math.cos(angle) * r,
        positions[i * 3 + 1] + Math.sin(time * 2 + phases[i]) * 0.1,
        Math.sin(angle) * r
      );
      
      const s = scales[i] * (0.5 + 0.5 * Math.sin(time * 3 + phases[i]));
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} rotation={[0.2, 0, 0]}>
      <planeGeometry args={[0.05, 0.05]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// --- MAIN EMERGE SYSTEM ---
export default function EmergeSystem() {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useScene((s) => s.phase);
  const localProgress = useScene((s) => s.localProgress);
  
  const mat1Ref = useRef<any>(null);
  const mat2Ref = useRef<any>(null);

  useFrame((state) => {
    if (mat1Ref.current) mat1Ref.current.uTime = state.clock.elapsedTime;
    if (mat2Ref.current) mat2Ref.current.uTime = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Fade in during EMERGE
      let opacity = 1;
      if (phase === 'C08_EMERGE') {
        opacity = Math.max(0, localProgress);
      } else if (phase !== 'C09_PROJECT') {
        opacity = 0;
      }
      
      if (mat1Ref.current) mat1Ref.current.uIntensity = opacity;
      if (mat2Ref.current) mat2Ref.current.uIntensity = opacity;
      
      // Slow majestic rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  if (phase !== 'C08_EMERGE' && phase !== 'C09_PROJECT') return null;

  return (
    <group ref={groupRef} position={[0, 0, -20]}>
      {/* Star 1: Hot Blue/White */}
      <group position={[-5, 0, 0]}>
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          {/* @ts-ignore */}
          <sunMaterial ref={mat1Ref} uColorMain={new THREE.Color('#44aaff')} uColorAccent={new THREE.Color('#ffffff')} transparent />
        </mesh>
        <AccretionDisk color="#88ccff" radius={2.2} />
      </group>

      {/* Star 2: Warm Orange/Yellow */}
      <group position={[5, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1.5, 64, 64]} />
          {/* @ts-ignore */}
          <sunMaterial ref={mat2Ref} uColorMain={new THREE.Color('#ff6600')} uColorAccent={new THREE.Color('#ffcc00')} transparent />
        </mesh>
        <AccretionDisk color="#ffaa44" radius={1.7} />
      </group>
      
      {/* Global Accretion connecting the binary system */}
      <AccretionDisk color="#aaaaaa" radius={8} />
    </group>
  );
}
