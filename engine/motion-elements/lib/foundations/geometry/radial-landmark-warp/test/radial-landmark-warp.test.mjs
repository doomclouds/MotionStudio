import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
test('one landmark agrees with analytic Gaussian at several radii and strengths',()=>{
 const warp=api.compileRadialWarp({source:[{x:0,y:0}],target:[{x:2,y:-3}],radius:4});
 for(const x of [0,1,4,12])for(const strength of [0,.25,1]){const p=warp.sample([{x,y:0}],strength)[0],w=Math.exp(-((x/4)**2))*strength;assert(Math.abs(p.x-(x+2*w))<1e-12);assert(Math.abs(p.y+3*w)<1e-12);}
});
test('compile copies landmarks and rejects duplicate ill-conditioned source',()=>{
 const source=[{x:0,y:0}],target=[{x:1,y:2}],warp=api.compileRadialWarp({source,target,radius:3});target[0].x=99;assert.equal(warp.sample([{x:0,y:0}])[0].x,1);
 assert.throws(()=>api.compileRadialWarp({source:[{x:0,y:0},{x:0,y:0}],target:[{x:1,y:0},{x:2,y:0}],radius:2}));
});
