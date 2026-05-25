export const vert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aDensityLevel;
  attribute float aIsCore;
  attribute float aIsHalo;
  attribute float aLangIndex;
  attribute vec3 aWarpParams;

  uniform float uActive;
  uniform float uDensity0;
  uniform float uDensity1;
  uniform float uDensity2;
  uniform float uDensity3;
  uniform float uDensity4;
  uniform float uHover;
  uniform float uMotion;
  uniform float uPixelRatio;
  uniform float uReveal;
  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vCore;
  varying float vHalo;

  float langDensity(float idx) {
    if (idx < 0.5) return uDensity0;
    if (idx < 1.5) return uDensity1;
    if (idx < 2.5) return uDensity2;
    if (idx < 3.5) return uDensity3;
    return uDensity4;
  }

  float isSelected(float idx, float target) {
    return step(0.0, target) * (1.0 - step(0.5, abs(idx - target)));
  }

  void main() {
    vec3 pos = position;
    float selected = isSelected(aLangIndex, uActive);
    float hover = isSelected(aLangIndex, uHover);
    float density = langDensity(max(0.0, aLangIndex));
    float spine = aWarpParams.z;

    float drift = sin(uTime * 0.22 + aWarpParams.x) * aWarpParams.y * uMotion;
    pos.xy += vec2(drift, -drift * 0.62);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = max(1.0, -mv.z);
    float core = step(0.5, aIsCore);
    float halo = step(0.5, aIsHalo);
    float activeBoost = 1.0 + selected * 0.56 + hover * 0.28;
    float densityBoost = 0.62 + density * 0.82;

    vec3 hot = vec3(1.0, 0.96, 0.82);
    vec3 cool = mix(aColor, vec3(0.16, 0.54, 1.0), halo * 0.24);
    vColor = mix(cool, hot, core * 0.58) * activeBoost * densityBoost;

    float baseSize = mix(0.92 + spine * 0.38, 1.9, core);
    baseSize = mix(baseSize, 0.82, halo);
    float size = baseSize * uPixelRatio * (36.0 / depth) * (0.72 + density * 0.48);
    gl_PointSize = clamp(size * uReveal, 0.42, core > 0.5 ? 3.4 : 1.9);

    float baseAlpha = 0.48 + aDensityLevel * 0.42;
    baseAlpha = mix(baseAlpha, 0.18 + density * 0.18, halo);
    baseAlpha = mix(baseAlpha, 0.72, core);
    vAlpha = baseAlpha * activeBoost * uReveal;
    vCore = core;
    vHalo = halo;
  }
`;

export const frag = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vCore;
  varying float vHalo;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = dot(centered, centered) * 4.0;
    if (dist > 1.0) discard;

    float soft = pow(1.0 - dist, 1.9);
    float coreHot = pow(1.0 - dist, 9.0) * vCore;
    float haloSoft = pow(1.0 - dist, 1.15) * vHalo;
    float alpha = (soft + coreHot * 0.48 + haloSoft * 0.25) * vAlpha;
    vec3 color = vColor * (0.62 + soft * 0.82 + coreHot * 1.4);

    gl_FragColor = vec4(color * (0.46 + alpha * 0.92), alpha);
  }
`;
