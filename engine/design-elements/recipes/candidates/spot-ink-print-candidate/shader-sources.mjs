// Derived from LemoLab riso.js, MIT Copyright (c) 2026 LemoLab.
// Full copyright and permission notice: licenses/LemoLab-MIT.txt.
// Fixed source and changes: PROVENANCE.md. Not a color-managed print model.
const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uOff[3];      // per-plate offset (px)
uniform float uRot[3];     // per-plate slight rotation (rad, about the frame centre)
uniform float uAng[3];     // screen angle
uniform vec3 uInk[3];
uniform vec3 uPaper;
uniform float uSeed;       // changes once per "printed sheet" (12fps steps = boiling ink grain)
uniform float uBoil;       // share of ink grain that boils 0..1
uniform float uSheet;      // sheet-level variation (ink streaks / density): changes only on shot cuts, to avoid full-screen flicker
uniform float uPeriod;     // halftone dot period px
uniform float uGate[3];    // whether this plate is on the machine yet 0..1
uniform float uSweep[3];   // inking reveal: the x (px) this plate has advanced to from right to left; >= uRes.x+200 means fully revealed
uniform float uGrain;      // ink grain strength
out vec4 o;

float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h21s(vec2 p, float s){ return h21(p + s * 17.13); }
float vn(vec2 p, float s){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  float a = h21s(i, s), b = h21s(i + vec2(1, 0), s), c = h21s(i + vec2(0, 1), s), d = h21s(i + vec2(1, 1), s);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

float dens(int i, vec2 px){
  vec2 q = rot(px - uRes * .5, uRot[i]) + uRes * .5 - uOff[i];
  float d = texture(uTex, q / uRes)[i];
  return d;
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  // paper: warm white + fibres
  float fib = vn(px * vec2(.9, .25), 7.) * .5 + vn(px * .05, 9.) * .5;
  vec3 col = uPaper * (.975 + .03 * fib);
  for (int i = 0; i < 3; i++) {
    if (uGate[i] <= 0.001) continue;
    vec2 q = rot(px - uRes * .5, uRot[i]) + uRes * .5 - uOff[i];
    float d = dens(i, px);
    // inking reveal: advances from right to left, with a slightly denser ink band at the edge
    // inking reveal: inked area = x < uSweep (advances from left to right), with a slightly denser ink band at the advancing edge
    float reveal = 1. - smoothstep(-5., 5., px.x - uSweep[i]);
    float band = exp(-pow((px.x - uSweep[i]) / 22., 2.));
    if (d < .002 && band < .01) continue;
    // halftone dots: in this plate's coordinates (shift together with the misregistration)
    vec2 g = rot(q, uAng[i]) / uPeriod;
    float spot = 1. - (cos(6.2831853 * g.x) + cos(6.2831853 * g.y) + 2.) * .25; // 0..1
    // ink grain and rough plate edges
    // ink grain: the static part follows the paper (one sheet per shot), the boiling part changes once per printed sheet, with a small amplitude (uBoil)
    float n1 = mix(h21s(floor(q * .9), uSheet + float(i) * 3.1), h21s(floor(q * .9), uSeed + float(i) * 3.1), uBoil);
    float n2 = vn(q * .33, uSheet * .7 + float(i));
    float thr = spot + (n1 - .5) * .16 * uGrain + (n2 - .5) * .12;
    float dd = d * 1.06;
    float cov = smoothstep(thr - .07, thr + .07, dd);
    cov = max(cov, smoothstep(.9, 1., d) * .96);   // solid
    // white pinholes (paper showing through solids)
    float sp = h21s(floor(q * .55), uSheet * 1.3 + float(i) * 7.7 + floor(uSeed * uBoil * 2.) * 0.);
    cov *= 1. - step(.955 - .03 * uGrain, sp) * .75 * smoothstep(.4, 1., d);
    // uneven ink: streaks along the paper-feed direction (vertical) + large density patches + an overall density per sheet
    float streak = vn(vec2(q.x * .025, q.y * .0022), 11. + float(i) + uSheet * .37);
    float blot = vn(q * .004, 5. + float(i) * 2. + uSheet * .13);
    float k = .80 + .14 * streak + .08 * blot;
    k = clamp(k, 0., 1.);
    float c = clamp(cov * k * reveal + band * .45 * smoothstep(0., .25, d), 0., 1.) * uGate[i];
    col *= mix(vec3(1.), uInk[i], c);
  }
  o = vec4(col, 1.);
}`;


export const spotInkShaderSources=Object.freeze({language:'GLSL ES 3.00',vertex:VS,fragment:FS});
