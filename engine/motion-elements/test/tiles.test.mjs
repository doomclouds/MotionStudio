import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
import {compileTileScatter as compile,sampleTileScatter as sample,drawTileScatter as draw,rational as T} from '../lib/index.mjs';
const {api}=loadNativeCanvas();
const spec={sourceRect:{x:0,y:0,width:641,height:359},columns:8,rows:5,seed:'fixture',instanceId:'tiles',range:{start:T(1),end:T(4)},step:T(1,100),displacement:{x:80,y:60},maxRotation:.3};
test('tile partition retains every nondivisible source pixel exactly once and stable identities',()=>{
 const p=compile(spec),coverage=new Uint8Array(641*359);
 assert.equal(p.tiles.length,40);assert.equal(new Set(p.tiles.map(t=>t.tileId)).size,40);
 for(const t of p.tiles){assert.deepEqual(t.sourceRect,t.homeRect);const h=t.homeRect;for(let y=h.y;y<h.y+h.height;y++)for(let x=h.x;x<h.x+h.width;x++)coverage[y*641+x]++;}
 assert.ok(coverage.every(v=>v===1));
 const changed=compile({...spec,seed:'different'});
 assert.deepEqual(p.tiles.map(t=>[t.tileId,t.homeRect]),changed.tiles.map(t=>[t.tileId,t.homeRect]));assert.notDeepEqual(p.tiles.map(t=>t.target),changed.tiles.map(t=>t.target));
 assert.throws(()=>{p.tiles[0].homeRect.x=4;});
});
test('global reverse exactly reflects all stagger timing and releases continuously',()=>{
 const p=compile(spec);
 for(const [n,d] of [[0,1],[1,1],[101,100],[3,2],[2,1],[7,2],[4,1],[5,1]]){
  const at=T(n,d),mirror=T(5*d-n,d);assert.deepEqual(sample(p,at,{direction:'in'}),sample(p,mirror,{direction:'out'}));
 }
 const home=sample(p,T(1),{direction:'out'});assert.equal(home.atHome,true);for(const t of home.tiles)assert.deepEqual(t.matrix,[1,0,0,1,0,0]);
 const early=sample(p,T(1000001,1000000),{direction:'out'});assert.equal(early.atHome,false);assert.ok(early.tiles[0].progress>0);assert.ok(Math.abs(early.tiles[0].matrix[4])<1e-6);
 assert.deepEqual(sample(p,T(4),{direction:'in'}),home);
 const expected=new Map([1,2,3,4].map(n=>[n,sample(p,T(n),{direction:'out'})]));for(const n of [4,2,1,3])assert.deepEqual(sample(p,T(n),{direction:'out'}),expected.get(n));
 const url=new URL('../lib/index.mjs',import.meta.url).href;
 const result=execFileSync(process.execPath,['--input-type=module','-e',`import {compileTileScatter as c,sampleTileScatter as s,rational as T} from '${url}';console.log(JSON.stringify(s(c(${JSON.stringify(spec)}),T(2),{direction:'out'})))`],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),expected.get(2));
});
test('tile resource and binding limits reject invalid domains',()=>{
 for(const bad of [null,{...spec,extra:1},{...spec,columns:0},{...spec,rows:359},{...spec,step:T(1)},{...spec,maxRotation:4},{...spec,displacement:{x:-1,y:0}},{...spec,sourceRect:{x:0,y:0,width:8192,height:8192}}])assert.throws(()=>compile(bad));
 const one=compile({...spec,columns:1,rows:1,sourceRect:{x:0,y:0,width:1,height:1}});assert.equal(one.tiles.length,1);
 const max=compile({...spec,columns:16,rows:16,step:T(0)});assert.equal(max.tiles.length,256);
 assert.throws(()=>sample(JSON.parse(JSON.stringify(one)),T(1),{direction:'out'}));assert.throws(()=>sample(one,T(1),{direction:'other'}));
});
function source(){const s=api.createCanvas(641,359),c=s.getContext('2d');c.fillStyle='#3388bb';c.fillRect(0,0,641,359);c.clearRect(70,60,80,80);c.fillStyle='#ff995580';c.fillRect(310,0,200,200);return s;}
test('home pixels match full source for fractional, rotated and nonuniform parent transforms',()=>{
 const s=source(),p=compile(spec);
 for(const m of [[1,0,0,1,10,20],[.7,0,0,.9,15.5,9.5],[.8,.2,-.2,.8,80,10]]){
 const a=api.createCanvas(800,500),b=api.createCanvas(800,500),ac=a.getContext('2d'),bc=b.getContext('2d');ac.transform(...m);bc.transform(...m);ac.globalAlpha=.7;bc.globalAlpha=.7;
 draw(ac,s,p,sample(p,T(4),{direction:'in'}));bc.drawImage(s,0,0,641,359,0,0,641,359);
 assert.deepEqual(ac.getImageData(0,0,800,500).data,bc.getImageData(0,0,800,500).data);
 }
 const ctx=api.createCanvas(800,500).getContext('2d');assert.throws(()=>draw(ctx,source(),p,sample(p,T(1),{direction:'out'})),/same source/);
 assert.throws(()=>draw(ctx,s,p,sample(compile(spec),T(1),{direction:'out'})),/bound/);
 const cropPlan=compile(spec);assert.throws(()=>draw(ctx,api.createCanvas(10,10),cropPlan,sample(cropPlan,T(1),{direction:'out'})),/crop/);
});
test('tile drawing restores state on draw errors and does not change current path',()=>{
 const s=source(),p=compile(spec),ctx=api.createCanvas(800,500).getContext('2d');
 ctx.beginPath();ctx.rect(700,400,20,20);draw(ctx,s,p,sample(p,T(2),{direction:'out'}));ctx.fillStyle='red';ctx.fill();assert.equal(ctx.getImageData(710,410,1,1).data[0],255);
 const before=ctx.getTransform(),original=ctx.drawImage;ctx.drawImage=()=>{throw Error('fixture');};
 assert.throws(()=>draw(ctx,s,p,sample(p,T(2),{direction:'out'})),/fixture/);assert.deepEqual(ctx.getTransform(),before);ctx.drawImage=original;
});
test('near-home uses every fixed tile, no early full-image switch; mutable source is caller responsibility',()=>{
 const s=source(),p=compile(spec),ctx=api.createCanvas(800,500).getContext('2d'),original=ctx.drawImage.bind(ctx);let calls=0;
 ctx.drawImage=(...args)=>{calls++;return original(...args);};
 draw(ctx,s,p,sample(p,T(1),{direction:'out'}));assert.equal(calls,1);calls=0;
 draw(ctx,s,p,sample(p,T(1000001,1000000),{direction:'out'}));assert.equal(calls,40);
 const first=ctx.getImageData(0,0,800,500).data;ctx.clearRect(0,0,800,500);
 s.getContext('2d').clearRect(0,0,641,359);
 draw(ctx,s,p,sample(p,T(1),{direction:'out'}));assert.notDeepEqual(ctx.getImageData(0,0,800,500).data,first);
});
