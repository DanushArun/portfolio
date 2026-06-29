export const portfolioVert = /* glsl */ `
  attribute vec3 aArtifactPosition;
  attribute vec3 aBeatPosition;
  attribute vec3 aColor;
  attribute vec3 aGlyphPosition;
  attribute vec3 aProjectPosition;
  attribute vec3 aTitleGlyphPosition;
  attribute float aArtifactAlpha;
  attribute float aArtifactScale;
  attribute float aBeatIndex;
  attribute float aProjectIndex;
  attribute float aRole;
  attribute float aSeed;

  uniform float uActiveBeat;
  uniform float uActiveProject;
  uniform float uBeatMorph;
  uniform float uGlyphMorph;
  uniform float uMotion;
  uniform float uPixelRatio;
  uniform float uProjectMorph;
  uniform float uRelease;
  uniform float uReveal;
  uniform float uTitleMorph;
  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vRole;

  float sameIndex(float left, float right) {
    return step(0.0, right) * (1.0 - step(0.5, abs(left - right)));
  }

  float sameRole(float role, float target) {
    return 1.0 - step(0.5, abs(role - target));
  }

  void main() {
    float project = sameIndex(aProjectIndex, uActiveProject);
    float beat = project * sameIndex(aBeatIndex, uActiveBeat);
    float glyphRole = sameRole(aRole, 4.0);
    float glyph = beat * glyphRole;
    float titleGlyph = beat * glyphRole * uTitleMorph;
    float readMorph = max(uGlyphMorph, uTitleMorph);
    float filament = project * sameRole(aRole, 2.0);
    float nucleus = project * sameRole(aRole, 1.0);
    float artifactFocus = project * (1.0 - glyphRole) * max(uProjectMorph, readMorph);
    float artifactTone = artifactFocus * aArtifactAlpha * (1.0 - readMorph * 0.78);

    vec3 home = position;
    vec3 pos = mix(home, aProjectPosition, project * uProjectMorph);
    pos = mix(pos, aArtifactPosition, project * max(uProjectMorph, readMorph));
    pos = mix(pos, aBeatPosition, beat * uBeatMorph * (1.0 - readMorph * 0.44));
    vec3 glyphTarget = mix(aGlyphPosition, aTitleGlyphPosition, uTitleMorph);
    pos = mix(pos, glyphTarget, max(glyph * uGlyphMorph, titleGlyph));
    pos = mix(pos, home, project * uRelease);

    float drift = sin(uTime * 0.27 + aSeed * 0.013) * 0.035 * uMotion;
    pos.xy += vec2(drift, -drift * 0.58) * (1.0 - max(glyph * uGlyphMorph, titleGlyph));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = max(1.0, -mv.z);
    float glyphFocus = max(glyph * uGlyphMorph, titleGlyph);
    float intensity = 0.36 + project * 0.24 + beat * 0.18 + artifactTone * 0.92 +
      glyphFocus * 1.12;
    float artifactSize = artifactFocus * aArtifactScale * (1.0 - readMorph * 0.42);
    float baseSize = 0.42 + nucleus * 0.22 + filament * 0.05 + artifactSize * 0.12 +
      glyphFocus * 0.58;
    gl_PointSize = clamp(baseSize * uPixelRatio * (42.0 / depth) * uReveal, 0.16, 3.1);

    vec3 hot = vec3(1.0, 0.92, 0.72);
    float readClearance = 1.0 - project * (1.0 - glyphRole) * readMorph * 0.88;
    float hotMix = glyphFocus * 0.76 + beat * glyphRole * 0.34 + beat * (1.0 - glyphRole) * 0.06;
    vColor = mix(aColor * 0.46, hot, hotMix) * intensity;
    vAlpha = (0.032 + project * 0.055 + beat * 0.07 + artifactTone * 0.95 +
      glyphFocus * 0.74) * readClearance * uReveal;
    vRole = aRole;
  }
`;

export const portfolioFrag = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vRole;

  float sameRole(float role, float target) {
    return 1.0 - step(0.5, abs(role - target));
  }

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = dot(centered, centered) * 4.0;
    if (dist > 1.0) discard;

    float glyph = sameRole(vRole, 4.0);
    float core = pow(1.0 - dist, 6.0);
    float soft = pow(1.0 - dist, 1.7);
    float alpha = (soft + core * (0.32 + glyph * 0.62)) * vAlpha;
    vec3 color = vColor * (0.32 + soft * 0.48 + core * 0.82);

    gl_FragColor = vec4(color, alpha);
  }
`;
