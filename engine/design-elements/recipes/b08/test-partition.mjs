import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {outputDirectory,loadFonts} from './runtime.mjs';
import {draw,validate} from './recipes/partition-donut.mjs';
if(!process.env.MOTION_ENGINE_ROOT)throw new Error('MOTION_ENGINE_ROOT required');
const require=createRequire(process.env.MOTION_ENGINE_ROOT+'/package.json');
const api=require('@napi-rs/canvas'),{createCanvas}=api;
if(require('@napi-rs/canvas/package.json').version!=='0.1.100')throw Error('canvas0.1.100 required');
const fonts=loadFonts(api,{display:process.env.B08_DISPLAY_FONT,body:process.env.B08_BODY_FONT});
const directory=outputDirectory(process.env.B08_PARTITION_EVIDENCE_DIR);
const out=pathToFileURL(directory+'/');
const samples=['a','b'].map(s=>JSON.parse(readFileSync(new URL(`./examples/partition-donut-${s}.json`,import.meta.url))));
for(const sample of samples)sample.theme.fontFamily='B08Body';
let renders=0;
function render(p){const c=createCanvas(p.bounds.width,p.bounds.height),ctx=c.getContext('2d');ctx.fillStyle='#12ab34';ctx.lineCap='round';ctx.globalAlpha=.7;const initialAlpha=ctx.globalAlpha;const original=JSON.stringify(p);const result=draw(ctx,p);assert.equal(ctx.fillStyle,'#12ab34');assert.equal(ctx.lineCap,'round');assert.equal(ctx.globalAlpha,initialAlpha);assert.equal(JSON.stringify(p),original);assert.equal(result.legend.length,p.data.length);assert.equal(result.segments.length,p.data.length);assert.ok(Math.abs(result.segments.reduce((s,d)=>s+d.end-d.start,0)-2*Math.PI)<1e-12);for(const d of result.segments)assert.ok(Math.abs((d.end-d.start)/(Math.PI*2)-d.value/result.total)<1e-12);return{png:c.toBuffer('image/png'),result}}
for(let i=0;i<samples.length;i++){const a=render(samples[i]);assert.deepEqual(a,render(samples[i]));writeFileSync(new URL(`example-${i+1}.png`,out),a.png);renders++}
const base=samples[1],full={...base,title:'FICTIONAL / ALL PAPER',data:[{label:'Paper',value:50,color:'#c35f37'},{label:'Other',value:0,color:'#5844aa'}]};
const fullResult=render(full);writeFileSync(new URL('full-and-zero.png',out),fullResult.png);assert.equal(fullResult.result.segments[1].start,fullResult.result.segments[1].end);
// Uniform 100% ring with a genuine empty center, no round cap seam or zero arc.
const c=createCanvas(800,360),ctx=c.getContext('2d');ctx.setLineDash([2,14]);ctx.lineDashOffset=7;const g=draw(ctx,full);assert.deepEqual(ctx.getLineDash(),[2,14]);assert.equal(ctx.lineDashOffset,7);for(const theta of [0,.2,1,2,3,4,5,6]){const r=(g.radius+g.innerRadius)/2,x=Math.round(g.center.x+Math.cos(theta)*r),y=Math.round(g.center.y+Math.sin(theta)*r);assert.deepEqual([...ctx.getImageData(x,y,1,1).data],[195,95,55,255])}
const small={...base,title:'SMALL SHARE / TEST',data:[{label:'Small',value:1,color:'#c35f37'},{label:'Large',value:99,color:'#5844aa'},{label:'Zero',value:0,color:'#00ff00'}]};
const sc=createCanvas(800,360),sx=sc.getContext('2d'),sg=draw(sx,small);
const px=(angle)=>{const radius=(sg.radius+sg.innerRadius)/2;return [...sx.getImageData(Math.round(sg.center.x+Math.cos(angle)*radius),Math.round(sg.center.y+Math.sin(angle)*radius),1,1).data]};
assert.deepEqual(px((sg.segments[0].start+sg.segments[0].end)/2),[195,95,55,255]);
assert.deepEqual(px((sg.segments[1].start+sg.segments[1].end)/2),[88,68,170,255]);
assert.equal(sg.segments[2].end,sg.segments[2].start);
// Every ring pixel excludes the zero category's unique green; swatch is outside this crop.
const pixels=sx.getImageData(sg.center.x-sg.radius-1,sg.center.y-sg.radius-1,sg.radius*2+2,sg.radius*2+2).data;for(let i=0;i<pixels.length;i+=4)assert.ok(!(pixels[i]===0&&pixels[i+1]===255&&pixels[i+2]===0));
writeFileSync(new URL('small-positive-and-zero.png',out),sc.toBuffer('image/png'));
const bad=[{data:[{label:'A',value:0,color:'#112233'}]},{data:[{label:'A',value:-1,color:'#112233'}]},{data:[{label:'A',value:Infinity,color:'#112233'}]},{data:[{label:'A',value:1,color:'not-a-color'}]},{data:[{label:'A',value:1,color:'#112233'},{label:'a',value:1,color:'#112233'}]},{data:[{value:1,color:'#112233'}]},{bounds:{...base.bounds,height:320},data:Array.from({length:12},(_,i)=>({label:`Item ${i}`,value:1,color:'#112233'}))},{data:[{label:'Wide '.repeat(15).trim(),value:1,color:'#112233'}]},{data:[{label:'Tiny',value:1e-300,color:'#112233'},{label:'Large',value:1,color:'#112233'}]},{data:[{label:'A',value:Number.MAX_VALUE,color:'#112233'},{label:'B',value:Number.MAX_VALUE,color:'#112233'}]}];
for(const patch of bad){const cv=createCanvas(800,360),cx=cv.getContext('2d');const bytes=cv.toBuffer('image/png');assert.throws(()=>draw(cx,{...base,...patch}));assert.deepEqual(cv.toBuffer('image/png'),bytes)}
const tinyCanvas=createCanvas(2000,1600),tiny=draw(tinyCanvas.getContext('2d'),{...base,bounds:{x:0,y:0,width:2000,height:1600},data:[{label:'Small',value:0.0004,color:'#112233'},{label:'Large',value:0.9996,color:'#445566'}]});assert.equal(tiny.legend[0].percentageDisplay,'<0.1%');assert.equal(tiny.legend[1].percentageDisplay,'>99.9%');
writeFileSync(new URL('results.json',out),JSON.stringify({fonts,smallNonzeroDisplay:true,positiveSharePixel:true,zeroRingPixels:true,callerDashRestored:true,deterministicExamples:renders,invalidBeforePaint:bad.length,fullCirclePixels:8,zeroRetainedInLegend:true,allCategoriesAccounted:true,stateRestored:true},null,2));console.log('PASS: 2 deterministic examples, true angular shares, complete legends, 100%/0 pixels, 10 zero-mutation rejections');
