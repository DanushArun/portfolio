export const vert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aIsCore;
  attribute float aIsLoop;
  attribute float aDensityLevel;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReveal;

  varying vec3 vColor;
  varying float vAlphaMultiplier;

  // Ultra-cheap trigonometric drift to replace expensive 3D simplex noise
  // This prevents the system from frying while allowing 400,000+ particles
  vec3 cheapDrift(vec3 p, float t) {
      float x = sin(p.y * 0.5 + t) * cos(p.z * 0.3 + t * 0.8);
      float y = cos(p.x * 0.5 + t * 0.9) * sin(p.z * 0.3 + t * 1.1);
      float z = sin(p.x * 0.3 + t * 1.2) * cos(p.y * 0.5 + t * 0.7);
      return vec3(x, y, z);
  }

  void main() {
    vec3 pos = position;
    
    // Smooth, cheap gravitational drift
    vec3 drift = cheapDrift(pos, uTime * 0.1) * 0.08 + cheapDrift(pos * 2.0, uTime * 0.2) * 0.02;
    
    vec4 mv = modelViewMatrix * vec4(pos + drift, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    
    bool isCore = aIsCore > 0.5;
    bool isFossilized = aDensityLevel < 0.0;
    float effectiveDensity = max(0.0, aDensityLevel);
    
    vec3 col = aColor;
    if (isCore) {
      col = mix(col, vec3(1.0, 0.95, 0.8), 0.4);
    }
    
    float intensity = 0.5 + pow(effectiveDensity, 2.0) * 1.5;
    if (isCore) {
      intensity += 1.5; 
    }
    if (aIsLoop > 0.5) {
      intensity += 0.5 + sin(uTime * 0.5 + pos.x) * 0.3; 
    }
    if (isFossilized) {
      intensity *= 0.1;
    }
    
    vColor = min(col * intensity, vec3(4.0));
    
    // Very fine particles to allow massive counts
    float baseSize = 1.0 + effectiveDensity * 2.0;
    if (isCore) baseSize += 2.0;
    if (isFossilized) baseSize *= 0.5;
    
    float sizePx = baseSize * uPixelRatio * (40.0 / max(0.5, depth));
    gl_PointSize = clamp(sizePx * uReveal, 0.5, 8.0);
    
    // Sharp falloff into pure black
    float depthFalloff = smoothstep(2.0, 25.0, depth);
    vAlphaMultiplier = mix(1.0, 0.0, depthFalloff);
    if (isFossilized) vAlphaMultiplier *= 0.3;
  }
`;

export const frag = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vAlphaMultiplier;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    
    // Sharp, microscopic point of light for filaments
    float alpha = pow(1.0 - d, 2.0) * 0.6;
    
    gl_FragColor = vec4(vColor * uReveal * alpha * vAlphaMultiplier, alpha * uReveal * vAlphaMultiplier);
  }
`;
