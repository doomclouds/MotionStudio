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
 assert.equal(version,a.version);assert.equal(a.entry,'families/authored-paths/index.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);assert.ok(existsSync(new URL(a.guidance,root)));
 for(const p of ['authored-paths.mjs','docs/authored-paths.md','examples/authored-paths.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two actual examples repeat and differ',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256)});
check('dispatcher, direct call, inputs and caller state agree',()=>{
 for(const p of samples){const before=clone(p),a=canvas(),b=canvas(),ctx=a.getContext('2d');ctx.lineJoin='bevel';ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.lineJoin,'bevel');assert.equal(ctx.globalAlpha,alpha);const other=b.getContext('2d');other.lineJoin='bevel';other.globalAlpha=.7;assert.deepEqual(g,drawAsset(other,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));}
});
check('all supplied anchors and stable IDs survive the mapping',()=>{for(const p of samples){const g=draw(canvas().getContext('2d'),p);assert.deepEqual(g.paths.map(k=>k.id),p.data.paths.map(k=>k.id));for(let i=0;i<g.paths.length;i++){const a=g.paths[i],source=p.data.paths[i];assert.equal(a.pointCount,source.points.length);a.points.forEach((pt,j)=>{assert.equal(pt.x,g.plotBounds.x+source.points[j].x*g.plotBounds.width);assert.equal(pt.y,g.plotBounds.y+(1-source.points[j].y)*g.plotBounds.height);});}}});
check('false semantic claims, ordering, range, duplicate IDs and overflow reject before pixels',()=>{for(const change of [p=>p.data.mode='quantitative',p=>p.data.paths[0].points[1].x=0,p=>p.data.paths[0].points[0].y=2,p=>p.data.paths.push(clone(p.data.paths[0])),p=>{p.bounds.width=180;p.data.paths[0].label='Very long authored story label'},p=>p.data.interpolation='geographic'])rejects(change)});
check('wide sharp polyline remains within declared frame',()=>{const p=clone(samples[0]);p.bounds={x:100,y:100,width:400,height:300};p.data.interpolation='polyline';p.data.caption='ILLUSTRATIVE';p.data.paths=[{id:'sharp',label:'Sharp',color:'#ff0000',width:12,points:[{x:.05,y:0},{x:.14,y:1},{x:.23,y:0}]}];const c=api.createCanvas(600,500),ctx=c.getContext('2d');draw(ctx,p);const px=ctx.getImageData(0,0,600,500).data;for(let y=0;y<500;y++)for(let x=0;x<600;x++)if(x<100||x>=500||y<100||y>=400)assert.equal(px[(y*600+x)*4+3],0);});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static technical checks only','no new visual or user acceptance']}));
