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
 assert.equal(version,a.version);assert.equal(a.entry,'families/proportional-partition/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['proportional-partition.mjs','docs/proportional-partition.md','examples/proportional-partition.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('positive areas share scale, cover plot without overlap, and zero remains explicit',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p);assert.ok(Math.abs(g.cells.reduce((s,c)=>s+c.area,0)-g.plotBounds.width*g.plotBounds.height)<1e-7);for(const c of g.cells){assert.ok(Math.abs(c.area/c.value-g.areaPerUnit)<1e-8);assert.equal(c.ratio,c.value/g.total);}assert.deepEqual(g.zeroIds,p.data.items.filter(x=>x.value===0).map(x=>x.id));for(let i=0;i<g.cells.length;i++)for(let j=i+1;j<g.cells.length;j++){const a=g.cells[i].rect,b=g.cells[j].rect;assert.ok(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)<1e-8||Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)<1e-8);}}});
check('integer-boundary 25/75 split agrees with actual red/blue pixel counts',()=>{const p=clone(samples[0]);p.bounds={x:20,y:20,width:400,height:300};p.data={unit:'u',sourceLabel:'SYNTHETIC',items:[{id:'a',label:'A',value:25,color:'#ff0000'},{id:'b',label:'B',value:75,color:'#0000ff'}]};const c=canvas(),ctx=c.getContext('2d'),g=draw(ctx,p),r=g.plotBounds,px=ctx.getImageData(r.x,r.y,r.width,r.height).data;let red=0,blue=0;for(let i=0;i<px.length;i+=4){if(px[i]===255&&px[i+1]===0&&px[i+2]===0)red++;if(px[i]===0&&px[i+1]===0&&px[i+2]===255)blue++;}assert.equal(red,r.width*r.height*.25);assert.equal(blue,r.width*r.height*.75);});
check('negative, zero total, duplicate color and unresolvable positive cells reject before pixels',()=>{for(const change of [p=>p.data.items[0].value=-1,p=>p.data.items.forEach(x=>x.value=0),p=>p.data.items[0].color=p.data.items[1].color,p=>p.data.items[0].value=1e-10,p=>p.data.items[1].id=p.data.items[0].id])rejects(change)});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
