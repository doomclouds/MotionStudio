import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as legacy from '../lib/two-link-ik.mjs';
import * as canonical from '../lib/foundations/geometry/two-link-ik.mjs';
import * as aggregate from '../lib/index.mjs';
const input=()=>({root:{x:10,y:20},target:{x:34,y:38},upperLength:18,lowerLength:24,bend:'positive',fallbackAxis:{x:1,y:0}});
const entries=[legacy,canonical,aggregate];
function error(fn,x){try{fn(x);return null;}catch(e){return{name:e.name,message:e.message};}}
test('two-link geometry canonical, legacy and aggregate expose the same one function',()=>{
 assert.deepEqual(Object.keys(canonical),['solveTwoLinkIK']);assert.deepEqual(Object.keys(legacy),Object.keys(canonical));
 for(const m of entries)assert.equal(m.solveTwoLinkIK,canonical.solveTwoLinkIK);
});
test('entrypoints retain shared reachable, projected, coincident and shuffled pure-state semantics',()=>{
 const inputs=[input(),{...input(),target:{x:100,y:20}},{...input(),target:{x:10,y:20}},{...input(),upperLength:18,lowerLength:18,target:{x:10,y:20}},{...input(),bend:'negative'}],expected=inputs.map(x=>canonical.solveTwoLinkIK(x));
 for(const m of entries)for(const i of [4,1,0,3,2,0])assert.deepEqual(m.solveTwoLinkIK(inputs[i]),expected[i]);
 const x=input(),state=legacy.solveTwoLinkIK(x);x.root.x=999;assert.equal(state.root.x,10);assert.ok(Object.isFrozen(state));assert.ok(Object.isFrozen(state.joint));
});
test('legacy validation/error behavior including null-prototype and cross-realm remains unchanged',()=>{
 const values=[null,{}, {...input(),extra:0},{...input(),target:{x:10+1e-12,y:20}}, {...input(),upperLength:0}, {...input(),bend:'other'}, {...input(),fallbackAxis:{x:0,y:0}}, {...input(),[Symbol('unknown')]:1}, vm.runInNewContext('('+JSON.stringify(input())+')')];
 for(const x of values){const expected=error(canonical.solveTwoLinkIK,x);assert.ok(expected);for(const m of entries)assert.deepEqual(error(m.solveTwoLinkIK,x),expected);}
 const x=Object.assign(Object.create(null),input());x.root=Object.assign(Object.create(null),x.root);for(const m of entries)assert.deepEqual(m.solveTwoLinkIK(x),canonical.solveTwoLinkIK(input()));
 // This migration deliberately does not replace the established validator with a stricter one.
 let reads=0;const accessor=input();Object.defineProperty(accessor,'upperLength',{get(){reads++;return 18;}});assert.deepEqual(legacy.solveTwoLinkIK(accessor),canonical.solveTwoLinkIK(input()));assert.ok(reads>0);
});
test('wrapper URL queries share canonical identity while canonical queries create independent functions',async()=>{
 const wrapper=await import('../lib/two-link-ik.mjs?ik-migration-probe');const isolated=await import('../lib/foundations/geometry/two-link-ik.mjs?ik-migration-probe');
 assert.equal(wrapper.solveTwoLinkIK,canonical.solveTwoLinkIK);assert.notEqual(isolated.solveTwoLinkIK,canonical.solveTwoLinkIK);
 assert.deepEqual(isolated.solveTwoLinkIK(input()),wrapper.solveTwoLinkIK(input()));
});
