import test from 'node:test';
import assert from 'node:assert/strict';
import * as canonical from '../lib/foundations/field/attractor-orientation/index.mjs';
import * as entry from '../lib/index.mjs';

const definition = {bounds:{x:-40,y:12,width:120,height:80},columns:6,rows:4};
const input = {attractor:{x:30,y:24},radial:.7,tangential:-.3};

test('field canonical and public imports expose exactly the same function identities',()=>{
  assert.deepEqual(Object.keys(canonical).sort(),['compileAttractorField','sampleAttractorField']);
  for(const name of Object.keys(canonical)){
    assert.equal(entry[name],canonical[name]);
  }
});

test('field plans compile and sample across canonical and aggregate entrypoints',()=>{
  const modules=[canonical,entry];
  const expected=canonical.sampleAttractorField(canonical.compileAttractorField(definition),input);
  for(const source of modules)for(const consumer of modules){
    const plan=source.compileAttractorField(definition);
    assert.deepEqual(consumer.sampleAttractorField(plan,input),expected);
    assert.ok(Object.isFrozen(plan));
    assert.ok(Object.isFrozen(plan.cells[0]));
    assert.throws(()=>consumer.sampleAttractorField({...plan},input),/compiled field plan/);
  }
});

test('field canonical entry preserves isolation, singular and shuffled evaluation',()=>{
  const mutable=structuredClone(definition),plan=canonical.compileAttractorField(mutable);
  mutable.bounds.width=1;mutable.columns=1;
  assert.deepEqual(plan,canonical.compileAttractorField(definition));
  const inputs=[input,{attractor:plan.cells[0].position,radial:1,tangential:0},
    {attractor:{x:0,y:0},radial:0,tangential:0},
    {attractor:{x:100,y:80},radial:-1,tangential:Number.MIN_VALUE}];
  const expected=inputs.map(x=>canonical.sampleAttractorField(plan,x));
  for(const i of [3,1,0,2,3,0])assert.deepEqual(canonical.sampleAttractorField(plan,inputs[i]),expected[i]);
  assert.equal(expected[1].cells[0].defined,false);
  assert.ok(expected[2].cells.every(c=>!c.defined));
});

test('a distinct canonical module instance still has a distinct plan brand',async()=>{
  const isolated=await import('../lib/foundations/field/attractor-orientation/index.mjs?compatibility-brand-probe');
  assert.notEqual(isolated.compileAttractorField,canonical.compileAttractorField);
  const normal=canonical.compileAttractorField(definition),separate=isolated.compileAttractorField(definition);
  assert.throws(()=>isolated.sampleAttractorField(normal,input),/compiled field plan/);
  assert.throws(()=>canonical.sampleAttractorField(separate,input),/compiled field plan/);
  assert.deepEqual(isolated.sampleAttractorField(separate,input),canonical.sampleAttractorField(normal,input));
});
