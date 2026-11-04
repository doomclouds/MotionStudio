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
 assert.equal(version,a.version);assert.equal(a.entry,'families/radial-scale/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['radial-scale.mjs','docs/radial-scale.md','examples/radial-scale.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('both variants map min midpoint max to explicit clockwise angles',()=>{
 for(const p0 of samples)for(const q of [0,.5,1]){const p=clone(p0);p.data.value=p.data.min+q*(p.data.max-p.data.min);const g=draw(canvas().getContext('2d'),p),angle=(p.data.startAngle+(p.data.endAngle-p.data.startAngle)*q)*Math.PI/180,r=g.radius*(p.data.variant==='knob'?.76:1);assert.equal(g.normalized,q);assert.ok(Math.abs(g.pointer.x-g.center.x-Math.cos(angle)*r)<1e-9);assert.ok(Math.abs(g.pointer.y-g.center.y-Math.sin(angle)*r)<1e-9);assert.equal(g.ticks.length,p.data.ticks);assert.equal(g.ticks[0].value,p.data.min);assert.equal(g.ticks.at(-1).value,p.data.max);}
});
check('invalid sweep, hidden precision, range and text reject before pixels',()=>{for(const change of [p=>p.data.endAngle=p.data.startAngle+360,p=>p.data.value=999,p=>p.data.max=p.data.min,p=>{p.data.min=0;p.data.max=.1;p.data.value=.05;p.data.precision=0},p=>p.data.label='W'.repeat(60),p=>p.data.variant='interactive'])rejects(change)});
check('tick labels remain inside frame with declared separation',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p);for(const t of g.ticks){assert.ok(t.bounds.x>=p.bounds.x+24);assert.ok(t.bounds.x+t.bounds.width<=p.bounds.x+p.bounds.width-24);}for(let i=0;i<g.ticks.length;i++)for(let j=i+1;j<g.ticks.length;j++){const a=g.ticks[i].bounds,b=g.ticks[j].bounds;assert.ok(!(a.x<b.x+b.width+6&&a.x+a.width+6>b.x&&a.y<b.y+b.height+6&&a.y+a.height+6>b.y));}}});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
