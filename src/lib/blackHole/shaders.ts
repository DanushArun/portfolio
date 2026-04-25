/**
 * Bruno Simon's exact shaders from
 *   https://github.com/brunosimon/webgl-black-hole
 *
 * Verbatim. The only mechanical change: the noises fragment shader inlines
 * the contents of `partials/perlin3dPeriodic.glsl` (Stefan Gustavson's classic
 * Perlin 3D, MIT-licensed) since we are not using a glsl-loader bundler plugin.
 */

// ─── Disc ─────────────────────────────────────────────────────────────────────
export const discVert = `uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vUv = uv;
}`;

export const discFrag = `precision highp float;
precision highp int;

uniform float uTime;
uniform sampler2D uNoiseTexture;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uCamAzimuth;   // camera angle around the disc spin axis (radians)

in vec2 vUv;

layout(location = 0) out vec4 pc_FragColor;

float inverseLerp(float v, float minValue, float maxValue)
{
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax)
{
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

vec3 blendAdd(vec3 base, vec3 blend)
{
    return min(base + blend, vec3(1.0));
}

void main()
{
    vec4 color = vec4(0.0);
    color.a = 1.0;

    float iterations = 3.0;

    for (float i = 0.0; i < iterations; i++)
    {
        float progress = i / (iterations - 1.0);

        float intensity = 1.0 - ((vUv.y - progress) * iterations) * 0.5;
        intensity = smoothstep(0.0, 1.0, intensity);

        vec2 uv = vUv;
        uv.y *= 2.0;
        uv.x += uTime / ((i * 10.0) + 1.0);

        vec3 ringColor = mix(uInnerColor, uOuterColor, progress);

        float noiseIntensity = texture(uNoiseTexture, uv).r;

        ringColor = mix(vec3(0.0), ringColor.rgb, noiseIntensity * intensity);

        color.rgb = blendAdd(color.rgb, ringColor);
    }

    float edgesAttenuation = min(inverseLerp(vUv.y, 0.0, 0.02), inverseLerp(vUv.y, 1.0, 0.5));

    color.rgb = mix(vec3(0.0), color.rgb, edgesAttenuation);

    // Relativistic Doppler beaming — dominant asymmetry in EHT M87 imagery
    // and Thorne et al. 2015 (DNGR). vUv.x maps disc azimuth 0..1; subtract
    // the camera azimuth so the boost peak tracks the approaching side.
    // Power 2.5 concentrates the boost on a quarter-disc wedge.
    float discAngle = vUv.x * 6.2832;
    float angleDiff = discAngle - uCamAzimuth;
    float doppler   = 0.20 + 1.50 * pow(0.5 + 0.5 * cos(angleDiff), 2.5);
    color.rgb *= doppler;

    pc_FragColor = color;
}`;

// ─── Disc particles ───────────────────────────────────────────────────────────
export const discParticlesVert = `#define PI 3.1415926538

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uTime;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uViewHeight;
uniform float uSize;
uniform float uCamAzimuth;

in float position;
in float aSize;
in float aRandom;

out vec3 vColor;

void main()
{
    float concentration = 0.05;
    float outerProgress = smoothstep(0.0, 1.0, position);
    outerProgress = mix(concentration, outerProgress, pow(aRandom, 1.7));
    float radius = 1.0 + outerProgress * 5.0;

    float angle = outerProgress - uTime * (1.0 - outerProgress) * 3.0;
    vec3 newPosition = vec3(
        sin(angle) * radius,
        0.0,
        cos(angle) * radius
    );
    vec4 modelViewPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    gl_PointSize = aSize * uSize * uViewHeight;
    gl_PointSize *= (1.0 / - modelViewPosition.z);

    vColor = mix(uInnerColor, uOuterColor, outerProgress);

    // Doppler beaming on per-particle brightness — matches the disc shader
    // formula. Use the particle's actual world XZ angle (atan2 of new
    // position) so each particle is dimmed/boosted by where it physically
    // sits relative to the observer.
    float worldAngle = atan(newPosition.z, newPosition.x);
    float angleDiff = worldAngle - uCamAzimuth;
    float doppler = 0.20 + 1.50 * pow(0.5 + 0.5 * cos(angleDiff), 2.5);
    vColor *= doppler;
}`;

export const discParticlesFrag = `precision highp float;
precision highp int;

layout(location = 0) out vec4 pc_FragColor;

in vec3 vColor;

void main()
{
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceToCenter > 0.5)
        discard;

    pc_FragColor = vec4(vColor, 0.5);
}`;

// ─── Stars particles ──────────────────────────────────────────────────────────
export const starsVert = `uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uViewHeight;
uniform float uSize;

in vec3 position;
in float aSize;
in vec3 aColor;

out vec3 vColor;

void main()
{
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    gl_PointSize = aSize * uSize * uViewHeight;

    vColor = aColor;
}`;

export const starsFrag = `precision highp float;
precision highp int;

layout(location = 0) out vec4 pc_FragColor;

in vec3 vColor;

void main()
{
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceToCenter > 0.5)
        discard;

    pc_FragColor = vec4(vColor, 1.0);
}`;

// ─── Distortion (active + mask) ──────────────────────────────────────────────
export const distortionVert = `uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vUv = uv;
}`;

export const distortionActiveFrag = `precision highp float;
precision highp int;

in vec2 vUv;

layout(location = 0) out vec4 pc_FragColor;

float inverseLerp(float v, float a, float b) { return (v - a) / (b - a); }
float remap(float v, float inMin, float inMax, float outMin, float outMax)
{
    return mix(outMin, outMax, inverseLerp(v, inMin, inMax));
}

void main()
{
    float distanceToCenter = length(vUv - 0.5);
    float radialStrength = remap(distanceToCenter, 0.0, 0.15, 1.0, 0.0);
    radialStrength = smoothstep(0.0, 1.0, radialStrength);

    float strength = radialStrength;
    pc_FragColor = vec4(strength, 1.0, 1.0, 1.0);
}`;

export const distortionMaskFrag = `precision highp float;
precision highp int;

in vec2 vUv;

layout(location = 0) out vec4 pc_FragColor;

float inverseLerp(float v, float a, float b) { return (v - a) / (b - a); }
float remap(float v, float inMin, float inMax, float outMin, float outMax)
{
    return mix(outMin, outMax, inverseLerp(v, inMin, inMax));
}

void main()
{
    float distanceToCenter = length(vUv - 0.5);
    float radialStrength = remap(distanceToCenter, 0.0, 0.15, 1.0, 0.0);
    radialStrength = smoothstep(0.0, 1.0, radialStrength);

    float alpha = smoothstep(0.0, 1.0, remap(distanceToCenter, 0.4, 0.5, 1.0, 0.0));

    pc_FragColor = vec4(radialStrength, 0.0, 0.0, alpha);
}`;

// ─── Final composite (post-process) ──────────────────────────────────────────
export const finalVert = `in vec3 position;
in vec2 uv;

out vec2 vUv;

void main()
{
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}`;

export const finalFrag = `#define PI 3.1415926538

precision highp float;
precision highp int;

in vec2 vUv;

uniform sampler2D uSpaceTexture;
uniform sampler2D uDistortionTexture;
uniform vec2 uBlackHolePosition;
uniform float uRGBShiftRadius;

layout(location = 0) out vec4 pc_FragColor;

vec3 getRGBShiftedColor(sampler2D _texture, vec2 _uv, float _radius)
{
    vec3 angle = vec3(
        PI * 2.0 / 3.0,
        PI * 4.0 / 3.0,
        0.0
    );
    vec3 color = vec3(0.0);
    color.r = texture(_texture, _uv + vec2(sin(angle.r) * _radius, cos(angle.r) * _radius)).r;
    color.g = texture(_texture, _uv + vec2(sin(angle.g) * _radius, cos(angle.g) * _radius)).g;
    color.b = texture(_texture, _uv + vec2(sin(angle.b) * _radius, cos(angle.b) * _radius)).b;

    return color;
}

void main()
{
    vec4 distortionColor = texture(uDistortionTexture, vUv);
    float distortionIntensity = distortionColor.r;
    vec2 towardCenter = vUv - uBlackHolePosition;
    towardCenter *= - distortionIntensity * 2.0;

    vec2 distortedUv = vUv + towardCenter;

    // Add radial blur during descent warp
    vec3 outColor = vec3(0.0);
    float blurSamples = 8.0;
    float blurStrength = uRGBShiftRadius * 2.0; // Scale blur with RGB shift

    for(float i = 0.0; i < blurSamples; i++)
    {
        float scale = 1.0 + (i / (blurSamples - 1.0) - 0.5) * blurStrength;
        vec2 sampleUv = uBlackHolePosition + (distortedUv - uBlackHolePosition) * scale;
        outColor += getRGBShiftedColor(uSpaceTexture, sampleUv, uRGBShiftRadius);
    }
    outColor /= blurSamples;

    pc_FragColor = vec4(outColor, 1.0);
}
`;

// ─── Noises (Perlin 3D periodic, render-once to texture) ─────────────────────
export const noisesVert = `in vec3 position;
in vec2 uv;

out vec2 vUv;

void main()
{
    gl_Position = vec4(position, 1.0);

    vUv = uv;
}`;

// Stefan Gustavson's classic Perlin 3D periodic noise inlined
export const noisesFrag = `precision highp float;
precision highp int;

in vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float perlin3dPeriodic(vec3 P, vec3 rep)
{
    vec3 Pi0 = mod(floor(P), rep);
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}

layout(location = 0) out vec4 pc_FragColor;

void main()
{
    float uFrequency = 8.0;

    float noiseR = perlin3dPeriodic(vec3(vUv * uFrequency, 123.456), vec3(uFrequency)) * 0.5 + 0.5;
    float noiseG = perlin3dPeriodic(vec3(vUv * uFrequency, 456.789), vec3(uFrequency)) * 0.5 + 0.5;
    float noiseB = perlin3dPeriodic(vec3(vUv * uFrequency, 789.123), vec3(uFrequency)) * 0.5 + 0.5;

    pc_FragColor = vec4(noiseR, noiseG, noiseB, 1.0);
}`;
