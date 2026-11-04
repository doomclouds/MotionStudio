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
 assert.equal(version,a.version);assert.equal(a.entry,'families/geometric-marks/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['geometric-marks.mjs','docs/geometric-marks.md','examples/geometric-marks.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('authored row-major order, grid dimensions and anchors stay consistent',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p),gap=p.data.gap??12,rows=Math.ceil(p.data.items.length/p.data.columns),w=(p.bounds.width-gap*(p.data.columns-1))/p.data.columns,h=(p.bounds.height-gap*(rows-1))/rows;assert.deepEqual(g.tiles.map(x=>x.id),p.data.items.map(x=>x.id));for(const [i,t]of g.tiles.entries()){assert.equal(t.bounds.width,w);assert.equal(t.bounds.height,h);assert.equal(t.bounds.x,p.bounds.x+(i%p.data.columns)*(w+gap));assert.equal(t.bounds.y,p.bounds.y+Math.floor(i/p.data.columns)*(h+gap));assert.equal(t.anchor.x,t.bounds.x+w/2);assert.equal(t.anchor.y,t.bounds.y+(h-34)/2);}}});
check('all six motifs and quarter-turns draw under the same contract',()=>{for(const motif of ['circle','semicircle','triangle','square','stripes','quarter-disc'])for(const rotation of [0,90,180,270]){const p=clone(samples[0]);p.data.items=[{...p.data.items[0],motif,rotation}];p.data.columns=1;const g=draw(canvas().getContext('2d'),p);assert.equal(g.tiles[0].motif,motif);assert.equal(g.tiles[0].rotation,rotation);}});
check('unknown motifs, arbitrary angles, duplicate ids, small tiles and labels reject before pixels',()=>{for(const change of [p=>p.data.items[0].motif='logo',p=>p.data.items[0].rotation=45,p=>p.data.items[1].id=p.data.items[0].id,p=>p.bounds.width=200,p=>p.data.items[0].label='W'.repeat(40)])rejects(change)});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
