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
 assert.equal(version,a.version);assert.equal(a.entry,'families/diagonal-field/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['diagonal-field.mjs','docs/diagonal-field.md','examples/diagonal-field.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('signed angles preserve endpoints and actual safe content bands',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p),delta=Math.tan(p.data.angle*Math.PI/180)*p.bounds.width/2,mid=p.bounds.y+p.bounds.height*p.data.cutoff;assert.equal(g.edge.left.y,mid-delta);assert.equal(g.edge.right.y,mid+delta);assert.ok(g.contentBounds.upper.y+g.contentBounds.upper.height<=Math.min(g.edge.left.y,g.edge.right.y));assert.ok(g.contentBounds.lower.y>=Math.max(g.edge.left.y,g.edge.right.y));for(const r of Object.values(g.contentBounds)){assert.ok(r.width>=40&&r.height>=40);assert.ok(r.x>=p.bounds.x&&r.x+r.width<=p.bounds.x+p.bounds.width);}}});
check('constant stops paint the authored upper field and lower surface',()=>{const p=clone(samples[0]);p.data.stops=[{at:0,color:'#ff0000'},{at:1,color:'#ff0000'}];p.theme.surface='#0000ff';const c=canvas(),ctx=c.getContext('2d'),g=draw(ctx,p);for(const [r,color]of [[g.contentBounds.upper,[255,0,0,255]],[g.contentBounds.lower,[0,0,255,255]]])assert.deepEqual([...ctx.getImageData(Math.floor(r.x+r.width/2),Math.floor(r.y+r.height/2),1,1).data],color);});
check('angle, stops, padding and cutoff errors reject before pixels',()=>{for(const change of [p=>p.data.angle=25,p=>p.data.stops[1].at=0,p=>p.data.stops[0].at=.1,p=>p.data.padding=100,p=>p.data.cutoff=.1,p=>p.theme.surface='transparent'])rejects(change)});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
