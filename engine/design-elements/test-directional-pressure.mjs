// Source-only local review. All generated images and pinned baseline stay external.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,dirname,basename,sep,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {drawDirectionalPaint,drawPaintExample} from './examples/directional-paint.mjs';
const require=createRequire(import.meta.url);
if(!process.env.CANVAS_MODULE||!process.env.BASELINE_DIRECTIONAL_PAINT||!process.argv[2]) throw Error('CANVAS_MODULE, BASELINE_DIRECTIONAL_PAINT and new external output directory required');
const api=require(process.env.CANVAS_MODULE),baseline=await import(pathToFileURL(await realpath(process.env.BASELINE_DIRECTIONAL_PAINT)).href);
const root=await realpath(fileURLToPath(new URL('../..',import.meta.url))),requested=resolve(process.argv[2]),out=resolve(await realpath(dirname(requested)),basename(requested)),rel=relative(root,out);
if(!(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))) throw Error('external output required');
await mkdir(out,{recursive:false});
const make=()=>api.createCanvas(640,480),bytes=c=>Buffer.from(c.getContext('2d').getImageData(0,0,640,480).data);
const props={bounds:{x:80,y:80,width:240,height:220},palette:['#204030','#b0cc80'],seed:42,count:100,length:23,width:6,angleAt:(u,v)=>u-v};
let checks=0;
for(const variant of ['leaf','ribbon'])for(const seed of [0,42,4294967295]) {
 const old=make(),def=make(),explicit=make(),taper=make(),repeat=make();baseline.drawPaintExample(old.getContext('2d'),variant,seed);drawPaintExample(def.getContext('2d'),variant,seed);drawPaintExample(explicit.getContext('2d'),variant,seed,{brush:'polygon'});drawPaintExample(taper.getContext('2d'),variant,seed,{brush:'taper'});drawPaintExample(repeat.getContext('2d'),variant,seed,{brush:'taper'});
 assert.deepEqual(bytes(old),bytes(def));assert.deepEqual(bytes(old),bytes(explicit));assert.deepEqual(bytes(taper),bytes(repeat));assert.notDeepEqual(bytes(old),bytes(taper));checks++;
 if(seed===42)for(const [name,c] of [['polygon',def],['taper',taper]])await writeFile(resolve(out,`${variant}-${name}.png`),c.toBuffer('image/png'));
}
// Default helper compatibility covers both size extremes and maximal seed/count.
for(const patch of [{seed:0,length:2,width:1,count:1},{seed:4294967295,length:80,width:20,count:10000},{}]){const a=make(),b=make();baseline.drawDirectionalPaint(a.getContext('2d'),{...props,...patch});drawDirectionalPaint(b.getContext('2d'),{...props,...patch});assert.deepEqual(bytes(a),bytes(b));checks++}
for(const patch of [{seed:0,length:2,width:1,count:1},{seed:4294967295,length:80,width:20,count:10000}]){const a=make();drawDirectionalPaint(a.getContext('2d'),{...props,...patch,brush:'taper'});assert(bytes(a).some(v=>v));checks++}
for(const invalid of [null,false,0,'','pressure','TAPER',{},[],NaN])for(const fn of [c=>drawDirectionalPaint(c,{...props,brush:invalid}),c=>drawPaintExample(c,'leaf',42,{brush:invalid})]){const c=make();assert.throws(()=>fn(c.getContext('2d')));assert(bytes(c).every(v=>v===0));checks++}
for(const patch of [{seed:-1},{count:0},{length:81},{width:0},{width:21},{length:3,width:4},{angleAt:()=>NaN}]){const c=make();assert.throws(()=>drawDirectionalPaint(c.getContext('2d'),{...props,...patch,brush:'taper'}));assert(bytes(c).every(v=>v===0));checks++}
let calls=0;const late=make();assert.throws(()=>drawDirectionalPaint(late.getContext('2d'),{...props,brush:'taper',angleAt:()=>++calls===100?Infinity:0}));assert(bytes(late).every(v=>v===0));checks++;
for(const brush of ['polygon','taper'])for(const kind of ['helper','leaf','ribbon'])for(const fill of ['solid','gradient']) {
 const a=make(),b=make(),c=a.getContext('2d'),control=b.getContext('2d');
 const init=x=>{x.translate(3,4);x.beginPath();x.rect(5,5,610,460);x.clip();x.globalAlpha=.7;x.lineWidth=7;x.strokeStyle='#9135b2';if(fill==='gradient'){const g=x.createLinearGradient(0,0,80,0);g.addColorStop(0,'#123456');g.addColorStop(1,'#23ab78');x.fillStyle=g}else x.fillStyle='#123456'};init(c);init(control);
 const state={fillStyle:c.fillStyle,strokeStyle:c.strokeStyle,lineWidth:c.lineWidth,globalAlpha:c.globalAlpha,transform:c.getTransform()};
 if(kind==='helper')drawDirectionalPaint(c,{...props,brush});else drawPaintExample(c,kind,42,{brush});
 for(const key of ['fillStyle','strokeStyle','lineWidth','globalAlpha'])assert.equal(c[key],state[key]);assert.deepEqual(c.getTransform(),state.transform);
 const swatch=x=>{x.clearRect(-3,-4,100,90);x.fillRect(10,10,24,26);x.beginPath();x.moveTo(45,10);x.lineTo(70,34);x.stroke();x.fillRect(-3,50,15,15)};swatch(c);swatch(control);
 assert.deepEqual(Buffer.from(c.getImageData(0,0,90,80).data),Buffer.from(control.getImageData(0,0,90,80).data));checks++;
}
for(const brush of ['polygon','taper']){const c=make(),ctx=c.getContext('2d');ctx.beginPath();ctx.rect(100,100,30,40);ctx.clip();const before=JSON.stringify({...props,angleAt:undefined});drawDirectionalPaint(ctx,{...props,brush});assert.equal(JSON.stringify({...props,angleAt:undefined}),before);const data=bytes(c);for(let y=0;y<480;y++)for(let x=0;x<640;x++)if(x<100||x>=130||y<100||y>=140)assert.equal(data[(y*640+x)*4+3],0);checks++}
for(const variant of ['leaf','ribbon']){const a=make(),b=make();drawPaintExample(a.getContext('2d'),variant,42,{brush:'taper'});drawPaintExample(b.getContext('2d'),variant,43,{brush:'taper'});assert.notDeepEqual(bytes(a),bytes(b));checks++}
const bounded=make();drawDirectionalPaint(bounded.getContext('2d'),{...props,brush:'taper'});const bd=bytes(bounded);for(let y=0;y<480;y++)for(let x=0;x<640;x++)if(x<80||x>=320||y<80||y>=300)assert.equal(bd[(y*640+x)*4+3],0);checks++;
await writeFile(resolve(out,'verification.json'),JSON.stringify({status:'PASS',checks,defaultPixelCompatibility:'same installed backend, pinned external pre-change implementation',state:'property plus actual subsequent fill/stroke pixels, solid/gradient, helper/leaf/ribbon, both brushes',acceptance:'technical only; visual review and user acceptance separate'},null,2));
console.log(`PASS ${checks}: default pixels, explicit taper repeatability, size/seed/count boundaries, invalid before paint, late field rejection, properties, visible state, host clip, input isolation`);
