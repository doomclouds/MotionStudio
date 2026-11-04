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
 assert.equal(version,a.version);assert.equal(a.entry,'families/expressive-type/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['expressive-type.mjs','docs/expressive-type.md','examples/expressive-type.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('returned effect boxes fit authored padding for both modes',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p);assert.equal(g.variant,p.data.variant);assert.equal(g.regions.length,p.data.lines.length);for(const r of g.regions){assert.ok(r.x>=p.bounds.x+p.data.padding);assert.ok(r.y>=p.bounds.y+p.data.padding);assert.ok(r.x+r.width<=p.bounds.x+p.bounds.width-p.data.padding);assert.ok(r.y+r.height<=p.bounds.y+p.bounds.height-p.data.padding);}}});
check('negative depth and transparent background preserve measured bounds and host pixels',()=>{const p=clone(samples[0]);p.data.depthX=-26;p.data.depthY=-30;p.data.paintBackground=false;const c=canvas(),ctx=c.getContext('2d');ctx.fillStyle='#123456';ctx.fillRect(0,0,c.width,c.height);const g=draw(ctx,p);for(const r of g.regions){assert.ok(r.x>=p.bounds.x+p.data.padding&&r.y>=p.bounds.y+p.data.padding);}assert.deepEqual([...ctx.getImageData(p.bounds.x+p.bounds.width-2,p.bounds.y+p.bounds.height-2,1,1).data],[18,52,86,255]);});
check('effects, lines, glyph metrics and illegal variant reject before pixels',()=>{for(const change of [p=>p.data.depthX=61,p=>p.data.layers=1,p=>p.data.lines=['A\nB'],p=>p.data.variant='3d',p=>p.bounds.width=100,p=>p.data.lines=[' '.repeat(24)]])rejects(change);const p=clone(samples[1]),c=canvas();p.data.fillRatio=.1;assert.throws(()=>draw(c.getContext('2d'),p));});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
