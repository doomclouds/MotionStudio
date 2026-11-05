import test from 'node:test';import assert from 'node:assert/strict';
import {compileOrderedStrokeReveal as compile,sampleOrderedStrokeReveal as sample} from '../index.mjs';
import {compileHanziStrokeReveal} from '../hanzi-data.mjs';import {buildExamples} from '../example.mjs';import {drawOrderedStrokeReveal as draw} from '../adapter.mjs';
const spec=()=>({strokes:[{outline:[{op:'M',values:[0,0]},{op:'L',values:[10,0]},{op:'L',values:[10,2]},{op:'Z',values:[]}],median:[{x:0,y:1},{x:10,y:1}],duration:1,revealWidth:3}],startTime:0,liftDuration:.2});
test('empty, complete, gap and exact vertex boundaries; no cross-stroke connection',()=>{
 const [a,b]=buildExamples();assert.equal(sample(a,-1).completedCount,0);assert.equal(sample(a,0).active.section.empty,true);assert.equal(sample(a,1).completedCount,1);assert.equal(sample(a,1).tip,null);
 assert.deepEqual(sample(b,2).active.section.vertices.map(v=>v.position),[{x:0,y:3},{x:21,y:3}]);
 assert.equal(sample(b,3).completedCount,1);assert.equal(sample(b,3).penDown,false);assert.equal(sample(b,3.2).tip,null);assert.equal(sample(b,3.125).phase,'lift');assert.deepEqual(sample(b,3.125).lift,{from:{x:21,y:24},to:{x:40,y:10},progress:.5,startTime:3,endTime:3.25});assert.deepEqual(sample(b,3.25).tip,{x:40,y:10});assert.equal(sample(b,3.75).done,true);
});
test('tip is exactly the retained prefix endpoint, corners remain and order/replay are stable',()=>{
 for(const p of buildExamples()){const times=[-1,0,.1,.5,1,1.5,2,2.2,3,3.25,3.5,9];const expected=times.map(t=>sample(p,t));for(const i of [9,2,5,0,10,11,1,6,7,8,3,4,9]){const s=sample(p,times[i]);assert.deepEqual(s,expected[i]);if(s.active)assert.deepEqual(s.tip,s.active.section.vertices.at(-1).position);}}
 const s=sample(buildExamples()[1],2.5);assert.equal(s.active.section.vertices.length,3);
});
test('owned copies, branded plans and frozen output',()=>{const input=spec(),p=compile(input),s=sample(p,.5);input.strokes[0].median[0].x=300;assert.equal(p.strokes[0].path.points[0].x,0);assert.throws(()=>{s.tip.x=4});assert.throws(()=>sample({...p},0));assert.throws(()=>{p.strokes[0].outline[0].values[0]=2});});
test('strict bounded schema rejects bad coordinates, time, shapes and accessors without reads',()=>{
 for(const n of [NaN,Infinity,-Infinity,'1',null]){const s=spec();s.startTime=n;assert.throws(()=>compile(s));assert.throws(()=>sample(buildExamples()[0],n));}
 for(const n of [0,-1,1e-9,1e7,NaN]){const s=spec();s.strokes[0].duration=n;assert.throws(()=>compile(s));}
 for(const mutate of [s=>s.strokes=[],s=>s.extra=1,s=>s.strokes[0].median[1]={x:0,y:1},s=>s.strokes[0].outline.pop(),s=>s.strokes[0].outline[0].op='m',s=>s.strokes[0].outline[1].values=[1],s=>s.strokes[0].revealWidth=0,s=>s.liftDuration=-1,s=>s.strokes[0].median[0].x=1e7,s=>s.strokes[0].outline[1].values[0]=Infinity]){const s=spec();mutate(s);assert.throws(()=>compile(s));}
 let reads=0;const s=spec();Object.defineProperty(s,'startTime',{get(){reads++;return 0;}});assert.throws(()=>compile(s));assert.equal(reads,0);
 const sparse=spec();delete sparse.strokes[0];assert.throws(()=>compile(sparse));const a=spec();Object.defineProperty(a.strokes,'0',{get(){reads++;return null;}});assert.throws(()=>compile(a));assert.equal(reads,0);
 const b=spec();b.strokes[0].outline[0].op={toString(){reads++;return 'M';}};assert.throws(()=>compile(b));assert.equal(reads,0);
 const lost=spec();lost.startTime=1e9-2;lost.liftDuration=1e-12;lost.strokes.push(structuredClone(lost.strokes[0]));assert.throws(()=>compile(lost));
});
test('narrow importer consumes authored SVG, rejects missing glyph and unsupported SVG',()=>{
 const base={strokes:['M 0 0 Q 2 4 10 0 C 11 0 11 2 10 2 L 0 2 Z'],medians:[[[0,1],[10,1]]],startTime:0,strokeDuration:1,liftDuration:.1,revealWidth:4};
 assert.equal(compileHanziStrokeReveal(base).strokes.length,1);for(const strokes of [undefined,[],['m 0 0 l 10 0 z'],['M 0 0 A 1 1 0 0 0 2 2 Z'],['M 0 0 L 1 0 2 0 Z'],['M 0 0 L NaN 2 Z']])assert.throws(()=>compileHanziStrokeReveal({...base,strokes}));assert.throws(()=>compileHanziStrokeReveal({...base,medians:[]}));
});
class Path {constructor(){this.commands=[];}moveTo(...p){this.commands.push(['M',...p]);}lineTo(...p){this.commands.push(['L',...p]);}quadraticCurveTo(...p){this.commands.push(['Q',...p]);}bezierCurveTo(...p){this.commands.push(['C',...p]);}closePath(){this.commands.push(['Z']);}}
const opts={x:10,y:20,scale:2,yOrigin:30,color:'#123456',Path2D:Path};
function context(fail=false){return{depth:0,calls:[],save(){this.depth++;},restore(){this.depth--;},translate(){},scale(){},setLineDash(){},fill(p){this.calls.push(['fill',p]);},clip(p){this.calls.push(['clip',p]);},stroke(p){if(fail)throw Error('native failed');this.calls.push(['stroke',p]);}};}
test('Canvas fills complete outlines, clips partial medians, preserves stack on throw',()=>{
 const p=buildExamples()[0],ctx=context();const r=draw(ctx,p,.5,opts);assert.deepEqual(r.tip,{x:30,y:76});assert.equal(ctx.depth,0);assert.deepEqual(ctx.calls.map(x=>x[0]),['clip','stroke']);assert.deepEqual(ctx.calls[1][1].commands.at(-1),['L',r.state.tip.x,r.state.tip.y]);
 const full=context();draw(full,p,1,opts);assert.deepEqual(full.calls.map(x=>x[0]),['fill']);const blank=context();draw(blank,p,0,opts);assert.equal(blank.calls.length,0);const broken=context(true);assert.throws(()=>draw(broken,p,.5,opts));assert.equal(broken.depth,0);
 for(const options of [{...opts,scale:0},{...opts,yOrigin:Infinity},{...opts,color:'red'},{...opts,extra:1}])assert.throws(()=>draw(context(),p,.5,options));
});
test('capacity bounds, zero-gap transition and finite endpoint time',()=>{
 const s=spec();s.strokes=Array.from({length:256},()=>structuredClone(s.strokes[0]));s.liftDuration=0;const p=compile(s);assert.equal(sample(p,1).active.index,1);assert.equal(sample(p,256).phase,'complete');s.strokes.push(structuredClone(s.strokes[0]));assert.throws(()=>compile(s));
 const points=spec();points.strokes[0].median=Array.from({length:4097},(_,x)=>({x,y:0}));assert.throws(()=>compile(points));
 const overflow=spec();overflow.startTime=1e9;assert.throws(()=>compile(overflow));
 const budget=spec();const contour=budget.strokes[0].outline;budget.strokes[0].outline=Array.from({length:2048},()=>structuredClone(contour)).flat();budget.strokes=Array.from({length:9},()=>structuredClone(budget.strokes[0]));assert.throws(()=>compile(budget),/budget/);
});
