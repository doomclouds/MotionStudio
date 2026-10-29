import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as legacy from '../lib/sticky-interval.mjs';
import * as canonical from '../lib/foundations/layout/sticky-interval.mjs';
import * as aggregate from '../lib/index.mjs';
const input=()=>({itemId:'section',rect:{x:8,y:60,width:120,height:24},container:{start:40,end:240},scrollOffset:90,pinY:12});
const entries=[legacy,canonical,aggregate];
function error(fn,x){try{fn(x);return null;}catch(e){return{name:e.name,message:e.message};}}
test('sticky layout canonical, legacy and aggregate expose one identical function',()=>{
 assert.deepEqual(Object.keys(canonical),['stickyIntervalLayout']);assert.deepEqual(Object.keys(legacy),Object.keys(canonical));
 for(const m of entries)assert.equal(m.stickyIntervalLayout,canonical.stickyIntervalLayout);
});
test('entrypoints retain exact phases, threshold equality and shuffled pure state',()=>{
 const inputs=[-120,47,48,90,204,205,400].map(scrollOffset=>({...input(),scrollOffset}));
 const expected=inputs.map(x=>canonical.stickyIntervalLayout(x));
 assert.deepEqual(expected.map(x=>x.phase),['normal','normal','pinned','pinned','pinned','released','released']);
 for(const m of entries)for(const i of [6,3,0,5,1,4,2,0])assert.deepEqual(m.stickyIntervalLayout(inputs[i]),expected[i]);
 const x=input(),state=legacy.stickyIntervalLayout(x);x.rect.y=80;x.container.end=320;
 assert.equal(state.naturalY,-30);assert.equal(state.thresholds.release,204);
 assert.ok(Object.isFrozen(state));assert.ok(Object.isFrozen(state.rect));assert.ok(Object.isFrozen(state.thresholds));
});
test('migration preserves existing validation including realm and accessor behavior',()=>{
 const values=[null,{}, {...input(),extra:0},{...input(),rect:{...input().rect,height:0}}, {...input(),container:{start:80,end:240}}, {...input(),scrollOffset:Infinity}, {...input(),[Symbol('unknown')]:1}, vm.runInNewContext('('+JSON.stringify(input())+')')];
 for(const x of values){const expected=error(canonical.stickyIntervalLayout,x);assert.ok(expected);for(const m of entries)assert.deepEqual(error(m.stickyIntervalLayout,x),expected);}
 const x=Object.assign(Object.create(null),input());x.rect=Object.assign(Object.create(null),x.rect);x.container=Object.assign(Object.create(null),x.container);
 for(const m of entries)assert.deepEqual(m.stickyIntervalLayout(x),canonical.stickyIntervalLayout(input()));
 // Classification is not a validator-hardening change: known own getters retain their established behavior.
 let reads=0;const accessor=input();Object.defineProperty(accessor,'scrollOffset',{get(){reads++;return 90;}});
 assert.deepEqual(legacy.stickyIntervalLayout(accessor),canonical.stickyIntervalLayout(input()));assert.ok(reads>0);
});
test('queried compatibility wrappers share canonical identity; queried canonical imports are independent',async()=>{
 const wrapper=await import('../lib/sticky-interval.mjs?sticky-migration-probe');
 const isolated=await import('../lib/foundations/layout/sticky-interval.mjs?sticky-migration-probe');
 assert.equal(wrapper.stickyIntervalLayout,canonical.stickyIntervalLayout);
 assert.notEqual(isolated.stickyIntervalLayout,canonical.stickyIntervalLayout);
 assert.deepEqual(isolated.stickyIntervalLayout(input()),wrapper.stickyIntervalLayout(input()));
});
