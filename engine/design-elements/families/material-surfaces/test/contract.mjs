import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {draw,validate,id,version,guidance} from '../index.mjs';
import {drawAsset} from '../../../index.mjs';
import {cases,backdrop} from '../examples/cases.mjs';
import {loadCanvas} from '../examples/runtime.mjs';
import {renderExamples} from '../examples/render.mjs';
const api=loadCanvas(),env={canvasApi:api,backdrop},checks=[],clone=x=>structuredClone(x);
const canvas=()=>api.createCanvas(1200,800);
const plain=()=>({bounds:{x:100,y:100,width:240,height:180},data:{variant:'opaque',radius:0,elevation:0},theme:{surface:'#ffffff',edge:'#ffffff',shadow:'#123456'}});
function check(name,fn){fn();checks.push(name)}
function rejects(change,environment=env){const p=plain();change(p);const c=canvas(),before=c.toBuffer('image/png');assert.throws(()=>draw(c.getContext('2d'),p,environment));assert.deepEqual(c.toBuffer('image/png'),before);}
check('canonical metadata and no old runtime aliases',()=>{
 const root=new URL('../../../',import.meta.url),a=JSON.parse(readFileSync(new URL('catalog.json',root))).assets.find(a=>a.id===id);
 assert.equal(a.version,version);assert.ok(a.tests.split('; ').includes('families/material-surfaces/test/contract.mjs'));assert.equal(a.entry,'families/material-surfaces/index.mjs');assert.equal(a.sample,'families/material-surfaces/examples/cases.mjs');assert.equal(a.example,'families/material-surfaces/examples/render.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);
 for(const p of ['material-surfaces.mjs','docs/material-surfaces.md','examples/material-surfaces.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('normalization supplies defaults without changing caller inputs',()=>{const p={bounds:{x:20,y:30,width:240,height:180},data:{variant:'paper'}},before=clone(p),v=validate(p);assert.deepEqual(p,before);assert.notEqual(v.bounds,p.bounds);assert.notEqual(v.data,p.data);assert.equal(v.data.padding,24);assert.equal(v.data.radius,0);assert.equal(v.data.elevation,1);assert.equal(v.data.opacity,.18);assert.equal(v.theme.fontSize,24);assert.equal(v.theme.fontFamily,'sans-serif');assert.equal(v.theme.surface,'#ffffff');});
check('two actual examples repeat with distinct hashes and explicit font identities',()=>{const a=renderExamples(),b=renderExamples();assert.equal(a.fonts.length,2);assert.deepEqual(a,b);assert.equal(a.frames.length,2);assert.notEqual(a.frames[0].sha256,a.frames[1].sha256);});
check('dispatcher and direct pixels agree, inputs and caller state survive',()=>{
 for(const sample of cases){const p=clone(sample.props),before=clone(p),a=canvas(),b=canvas(),x=a.getContext('2d'),y=b.getContext('2d');for(const c of [x,y]){c.translate(5,7);c.globalAlpha=.65;c.fillStyle='#abcdef';c.font='17px sans-serif';c.textAlign='right';}const matrix=x.getTransform(),alpha=x.globalAlpha,font=x.font;
  const g=draw(x,p,env);assert.deepEqual(g,drawAsset(y,{assetId:id,version,props:p},env));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));assert.deepEqual(p,before);assert.equal(x.fillStyle,'#abcdef');assert.equal(x.globalAlpha,alpha);assert.equal(x.font,font);assert.equal(x.textAlign,'right');for(const k of ['a','b','c','d','e','f'])assert.equal(x.getTransform()[k],matrix[k]);
 }
});
check('heading and content slots use logical absolute bounds including zero-height boundary',()=>{
 const p=plain();p.data={...p.data,title:'Title',subtitle:'Note',padding:20};p.theme.fontSize=20;const g=draw(canvas().getContext('2d'),p,env);assert.equal(g.headingHeight,44);assert.deepEqual(g.contentBounds,{x:120,y:164,width:200,height:96});assert.equal(g.staticOnly,true);
 p.bounds.height=100;p.data.padding=11;p.data.title='HI';p.data.subtitle='';p.theme.fontSize=60;const z=draw(canvas().getContext('2d'),p,env);assert.equal(z.contentBounds.height,0);
});
check('paper hard rectangular offset and opaque zero-elevation pixels are exact',()=>{
 for(const variant of ['paper','opaque']){const p=plain();p.data.variant=variant;p.data.elevation=variant==='paper'?2:0;const c=canvas(),ctx=c.getContext('2d');draw(ctx,p,{});assert.deepEqual([...ctx.getImageData(150,150,1,1).data],[255,255,255,255]);const outside=[...ctx.getImageData(345,285,1,1).data];assert.deepEqual(outside,variant==='paper'?[18,52,86,255]:[0,0,0,0]);}
});
check('bounded soft shadow is visible outside the declared surface, not unbounded',()=>{
 const p=plain();p.data.elevation=2;p.data.radius=18;p.theme.shadow='#000000';const c=canvas(),ctx=c.getContext('2d');draw(ctx,p,env);assert.ok(ctx.getImageData(200,290,1,1).data[3]>0);assert.equal(ctx.getImageData(20,20,1,1).data[3],0);const pad=33,offset=16,px=ctx.getImageData(0,0,c.width,c.height).data;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(x<100-pad||x>=340+pad||y<100-pad+offset||y>=280+pad+offset)assert.equal(px[(y*c.width+x)*4+3],0);
});
check('glass calls explicit local backdrop and overlays surface tint without implicit capture',()=>{
 const p=plain();p.data.variant='glass';p.data.opacity=.2;let call;const c=canvas(),ctx=c.getContext('2d');const g=draw(ctx,p,{canvasApi:api,backdrop:args=>{call=args;args.ctx.fillStyle='#0000ff';args.ctx.fillRect(0,0,args.width,args.height);}});assert.equal(call.width,240);assert.equal(call.height,180);assert.deepEqual(call.bounds,p.bounds);assert.notEqual(call.bounds,p.bounds);assert.equal(g.material,'glass');const pixel=ctx.getImageData(220,190,1,1).data;assert.equal(pixel[2],255);assert.equal(pixel[3],255);assert.ok(pixel[0]>0&&pixel[0]<255);assert.equal(pixel[0],pixel[1]);
});
check('invalid dimensions, data, headings and required env reject before pixels',()=>{
 for(const change of [p=>p.bounds.width=119,p=>p.bounds.height=99,p=>p.data.padding=81,p=>p.data.radius=500,p=>p.data.opacity=.76,p=>p.data.elevation=4,p=>p.data.variant='metal',p=>p.data.title='line\nbreak',p=>p.data.title='W'.repeat(100),p=>p.theme.surface='red',p=>p.theme.fontFamily='bad;font',p=>{p.bounds.height=100;p.data.padding=20;p.data.title='Title';p.theme.fontSize=60;}])rejects(change);
 rejects(p=>p.data.variant='glass',{});rejects(p=>p.data.elevation=1,{});
});
check('late backdrop failure restores state but does not promise pixel rollback',()=>{
 const p=plain();p.data.variant='glass';p.data.elevation=2;const c=canvas(),ctx=c.getContext('2d');ctx.translate(3,4);ctx.fillStyle='#abcdef';const matrix=ctx.getTransform(),before=c.toBuffer('image/png');assert.throws(()=>draw(ctx,p,{canvasApi:api,backdrop:()=>{throw Error('synthetic callback failure')}}),/synthetic callback/);assert.equal(ctx.fillStyle,'#abcdef');for(const k of ['a','b','c','d','e','f'])assert.equal(ctx.getTransform()[k],matrix[k]);assert.notDeepEqual(c.toBuffer('image/png'),before);
});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,fontIdentities:api.fontIdentities,limits:['Native static technical checks only','new explicitly supplied DejaVu environment, not historical font reproduction','no historical restore/render or new visual/user acceptance']}));
