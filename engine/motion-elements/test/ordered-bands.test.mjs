import test from 'node:test';
import assert from 'node:assert/strict';
import {compileOrderedBands as compile,sampleOrderedBands as sample} from '../lib/foundations/layout/ordered-bands.mjs';
import {createOrderedBandExample,orderedBandExamples} from '../examples/ordered-bands.mjs';
const rows = weights=>weights.map((weight,i)=>({id:`b${i}`,weight}));
const plan = (a,b)=>compile({from:rows(a),to:rows(b)});
const near = (a,b)=>assert.ok(Math.abs(a-b)<1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('analytic shared-boundary oracle, not independent rectangle motion',()=>{
  const p=plan([2,5,3],[4,2,4]);
  assert.deepEqual(sample(p,0).boundaries,[0,.2,.7,1]);
  assert.deepEqual(sample(p,1).boundaries,[0,.4,.6,1]);
  sample(p,.25).boundaries.forEach((b,i)=>near(b,[0,.25,.675,1][i]));
  sample(p,.25).bands.forEach((b,i)=>near(b.fraction,[.25,.425,.325][i]));
});
test('two neutral examples: coverage, shared edges, normalized area and seek determinism',()=>{
  for(let example=0;example<2;example++) {
    const e=createOrderedBandExample(example), remembered=e.sample(.37);
    for(const t of [1,0,.9,.001,.5,.37,.99,0,1]) {
      const s=e.sample(t); assert.equal(s.boundaries[0],0); assert.equal(s.boundaries.at(-1),1);
      near(s.bands.reduce((sum,b)=>sum+b.fraction*640*180,0),640*180);
      s.bands.forEach((b,i)=>{assert.ok(b.fraction>=0); if(i)assert.equal(b.start,s.bands[i-1].end);});
    }
    assert.deepEqual(e.sample(.37),remembered);
    const calls=[];let depth=0; e.draw({save(){depth++},restore(){depth--},fillRect(...args){calls.push(args)}},.5,640,180);
    assert.equal(depth,0);assert.equal(calls.length,remembered.bands.length);
  }
});
test('zero-width IDs persist, singleton, extreme weights, 128-band boundary',()=>{
  assert.deepEqual(sample(plan([0,1,0],[1,0,0]),.5).bands.map(b=>b.fraction),[.5,.5,0]);
  assert.deepEqual(sample(plan([1],[1e12]),.4).boundaries,[0,1]);
  for(const p of [plan([Number.MIN_VALUE,0],[0,Number.MIN_VALUE]),plan([1e-20,1e12],[1e12,1e-20]),plan(Array(128).fill(1),Array(128).fill(2))]) {
    for(const t of [0,.3,1]){const s=sample(p,t);near(s.bands.reduce((a,b)=>a+b.fraction,0),1);assert.ok(s.bands.every(b=>b.fraction>=0));}
  }
});
test('endpoint scaling and output/input isolation',()=>{
  assert.deepEqual(sample(plan([1,2],[4,1]),.3),sample(plan([100,200],[8,2]),.3));
  const from=rows([1,2]),p=compile({from,to:rows([3,1])}), expected=sample(p,.4);
  from[0].weight=999;const changed=sample(p,.4);changed.boundaries[0]=8;changed.bands[0].id='wrong';
  assert.deepEqual(sample(p,.4),expected);
});
test('reject structural identity changes and invalid inputs, without invoking accessors',()=>{
  assert.throws(()=>compile({from:rows([1,2]),to:rows([2,1]).reverse()}));
  assert.throws(()=>plan([1],[1,2]));
  for(const weights of [[],[0,0],[-1,2],[NaN,1],[Infinity],Array(129).fill(1)])assert.throws(()=>plan(weights,weights));
  assert.throws(()=>compile({from:[{id:'a',weight:1},{id:'a',weight:2}],to:rows([1,2])}));
  const sparse=Array(2);sparse[1]={id:'a',weight:1};assert.throws(()=>compile({from:sparse,to:sparse}));
  let invoked=false;const accessor={get from(){invoked=true;return rows([1])},to:rows([1])};assert.throws(()=>compile(accessor));assert.equal(invoked,false);
  assert.throws(()=>compile({from:rows([1]),to:rows([1]),extra:true}));
  for(const t of [-1,1.01,NaN,Infinity,'0'])assert.throws(()=>sample(plan([1],[1]),t));
  assert.throws(()=>sample({},0));
});

test('example configuration is immutable and draw bounds explicit',()=>{
  assert.throws(()=>{orderedBandExamples[0].colors[0]='red'});
  for(const index of [-1,.5,'0',2])assert.throws(()=>createOrderedBandExample(index));
  const e=createOrderedBandExample(0);
  for(const width of [0,-1,NaN,Infinity])assert.throws(()=>e.draw({},.5,width,100));
});
