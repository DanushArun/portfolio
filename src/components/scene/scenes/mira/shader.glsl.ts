export const vert = /* glsl */ `
  // Canonical 3D simplex noise
  vec3 mod289_3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289_4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute4(vec4 x){return mod289_4(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.792843-0.853735*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,0.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g_=step(x0.yzx,x0.xyz);
    vec3 l=1.-g_;
    vec3 i1=min(g_.xyz,l.zxy);
    vec3 i2=max(g_.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289_3(i);
    vec4 p=permute4(permute4(permute4(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  attribute vec3 aColor;
  attribute float aIsCore;
  attribute float aIsLoop;
  attribute float aDensityLevel;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReveal;

  varying vec3 vColor;

  void main() {
    vec3 pos = position;
    
    // Dynamic drift
    float driftNoise = snoise(pos * 0.30 + vec3(uTime * 0.08));
    vec3 drift = vec3(driftNoise, driftNoise, driftNoise) * 0.04;
    
    vec4 mv = modelViewMatrix * vec4(pos + drift, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    
    vec3 col = aColor;
    if (aIsCore > 0.5) {
      // Warm tint for core without full washout
      col = mix(col, vec3(1.0, 0.95, 0.8), 0.3);
    }
    
    // Smooth transition from dark mist to bright tendrils
    float intensity = 0.4 + pow(aDensityLevel, 1.5) * 0.8;
    
    if (aIsCore > 0.5) {
      intensity += 1.5; // cores erupt over the 0.90 bloom threshold
    }
    if (aIsLoop > 0.5) {
      intensity += 0.5;
    }
    
    vColor = min(col * intensity, vec3(3.0));
    
    float baseSize = 0.6 + aDensityLevel * 0.8 + aIsCore * 1.5;
    float sizePx = baseSize * uPixelRatio * (30.0 / max(0.5, depth));
    gl_PointSize = clamp(sizePx * uReveal, 0.45, 4.0);
  }
`;

export const frag = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  varying vec3 vColor;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    
    float alpha = 1.0 - smoothstep(0.8, 1.0, d);
    gl_FragColor = vec4(vColor * uReveal, alpha * uReveal);
  }
`;
