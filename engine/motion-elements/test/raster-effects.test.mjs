import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createRasterSnapshot as snap,copyRasterPixels as copy,sampleRasterMatte as matte,sampleRasterDisplacement as displace,RASTER_LIMITS} from '../lib/raster-effects.mjs';
import {drawRasterSnapshot as draw} from '../adapters/raster-effects.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const raw=(width,height,pixels)=>({width,height,pixels}),rgba=s=>[...copy(s)];
const source=raw(2,2,[255,0,0,255,0,255,0,255,0,0,255,128,230,210,190,0]);
const mask=raw(2,2,[255,255,255,255,0,0,0,255,128,128,128,128,255,255,255,0]);
const map=(w,h,r=128,g=128,a=255)=>raw(w,h,Array.from({length:w*h},()=>[r,g,39,a]).flat());
const spec=(s=source,m=map(s.width,s.height))=>({source:s,map:m,scaleX:12,scaleY:9,edge:'clamp',filter:'bilinear'});

test('opaque snapshots detach both input and inspection buffers, freeze only public dimensions',()=>{
 const input=new Uint8ClampedArray([9,8,7,6]),s=snap(raw(1,1,input));input.fill(0);
 assert.deepEqual(s,{width:1,height:1});assert.ok(Object.isFrozen(s));assert.equal(snap(s),s);
 const a=copy(s);a.fill(255);assert.deepEqual(rgba(s),[9,8,7,6]);assert.notEqual(copy(s).buffer,copy(s).buffer);
 assert.throws(()=>copy(structuredClone(s)),/snapshot/);assert.throws(()=>snap(structuredClone(s)),/Missing field/);
 assert.throws(()=>{s.width=3;},TypeError);
 const view=new Uint8ClampedArray(new ArrayBuffer(12),4,4);view.set([1,2,3,4]);assert.deepEqual(rgba(snap(raw(1,1,view))),[1,2,3,4]);
});
test('snapshot JSON shape, dimensions, exact bytes, sparse arrays and attached fields are strict',()=>{
 const bad=[null,[],{},raw(0,1,[]),raw(4097,1,[]),raw(2048,1025,[]),raw(1.5,1,[]),raw(1,1,[0,0,0]),raw(1,1,[0,0,0,NaN]),raw(1,1,[0,0,0,Infinity]),raw(1,1,[0,0,0,.5]),raw(1,1,[0,0,0,256]),raw(1,1,[0,0,0,-1]),raw(1,1,new Uint8Array(4)),raw(1,1,Array(4))];
 for(const x of bad)assert.throws(()=>snap(x));
 for(const pixels of [Object.assign([0,0,0,0],{extra:1}),Object.assign([0,0,0,0],{[Symbol('s')]:1})])assert.throws(()=>snap(raw(1,1,pixels)));
 for(const x of [{...source,extra:1},{...source,[Symbol('s')]:1},new (class X{constructor(){Object.assign(this,source)}})])assert.throws(()=>snap(x));
 for(const key of Object.keys(source)){const x={...source};delete x[key];assert.throws(()=>snap(x));assert.throws(()=>snap({...source,[key]:null}));}
});
test('typed bytes use internal view length, ignore irrelevant metadata, and reject shared/detached storage',()=>{
 const pixels=new Uint8ClampedArray([1,2,3,4]);Object.defineProperty(pixels,'length',{value:123});pixels.extra=99;pixels[Symbol('metadata')]=true;
 assert.deepEqual(rgba(snap(raw(1,1,pixels))),[1,2,3,4]);assert.throws(()=>snap(raw(1,2,pixels)),/byte count/);
 if(typeof SharedArrayBuffer==='function'){
  assert.throws(()=>snap(raw(1,1,new Uint8ClampedArray(new SharedArrayBuffer(4)))),/Shared/);
  const foreign=runInNewContext('new SharedArrayBuffer(4)');
  assert.equal(foreign instanceof SharedArrayBuffer,false);
  assert.throws(()=>snap(raw(1,1,new Uint8ClampedArray(foreign))),/Shared/);
 }
 const detached=new Uint8ClampedArray(4);structuredClone(detached.buffer,{transfer:[detached.buffer]});assert.throws(()=>snap(raw(1,1,detached)));
});
test('HD/full budget is supported with bounded private bytes and limits do not mutate',()=>{
 assert.deepEqual(RASTER_LIMITS,{maxDimension:4096,maxPixels:2097152});assert.ok(Object.isFrozen(RASTER_LIMITS));
 const pixels=new Uint8ClampedArray(4096*512*4);pixels[3]=255;pixels[pixels.length-1]=17;
 const s=snap(raw(4096,512,pixels));assert.equal(copy(s).length,pixels.length);assert.equal(copy(s).at(-1),17);
 const hd=snap(raw(1920,1080,new Uint8ClampedArray(1920*1080*4).fill(255)));
 assert.equal(copy(matte({source:hd,mask:hd,mode:'alpha',invert:false})).at(-1),255);
 assert.throws(()=>snap(raw(4096,513,[])),/budget/);
});
test('alpha/luma/inverted coverage preserve RGB and multiply existing alpha, without cumulative mutation',()=>{
 const a=matte({source,mask,mode:'alpha',invert:false});assert.deepEqual(rgba(a).filter((_,i)=>i%4===3),[255,255,64,0]);
 const b=matte({source,mask,mode:'luma',invert:false});assert.deepEqual(rgba(b).filter((_,i)=>i%4===3),[255,0,32,0]);
 assert.deepEqual(rgba(matte({source,mask,mode:'alpha',invert:true})).filter((_,i)=>i%4===3),[0,0,64,0]);
 assert.deepEqual(rgba(matte({source,mask,mode:'alpha',invert:false})),rgba(a));assert.deepEqual(rgba(snap(source)),source.pixels);
 assert.deepEqual(rgba(a).filter((_,i)=>i%4!==3),source.pixels.filter((_,i)=>i%4!==3));
 const transparent=raw(1,1,[255,255,255,0]);assert.deepEqual(rgba(matte({source:raw(1,1,[4,5,6,127]),mask:transparent,mode:'luma',invert:true})),[4,5,6,127]);
});
test('neutral RG/zero strength/transparent map are exact byte identity with both filters and edge modes',()=>{
 for(const filter of ['nearest','bilinear'])for(const edge of ['clamp','transparent']){
  assert.deepEqual(rgba(displace({...spec(),filter,edge})),source.pixels);
  assert.deepEqual(rgba(displace({...spec(source,map(2,2,0,255,255)),scaleX:0,scaleY:0,filter,edge})),source.pixels);
  assert.deepEqual(rgba(displace({...spec(source,map(2,2,0,255,0)),filter,edge})),source.pixels);
 }
});
test('nearest inverse direction, signed scales and tie behavior are explicit',()=>{
 const s=raw(3,1,[1,0,0,255,2,0,0,255,3,0,0,255]),m=map(3,1,0,128);
 assert.deepEqual(rgba(displace({...spec(s,m),scaleX:1,scaleY:0,filter:'nearest',edge:'transparent'})),[0,0,0,0,1,0,0,255,2,0,0,255]);
 assert.deepEqual(rgba(displace({...spec(s,m),scaleX:-1,scaleY:0,filter:'nearest',edge:'clamp'})).filter((_,i)=>i%4===0),[2,3,3]);
 assert.deepEqual(rgba(displace({...spec(s,m),scaleX:.5,scaleY:0,filter:'nearest',edge:'transparent'})),s.pixels,'floor(-.5+.5) is 0');
 assert.equal(rgba(displace({...spec(s,map(3,1,192,128)),scaleX:1,scaleY:0,filter:'nearest'}))[0],2);
});
test('bilinear premultiplication prevents hidden transparent RGB from bleeding and edges fade per tap',()=>{
 const s=raw(2,1,[255,0,0,255,0,0,255,0]);
 const a=displace({...spec(s,map(2,1,192,128)),scaleX:1,scaleY:0});assert.deepEqual(rgba(a).slice(0,4),[255,0,0,128]);assert.deepEqual(rgba(a).slice(4),[0,0,255,0]);
 const one=raw(1,1,[0,255,0,255]);const x=displace({...spec(one,map(1,1,64,128)),scaleX:1,scaleY:0,edge:'transparent'});assert.deepEqual(rgba(x),[0,255,0,128]);
 assert.deepEqual(rgba(displace({...spec(one,map(1,1,0,0)),scaleX:4096,scaleY:4096,edge:'transparent'})),[0,0,0,0]);
 const invisible=raw(2,1,[255,0,0,0,0,0,255,0]);assert.deepEqual(rgba(displace({...spec(invisible,map(2,1,192,128)),scaleX:1,scaleY:0})).slice(0,4),[0,0,0,0]);
});
test('bilinear channel interpolation and map-alpha gate agree with exact half/quarter samples',()=>{
 const s=raw(2,2,[255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
 assert.deepEqual(rgba(displace({...spec(s,map(2,2,192,192)),scaleX:1,scaleY:1})).slice(0,4),[128,128,128,255]);
 // 128/255 alpha gates the map offset; it is not silently treated as .5.
 const a=rgba(displace({...spec(s,map(2,2,192,128,128)),scaleX:1,scaleY:0}));
 assert.deepEqual(a.slice(0,4),[191,64,0,255]);
});
function oracle(s,m,sx,sy,edge,filter){
 const out=[],get=(x,y)=>{if(edge==='transparent'&&(x<0||y<0||x>=s.width||y>=s.height))return[0,0,0,0];x=Math.max(0,Math.min(s.width-1,x));y=Math.max(0,Math.min(s.height-1,y));return s.pixels.slice((y*s.width+x)*4,(y*s.width+x+1)*4);};
 for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
  const k=(y*s.width+x)*4,px=x+(m.pixels[k]-128)/128*sx*m.pixels[k+3]/255,py=y+(m.pixels[k+1]-128)/128*sy*m.pixels[k+3]/255;
  if(filter==='nearest'){out.push(...get(Math.floor(px+.5),Math.floor(py+.5)));continue;}
  let a=px,b=py;if(edge==='clamp'){a=Math.max(0,Math.min(s.width-1,a));b=Math.max(0,Math.min(s.height-1,b));}
  if(Number.isInteger(a)&&Number.isInteger(b)){out.push(...get(a,b));continue;}
  const ix=Math.floor(a),iy=Math.floor(b),u=a-ix,v=b-iy,weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v],samples=[get(ix,iy),get(ix+1,iy),get(ix,iy+1),get(ix+1,iy+1)];
  const alpha=samples.reduce((n,p,j)=>n+p[3]*weights[j],0),aa=Math.round(alpha);out.push(...[0,1,2].map(c=>aa?Math.round(samples.reduce((n,p,j)=>n+p[c]*p[3]*weights[j],0)/alpha):0),aa);
 }return out;
}
test('independent small-image oracle covers arbitrary RGBA, borders, low alpha and both filters',()=>{
 let seed=183;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let n=0;n<100;n++){
  const width=1+rand()%5,height=1+rand()%4,s=raw(width,height,Array.from({length:width*height*4},()=>rand()%256)),m=raw(width,height,Array.from({length:width*height*4},()=>rand()%256));
  const scaleX=(rand()%400-200)/16,scaleY=(rand()%400-200)/16;
  for(const edge of ['clamp','transparent'])for(const filter of ['nearest','bilinear'])assert.deepEqual(rgba(displace({source:s,map:m,scaleX,scaleY,edge,filter})),oracle(s,m,scaleX,scaleY,edge,filter),`case ${n} ${edge}/${filter}`);
 }
});
test('each effect rejects missing/null/unknown fields, nonfinite scales and mismatched dimensions',()=>{
 const inputs=[[matte,{source,mask,mode:'alpha',invert:false}],[displace,spec()]];
 for(const [run,good] of inputs){const before=structuredClone(good);run(good);assert.deepEqual(good,before);
  for(const bad of [null,[],{}, {...good,extra:1},{...good,[Symbol('x')]:1}])assert.throws(()=>run(bad));
  for(const key of Object.keys(good)){const missing={...good};delete missing[key];assert.throws(()=>run(missing));assert.throws(()=>run({...good,[key]:null}));}
 }
 for(const scaleX of [NaN,Infinity,-Infinity,4096.1,-4096.1,'2'])assert.throws(()=>displace({...spec(),scaleX}));
 for(const patch of [{filter:'bicubic'},{edge:'wrap'},{map:map(1,1)}])assert.throws(()=>displace({...spec(),...patch}));
 for(const patch of [{mode:'brightness'},{invert:1},{mask:map(1,1)}])assert.throws(()=>matte({source,mask,mode:'alpha',invert:false,...patch}));
});
test('absolute inputs reproduce in reverse/random order and across a fresh process',()=>{
 const inputs=[0,.5,1,1.5,2].map(t=>({...spec(source,map(2,2,91,153)),scaleX:Math.sin(t),scaleY:Math.cos(t)})),expected=inputs.map(x=>rgba(displace(x)));
 for(const i of [4,0,3,1,2,1])assert.deepEqual(rgba(displace(inputs[i])),expected[i]);
 const url=new URL('../lib/raster-effects.mjs',import.meta.url).href;
 const code=`import {sampleRasterDisplacement as run,copyRasterPixels as copy} from ${JSON.stringify(url)};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(s=>[...copy(run(s))])));`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),expected);
});
test('native adapter retains transform/clip/current path/alpha/composite and restores on draw exception',()=>{
 const {api}=loadNativeCanvas(),canvas=api.createCanvas(12,10),ctx=canvas.getContext('2d'),backend={createCanvas:api.createCanvas},placement={x:0,y:0,width:2,height:2,smoothing:false};
 ctx.translate(3,2);ctx.beginPath();ctx.rect(0,0,1,1);ctx.clip();ctx.globalAlpha=.6;const alpha=ctx.globalAlpha,transform=ctx.getTransform();ctx.globalCompositeOperation='source-over';
 draw(ctx,snap(source),placement,backend);assert.ok(ctx.getImageData(3,2,1,1).data[3]>0);assert.equal(ctx.getImageData(4,2,1,1).data[3],0);assert.equal(ctx.globalAlpha,alpha);assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.imageSmoothingEnabled,true);
 const other=api.createCanvas(12,10).getContext('2d');other.beginPath();other.rect(7,6,1,1);draw(other,snap(source),placement,backend);other.fillStyle='blue';other.fill();assert.equal(other.getImageData(7,6,1,1).data[2],255);
 other.globalCompositeOperation='screen';const op=other.globalCompositeOperation,m=other.getTransform(),old=other.drawImage;other.drawImage=()=>{other.translate(5,4);other.globalCompositeOperation='copy';throw Error('injected');};
 assert.throws(()=>draw(other,snap(source),placement,backend),/injected/);assert.deepEqual(other.getTransform(),m);assert.equal(other.globalCompositeOperation,op);assert.equal(other.imageSmoothingEnabled,true);other.drawImage=old;
 for(const b of [null,{}, {createCanvas:Object.setPrototypeOf((w,h)=>api.createCanvas(w,h),null)}, {createCanvas:async()=>canvas},{createCanvas:()=>Promise.resolve(canvas)},{createCanvas:()=>ctx.canvas},{createCanvas:()=>api.createCanvas(1,1)},{createCanvas:()=>({width:2,height:2,getContext:()=>ctx})}])assert.throws(()=>draw(ctx,snap(source),placement,b));
 for(const patch of [{extra:1},{smoothing:null},{width:0},{x:Infinity}])assert.throws(()=>draw(ctx,snap(source),{...placement,...patch},backend));
});
test('native masked-displacement pixels match reversed evaluation and fresh-process frames',()=>{
 const {api}=loadNativeCanvas(),s=snap(source),m=snap(mask),backend={createCanvas:api.createCanvas};
 const fixtures=[0,.25,.75,1].map(scaleX=>({...spec(s,map(2,2,0,192)),scaleX,scaleY:.7}));
 const hash=state=>{const c=api.createCanvas(2,2);draw(c.getContext('2d'),state,{x:0,y:0,width:2,height:2,smoothing:false},backend);return createHash('sha256').update(c.toBuffer('image/png')).digest('hex');};
 const render=i=>hash(matte({source:displace(fixtures[i]),mask:m,mode:'alpha',invert:false})),expected=fixtures.map((_,i)=>render(i));for(const i of [3,1,0,2])assert.equal(render(i),expected[i]);
 const paths={native:new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href,lib:new URL('../lib/raster-effects.mjs',import.meta.url).href,adapter:new URL('../adapters/raster-effects.mjs',import.meta.url).href};
 const code=`import{loadNativeCanvas}from ${JSON.stringify(paths.native)};import{sampleRasterDisplacement as d,sampleRasterMatte as m}from ${JSON.stringify(paths.lib)};import{drawRasterSnapshot as draw}from ${JSON.stringify(paths.adapter)};import{createHash}from 'node:crypto';const{api}=loadNativeCanvas();console.log(JSON.stringify([0,.25,.75,1].map(scaleX=>{const c=api.createCanvas(2,2);draw(c.getContext('2d'),m({source:d({...${JSON.stringify(spec(source,map(2,2,0,192)))},scaleX,scaleY:.7}),mask:${JSON.stringify(mask)},mode:'alpha',invert:false}),{x:0,y:0,width:2,height:2,smoothing:false},{createCanvas:api.createCanvas});return createHash('sha256').update(c.toBuffer('image/png')).digest('hex')})));`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),expected);
});

test('half-byte floating boundary is declared quantization, not exact-rational sampling',()=>{
 const source=raw(1,1,[152,14,232,207]),map=raw(1,1,[128,124,0,200]);
 // The exact rational alpha is34.5; IEEE evaluation is34.49999999999999.
 // Preserve actual rounding behavior, do not insert an arbitrary epsilon.
 assert.deepEqual(rgba(displace({source,map,scaleX:0,scaleY:-34,edge:'transparent',filter:'bilinear'})),[152,14,232,34]);
});
test('public candidate exports use the same snapshot/adapter module instance',async()=>{
 const api=await import('../lib/index.mjs');
 assert.equal(api.createRasterSnapshot,snap);assert.equal(api.sampleRasterMatte,matte);
 assert.equal(api.sampleRasterDisplacement,displace);assert.equal(api.drawRasterSnapshot,draw);
 assert.deepEqual([...api.copyRasterPixels(api.createRasterSnapshot(source))],source.pixels);
});

test('caller-owned bounded scratch reuse replaces every pixel and preserves shuffled output',()=>{
 const {api}=loadNativeCanvas(),target=api.createCanvas(2,2),ctx=target.getContext('2d');let allocations=0;
 const scratch=api.createCanvas(2,2),backend={createCanvas:()=>{allocations++;return scratch;}},placement={x:0,y:0,width:2,height:2,smoothing:false};
 const a=snap(raw(2,2,Array(4).fill([255,0,0,255]).flat())),b=snap(raw(2,2,Array(4).fill([0,255,0,255]).flat()));
 for(const [state,expected] of [[a,[255,0,0,255]],[b,[0,255,0,255]],[a,[255,0,0,255]]]){draw(ctx,state,placement,backend);assert.deepEqual([...ctx.getImageData(1,1,1,1).data],expected);}
 assert.equal(allocations,3,'factory called each time; actual scratch remains caller owned');
});

test('nearest half-texel uses IEEE coordinates, not exact rational tie selection',()=>{
 const pixels=new Uint8ClampedArray(128*4);for(let x=0;x<128;x++)pixels[x*4+3]=255;pixels[116*4]=255;
 const source=raw(128,1,pixels),mapping=map(128,1,2,128,187);
 const coordinate=(2-128)/128*(-160)*(187/255);
 assert.equal(coordinate,115.49999999999999);assert.equal(Math.floor(coordinate+.5),115);
 // Exact rational coordinate is231/2 and would choose pixel116. No epsilon:
 // selecting a different neighbor can differ by255, not merely1 output LSB.
 assert.equal(BigInt(2-128)*BigInt(-160)*187n*2n,231n*128n*255n);
 const actual=rgba(displace({source,map:mapping,scaleX:-160,scaleY:0,edge:'clamp',filter:'nearest'}));
 assert.deepEqual(actual.slice(0,4),[0,0,0,255]);assert.equal(pixels[116*4]-actual[0],255);
});

test('bilinear half-alpha threshold may clear RGB when the rounded alpha becomes zero',()=>{
 const source=raw(1,1,[255,50,20,3]),mapping=map(1,1,28,128,8);
 const coordinate=(28-128)/128*(-34)*(8/255);
 assert.equal(coordinate,.8333333333333334);assert.equal(3*(1-coordinate),.4999999999999999);
 // Exact rational offset5/6 gives alpha1/2 -> byte1; IEEE evaluates below1/2.
 assert.equal(BigInt(28-128)*BigInt(-34)*8n*6n,5n*128n*255n);
 assert.deepEqual(rgba(displace({source,map:mapping,scaleX:-34,scaleY:0,edge:'transparent',filter:'bilinear'})),[0,0,0,0]);
});
