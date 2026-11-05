import test from 'node:test';import assert from 'node:assert/strict';
import {loadNativeCanvas} from '../../../../../motion-render-core/lib/native.mjs';
import {plans} from '../examples/contract.mjs';
import {sampleHeldVertexJitter} from '../index.mjs';
const {api}=loadNativeCanvas();
const render=(plan,frame)=>{const c=api.createCanvas(160,120),g=c.getContext('2d'),p=sampleHeldVertexJitter(plan,frame).points;g.strokeStyle='#23384b';g.lineWidth=2;g.lineJoin='round';g.beginPath();p.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));if(plan.closed)g.closePath();g.stroke();return Buffer.from(g.getImageData(0,0,160,120).data);};
test('Native route and closed card consume actual held geometry',()=>{
 for(const p of plans){const a=render(p,0);assert.ok(a.some(v=>v!==0));assert.deepEqual(a,render(p,p.holdFrames-1));assert.notDeepEqual(a,render(p,p.holdFrames));render(p,100);assert.deepEqual(a,render(p,0));}
});
