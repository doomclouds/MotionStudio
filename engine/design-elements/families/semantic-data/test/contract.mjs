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
 assert.equal(version,a.version);assert.equal(a.entry,'families/semantic-data/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['semantic-data.mjs','docs/semantic-data.md','examples/semantic-data.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('nominal circle area follows value while zero has zero geometry',()=>{const p=clone(samples[0]),g=draw(canvas().getContext('2d'),p);for(let i=1;i<g.regions.length;i++)assert.ok(Math.abs((g.regions[0].width/g.regions[i].width)**2-p.data.points[0].value/p.data.points[i].value)<1e-10);p.data.points[0].value=0;assert.equal(draw(canvas().getContext('2d'),p).regions[0].width,0);});
check('center cutout is explicit and nominal geometry does not claim painted area',()=>{const p=clone(samples[0]),c=canvas(),ctx=c.getContext('2d'),g=draw(ctx,p);const r=g.regions[2],x=Math.round(r.x+r.width/2),y=Math.round(r.y+r.height/2);assert.deepEqual([...ctx.getImageData(x,y,1,1).data],[243,238,223,255]);assert.equal(g.encoding.metric,p.data.metric);assert.deepEqual(g.readingOrder,p.data.points.map(x=>x.id));assert.ok(g.encoding.x.includes('not calibrated time'));assert.ok(g.encoding.y.includes('not numerical value'));});
check('semantic, category, chronology, value and label errors reject before pixels',()=>{for(const change of [p=>p.data.mode='measured-trend',p=>p.data.points[0].category='missing',p=>p.data.points[1].id=p.data.points[0].id,p=>p.data.points[1].x=0,p=>p.data.points[0].value=-1,p=>p.data.points[0].value=999,p=>p.data.points[1].x=.01])rejects(change)});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
