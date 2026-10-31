import resources from './resources.cjs';import assert from'node:assert/strict';import fs from'node:fs';import{createRequire}from'node:module';import{drawPixelMotif,flowerRects}from'./design/pixel-card.mjs';import{drawTimeline}from'./design/timeline.mjs';import{registerFonts,render}from'./design/scene.mjs';
const require=createRequire(import.meta.url),{createCanvas,GlobalFonts,Path2D}=resources.canvas();registerFonts(GlobalFonts);
let checks=0;const c=createCanvas(600,240),ctx=c.getContext('2d');ctx.fillStyle='#123456';ctx.translate(3,4);
const state=()=>[ctx.fillStyle,ctx.font,ctx.letterSpacing,...['a','b','c','d','e','f'].map(k=>ctx.getTransform()[k])];const before=state();
assert.equal(drawPixelMotif(ctx,{x:20,y:20,scale:4}).rectCount,17);checks++;assert.deepEqual(state(),before);checks++;
for(const args of [{x:1e20},{y:-1e20},{scale:Number.MIN_VALUE},{scale:.124},{rects:[[0,0,Number.MIN_VALUE,1,'#ffffff']]},{scale:0},{scale:65},{x:NaN},{rects:[[23,0,2,2,'#ffffff']]},{rects:[[0,0,1,1,'red']]},{rects:new Array(4097)}]){const a=c.toBuffer('image/png');assert.throws(()=>drawPixelMotif(ctx,args));assert.deepEqual(c.toBuffer('image/png'),a);checks+=2}
drawTimeline(ctx,{Path2D,x:0,y:170,width:600,height:36,items:[{x:20,label:'EXAMPLE 01'},{x:260,label:'EXAMPLE 02'}]});assert.deepEqual(state(),before);checks++;
for(const args of [{x:1e20},{y:-1e20},{width:Number.MIN_VALUE},{height:.5},{items:[{x:1e20,label:'x'}]},{items:[{x:-1,label:'x'}]},{items:[{x:1281,label:'x'}]},{width:0},{height:NaN},{items:[{x:Infinity,label:'x'}]},{items:[{x:0,label:'x'.repeat(161)}]}]){assert.throws(()=>drawTimeline(ctx,{Path2D,items:[],...args}));checks++}
const second=createCanvas(600,240),s=second.getContext('2d');s.fillStyle='#f5efe2';s.fillRect(0,0,600,240);drawPixelMotif(s,{x:40,y:25,scale:4,rects:[[0,0,24,32,'#f5efe2'],[3,3,18,14,'#1a1614'],[8,7,8,8,'#f7c95b'],[6,22,12,6,'#3b6b3b']]});drawTimeline(s,{Path2D,x:0,y:204,width:600,height:36,items:[{x:24,label:'SYNTHETIC ALTERNATE MOTIF'},{x:365,label:'NOT A NEW WORK'}]});resources.write('transfer.png',second.toBuffer('image/png'));
const a=createCanvas(1024,576),b=createCanvas(1024,576);render(a.getContext('2d'),{Path2D});render(b.getContext('2d'),{Path2D});assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));checks++;render(b.getContext('2d'),{revision:true,Path2D});assert.notDeepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));checks++;
console.log(JSON.stringify({checks,deterministic:true,negativePreflight:true,callerStatePreserved:true,syntheticTransferOnly:true}));

const pc=createCanvas(100,100),pctx=pc.getContext('2d');pctx.beginPath();pctx.rect(10,10,10,10);drawTimeline(pctx,{Path2D,x:0,y:60,width:100,height:20,items:[]});pctx.fillStyle='#ff00ff';pctx.fill();assert.deepEqual(Array.from(pctx.getImageData(15,15,1,1).data),[255,0,255,255]);assert.deepEqual(Array.from(pctx.getImageData(40,40,1,1).data),[0,0,0,0]);console.log(JSON.stringify({additionalCallerPathChecks:2,Path2DIsolated:true}));

let pollutionChecks=0;
for(const items of [new Array(1),[,{x:10,label:'ok'}],[{x:10,label:'ok'},,], [null],[undefined],[3],[[]],[{}],[{x:10,label:null}]]){
 const canvas=createCanvas(100,100),context=canvas.getContext('2d');context.fillStyle='#123456';context.fillRect(0,0,100,100);context.beginPath();context.rect(10,10,10,10);
 const before=canvas.toBuffer('image/png'),style=context.fillStyle;
 assert.throws(()=>drawTimeline(context,{Path2D,width:100,items}));assert.deepEqual(canvas.toBuffer('image/png'),before);assert.equal(context.fillStyle,style);
 context.fillStyle='#ff00ff';context.fill();assert.deepEqual(Array.from(context.getImageData(15,15,1,1).data),[255,0,255,255]);pollutionChecks+=4;
}
console.log(JSON.stringify({sparseAndInvalidItemChecks:pollutionChecks,zeroPixelStylePathPollution:true}));
