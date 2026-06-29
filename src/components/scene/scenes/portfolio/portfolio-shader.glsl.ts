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
  uniform float uFromBeat;
  uniform float uFromProject;
  uniform float uGlyphMorph;
  uniform float uMotion;
  uniform float uPixelRatio;
  uniform float uProjectMorph;
  uniform float uRelease;
  uniform float uReveal;
  uniform float uStepMorph;
  uniform float uTitleMorph;
  uniform float uToBeat;
  uniform float uToProject;
  uniform float uTime;
  uniform float uTransitionActive;

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
    float settledProject = sameIndex(aProjectIndex, uActiveProject);
    float settledBeat = settledProject * sameIndex(aBeatIndex, uActiveBeat);
    float fromProject = sameIndex(aProjectIndex, uFromProject);
    float toProject = sameIndex(aProjectIndex, uToProject);
    float fromBeat = fromProject * sameIndex(aBeatIndex, uFromBeat);
    float toBeat = toProject * sameIndex(aBeatIndex, uToBeat);
    float transition = clamp(uTransitionActive, 0.0, 1.0);
    float stepMorph = clamp(uStepMorph, 0.0, 1.0);
    float transitionProject = max(fromProject, toProject);
    float transitionBeat = max(fromBeat * (1.0 - stepMorph), toBeat * stepMorph);
    float project = mix(settledProject, transitionProject, transition);
    float beat = mix(settledBeat, transitionBeat, transition);
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
    float intensity = 0.34 + project * 0.18 + beat * 0.12 + artifactTone * 0.48 +
      glyphFocus * 1.46;
    float artifactSize = artifactFocus * aArtifactScale * (1.0 - readMorph * 0.42);
    float baseSize = 0.42 + nucleus * 0.22 + filament * 0.05 + artifactSize * 0.12 +
      glyphFocus * 0.64;
    gl_PointSize = clamp(baseSize * uPixelRatio * (42.0 / depth) * uReveal, 0.16, 3.3);

    vec3 hot = vec3(1.0, 0.92, 0.72);
    float readClearance = 1.0 - project * (1.0 - glyphRole) * readMorph * 0.98;
    float hotMix = glyphFocus * 0.84 + beat * glyphRole * 0.34 + beat * (1.0 - glyphRole) * 0.03;
    vColor = mix(aColor * 0.46, hot, hotMix) * intensity;
    vAlpha = (0.032 + project * 0.055 + beat * 0.07 + artifactTone * 0.95 +
      glyphFocus * 0.88) * readClearance * uReveal;
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
    float alpha = (soft * (1.0 - glyph * 0.34) + core * (0.34 + glyph * 1.04)) * vAlpha;
    vec3 color = vColor * (0.28 + soft * 0.34 + core * (0.88 + glyph * 0.34));

    gl_FragColor = vec4(color, alpha);
  }
`;
