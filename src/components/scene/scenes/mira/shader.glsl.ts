export const vert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aIsCore;
  attribute float aIsLoop;
  attribute float aDensityLevel;
  attribute vec3 aWarpParams;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReveal;

  varying vec3 vColor;
  varying float vAlphaMultiplier;
  varying float vCore;
  varying float vLoop;

  float fastNoise(vec3 p) {
    return sin(p.x * 0.5 + p.y * 1.2 + p.z * 0.8)
      * cos(p.y * 0.4 - p.z * 1.5 + p.x * 0.9);
  }

  vec3 fbmWarpGPU(vec3 p, float offset) {
    vec3 p1 = p * 0.22 + vec3(offset);
    vec3 p2 = p * 0.92 + vec3(offset * 2.0);
    vec3 p3 = p * 2.1;

    float n1 = fastNoise(p1);
    float n2 = fastNoise(p2 + vec3(n1));
    float n3 = fastNoise(p3);

    return vec3(n1 * 0.72 + n2 * 0.28 + n3 * 0.08);
  }

  void main() {
    vec3 pos = position;
    bool isCore = aIsCore > 0.5;
    bool isLoop = aIsLoop > 0.5;
    vCore = isCore ? 1.0 : 0.0;
    vLoop = isLoop ? 1.0 : 0.0;

    if (!isCore) {
      float warpScale = isLoop ? aWarpParams.y * 0.34 : aWarpParams.y;
      pos += fbmWarpGPU(pos, aWarpParams.x + uTime * 0.018) * warpScale;
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = -mv.z;
    float density = max(0.0, aDensityLevel);
    vec3 deepBlue = vec3(0.045, 0.16, 0.95);
    vec3 ionViolet = vec3(0.42, 0.18, 1.0);
    vec3 hotCore = vec3(1.0, 0.94, 0.76);
    vec3 loopGold = vec3(1.0, 0.62, 0.28);
    vec3 col = aColor;

    if (isCore) {
      col = mix(col, hotCore, 0.82);
    } else if (isLoop) {
      col = mix(loopGold, hotCore, 0.20);
    } else {
      col = mix(mix(deepBlue, ionViolet, density), col, density * 0.78);
    }

    float twinkle = 0.88 + 0.12 * sin(uTime * 1.3 + aWarpParams.x);
    float intensity = 0.42 + density * 1.90;
    if (isCore) intensity += 2.2;
    if (isLoop) intensity += 0.36;

    vColor = min(col * intensity * twinkle, vec3(5.0));

    float baseSize = 0.48;
    if (isCore) baseSize = 1.54;
    if (isLoop) baseSize = 0.74;

    float sizePx = baseSize * uPixelRatio * (40.0 / max(0.5, depth));
    gl_PointSize = clamp(sizePx * uReveal, 0.24, 2.6);

    float depthFalloff = smoothstep(1.0, 30.0, depth);
    vAlphaMultiplier = mix(1.0, 0.0, depthFalloff);
  }
`;

export const frag = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vAlphaMultiplier;
  varying float vCore;
  varying float vLoop;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float dSq = dot(c, c) * 4.0;
    if (dSq > 1.0) discard;

    float pointAlpha = 0.42;
    pointAlpha = mix(pointAlpha, 0.56, vLoop);
    pointAlpha = mix(pointAlpha, 0.88, vCore);
    float alpha = (1.0 - dSq) * pointAlpha;
    float finalAlpha = alpha * uReveal * vAlphaMultiplier;

    gl_FragColor = vec4(vColor * uReveal * alpha * vAlphaMultiplier, finalAlpha);
  }
`;
