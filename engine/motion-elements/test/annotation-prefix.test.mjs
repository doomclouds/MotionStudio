import test from 'node:test';
import assert from 'node:assert/strict';
import {annotationExamples,sampleAnnotationExample as sample} from '../examples/annotation-prefix.mjs';

test('diagram leader preserves its elbow; halfway pen and ink share one endpoint',()=>{
  const s=sample(0,.5);
  assert.deepEqual(s.screenVertices,[{x:32,y:38},{x:92,y:38},{x:92,y:68}]);
  assert.strictEqual(s.pen,s.screenVertices.at(-1));
  assert.equal(s.section.length,90);
  assert.equal(s.showPen,true);
});
test('measured span uses the same prefix under a rotated parent exactly once',()=>{
  const s=sample(1,.5);
  assert.deepEqual(s.screenVertices,[{x:100,y:42},{x:60,y:42},{x:60,y:102}]);
  assert.strictEqual(s.pen,s.screenVertices.at(-1));
  assert.equal(s.section.length,100);
});
test('zero has no ink or floating pen; full state retains every authored corner',()=>{
  for(let i=0;i<annotationExamples.length;i++){
    assert.equal(sample(i,0).drawStroke,false);
    assert.equal(sample(i,0).showPen,false);
    assert.equal(sample(i,1).showPen,false);
    assert.deepEqual(sample(i,1).section.vertices.map(v=>v.position),annotationExamples[i].points);
  }
});
test('exact corner is not duplicated; all partial points stay within prefix distance',()=>{
  const corner=sample(0,1/3);
  assert.deepEqual(corner.screenVertices,[{x:32,y:38},{x:92,y:38}]);
  for(let i=0;i<2;i++)for(const p of [.001,.2,.5,.999,1]){
    const s=sample(i,p);
    assert.ok(s.section.vertices.every(v=>v.distance<=s.section.endDistance));
    assert.equal(s.section.vertices.at(-1).distance,s.section.endDistance);
  }
});
test('seek, repeat, reduced-motion and immutable state are explicit example policies',()=>{
  for(let i=0;i<2;i++){
    const expected=sample(i,.37);
    for(const p of [1,0,.91,.01])sample(i,p);
    assert.deepEqual(sample(i,.37),expected);
    const still=sample(i,.1,{reducedMotion:true});
    assert.deepEqual(still.screenVertices,sample(i,1).screenVertices);
    assert.equal(still.showPen,false);
    assert.ok(Object.isFrozen(expected.pen));
    assert.throws(()=>{expected.pen.x=999;});
  }
});
test('example rejects invalid domains rather than implicitly clamping',()=>{
  for(const p of [NaN,Infinity,-.01,1.01,'0.5'])assert.throws(()=>sample(0,p));
  for(const i of [-1,2,.5,'0'])assert.throws(()=>sample(i,.5));
  assert.throws(()=>sample(0,.5,{reducedMotion:1}));
});
