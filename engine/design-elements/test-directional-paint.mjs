// Font-free verification; output stays in a caller-owned external directory.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,dirname,basename,sep,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {drawDirectionalPaint,drawPaintExample} from './examples/directional-paint.mjs';
const require=createRequire(import.meta.url);
if(!process.env.CANVAS_MODULE) throw new Error('CANVAS_MODULE must point to caller-installed @napi-rs/canvas');
const api=require(process.env.CANVAS_MODULE);
const root=await realpath(fileURLToPath(new URL('../..',import.meta.url)));
if(!process.argv[2]) throw new Error('external output directory required');
const requested=resolve(process.argv[2]);
// Resolve the existing parent so symlinks cannot redirect output into the repo.
// mkdir below still rejects an existing target, including a target symlink.
const out=resolve(await realpath(dirname(requested)),basename(requested));
const rel=relative(root,out);
if(!(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))) throw new Error('external output directory required');
await mkdir(out,{recursive:false});
const make=()=>api.createCanvas(640,480);
const bytes=c=>Buffer.from(c.getContext('2d').getImageData(0,0,640,480).data);
const props={bounds:{x:60,y:70,width:100,height:90},seed:0,count:50,palette:['#204030','#b0cc80'],angleAt:(u,v)=>u-v};
const a=make(),ctx=a.getContext('2d');ctx.fillStyle='#123456';ctx.strokeStyle='#654321';ctx.lineWidth=3;ctx.globalAlpha=.7;ctx.translate(3,4);
const alphaBefore=ctx.globalAlpha;const before=ctx.getTransform();drawDirectionalPaint(ctx,props);
assert.equal(ctx.fillStyle,'#123456');assert.equal(ctx.strokeStyle,'#654321');assert.equal(ctx.lineWidth,3);assert.equal(ctx.globalAlpha,alphaBefore);assert.deepEqual(ctx.getTransform(),before);
const clipped=make();drawDirectionalPaint(clipped.getContext('2d'),props);
const data=bytes(clipped);let visible=0;
for(let y=0;y<480;y++)for(let x=0;x<640;x++){const alpha=data[(y*640+x)*4+3];if(x<60||x>=160||y<70||y>=160)assert.equal(alpha,0);else visible+=alpha>0;}
assert(visible>100);
const host=make(),h=host.getContext('2d');h.beginPath();h.rect(80,80,30,40);h.clip();drawDirectionalPaint(h,props);
const hd=bytes(host);for(let y=0;y<480;y++)for(let x=0;x<640;x++)if(x<80||x>=110||y<80||y>=120)assert.equal(hd[(y*640+x)*4+3],0);
// A later draw outside helper bounds verifies its temporary clip was restored.
ctx.fillRect(200,200,5,5);assert(bytes(a)[((204*640+203)*4)+3]>0);
for(const patch of [{seed:1.5},{count:0},{length:Infinity},{width:0},{palette:['red','#ffffff']},{angleAt:()=>7},{bounds:{x:1e6+1,y:0,width:20,height:20}},{seed:-1},{seed:2**32},{count:10001},{count:NaN},{length:0},{width:81},{palette:['#ffffff',,]},{angleAt:()=>NaN},{bounds:{x:0,y:0,width:Infinity,height:20}}]) {
  const c=make(),b=bytes(c);assert.throws(()=>drawDirectionalPaint(c.getContext('2d'),{...props,...patch}));assert.deepEqual(bytes(c),b);
}
let calls=0;const late=make();assert.throws(()=>drawDirectionalPaint(late.getContext('2d'),{...props,angleAt:()=>++calls===50?Infinity:0}));assert(bytes(late).every(v=>v===0));
const original=JSON.stringify({...props,angleAt:undefined});drawDirectionalPaint(make().getContext('2d'),props);assert.equal(JSON.stringify({...props,angleAt:undefined}),original);
const outputs=[];
for(const variant of ['leaf','ribbon']) {
 const c=make(),repeat=make(),changed=make();drawPaintExample(c.getContext('2d'),variant);drawPaintExample(repeat.getContext('2d'),variant);drawPaintExample(changed.getContext('2d'),variant,43);
 assert.deepEqual(bytes(c),bytes(repeat));assert.notDeepEqual(bytes(c),bytes(changed));
 await writeFile(resolve(out,variant+'.png'),c.toBuffer('image/png'));outputs.push(bytes(c));
}
assert.notDeepEqual(outputs[0],outputs[1]);
console.log('PASS: two content shapes; same-seed repeat, changed-seed difference, context/input isolation, bounds/host clipping, invalid inputs before painting. No fonts/media/audio.');
