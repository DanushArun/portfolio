/* eslint-disable react-hooks/immutability */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KNOTS_W } from './knot-config';
import { KNOT_TABLE, type MiraLang } from '@/lib/mira-state';

const coreVert = /* glsl */ `
  attribute float aIndex;
  uniform float uScale;
  uniform vec3  uPos0; uniform vec3  uPos1; uniform vec3  uPos2;
  uniform vec3  uPos3; uniform vec3  uPos4;
  uniform float uSize0; uniform float uSize1; uniform float uSize2;
  uniform float uSize3; uniform float uSize4;
  uniform vec3  uHue0; uniform vec3  uHue1; uniform vec3  uHue2;
  uniform vec3  uHue3; uniform vec3  uHue4;
  uniform float uActive;
  varying vec2 vUv; varying vec3 vHue; varying float vIsActive;

  void main() {
    vec3 origin; float s;
    if      (aIndex < 0.5) { origin=uPos0; s=uSize0; vHue=uHue0; }
    else if (aIndex < 1.5) { origin=uPos1; s=uSize1; vHue=uHue1; }
    else if (aIndex < 2.5) { origin=uPos2; s=uSize2; vHue=uHue2; }
    else if (aIndex < 3.5) { origin=uPos3; s=uSize3; vHue=uHue3; }
    else                   { origin=uPos4; s=uSize4; vHue=uHue4; }
    vIsActive = abs(aIndex - uActive) < 0.5 ? 1.0 : 0.0;
    vUv = uv;
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world = origin + right*position.x*s + up*position.y*s;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const coreFrag = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  uniform float uTime;
  varying vec2 vUv; varying vec3 vHue; varying float vIsActive;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float r = length(p) * 2.0;
    if (r > 1.0) discard;

    // 482ms heartbeat pulse
    float period = 0.482;
    float phase = mod(uTime, period) / period;
    float pulse = exp(-pow(phase * 18.0, 2.0)) * 0.70 + exp(-pow((phase - 0.15) * 24.0, 2.0)) * 0.30;
    
    float core  = pow(1.0 - r, 12.0); // Tighter core
    float inner = pow(1.0 - r, 3.0);
    float halo  = pow(1.0 - r, 1.5);
    
    // Core goes extremely bright white, then falls off to the hue color.
    vec3 col = mix(vHue, vec3(1.0, 0.98, 0.90), core);
    float boost = mix(1.0, 1.0 + pulse * 0.4, vIsActive);
    
    // Intensity needs to be high enough to hit the 0.90 bloom threshold, but not blowout the screen
    float intensity = (core * 2.2 + inner * 0.8 + halo * 0.2) * boost * uReveal;
    float alpha = (inner * 0.7 + halo * 0.3) * (0.6 + vIsActive * 0.4) * uReveal;
    
    gl_FragColor = vec4(col * intensity, alpha);
  }
`;

export interface CoreBillboardsProps {
  reveal: number;
  activeLang: MiraLang;
  density: Record<MiraLang, number>;
}

const LANG_INDEX: Record<string, number> = { EN: 0, HI: 1, TA: 2, KN: 3, TE: 4 };

export function CoreBillboards({ reveal, activeLang, density }: CoreBillboardsProps) {
  const { geometry, material } = useMemo(() => {
    const QUAD = 5;
    const positions = new Float32Array(QUAD * 4 * 3);
    const uvs = new Float32Array(QUAD * 4 * 2);
    const indices = new Uint16Array(QUAD * 6);
    const idxAttr = new Float32Array(QUAD * 4);
    for (let q = 0; q < QUAD; q++) {
      const v = q * 4;
      positions[v*3]   = -0.5; positions[v*3+1]   = -0.5; positions[v*3+2]   = 0;
      positions[v*3+3] =  0.5; positions[v*3+4]   = -0.5; positions[v*3+5]   = 0;
      positions[v*3+6] =  0.5; positions[v*3+7]   =  0.5; positions[v*3+8]   = 0;
      positions[v*3+9] = -0.5; positions[v*3+10]  =  0.5; positions[v*3+11]  = 0;
      uvs[v*2]=0; uvs[v*2+1]=0;
      uvs[(v+1)*2]=1; uvs[(v+1)*2+1]=0;
      uvs[(v+2)*2]=1; uvs[(v+2)*2+1]=1;
      uvs[(v+3)*2]=0; uvs[(v+3)*2+1]=1;
      idxAttr[v]=q; idxAttr[v+1]=q; idxAttr[v+2]=q; idxAttr[v+3]=q;
      const tri = q * 6;
      indices[tri]=v; indices[tri+1]=v+1; indices[tri+2]=v+2;
      indices[tri+3]=v; indices[tri+4]=v+2; indices[tri+5]=v+3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    g.setAttribute('aIndex',   new THREE.BufferAttribute(idxAttr, 1));
    g.setIndex(new THREE.BufferAttribute(indices, 1));

    const hueColors = KNOTS_W.map(
      (k) => new THREE.Color(KNOT_TABLE.find((kt) => kt.lang === k.lang)!.hue),
    );
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uReveal: { value: reveal },
        uTime:   { value: 0 },
        uScale:  { value: 1 },
        uActive: { value: 0 },
        uPos0: { value: new THREE.Vector3(...KNOTS_W[0].pos) },
        uPos1: { value: new THREE.Vector3(...KNOTS_W[1].pos) },
        uPos2: { value: new THREE.Vector3(...KNOTS_W[2].pos) },
        uPos3: { value: new THREE.Vector3(...KNOTS_W[3].pos) },
        uPos4: { value: new THREE.Vector3(...KNOTS_W[4].pos) },
        uSize0: { value: 0.30 * KNOTS_W[0].scale },
        uSize1: { value: 0.30 * KNOTS_W[1].scale },
        uSize2: { value: 0.30 * KNOTS_W[2].scale },
        uSize3: { value: 0.30 * KNOTS_W[3].scale },
        uSize4: { value: 0.30 * KNOTS_W[4].scale },
        uHue0: { value: hueColors[0] }, uHue1: { value: hueColors[1] },
        uHue2: { value: hueColors[2] }, uHue3: { value: hueColors[3] },
        uHue4: { value: hueColors[4] },
      },
      vertexShader: coreVert,
      fragmentShader: coreFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [reveal]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uActive.value = LANG_INDEX[activeLang];
    material.uniforms.uReveal.value = reveal;
    material.uniforms.uSize0.value = 0.45*KNOTS_W[0].scale*(0.92+density[KNOTS_W[0].lang]*0.55);
    material.uniforms.uSize1.value = 0.45*KNOTS_W[1].scale*(0.92+density[KNOTS_W[1].lang]*0.55);
    material.uniforms.uSize2.value = 0.45*KNOTS_W[2].scale*(0.92+density[KNOTS_W[2].lang]*0.55);
    material.uniforms.uSize3.value = 0.45*KNOTS_W[3].scale*(0.92+density[KNOTS_W[3].lang]*0.55);
    material.uniforms.uSize4.value = 0.45*KNOTS_W[4].scale*(0.92+density[KNOTS_W[4].lang]*0.55);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
