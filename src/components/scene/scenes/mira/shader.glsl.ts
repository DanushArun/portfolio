export const vert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aIsCore;
  attribute float aIsLoop;
  attribute float aDensityLevel;
  attribute vec3 aWarpParams; // [offset, scale, thickness]

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReveal;

  varying vec3 vColor;
  varying float vAlphaMultiplier;

  // Extremely fast GPU-side fractal noise for tearing the neural web
  // We use this to replace the CPU-based fbm3/fbmVec3
  float fastNoise(vec3 p) {
    return sin(p.x * 0.5 + p.y * 1.2 + p.z * 0.8) * cos(p.y * 0.4 - p.z * 1.5 + p.x * 0.9);
  }

  vec3 fbmWarpGPU(vec3 p, float offset) {
    vec3 p1 = p * 0.2 + vec3(offset);
    vec3 p2 = p * 0.8 + vec3(offset * 2.0);
    vec3 p3 = p * 2.5;

    float n1 = fastNoise(p1);
    float n2 = fastNoise(p2 + vec3(n1));
    float n3 = fastNoise(p3);

    return vec3(n1 * 1.0 + n2 * 0.4 + n3 * 0.1);
  }

  void main() {
    vec3 pos = position;
    
    // Fractal Tearing (Intelligence Topology) - Now on the GPU!
    // aWarpParams.x = offset, aWarpParams.y = chaosScale
    bool isCore = aIsCore > 0.5;
    bool isLoop = aIsLoop > 0.5;

    if (!isCore) {
      // Apply the same 'bulge' logic (0 at nodes, max in middle) as before
      // We calculate a pseudo-bulge based on position or we can just apply it generally.
      // For simplicity and crispness, we apply a static fractal warp.
      vec3 warp = fbmWarpGPU(pos, aWarpParams.x);
      pos += warp * aWarpParams.y;
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    
    float effectiveDensity = max(0.0, aDensityLevel);
    
    vec3 deepVoidColor = vec3(0.05, 0.1, 1.0);
    vec3 hotCoreColor = vec3(1.0, 0.95, 0.8);
    
    vec3 col = aColor;
    
    if (isCore) {
      col = mix(col, hotCoreColor, 0.8);
    } else {
      col = mix(deepVoidColor, col, effectiveDensity);
      col += aColor * effectiveDensity * 0.5;
    }
    
    float intensity = 0.5 + effectiveDensity * 2.0;
    if (isCore) intensity += 1.5;
    
    vColor = min(col * intensity, vec3(5.0));
    
    // Density restored: particles are tiny but dense.
    float baseSize = 0.8;
    if (isCore) baseSize = 1.6;
    
    float sizePx = baseSize * uPixelRatio * (40.0 / max(0.5, depth));
    gl_PointSize = clamp(sizePx * uReveal, 0.5, 3.0);
    
    float depthFalloff = smoothstep(1.0, 30.0, depth);
    vAlphaMultiplier = mix(1.0, 0.0, depthFalloff);
  }
`;

export const frag = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vAlphaMultiplier;

  void main() {
    // Ultra-optimized fragment shader.
    // Avoid length() and pow(). Use dot product (squared distance) instead.
    vec2 c = gl_PointCoord - vec2(0.5);
    float dSq = dot(c, c) * 4.0; // 0 at center, 1 at edges
    if (dSq > 1.0) discard;
    
    // Simple linear falloff using squared distance is incredibly cheap
    float alpha = (1.0 - dSq) * 0.8;
    
    gl_FragColor = vec4(vColor * uReveal * alpha * vAlphaMultiplier, alpha * uReveal * vAlphaMultiplier);
  }
`;
