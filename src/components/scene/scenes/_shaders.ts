/**
 * _shaders.ts — shared GLSL utility strings for MIRA scene files.
 *
 * Hoisted from MiraPlasma.tsx so MiraKnots, MiraSupercluster, and MiraPlume
 * can all import the same noise library without duplicating it.
 */

/**
 * NOISE_GLSL — value noise + 5-octave FBM.
 *
 * Outputs:
 *   float vnoise(vec3 p)  — single-octave value noise, range [-1..1]
 *   float fbm(vec3 p)     — 5-octave FBM, range ~ [-1..1]
 *
 * Ported from MiraPlasma (MisterPrada/vortex-glass-sphere, MIT, Mar 2025).
 */
export const NOISE_GLSL = /* glsl */ `
  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7,  74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`;

/**
 * GAUSSIAN_PULSE_GLSL — 482ms Gaussian heartbeat used by knot cores.
 *
 * Requires uniform: float uTime
 * Provides function: float gaussianPulse(float period)
 *   Returns [0..1] — peaks near t=0 within each period, fast decay.
 */
export const GAUSSIAN_PULSE_GLSL = /* glsl */ `
  float gaussianPulse(float period) {
    float phase = mod(uTime, period) / period;
    float p = exp(-pow(phase * 18.0, 2.0)) * 0.70;
    p += exp(-pow((phase - 0.15) * 24.0, 2.0)) * 0.30;
    return p;
  }
`;
