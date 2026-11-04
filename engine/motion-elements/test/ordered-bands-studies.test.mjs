import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrderedBandStudy,orderedBandStudies} from '../examples/ordered-bands-studies.mjs';
import {compileOrderedBands,sampleOrderedBands} from '../lib/foundations/layout/ordered-bands.mjs';
const context=()=>({depth:0,save(){this.depth++},restore(){this.depth--},scale(){},fillRect(){},fillText(){}});
test('distinct synthetic consumers retain explicit content and endpoint totals',()=>{
 assert.equal(orderedBandStudies.workload.from.reduce((a,b)=>a+b),40);
 assert.equal(orderedBandStudies.inventory.to.reduce((a,b)=>a+b),160);
 for(const name of Object.keys(orderedBandStudies)) {
  const study=createOrderedBandStudy(name),expected=study.sample(.37);
  for(const progress of [1,0,.7,.37,1,.37]) { const ctx=context();assert.deepEqual(study.draw(ctx,progress,640,360),study.sample(progress));assert.equal(ctx.depth,0); }
  assert.deepEqual(study.sample(.37),expected);
  const reduced=createOrderedBandStudy(name,true);
  for(const progress of [0,.1,.5,1]) assert.deepEqual(reduced.sample(progress),study.sample(1));
 }
 assert.equal(createOrderedBandStudy('inventory').sample(0).bands.at(-1).fraction,0);
 assert.equal(createOrderedBandStudy('inventory').sample(1).bands.at(-1).fraction,.25);
});
test('studies validate caller progress even in reduced mode and restore draw failures',()=>{
 for(const name of ['wrong',null])assert.throws(()=>createOrderedBandStudy(name));
 assert.throws(()=>createOrderedBandStudy('workload',1));
 const study=createOrderedBandStudy('workload',true);
 for(const progress of [-1,NaN,Infinity,1.1])assert.throws(()=>study.sample(progress));
 const ctx=context();ctx.fillText=()=>{throw Error('draw failure')};assert.throws(()=>study.draw(ctx,.5));assert.equal(ctx.depth,0);
});
test('ordered bands reject nested/array accessors without invoking them and preserve tiny collapsed IDs',()=>{
 let calls=0;const row={id:'a',get weight(){calls++;return 1}};
 assert.throws(()=>compileOrderedBands({from:[row],to:[row]}));
 const arr=[];Object.defineProperty(arr,0,{get(){calls++;return {id:'a',weight:1}},enumerable:true});
 assert.throws(()=>compileOrderedBands({from:arr,to:arr}));assert.equal(calls,0);
 const from=[{id:'large',weight:1e12},{id:'tiny',weight:1e-20}];
 const state=sampleOrderedBands(compileOrderedBands({from,to:from}),.4);
 assert.equal(state.bands[1].id,'tiny');assert.equal(state.bands[1].fraction,0);
});

test('study text alignment is explicit and caller text state is restored',()=>{
 for(const name of Object.keys(orderedBandStudies)) {
  const ctx=context();ctx.textAlign='right';ctx.textBaseline='top';
  ctx.save=function(){this.depth++;this.saved=[this.textAlign,this.textBaseline]};
  ctx.restore=function(){this.depth--;[this.textAlign,this.textBaseline]=this.saved};
  let texts=0;ctx.fillText=function(){texts++;assert.equal(this.textAlign,'left');assert.equal(this.textBaseline,'alphabetic')};
  createOrderedBandStudy(name).draw(ctx,.5);
  assert.ok(texts>0);assert.equal(ctx.textAlign,'right');assert.equal(ctx.textBaseline,'top');assert.equal(ctx.depth,0);
 }
});
