'use client';

/**
 * BlackHole — Physics-accurate Schwarzschild renderer + EVENT_HORIZON interactivity.
 *
 * Geodesic equation for null rays in Schwarzschild geometry:
 *   d(dir)/dλ = -(3Rs/2) · h²/r⁵ · pos
 *   where h² = r² − (pos·dir)²
 *
 * Mouse interaction (EVENT_HORIZON phase):
 *   X-axis → observer angle around disk (±25°). Doppler beaming responds.
 *   Y-axis → disk inclination offset (±12°). Edge-on = stronger lensing.
 *
 * VOID phase: renders with no mouse influence (initial reveal).
 * EVENT_HORIZON phase: full mouse + scroll interaction.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { hash33, fbm3, snoise3 } from '@/lib/shaders/noise';
import { useScene, phaseTime } from '@/lib/scene-state';

// ─────────────────────────────────────────────────────────────────────────────
// Vertex shader
// ─────────────────────────────────────────────────────────────────────────────
const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldDir;
void main() {
  vUv = uv;
  vec4 ndc  = vec4(position.xy, 1.0, 1.0);
  vec4 view = inverse(projectionMatrix) * ndc;
  view /= view.w;
  vWorldDir = normalize((inverse(viewMatrix) * vec4(view.xyz, 0.0)).xyz);
  gl_Position = ndc;
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Fragment shader
// ─────────────────────────────────────────────────────────────────────────────
const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec3 vWorldDir;

uniform vec3  uCamPos;
uniform float uTime;
uniform float uRs;
uniform float uDiskTilt;   // base disk inclination (radians)
uniform float uMouseX;     // -1..1 normalized mouse X
uniform float uMouseY;     // -1..1 normalized mouse Y
uniform float uReveal;     // 0..1 — black hole reveal progress (VOID phase)
uniform float uThreshold;  // 0..1 — entering event horizon

${hash33}
${snoise3}
${fbm3}

#define STEPS     96
#define ESCAPE    62.0
#define RI        (uRs * 3.0)
#define RO        (uRs * 11.5)
#define B_CRIT    (uRs * 2.5981)

// ── Starfield ──────────────────────────────────────────────────────────────
vec3 bgStars(vec3 d) {
  vec3 col = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float sc  = 42.0 + float(i) * 88.0;
    vec3  p   = d * sc;
    vec3  h   = hash33(floor(p));
    float dst = length(fract(p) - 0.5 - h * 0.38);
    float tw  = 0.65 + 0.35 * sin(h.x * 17.3 + uTime * (0.18 + h.y * 0.35));
    float b   = smoothstep(0.032, 0.0, dst) * (0.15 + h.z * 0.62) * tw;
    col += b * mix(vec3(0.58,0.76,1.0), vec3(1.0,0.90,0.68), fract(h.x*6.8)) * 0.52;
  }
  float band = exp(-pow(d.y * 4.2, 2.0));
  float mw   = fbm3(d * 2.3, 4, 2.0, 0.5) * 0.5 + 0.5;
  col += band * mw * vec3(0.025, 0.035, 0.072) * 0.38;
  return col;
}

// ── Blackbody ramp ─────────────────────────────────────────────────────────
vec3 bbColor(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.18) return mix(vec3(0.30,0.02,0.01), vec3(0.75,0.18,0.04), t/0.18);
  if (t < 0.42) return mix(vec3(0.75,0.18,0.04), vec3(1.00,0.68,0.22), (t-0.18)/0.24);
  if (t < 0.68) return mix(vec3(1.00,0.68,0.22), vec3(1.00,0.96,0.78), (t-0.42)/0.26);
               return mix(vec3(1.00,0.96,0.78), vec3(0.82,0.90,1.00), (t-0.68)/0.32);
}

// ── Disk emission ──────────────────────────────────────────────────────────
vec3 diskEmission(vec3 diskPos, vec3 viewDirDisk) {
  float r = length(diskPos.xz);
  if (r < RI * 0.88 || r > RO * 1.06) return vec3(0.0);
  float theta = atan(diskPos.z, diskPos.x);

  // Novikov-Thorne temperature profile
  float tNorm = 0.0;
  if (r > RI) {
    float x = r / RI;
    tNorm = pow(pow(1.0/x, 0.75) * pow(max(0.0, 1.0 - inversesqrt(x)), 0.25), 0.70);
  }
  tNorm = clamp(tNorm, 0.0, 1.0);

  // Gravitational redshift
  float gGrav = sqrt(max(0.0, 1.0 - uRs / r));

  // Keplerian velocity + Doppler beaming
  float v    = clamp(sqrt(uRs / (2.0 * r)), 0.0, 0.87);
  vec2  tang = normalize(vec2(-diskPos.z, diskPos.x));
  vec3  vel  = vec3(tang.x, 0.0, tang.y) * v;
  float bn   = dot(vel, -viewDirDisk);
  float gam  = 1.0 / sqrt(max(1.0 - v*v, 0.001));
  float gD   = 1.0 / (gam * (1.0 - bn) + 1e-5);
  float beam = pow(clamp(gD, 0.02, 10.0), 4.0);

  // Radial profile
  float radial = smoothstep(RI-uRs*0.08, RI+uRs*0.55, r)
               * smoothstep(RO+uRs*0.4,  RO-uRs*1.8,  r);

  // Turbulence (2 octaves for performance)
  vec3 np1 = vec3(cos(theta)*r*0.26, sin(theta)*r*0.26, uTime*0.042);
  vec3 np2 = vec3(cos(theta)*r*1.05, sin(theta)*r*1.05, uTime*0.155);
  float tb = clamp(0.52 + 0.32*fbm3(np1,2,2.0,0.55) + 0.23*fbm3(np2,2,2.2,0.50), 0.18, 1.75);

  // Density waves
  float dw   = 0.83 + 0.24*sin(log(max(r,0.1))*7.8 - uTime*0.38 + theta*1.9);
  float lane = 1.0 - 0.62*smoothstep(0.0,0.26,-sin(theta*3.1)*sin(theta*4.9+0.5))
             * smoothstep(RI,(RI+RO)*0.48,r)*(1.0-smoothstep((RI+RO)*0.56,RO,r));

  float intensity = pow(tNorm, 1.4) * radial * tb * dw * lane * beam * gGrav;
  return bbColor(tNorm) * intensity * 5.5;
}

vec3 diskEmissionCheap(vec3 diskPos, vec3 viewDirDisk) {
  float r = length(diskPos.xz);
  if (r < RI * 0.88 || r > RO * 1.06) return vec3(0.0);
  float tNorm = (r > RI) ? clamp(pow(pow(RI/r,0.75)*pow(max(0.0,1.0-inversesqrt(r/RI)),0.25),0.70),0.0,1.0) : 0.0;
  float v = clamp(sqrt(uRs/(2.0*r)),0.0,0.87);
  vec2 tang = normalize(vec2(-diskPos.z,diskPos.x));
  vec3 vel  = vec3(tang.x,0.0,tang.y)*v;
  float gam = 1.0/sqrt(max(1.0-v*v,0.001));
  float gD  = 1.0/(gam*(1.0-dot(vel,-viewDirDisk))+1e-5);
  float beam= pow(clamp(gD,0.02,10.0),4.0);
  float rad = smoothstep(RI-uRs*0.08,RI+uRs*0.55,r)*smoothstep(RO+uRs*0.4,RO-uRs*1.8,r);
  float gG  = sqrt(max(0.0,1.0-uRs/r));
  return bbColor(tNorm)*pow(tNorm,1.4)*rad*beam*gG*5.5;
}

// ── Geodesic step (Schwarzschild velocity-Verlet) ──────────────────────────
void geodStep(inout vec3 pos, inout vec3 dir, float h) {
  float r2 = dot(pos,pos); float r = sqrt(r2);
  float r4 = r2*r2; float r5 = r4*r;
  float pd = dot(pos,dir);
  float h2 = max(0.0, r2 - pd*pd);
  vec3  ac = -(1.5*uRs*h2/r5)*pos;
  dir = normalize(dir + ac*h);
  pos = pos + dir*h;
}

// ─────────────────────────────────────────────────────────────────────────────
void main() {
  vec3 ro = uCamPos;
  vec3 rd = normalize(vWorldDir);

  // Mouse-driven disk tilt: X offsets observer angle, Y offsets inclination
  float tiltY = uDiskTilt + uMouseY * 0.21;   // ±12° inclination offset
  // Observer angle offset from mouseX: rotate the ray origin slightly in XZ
  float angOff = uMouseX * 0.44;              // ±25° (radians)
  float cosA = cos(angOff), sinA = sin(angOff);
  ro.x = uCamPos.x * cosA - uCamPos.z * sinA;
  ro.z = uCamPos.x * sinA + uCamPos.z * cosA;

  // Disk tilt matrix (rotation around X by tiltY)
  float ca = cos(tiltY), sa = sin(tiltY);
  mat3 toDisk = mat3(1.0,0.0,0.0, 0.0,ca,sa, 0.0,-sa,ca);

  vec3  diskAccum = vec3(0.0);
  float diskTrans = 1.0;
  int   nCross    = 0;
  bool  captured  = false;

  vec3 pos     = ro;
  vec3 dir     = rd;
  vec3 prevDisk = toDisk * pos;

  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);
    if (r < uRs * 0.97) { captured = true; break; }
    if (r > ESCAPE) break;

    float h = clamp(0.30*(r/uRs - 0.96), 0.04, 1.5);

    vec3 preDisk = prevDisk;
    geodStep(pos, dir, h);
    vec3 postDisk = toDisk * pos;

    if (preDisk.y * postDisk.y < 0.0) {
      float frac      = preDisk.y / (preDisk.y - postDisk.y);
      vec3  crossDisk = preDisk + (postDisk - preDisk) * frac;
      float crossR    = length(crossDisk.xz);
      if (crossR > RI*0.86 && crossR < RO*1.07 && nCross < 4) {
        vec3 vdd   = toDisk * dir;
        vec3 emit  = (nCross < 2)
          ? diskEmission(crossDisk, vdd)
          : diskEmissionCheap(crossDisk, vdd);
        float cw   = diskTrans * exp(-float(nCross)*0.68);
        diskAccum += emit * cw;
        diskTrans *= 0.48;
        nCross++;
      }
    }
    prevDisk = postDisk;
  }

  vec3 color;

  if (captured) {
    color = vec3(0.0) + diskAccum;
    float dist0  = length(ro);
    float cosAng = dot(rd, normalize(-ro));
    float angSep = acos(clamp(cosAng, -1.0, 1.0));
    float critA  = B_CRIT / dist0;
    float pr1 = exp(-pow((angSep-critA)         /(critA*0.009),2.0));
    float pr2 = exp(-pow((angSep-critA*1.018)   /(critA*0.006),2.0));
    float pr3 = exp(-pow((angSep-critA*1.034)   /(critA*0.004),2.0));
    color += vec3(1.00,0.95,0.72)*pr1*7.0;
    color += vec3(0.95,0.78,0.40)*pr2*3.0;
    color += vec3(0.88,0.62,0.24)*pr3*1.2;
    float halo = exp(-pow((angSep-critA*0.97)/(critA*0.06),2.0));
    color += vec3(0.75,0.40,0.10)*halo*0.45;
  } else {
    float bgMask = clamp(1.0 - float(nCross)*0.35, 0.0, 1.0);
    color = bgStars(dir) * bgMask + diskAccum;
  }

  // Threshold phase: vignette collapse
  if (uThreshold > 0.01) {
    vec2  ctr = vUv - 0.5;
    float d   = length(ctr);
    float cs  = uThreshold * 0.036;
    color.r = mix(color.r, bgStars(normalize(vWorldDir+vec3(ctr,0.0)*cs)).r, uThreshold*0.4);
    color.b = mix(color.b, bgStars(normalize(vWorldDir-vec3(ctr,0.0)*cs)).b, uThreshold*0.4);
    color  *= mix(1.0, smoothstep(0.90,0.06,d), uThreshold);
  }

  // Reveal: fade from black during VOID phase
  color *= uReveal;

  // ACES tonemap
  color = max(vec3(0.0), color);
  color = (color*(2.51*color+0.03))/(color*(2.43*color+0.59)+0.14);

  gl_FragColor = vec4(color, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function BlackHole() {
  const matRef  = useRef<THREE.ShaderMaterial>(null);
  const { camera, size } = useThree();
  const scene   = useScene();
  const breath  = useMemo(() => new THREE.Vector3(), []);
  const basePos = useMemo(() => new THREE.Vector3(), []);

  // Scroll-based camera approach (EVENT_HORIZON only)
  const scrollT = useRef(0); // 0..1 scroll progress

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollT.current = max > 0 ? Math.min(1, window.scrollY / max) : 0;

      // Trigger DESCENT at 85% scroll
      const { phase, setPhase } = useScene.getState();
      if (phase === 'EVENT_HORIZON' && scrollT.current > 0.85) {
        setPhase('DESCENT');
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Add scroll spacer so page is scrollable during EVENT_HORIZON
  useEffect(() => {
    if (scene.phase !== 'EVENT_HORIZON') return;
    const spacer = document.createElement('div');
    spacer.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:300vh;pointer-events:none;';
    document.body.appendChild(spacer);
    return () => spacer.remove();
  }, [scene.phase]);

  const uniforms = useMemo(
    () => ({
      uCamPos:    { value: new THREE.Vector3() },
      uTime:      { value: 0 },
      uRs:        { value: 1.0 },
      uDiskTilt:  { value: 0.28 },
      uMouseX:    { value: 0 },
      uMouseY:    { value: 0 },
      uReveal:    { value: 0 },
      uThreshold: { value: 0 },
    }),
    []
  );

  useFrame((_, dt) => {
    if (!matRef.current) return;
    uniforms.uTime.value += dt;

    const { phase, phaseStart, mouseX, mouseY } = useScene.getState();

    // Handheld camera breath
    const t = uniforms.uTime.value;
    const AMP = 0.038;
    breath.set(
      (Math.sin(t * 1.88) * 0.6 + Math.sin(t * 4.39 + 1.3) * 0.4) * AMP,
      (Math.sin(t * 2.64 + 0.7) * 0.55 + Math.sin(t * 3.45 + 2.1) * 0.45) * AMP * 0.75,
      (Math.sin(t * 4.39 + 1.3) * 0.3 + Math.sin(t * 3.45 + 2.1) * 0.3) * AMP * 0.4
    );
    basePos.copy(camera.position);
    uniforms.uCamPos.value.copy(basePos).add(breath);

    // Mouse uniforms — smooth toward target
    const MX = uniforms.uMouseX.value;
    const MY = uniforms.uMouseY.value;
    uniforms.uMouseX.value = MX + (mouseX - MX) * 0.06;
    uniforms.uMouseY.value = MY + (mouseY - MY) * 0.06;

    // Reveal (VOID: ramp from 0→1 over first 2.5s)
    if (phase === 'VOID') {
      const pt = phaseTime(phaseStart);
      uniforms.uReveal.value = Math.min(1, pt / 2.5);
      uniforms.uMouseX.value = 0; // no mouse during VOID
      uniforms.uMouseY.value = 0;
    } else if (phase === 'EVENT_HORIZON') {
      uniforms.uReveal.value = 1;
      // Threshold: approach effect as user scrolls toward event horizon
      uniforms.uThreshold.value = Math.pow(scrollT.current, 2) * 0.8;
    } else {
      uniforms.uReveal.value = 1;
      uniforms.uThreshold.value = 1;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
