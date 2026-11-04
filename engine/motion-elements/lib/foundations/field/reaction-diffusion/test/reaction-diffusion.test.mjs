import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
const spec={width:2,height:1,u:[1,0],v:[0,0],steps:1,dt:.1,diffusionU:1,diffusionV:0,feed:0,kill:0};
test('clamped four-neighbor pure diffusion has hand-computed two-cell result',()=>{
 const out=api.reactionDiffusion(spec);assert.deepEqual([...out.u],[.9,.1]);assert.deepEqual([...out.v],[0,0]);assert.equal(out.u[0]+out.u[1],1);
});
test('fixed-step chunks reproduce replay; zero steps copy and excessive dt rejects',()=>{
 const first=api.reactionDiffusion({...spec,steps:3}),chunk=api.reactionDiffusion({...spec,...first,steps:2}),whole=api.reactionDiffusion({...spec,steps:5});assert.deepEqual(chunk,whole);const zero=api.reactionDiffusion({...spec,steps:0});assert.deepEqual([...zero.u],spec.u);zero.u[0]=0;assert.equal(spec.u[0],1);assert.throws(()=>api.reactionDiffusion({...spec,dt:.1001}));
});
