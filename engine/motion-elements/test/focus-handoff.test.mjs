import test from 'node:test';
import assert from 'node:assert/strict';
import {compileFocusHandoff as compile,sampleFocusHandoff as sample,rational as T,transformBounds} from '../lib/index.mjs';
const input={type:'recipe.focus-handoff',version:1,cardIds:['draft','structure','output'],selectedId:'structure',detailId:'detail',nextId:'next',start:T(0),travel:{x:0,y:55},rotationStep:.03,focusScale:1.6};
test('focus handoff preserves fixed identity, selected top z and exact entry to focus boundary',()=>{
 for(const selectedId of input.cardIds){
 const p=compile({...input,selectedId}),endEntry=sample(p,T(70,100)),startFocus=sample(p,T(150,100));
 assert.deepEqual(endEntry.layers,startFocus.layers);
 for(const at of [0,.3,.7,1.5,1.9,2.35,3.65,4,4.35,7]){
 const state=sample(p,T(Math.round(at*100),100));assert.deepEqual(state.layers.map(x=>x.itemId),input.cardIds);
 const selected=state.layers.find(x=>x.itemId===selectedId);assert.equal(selected.zIndex,3);
 assert.ok(state.layers.every(x=>x.zIndex<=3));assert.equal(state.layers.length,3);
 }
 }
});
test('focus frame remains fixed during handoff and old content is not alpha-overlaid',()=>{
 const p=compile(input);let expected;
 for(const at of [235,364,365,366,400,434,435,700]){
 const state=sample(p,T(at,100)),selected=state.layers.find(x=>x.itemId===input.selectedId);
 expected??=selected.matrix;assert.deepEqual(selected.matrix,expected);assert.equal(selected.opacity,1);
 assert.deepEqual(selected.geometryBounds,{x:448,y:212,width:1024,height:576});
 assert.equal(selected.content.drawPrevious,at<435);
 assert.equal(selected.content.detailReveal,1);assert.ok(selected.content.nextReveal>=0&&selected.content.nextReveal<=1);
 assert.ok(state.layers.filter(x=>x.itemId!==input.selectedId).every(x=>x.opacity===0));
 }
 assert.equal(sample(p,T(3)).phase,'detail');assert.equal(sample(p,T(4)).phase,'handoff');assert.equal(sample(p,T(5)).phase,'next');
});
test('focus handoff boundary neighborhoods are continuous and seek-safe',()=>{
 const p=compile(input),times=[0,70,150,235,365,435,700],expected=new Map();
 for(const v of times){const a=sample(p,T(v*1000-1,100000)),b=sample(p,T(v*1000+1,100000));
 for(let i=0;i<3;i++)for(let j=0;j<6;j++)assert.ok(Math.abs(a.layers[i].matrix[j]-b.layers[i].matrix[j])<.01);
 expected.set(v,sample(p,T(v,100)));
 }
 for(const v of [...times].reverse())assert.deepEqual(sample(p,T(v,100)),expected.get(v));
});
test('reduced focus keeps cues, readable cards and explicit midpoint cuts',()=>{
 const p=compile(input),options={reducedMotion:true};
 assert.deepEqual(sample(p,T(0)).cueTimes,sample(p,T(0),options).cueTimes);
 assert.ok(sample(p,T(0),options).layers.every(l=>l.opacity===1));
 const a=sample(p,T(1924,1000),options),b=sample(p,T(1925,1000),options);
 assert.ok(a.layers.every(l=>l.opacity===1));assert.equal(b.layers.filter(l=>l.opacity===1).length,1);
 assert.equal(sample(p,T(3999,1000),options).layers[1].content.nextReveal,0);
 assert.equal(sample(p,T(4),options).layers[1].content.nextReveal,1);
});
test('focus strict bindings, time, budgets and parent transform/bounds',()=>{
 for(const bad of [null,{...input,extra:1},{...input,cardIds:['a','b']},{...input,selectedId:'missing'},{...input,nextId:'detail'},{...input,travel:{x:101,y:0}},{...input,rotationStep:.05},{...input,focusScale:2},{...input,start:T(86400)}])assert.throws(()=>compile(bad));
 const p=compile(input);assert.throws(()=>sample(JSON.parse(JSON.stringify(p)),T(2)));
 for(const opts of [{parentMatrix:[2,0,0,1,0,0]},{parentMatrix:[1,.1,0,1,0,0]},{reducedMotion:null},{typo:1}])assert.throws(()=>sample(p,T(2),opts));
 const state=sample(p,T(3),{parentMatrix:[.5,0,0,.5,20,30]});
 assert.deepEqual(state.layers[1].geometryBounds,{x:244,y:136,width:512,height:288});
 for(const l of state.layers)assert.deepEqual(l.geometryBounds,transformBounds(l.matrix,l.rect));
});
