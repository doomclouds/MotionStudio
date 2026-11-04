import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleUmbrellaPictogram as sample } from './umbrella-pictogram-geometry.mjs';
function allNumbers(value) {
  if (typeof value === 'number') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(allNumbers);
  return [];
}
function allFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value)); Object.values(value).forEach(allFrozen);
}
test('default is open and omission is deterministic', () => { assert.deepEqual(sample(),sample({openness:1})); assert.equal(sample().width,1); });
test('zero remains a narrow folded canopy', () => { const g=sample({openness:0});assert.equal(g.width,.15);assert.equal(g.height,1.12);assert.equal(g.rimY,.52); });
test('bounded overshoot changes width and shaft, not capped profile', () => { const a=sample(),b=sample({openness:1.15});assert.ok(b.width>a.width);assert.ok(b.shaft.end[1]<a.shaft.end[1]);assert.equal(b.height,a.height);assert.equal(b.rimY,a.rimY);assert.equal(b.scallopDepth,a.scallopDepth); });
test('fixed closed contour has 29 top points and four ordered bays', () => { const g=sample({openness:.63});assert.equal(g.canopy.upper.length,29);assert.equal(g.canopy.hem.length,4);assert.equal(g.canopy.closed,true);assert.equal(g.canopy.upper[0][0],-g.width);assert.equal(g.canopy.upper.at(-1)[0],g.width);assert.equal(g.canopy.hem.at(-1).end[0],-g.width);for(let i=1;i<4;i++)assert.ok(g.canopy.hem[i].end[0]<g.canopy.hem[i-1].end[0]); });
test('entire result is frozen and calls do not alias', () => {const a=sample(),b=sample();allFrozen(a);assert.notEqual(a,b);assert.notEqual(a.canopy.upper,b.canopy.upper);assert.throws(()=>{a.canopy.upper[0][0]=4;},TypeError);});
test('input is not mutated',()=>{const a=Object.freeze({openness:.25});sample(a);assert.deepEqual(a,{openness:.25});});
test('null-prototype plain input accepted',()=>{const a=Object.create(null);a.openness=.4;assert.equal(sample(a).openness,.4);});
for(const bad of [null,[],true,1,'',()=>{},new Date(0),Object.create({openness:.2})]) test(`reject nonordinary options ${String(bad)}`,()=>assert.throws(()=>sample(bad),TypeError));
for(const bad of [undefined,null,'1',true,NaN,Infinity,-Infinity]) test(`reject nonfinite or nonnumeric openness ${String(bad)}`,()=>assert.throws(()=>sample({openness:bad}),TypeError));
for(const bad of [-Number.MIN_VALUE,-1,1.15000000001,2]) test(`reject domain ${bad}`,()=>assert.throws(()=>sample({openness:bad}),RangeError));
test('unknown own string/symbol options rejected',()=>{assert.throws(()=>sample({open:1}),TypeError);assert.throws(()=>sample({[Symbol('x')]:1}),TypeError);});
test('source geometry equivalence across 601 positions',()=>{
  for(let k=0;k<=600;k++){
    const o=k/600*1.15,g=sample({openness:o}), L=(a,b,t)=>a+(b-a)*t;
    const w=L(.15,1,o),h=L(1.12,.62,Math.min(o,1)),ry=L(.52,0,Math.min(o,1)),sc=.03+.11*Math.min(o,1),end=L(.98,.95,o);
    assert.equal(g.width,w);assert.equal(g.height,h);assert.equal(g.rimY,ry);
    for(let i=0;i<=28;i++){const th=Math.PI+(i/28)*Math.PI;assert.deepEqual(g.canopy.upper[i],[w*Math.cos(th),ry+h*Math.sin(th)]);}
    for(let i=0;i<4;i++){const xa=w*(1-i*.5),xb=w*(1-(i+1)*.5);assert.deepEqual(g.canopy.hem[i],{control:[(xa+xb)/2,ry-sc*2],end:[xb,ry]});}
    assert.deepEqual(g.shaft,{start:[0,-h+ry-.16],end:[0,end],width:.058});assert.deepEqual(g.ferrule,{start:[0,ry-h-.02],end:[0,ry-h-.14],width:.05});assert.equal(g.gore.radiusX,w*.36);assert.equal(g.handle.center[1],end);assert.ok(allNumbers(g).every(Number.isFinite));
  }
});
