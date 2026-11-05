/** Copyright (c) 2026 Palink. MIT License; see LICENSE.
 * Original flat-color brush candidate. Tool art only; no stroke renderer. */
const KEYS = new Set(['x', 'y', 'angle', 'length', 'width', 'color', 'lift']);
function read(input) {
  if (!input || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new TypeError('Expected plain options record');
  const o = {angle: 0, length: 140, width: 18, color: '#357d86', lift: 0};
  for (const k of Reflect.ownKeys(input)) {
    const d = Object.getOwnPropertyDescriptor(input, k);
    if (!KEYS.has(k) || !d.enumerable || !('value' in d)) throw new TypeError('Unknown or non-data option');
    o[k] = d.value;
  }
  for (const [k, lo, hi] of [['x', -1e6, 1e6], ['y', -1e6, 1e6], ['angle', -Math.PI*2, Math.PI*2], ['length', 60, 260], ['width', 6, 48], ['lift', 0, 1]]) {
    if (typeof o[k] !== 'number' || !Number.isFinite(o[k]) || o[k] < lo || o[k] > hi) throw new RangeError(`Invalid ${k}`);
  }
  if (typeof o.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(o.color)) throw new TypeError('color must be #RRGGBB');
  return o;
}
const point = (x,y) => Object.freeze({x,y});
function bounds(points) {
  return Object.freeze({minX: Math.min(...points.map(p=>p.x)), minY: Math.min(...points.map(p=>p.y)), maxX: Math.max(...points.map(p=>p.x)), maxY: Math.max(...points.map(p=>p.y))});
}
function geometry(o) {
  const {length:L,width:W}=o, c=Math.cos(o.angle), s=Math.sin(o.angle), raise=o.lift*.14*L;
  const map = ([a,b]) => point(o.x+a*c-b*s,o.y-raise+a*s+b*c);
  const bristles=[[-.18*L,-W/2],[0,-.46*W],[0,.46*W],[-.18*L,W/2]];
  const ferrule=[[0,-.5*W],[.19*L,-.39*W],[.19*L,.39*W],[0,.5*W]];
  const handle=[[.18*L,-.28*W],[.7*L,-.22*W],[.79*L,-.13*W],[.82*L,0],[.79*L,.13*W],[.7*L,.22*W],[.18*L,.28*W]];
  const edge=Object.freeze({a:map(bristles[0]),b:map(bristles[3])});
  return {map,bristles,ferrule,handle,state:Object.freeze({nominalOrigin:point(o.x,o.y),visibleOrigin:point(o.x,o.y-raise),visibleEdge:edge,edgeBounds:bounds([edge.a,edge.b]),toolBounds:bounds([...bristles,...ferrule,...handle].map(map)),contact:o.lift===0,contactEdge:o.lift===0?edge:null,basis:Object.freeze({axis:point(c,s),edge:point(-s,c)}),width:W,length:L,lift:o.lift,toolOnly:true})};
}
/** Geometry in caller-local coordinates, prior to any parent Canvas transform. */
export function flatBrushGeometry(input) { return geometry(read(input)).state; }
export function drawFlatColorBrush(ctx,input) {
  const o=read(input),g=geometry(o),L=o.length,W=o.width;
  for(const name of ['save','restore','translate','rotate','beginPath','moveTo','lineTo','closePath','fill']) if(typeof ctx?.[name]!=='function') throw new TypeError('Canvas 2D context required');
  const poly=(color,pts)=>{ctx.fillStyle=color;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
  ctx.save();
  try {
    ctx.translate(o.x,o.y-o.lift*.14*L);ctx.rotate(o.angle);
    ctx.shadowColor='rgba(0,0,0,0)';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    // No filter use. Caller should supply an unfiltered context for literal bounds.
    poly('#a86a38',g.handle);
    poly('#d2a061',[[.2*L,-.24*W],[.7*L,-.18*W],[.78*L,-.06*W],[.3*L,-.1*W]]);
    poly('#82502f',[[.23*L,.17*W],[.72*L,.15*W],[.76*L,.08*W],[.35*L,.09*W]]);
    poly('#9da5a4',g.ferrule);
    poly('#e2e6df',[[.015*L,-.43*W],[.18*L,-.34*W],[.18*L,-.07*W],[.015*L,-.14*W]]);
    poly('#6e7a7b',[[.015*L,.28*W],[.18*L,.22*W],[.18*L,.34*W],[.015*L,.44*W]]);
    poly('#c3cac4',[[.145*L,-.4*W],[.155*L,-.395*W],[.155*L,.395*W],[.145*L,.4*W]]);
    poly(o.color,g.bristles);
    // Sparse bristle facets stop short of the continuous, literal contact edge.
    for(const t of [-.31,-.12,.14,.33]) poly('rgba(24,32,30,.20)',[[-.157*L,t*W],[-.012*L,(t-.025)*W],[-.012*L,(t+.015)*W]]);
    poly('rgba(255,255,255,.19)',[[-.16*L,-.38*W],[-.015*L,-.38*W],[-.015*L,-.26*W],[-.16*L,-.32*W]]);
  } finally {ctx.restore();}
  return g.state;
}
