import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
test('three-item assignments agree with independent full permutation enumeration',()=>{
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 for(const c of [[[8,2,5],[4,9,1],[3,7,6]],[[0,0,0],[0,0,0],[0,0,0]],[[.1,.2,.3],[.3,.1,.2],[.2,.3,.1]]]){const a=api.minimumCostAssignment(c);const best=Math.min(...permutations.map(p=>p.reduce((sum,j,i)=>sum+c[i][j],0)));assert(Math.abs(a.totalCost-best)<1e-12);assert.equal(new Set(a.columns).size,3);}
});
test('input is unchanged and invalid matrix getters are not executed',()=>{
 const c=[[4,1],[2,5]],copy=structuredClone(c);api.minimumCostAssignment(c);assert.deepEqual(c,copy);let reads=0;const bad=[[1]];Object.defineProperty(bad,'0',{get(){reads++;return [1];}});assert.throws(()=>api.minimumCostAssignment(bad));assert.equal(reads,0);
});
