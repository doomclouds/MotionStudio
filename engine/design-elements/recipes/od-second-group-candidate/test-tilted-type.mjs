import assert from'node:assert/strict';import fs from'node:fs';import{createRequire}from'node:module';import{drawTiltedType}from'./bold-poster/design/tilted-type.mjs';import{registerFonts,render}from'./bold-poster/design/scene.mjs';
const require=createRequire(import.meta.url),api=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');registerFonts(api.GlobalFonts,process.env.OD_SECOND_ASSETS+'/bold-poster');let checks=0;
const c=api.createCanvas(400,240),g=c.getContext('2d');g.fillStyle='#123456';g.font='12px BoldSans500';g.letterSpacing='2px';g.beginPath();g.rect(5,5,10,10);const state=()=>[g.fillStyle,g.font,g.letterSpacing,g.wordSpacing,g.direction,g.textAlign,g.textBaseline,...['a','b','c','d','e','f'].map(k=>g.getTransform()[k])];const original=state();const opts={canvasApi:api,text:'A clear idea',x:40,y:130,size:30,font:'BoldDisplay',angle:-4,maxWidth:350};
drawTiltedType(g,opts);assert.deepEqual(state(),original);checks++;g.fillStyle='#ff00ff';g.fill();assert.deepEqual(Array.from(g.getImageData(10,10,1,1).data),[255,0,255,255]);checks++;
for(const bad of [{x:1e20},{y:-9000},{size:Number.MIN_VALUE},{size:513},{angle:16},{originX:Infinity},{text:''},{text:'x'.repeat(201)},{text:null},{color:'red'},{spacing:13},{maxWidth:1},{font:'unsafe; font'}]){
 const pixels=c.toBuffer('image/png'),s=state();assert.throws(()=>drawTiltedType(g,{...opts,...bad}));assert.deepEqual(c.toBuffer('image/png'),pixels);assert.deepEqual(state(),s);checks+=3;
}
// Caller typography must not change the measured ink surface or clip its rendered text.
for(const wordSpacing of ['-25px','25px']){
 const baseline=api.createCanvas(600,240),inherited=api.createCanvas(600,240),bg=baseline.getContext('2d'),ig=inherited.getContext('2d');
 ig.wordSpacing=wordSpacing;ig.direction='rtl';
 const regression={...opts,text:'Make it loud',maxWidth:550,angle:-4};
 const expected=drawTiltedType(bg,regression),actual=drawTiltedType(ig,regression);
 assert.deepEqual(actual,expected);assert.deepEqual(inherited.toBuffer('image/png'),baseline.toBuffer('image/png'));
 assert.equal(ig.wordSpacing,wordSpacing);assert.equal(ig.direction,'rtl');checks+=4;
}
const a=api.createCanvas(1920,1080),b=api.createCanvas(1920,1080);render(a.getContext('2d'),{canvasApi:api});render(b.getContext('2d'),{canvasApi:api});assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));checks++;render(b.getContext('2d'),{alternate:true,canvasApi:api});assert.notDeepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));checks++;
console.log(JSON.stringify({checks,deterministic:true,negativeCases:13,callerPathAndState:true,callerTypographyIsolationCases:2,syntheticTransferNotNewWork:true}));
