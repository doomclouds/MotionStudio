import test from 'node:test';
import assert from 'node:assert/strict';
import {drawFlatColorBrush as draw, flatBrushGeometry as geom} from '../index.mjs';
import {drawSampleRibbon, drawConcavePatch} from '../examples/consumers.mjs';
const opts = {x:150, y:90, width:24, length:100, color:'#bd6044'};
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
function frozen(o) { assert.ok(Object.isFrozen(o)); for (const v of Object.values(o)) if(v && typeof v==='object') frozen(v); }
function mock(fail) {
  const state = {depth:0, saves:0, calls:0};
  const ctx = {save(){state.depth++;state.saves++;},restore(){state.depth--;}};
  for(const name of ['translate','rotate','beginPath','moveTo','lineTo','closePath','fill','clip']) ctx[name]=()=>{state.calls++;if(name===fail) throw Error('backend failure');};
  return {ctx,state};
}
test('literal edge, basis, lift, frozen geometry and supported extremes',()=>{
  for(const width of [6,24,40,48]) for(const length of [60,140,260]) for(const angle of [-2*Math.PI,-1.8,0,.7,Math.PI,2*Math.PI]) for(const lift of [0,Number.MIN_VALUE,.5,1]) {
    const o={...opts,width,length,angle,lift},s=geom(o),c=Math.cos(angle),t=Math.sin(angle);
    near(s.visibleEdge.a.x,150-.18*length*c+width/2*t);
    near(s.visibleEdge.a.y,90-.14*length*lift-.18*length*t-width/2*c);
    near(Math.hypot(s.visibleEdge.a.x-s.visibleEdge.b.x,s.visibleEdge.a.y-s.visibleEdge.b.y),width);
    near(s.basis.axis.x*s.basis.edge.x+s.basis.axis.y*s.basis.edge.y,0);
    assert.equal(s.contact,lift===0);assert.equal(s.contactEdge,lift===0?s.visibleEdge:null);
    assert.deepEqual(s.nominalOrigin,{x:150,y:90});frozen(s);
    for(const p of [s.visibleEdge.a,s.visibleEdge.b]) for(const [key,axis] of [['X','x'],['Y','y']]) assert.ok(p[axis]>=s.toolBounds['min'+key]&&p[axis]<=s.toolBounds['max'+key]);
    const {ctx}=mock();assert.deepEqual(draw(ctx,o),s);assert.deepEqual(o,{...opts,width,length,angle,lift});
  }
});
test('strict options fail before Canvas calls and never execute getters',()=>{
  const {ctx,state}=mock();
  const bad=[undefined,null,[],new Date(),Object.create({x:1,y:2}),{}, {x:1}, {...opts,[Symbol()]:2}];
  for(const key of ['x','y','angle','length','width','lift']) for(const v of [undefined,null,'1',NaN,Infinity,-Infinity]) bad.push({...opts,[key]:v});
  for(const [key,v] of [['x',1e6+1],['y',-1e6-1],['angle',7],['length',59],['length',261],['width',5],['width',49],['lift',-.1],['lift',1.1],['color','red'],['color','#fff'],['color',undefined],['color',null],['extra',0]]) bad.push({...opts,[key]:v});
  let invoked=false;const accessor={...opts};Object.defineProperty(accessor,'lift',{enumerable:true,get(){invoked=true;return 0;}});bad.push(accessor);
  const hidden={...opts};Object.defineProperty(hidden,'lift',{value:0});bad.push(hidden);
  for(const o of bad) assert.throws(()=>draw(ctx,o));
  assert.equal(invoked,false);assert.equal(state.saves,0);assert.equal(state.calls,0);
  assert.deepEqual(geom(Object.assign(Object.create(null),opts)),geom(opts));
  assert.throws(()=>draw(null,opts),/Canvas/);
});
test('exceptions restore exactly once after transform, path or fill failure',()=>{
  for(const op of ['translate','rotate','beginPath','lineTo','fill']) {
    const {ctx,state}=mock(op);assert.throws(()=>draw(ctx,opts),/backend failure/);assert.equal(state.depth,0);assert.equal(state.saves,1);
  }
  const {ctx,state}=mock();Object.defineProperty(ctx,'fillStyle',{set(){throw Error('style failure');}});
  assert.throws(()=>draw(ctx,opts),/style failure/);assert.equal(state.depth,0);
});
test('synthetic consumers validate first and restore nested scopes on errors',()=>{
  for(const consumer of [drawSampleRibbon,drawConcavePatch]) {
    for(const value of [-1,1.01,NaN,undefined,'0']) {const {ctx,state}=mock();assert.throws(()=>consumer(ctx,value));assert.equal(state.saves,0);}
    const {ctx,state}=mock('fill');assert.throws(()=>consumer(ctx,.5),/backend failure/);assert.equal(state.depth,0);
  }
});

test('core does not read or write caller filters',()=>{
  const {ctx}=mock();Object.defineProperty(ctx,'filter',{get(){throw Error('filter read');},set(){throw Error('filter write');}});
  draw(ctx,opts);
});
