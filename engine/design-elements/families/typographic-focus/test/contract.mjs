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
 assert.equal(version,a.version);assert.equal(a.entry,'families/typographic-focus/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['typographic-focus.mjs','docs/typographic-focus.md','examples/typographic-focus.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('authored hierarchy, line count and centered advance regions',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p);assert.deepEqual(g.readingOrder,['kicker','headline','support']);assert.equal(g.regions.length,1+p.data.lines.length+p.data.body.length);for(const r of g.regions){if(p.data.align==='center')assert.ok(Math.abs(r.x+r.width/2-(p.bounds.x+p.bounds.width/2))<1e-9);else assert.equal(r.x,p.bounds.x+p.data.padding);assert.ok(r.width<=p.bounds.width-2*p.data.padding);}}});
check('transparent text leaves the host background at an unused edge',()=>{const p=clone(samples[0]);p.data.paintBackground=false;const c=canvas(),ctx=c.getContext('2d');ctx.fillStyle='#123456';ctx.fillRect(0,0,c.width,c.height);draw(ctx,p);assert.deepEqual([...ctx.getImageData(p.bounds.x+p.bounds.width-2,p.bounds.y+p.bounds.height-2,1,1).data],[18,52,86,255]);});
check('oversized, overlong, invalid alignment and emphasis reject before pixels',()=>{for(const change of [p=>p.data.lines[0]='W'.repeat(45),p=>p.data.lines.push('x','y','z'),p=>p.data.align='right',p=>p.data.accentLine=.5,p=>p.data.bodySize=33,p=>p.bounds.height=100])rejects(change)});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
