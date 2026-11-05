import test from 'node:test';import assert from 'node:assert/strict';
import {compilePaperSurface,drawPaperSurface,drawMarker} from '../index.mjs';
import {drawExample} from '../examples/contract.mjs';
import {loadNativeCanvas} from '../../../../../motion-render-core/lib/native.mjs';
const {api}=loadNativeCanvas(),canvas=()=>api.createCanvas(320,200),pix=(c,x,y)=>[...c.getImageData(x,y,1,1).data];
test('seed and finite paper plan, immutability and independent instances',()=>{
 const spec={width:320,height:200,seed:17},a=compilePaperSurface(spec),b=compilePaperSurface(spec);spec.seed=22;
 assert.deepEqual(a,b);assert.notDeepEqual(a.fibers,compilePaperSurface(spec).fibers);assert.ok(Object.isFrozen(a.fibers[0]));
 const largest=compilePaperSurface({width:4096,height:4096,seed:0});assert.ok(largest.fibers.length<=20000&&largest.grains.length<=20000);
 assert.throws(()=>drawPaperSurface(canvas().getContext('2d'),{...a}));
 for(const bad of [{width:0},{height:Infinity},{seed:-1},{fiberCount:20001},{grainCount:1.2},{strength:1},{paper:'red'},{dotSpacing:3},{extra:1}])assert.throws(()=>compilePaperSurface({width:32,height:32,seed:0,...bad}));
 let reads=0;assert.throws(()=>compilePaperSurface({get width(){reads++;return 32;},height:32,seed:0}));assert.equal(reads,0);
});
test('marker balances both Canvas save levels after backend failure',()=>{
 const g=canvas().getContext('2d'),save=g.save.bind(g),restore=g.restore.bind(g),fillRect=g.fillRect.bind(g);let depth=0;
 g.save=()=>{save();depth++;};g.restore=()=>{restore();depth--;};g.fillRect=()=>{throw Error('backend failure');};
 assert.throws(()=>drawMarker(g,{x:10,y:10}),/backend failure/);assert.equal(depth,0);
 g.fillRect=fillRect;g.fillStyle='#abcdef';g.fillRect(0,0,10,10);assert.deepEqual(pix(g,5,5),[171,205,239,255]);
});
test('paper paints actual texture, stays inside clip and repeats byte-for-byte',()=>{
 const c=canvas(),g=c.getContext('2d'),p=compilePaperSurface({width:160,height:120,seed:3,fiberCount:500,grainCount:500,strength:.3});
 drawPaperSurface(g,p);const a=Buffer.from(g.getImageData(0,0,320,200).data);
 assert.equal(pix(g,180,130)[3],0);assert.equal(pix(g,10,10)[3],255);
 const colors=new Set();for(let i=0;i<160*120;i++){const x=i%160,y=Math.floor(i/160),j=(y*320+x)*4;colors.add(a.subarray(j,j+4).toString('hex'));}assert.ok(colors.size>10);
 g.clearRect(0,0,320,200);drawPaperSurface(g,p);assert.deepEqual(Buffer.from(g.getImageData(0,0,320,200).data),a);
});
test('marker local tip anchor, lift and two actual content consumers',()=>{
 const c=canvas(),g=c.getContext('2d');const state=drawMarker(g,{x:80,y:100,angle:0,length:80,width:12});
 assert.deepEqual(state.contact,{x:80,y:100});assert.equal(pix(g,84,100)[3],255);assert.equal(pix(g,75,100)[3],0);
 g.clearRect(0,0,320,200);const lifted=drawMarker(g,{x:80,y:100,angle:0,lift:1});assert.deepEqual(lifted.visibleTip,{x:80,y:82});assert.deepEqual(lifted.contact,{x:80,y:100});assert.equal(pix(g,84,82)[3],255);
 const output=[];for(const i of [0,1]){g.clearRect(0,0,320,200);drawExample(g,i);output.push(Buffer.from(g.getImageData(0,0,320,200).data));}assert.notDeepEqual(output[0],output[1]);
 for(const bad of [{width:40,length:24},{lift:2},{angle:NaN},{ink:'blue'},{extra:1}])assert.throws(()=>drawMarker(g,{x:0,y:0,...bad}));
});
test('actual post-draw paint proves caller style, transform, alpha and clip restoration',()=>{
 const c=canvas(),g=c.getContext('2d');g.translate(5,7);g.fillStyle='#abcdee';g.strokeStyle='#123456';g.lineWidth=6;g.globalAlpha=.5;const callerAlpha=g.globalAlpha;g.setLineDash([3,4]);g.beginPath();g.rect(0,0,300,180);g.clip();
 drawExample(g,0);g.clearRect(270,160,20,10);g.fillRect(270,160,20,10);
 const control=canvas().getContext('2d');control.fillStyle='#abcdee';control.globalAlpha=.5;control.fillRect(0,0,10,10);
 assert.deepEqual(pix(g,280,172),pix(control,5,5));assert.equal(pix(g,318,190)[3],0);assert.deepEqual(g.getLineDash(),[3,4]);assert.equal(g.getTransform().e,5);assert.equal(g.globalAlpha,callerAlpha);
});
