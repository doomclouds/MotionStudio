import test from 'node:test';import assert from 'node:assert/strict';
import {coverageGlyph as f} from '../index.mjs';import {buildExamples} from '../examples/contract.mjs';
const at=(luminance,other={})=>f({coverage:1,luminance,...other});
test('equal scalar bins, short ramps, clamp at upper endpoint and optional index floor',()=>{
 assert.deepEqual([0,.24,.25,.49,.5,.74,.75,1].map(v=>at(v,{ramp:'abcd'})),['a','a','b','b','c','c','d','d']);
 assert.equal(at(.49,{ramp:' .'}),' ');assert.equal(at(.5,{ramp:' .'}),'.');assert.equal(at(0,{ramp:'abc',minimumIndex:2}),'c');assert.equal(at(1,{ramp:'abcd',shade:.5}),'c');
});
test('coverage is an independent gate, not glyph ink area',()=>{
 assert.equal(f({coverage:.229,luminance:1}),null);assert.equal(f({coverage:.23,luminance:1}),'#');assert.equal(f({coverage:0,luminance:0,threshold:0,ramp:'ab'}),'a');assert.equal(at(0,{ramp:' .'}),' ');
});
test('Unicode scalars are intact; multi-scalar shaping is outside contract',()=>{
 assert.equal(at(0,{ramp:'😀😎'}),'😀');assert.equal(at(1,{ramp:'😀😎'}),'😎');for(const ramp of ['','a','a\ud800','a\udfff','e\u0301','a\n','a\u200d','a\ufe0f','a\u2028','a\u2029','a\u00a0','x'.repeat(65)])assert.throws(()=>at(1,{ramp}));assert.equal(at(1,{ramp:'😀'.repeat(64)}),'😀');
});
test('strict bounded inputs; no coercion or accessors',()=>{
 for(const key of ['coverage','luminance','shade','threshold'])for(const bad of [NaN,Infinity,-1,1.01,'1',null])assert.throws(()=>at(1,{[key]:bad}));
 for(const bad of [-1,1.5,15,Infinity])assert.throws(()=>at(1,{minimumIndex:bad}));
 for(const input of [null,[],{},Object.create(null),{coverage:1},{luminance:1},{coverage:1,luminance:1,extra:0},{coverage:1,luminance:1,[Symbol()]:1}])assert.throws(()=>f(input));
 let reads=0;assert.throws(()=>f({get coverage(){reads++;return 1;},luminance:1}));assert.equal(reads,0);
});
test('deterministic, no input writes, two independent synthetic consumers',()=>{
 const input=Object.freeze({coverage:.8,luminance:.7,ramp:'abcd'});const expected=at(.7,{coverage:.8,ramp:'abcd'});for(let i=0;i<100;i++)assert.equal(f(input),expected);
 const a=buildExamples(),b=buildExamples();assert.deepEqual(a,b);assert.notDeepEqual(a[0].rows,a[1].rows);
});
