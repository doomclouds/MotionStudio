import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {compilePolyline,samplePath,sampleTrail} from '../lib/index.mjs';
const points=[{x:0,y:0},{x:120,y:0},{x:120,y:80}],path=compilePolyline({points});
test('polyline exact endpoints, outgoing vertex tangent and incoming terminal tangent',()=>{
 assert.equal(path.totalLength,200);
 assert.deepEqual(samplePath(path,0).position,{x:0,y:0});
 assert.deepEqual(samplePath(path,.6).unitTangent,{x:0,y:1});
 assert.equal(samplePath(path,.6).segmentIndex,1);
 assert.deepEqual(samplePath(path,1).position,points[2]);
 assert.deepEqual(samplePath(path,1).unitTangent,{x:0,y:1});
 assert.ok(samplePath(path,.6-1e-10).unitTangent.x===1);
});
test('trail never overtakes head, including early progress and zero requested length',()=>{
 for(const u of [0,.000001,.01,.1,.6,1])for(const length of [0,1,45,1e300]){
 const t=sampleTrail(path,{headProgress:u,length,samples:256});assert.ok(t.tailDistance>=0&&t.tailDistance<=t.headDistance&&t.headDistance<=path.totalLength);
 let prev=t.tailDistance;
 for(const p of t.points){assert.ok(p.distance>=prev&&p.distance<=t.headDistance);prev=p.distance;}
 assert.deepEqual(t.points.at(-1),samplePath(path,u));
 assert.equal(t.points[0].distance,t.tailDistance);
 }
});
test('polyline strict inputs, resource limits, duplicate and unrepresentable segments',()=>{
 for(const bad of [null,{}, {points:[]},{points:[{x:0,y:0},{x:0,y:0}]},{points:[{x:0,y:0},{x:NaN,y:1}]},{points:[{x:0,y:0},{x:1e10,y:1}]},{points,typo:1},{points:Array(1025).fill({x:1,y:2})}])assert.throws(()=>compilePolyline(bad));
 assert.throws(()=>compilePolyline({points:[{x:1e9,y:0},{x:0,y:0},{x:0,y:1e-30}]}));
 assert.throws(()=>compilePolyline({points:[{x:0,y:0},{x:Number.MIN_VALUE,y:Number.MIN_VALUE}]}));
 assert.throws(()=>samplePath(JSON.parse(JSON.stringify(path)),.5));
 for(const u of [NaN,Infinity,-.01,1.01,null])assert.throws(()=>samplePath(path,u));
 for(const bad of [{headProgress:.2,length:-1,samples:16},{headProgress:.2,length:10,samples:257},{headProgress:.2,length:10,samples:1},{headProgress:.2,length:10,samples:16,extra:1}])assert.throws(()=>sampleTrail(path,bad));
 const tiny=compilePolyline({points:[{x:0,y:0},{x:1e-200,y:0}]});assert.equal(samplePath(tiny,.5).position.x,5e-201);
});
test('compiled geometry is deep immutable and detached, samples seek safely across processes',()=>{
 const src=structuredClone(points),p=compilePolyline({points:src});src[0].x=999;assert.equal(p.points[0].x,0);
 assert.throws(()=>{p.points[0].x=3;});assert.throws(()=>{p.segments[0].unitTangent.x=9;});
 const seek=u=>sampleTrail(p,{headProgress:u,length:45,samples:16});
 const expected=new Map([0,.01,.6,1].map(u=>[u,seek(u)]));
 for(const u of [1,.01,0,.6])assert.deepEqual(seek(u),expected.get(u));
 const moduleUrl=new URL('../lib/index.mjs',import.meta.url).href;
 const result=execFileSync(process.execPath,['--input-type=module','-e',`import {compilePolyline,sampleTrail} from '${moduleUrl}'; console.log(JSON.stringify(sampleTrail(compilePolyline({points:${JSON.stringify(points)}}),{headProgress:.01,length:45,samples:16})))`],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),seek(.01));
});
