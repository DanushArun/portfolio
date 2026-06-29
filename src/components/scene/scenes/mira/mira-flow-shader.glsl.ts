export const miraFlowVert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSeed;
  attribute vec3 aTarget0;
  attribute vec3 aTarget1;
  attribute vec3 aTarget2;
  attribute vec3 aTarget3;
  attribute vec3 aTarget4;
  attribute vec3 aTarget5;
  attribute vec3 aTarget6;
  attribute vec3 aTarget7;

  uniform float uBeatIndex;
  uniform float uBeatMorph;
  uniform float uPixelRatio;
  uniform float uReveal;
  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 targetForBeat(float index) {
    if (index < 0.5) return aTarget0;
    if (index < 1.5) return aTarget1;
    if (index < 2.5) return aTarget2;
    if (index < 3.5) return aTarget3;
    if (index < 4.5) return aTarget4;
    if (index < 5.5) return aTarget5;
    if (index < 6.5) return aTarget6;
    return aTarget7;
  }

  void main() {
    float safeBeat = clamp(uBeatIndex, 0.0, 7.0);
    float previousBeat = max(0.0, safeBeat - 1.0);
    float morph = smoothstep(0.0, 1.0, uBeatMorph);
    vec3 target = mix(targetForBeat(previousBeat), targetForBeat(safeBeat), morph);
    vec3 home = position;

    float phase = uTime * 1.35 + aSeed * 0.017;
    float stream = sin(phase + target.x * 2.4) * 0.045;
    vec3 pos = mix(home, target, uReveal);
    pos.xy += vec2(stream, -stream * 0.35) * uReveal;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = max(1.0, -mv.z);
    float pulse = 0.72 + sin(phase) * 0.28;
    gl_PointSize = clamp((0.52 + pulse * 0.24) * uPixelRatio * (42.0 / depth), 0.2, 3.6);

    vec3 heat = vec3(1.0, 0.74, 0.36);
    vColor = mix(aColor * 0.72, heat, 0.18 + pulse * 0.22);
    vAlpha = (0.26 + pulse * 0.18) * uReveal;
  }
`;

export const miraFlowFrag = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = dot(centered, centered) * 4.0;
    if (dist > 1.0) discard;

    float core = pow(1.0 - dist, 5.0);
    float soft = pow(1.0 - dist, 1.55);
    float alpha = (soft * 0.72 + core * 0.48) * vAlpha;
    vec3 color = vColor * (0.34 + soft * 0.52 + core * 0.72);

    gl_FragColor = vec4(color, alpha);
  }
`;
