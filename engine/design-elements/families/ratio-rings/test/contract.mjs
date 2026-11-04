import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {draw,validate,id,version,guidance} from '../index.mjs';
import {drawAsset} from '../../../index.mjs';
import {examples} from '../examples/cases.mjs';
import {loadCanvas} from '../examples/runtime.mjs';
import {renderExamples} from '../examples/render.mjs';
const api=loadCanvas(),checks=[],clone=x=>structuredClone(x),samples=examples.map(x=>x.props??x);
function check(name,fn){fn();checks.push(name)}
const canvas=()=>api.createCanvas(1800,1400);
function rejects(change){const p=clone(samples[0]);change(p);const c=canvas(),before=c.toBuffer('image/png');assert.throws(()=>draw(c.getContext('2d'),p));assert.deepEqual(c.toBuffer('image/png'),before);}
check('canonical catalog metadata and absent legacy paths',()=>{
 const root=new URL('../../../',import.meta.url),a=JSON.parse(readFileSync(new URL('catalog.json',root))).assets.find(a=>a.id===id);
 assert.equal(version,a.version);assert.equal(a.entry,'families/ratio-rings/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['ratio-rings.mjs','docs/ratio-rings.md','examples/ratio-rings.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('zero half and full target agree in geometry and actual arc samples',()=>{for(const ratio of [0,.5,1]){const p=clone(samples[0]);p.data={sourceLabel:'SYNTHETIC',thickness:20,gap:12,rings:[{id:'a',label:'TARGET',value:ratio*100,max:100,unit:'items',color:'#ff0000'}]};const c=canvas(),ctx=c.getContext('2d'),g=draw(ctx,p),r=g.rings[0];assert.equal(r.ratio,ratio);assert.ok(Math.abs(r.sweepAngle-ratio*Math.PI*2)<1e-12);for(const [i,a]of[-Math.PI/4,Math.PI/4,Math.PI*3/4,Math.PI*5/4].entries()){const px=ctx.getImageData(Math.round(g.center.x+r.radius*Math.cos(a)),Math.round(g.center.y+r.radius*Math.sin(a)),1,1).data;assert.equal(px[0]>250&&px[1]<5&&px[2]<5,ratio===1||(ratio===.5&&i<2));}}});
check('caller dash is ignored for actual arcs and restored afterwards',()=>{const render=dash=>{const c=canvas(),ctx=c.getContext('2d');ctx.setLineDash(dash);draw(ctx,samples[0]);assert.deepEqual(ctx.getLineDash(),dash);return c.toBuffer('image/png')};assert.deepEqual(render([]),render([7,11]));});
check('zero target, over-target, duplicate ids, small center and labels reject before pixels',()=>{for(const change of [p=>p.data.rings[0].max=0,p=>p.data.rings[0].value=p.data.rings[0].max+1,p=>p.data.rings[1].id=p.data.rings[0].id,p=>{p.bounds.width=450;p.data.thickness=28;p.data.gap=32},p=>p.data.rings[0].label='W'.repeat(40)])rejects(change)});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
