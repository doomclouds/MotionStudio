import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {stickyIntervalLayout as layout} from '../lib/sticky-interval.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const base={itemId:'heading',rect:{x:20,y:100,width:180,height:30},container:{start:80,end:400},scrollOffset:0,pinY:10};
const copy=x=>structuredClone(x);
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}, tolerance ${tol}`);
test('normal, pinning and section-end release are three parts of one constraint',()=>{
 for(const [scrollOffset,phase,y]of [[0,'normal',100],[89,'normal',11],[90,'pinned',10],[200,'pinned',10],[360,'pinned',10],[361,'released',9],[500,'released',-130]]){
  const o=layout({...base,scrollOffset});assert.equal(o.phase,phase);assert.equal(o.rect.y,y);assert.equal(o.naturalY,100-scrollOffset);assert.equal(o.shiftY,y-o.naturalY);assert.deepEqual(o.thresholds,{pin:90,release:360});assert.equal(o.rect.x,20);assert.equal(o.rect.width,180);assert.equal(o.rect.height,30);
 }
});
test('both threshold equalities belong to pinned without epsilon snapping',()=>{
 for(const [scrollOffset,phase]of [[90-1e-12,'normal'],[90,'pinned'],[90+1e-12,'pinned'],[360-1e-12,'pinned'],[360,'pinned'],[360+1e-12,'released']])assert.equal(layout({...base,scrollOffset}).phase,phase);
});
test('a rectangle occupying the whole interval has a single pinned instant',()=>{
 const s={...base,rect:{x:0,y:20,width:10,height:40},container:{start:20,end:60},pinY:-5};
 for(const [scrollOffset,phase,y]of [[24,'normal',-4],[25,'pinned',-5],[26,'released',-6]]){const o=layout({...s,scrollOffset});assert.equal(o.phase,phase);assert.equal(o.rect.y,y);assert.deepEqual(o.thresholds,{pin:25,release:25});}
});
test('negative scroll and pin coordinates stay explicit, not clamped to a viewport',()=>{
 const s={...base,rect:{x:-60,y:-100,width:25,height:20},container:{start:-150,end:100},pinY:-30};
 assert.equal(layout({...s,scrollOffset:-200}).rect.y,100);assert.equal(layout({...s,scrollOffset:-70}).rect.y,-30);assert.equal(layout({...s,scrollOffset:111}).rect.y,-31);
});
test('neighboring independent sections release and replace their own headings',()=>{
 const a={...base,rect:{x:0,y:0,width:50,height:20},container:{start:0,end:100},pinY:0};
 const b={...a,itemId:'next',rect:{...a.rect,y:100},container:{start:100,end:200}};
 const at=s=>[layout({...a,scrollOffset:s}),layout({...b,scrollOffset:s})];
 assert.deepEqual(at(90).map(o=>[o.phase,o.rect.y]),[['released',-10],['normal',10]]);
 assert.deepEqual(at(100).map(o=>[o.phase,o.rect.y]),[['released',-20],['pinned',0]]);
 const one=at(90);assert.deepEqual(layout({...b,scrollOffset:90}),one[1]);assert.deepEqual(layout({...a,scrollOffset:90}),one[0]);
});
test('independent clamp in content space matches 7000 sampled constraints',()=>{
 let seed=78651;const unit=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(let i=0;i<7000;i++){
  const start=(unit()-.5)*1e6,height=.001+unit()*1000,end=start+height+unit()*10000,y=start+unit()*(end-height-start),scrollOffset=(unit()-.5)*2e6,pinY=(unit()-.5)*1e6;
  const s={itemId:'oracle',rect:{x:(unit()-.5)*2e6,y,width:.001+unit()*1e6,height},container:{start,end},scrollOffset,pinY},o=layout(s);
  const contentY=Math.min(Math.max(y,scrollOffset+pinY),end-height);near(o.rect.y,contentY-scrollOffset);assert.ok(o.thresholds.pin<=o.thresholds.release);assert.ok(Object.values(o.rect).every(Number.isFinite));
 }
});
test('input extrema and derived coordinates outside the input domain remain supported',()=>{
 const s={...base,rect:{x:1e6,y:-1e6,width:1e6,height:1e6},container:{start:-1e6,end:1e6},scrollOffset:1e6,pinY:-1e6};const o=layout(s);
 assert.equal(o.naturalY,-2e6);assert.equal(o.rect.y,-1e6);assert.equal(o.shiftY,1e6);
 const tiny={...base,rect:{x:-1e6,y:1e6-.01,width:.001,height:.001},container:{start:1e6-.02,end:1e6},scrollOffset:-1e6,pinY:1e6};assert.ok(layout(tiny).rect.y>1e6);
});
test('containment uses end minus height consistently, including floating cancellation',()=>{
 const s={...base,rect:{x:0,y:.1,width:1,height:.2},container:{start:0,end:.3},pinY:0};
 assert.ok(.3-.2<.1);assert.throws(()=>layout(s),/fit vertically/);
 const corrected={...s,rect:{...s.rect,y:.3-.2}};const o=layout({...corrected,scrollOffset:.3-.2});assert.equal(o.phase,'pinned');assert.equal(o.rect.y,0);assert.equal(o.thresholds.pin,o.thresholds.release);
});
test('sum-based containment cannot admit an inverted release interval',()=>{
 const y=370931.15132302046,height=157222.72210886382,end=528153.8734318842;
 assert.equal(y+height,end);assert.ok(end-height<y);
 assert.throws(()=>layout({...base,rect:{x:0,y,width:1,height},container:{start:0,end}}),/fit vertically/);
 const s={...base,rect:{x:0,y:end-height,width:1,height},container:{start:0,end},pinY:0,scrollOffset:end-height};
 assert.equal(layout(s).phase,'pinned');assert.equal(layout(s).thresholds.pin,layout(s).thresholds.release);
});
test('required and unknown fields are enforced at each object level',()=>{
 for(const key of Object.keys(base)){const s=copy(base);delete s[key];assert.throws(()=>layout(s));}
 for(const parent of ['rect','container']){
  for(const key of Object.keys(base[parent])){const s=copy(base);delete s[parent][key];assert.throws(()=>layout(s));}
  for(const value of [null,[],new Date(),{...base[parent],extra:1},{...base[parent],[Symbol('x')]:1}])assert.throws(()=>layout({...base,[parent]:value}));
 }
 for(const value of [null,[],new Date(),{...base,extra:1},{...base,[Symbol('x')]:1}])assert.throws(()=>layout(value));
});
test('all finite scalar bounds, types and identity grammar are validated',()=>{
 const fields=[['rect','x',-1e6,1e6],['rect','y',-1e6,1e6],['rect','width',.001,1e6],['rect','height',.001,1e6],['container','start',-1e6,1e6],['container','end',-1e6,1e6],[null,'scrollOffset',-1e6,1e6],[null,'pinY',-1e6,1e6]];
 for(const [parent,key,min,max]of fields)for(const bad of [NaN,Infinity,-Infinity,undefined,null,'1',true,1n,min-1,max+1]){const s=copy(base);(parent?s[parent]:s)[key]=bad;assert.throws(()=>layout(s));}
 for(const itemId of ['',null,1,'a'.repeat(65),'with space','a.b'])assert.throws(()=>layout({...base,itemId}));assert.doesNotThrow(()=>layout({...base,itemId:'a'.repeat(64)}));
});
test('invalid intervals and vertically out-of-container rectangles reject rather than repair',()=>{
 for(const container of [{start:400,end:400},{start:401,end:400},{start:101,end:400},{start:0,end:129}])assert.throws(()=>layout({...base,container}));
 assert.doesNotThrow(()=>layout({...base,container:{start:100,end:130}}));
});
test('same-realm plain and null-prototype inputs are explicit, cross-realm plain objects reject',()=>{
 const n=Object.assign(Object.create(null),base);n.rect=Object.assign(Object.create(null),base.rect);n.container=Object.assign(Object.create(null),base.container);assert.deepEqual(layout(n),layout(base));
 assert.throws(()=>layout(runInNewContext('('+JSON.stringify(base)+')')));assert.throws(()=>layout({...base,rect:runInNewContext('('+JSON.stringify(base.rect)+')')}));
});
test('results are detached and deep frozen; calls cannot mutate inputs or store history',()=>{
 const s=copy(base),before=JSON.stringify(s),o=layout(s);assert.equal(JSON.stringify(s),before);s.rect.y=200;s.container.end=500;assert.equal(o.rect.y,100);assert.equal(o.thresholds.release,360);
 assert.ok(Object.isFrozen(o));assert.ok(Object.isFrozen(o.rect));assert.ok(Object.isFrozen(o.thresholds));assert.throws(()=>{o.rect.y=0;});assert.deepEqual(layout(base),o);assert.notEqual(layout(base).rect,o.rect);
});
test('normal and pinned placement retain their exact declared values at large magnitudes',()=>{
 const s={...base,rect:{x:0,y:999999,width:1,height:.001},container:{start:999998,end:1e6},pinY:-999999.999};
 const o=layout({...s,scrollOffset:1e6});assert.equal(o.phase,'normal');assert.equal(o.rect.y,-1);assert.equal(o.shiftY,0);
 const p=layout({...base,pinY:.123456789,scrollOffset:200});assert.equal(p.rect.y,.123456789);
});
test('shiftY is the actual IEEE difference and may be slightly negative at a rounded threshold',()=>{
 const s={itemId:'rounding',rect:{x:0,y:-414886.4734672843,width:10,height:139.01224226861206},container:{start:-414935.91714778065,end:-414725.4147566811},pinY:402640.1952270933,scrollOffset:-817526.6686943776};
 const o=layout(s);assert.equal(o.thresholds.pin,s.scrollOffset);assert.equal(o.phase,'pinned');assert.equal(o.rect.y,s.pinY);assert.equal(o.shiftY,o.rect.y-o.naturalY);assert.equal(o.shiftY,-5.820766091346741e-11);
});
test('absolute inputs repeat in reverse/random order and in a new process',()=>{
 const inputs=[-100,90,200,360,361,600].map(scrollOffset=>({...base,scrollOffset})),expected=inputs.map(layout);
 for(const i of [5,2,0,4,1,3,2])assert.deepEqual(layout(inputs[i]),expected[i]);
 const r=spawnSync(process.execPath,['--input-type=module','-e',`import{stickyIntervalLayout as f}from ${JSON.stringify(new URL('../lib/sticky-interval.mjs',import.meta.url).href)};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(f)));`],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),expected);
});
test('Native caller clip and actual returned rectangles replay without leaking caller drawing state',()=>{
 const {api}=loadNativeCanvas();const inputs=[0,10,40,90].map(scrollOffset=>({itemId:'pixel',rect:{x:8,y:30,width:35,height:12},container:{start:20,end:90},scrollOffset,pinY:8}));
 const draw=s=>{const canvas=api.createCanvas(80,60),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,80,60);ctx.globalAlpha=.75;ctx.lineWidth=3;const before=[ctx.globalAlpha,ctx.lineWidth,ctx.getTransform().toString()];ctx.save();try{ctx.beginPath();ctx.rect(2,2,76,56);ctx.clip();const o=layout(s);ctx.fillStyle='#d85438';ctx.fillRect(o.rect.x,o.rect.y,o.rect.width,o.rect.height);}finally{ctx.restore();}assert.deepEqual([ctx.globalAlpha,ctx.lineWidth,ctx.getTransform().toString()],before);return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');};
 const expected=inputs.map(draw);assert.equal(new Set(expected).size,4);assert.deepEqual([...inputs].reverse().map(draw),[...expected].reverse());
 const code=`import{stickyIntervalLayout as layout}from ${JSON.stringify(new URL('../lib/sticky-interval.mjs',import.meta.url).href)};import{loadNativeCanvas}from ${JSON.stringify(new URL('../../motion-render-core/lib/native.mjs',import.meta.url).href)};import{createHash}from'node:crypto';import assert from'node:assert/strict';const{api}=loadNativeCanvas();const draw=${draw.toString()};console.log(JSON.stringify(${JSON.stringify(inputs)}.map(draw)));`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),expected);
});
test('public index exports the same constraint function and exact results',async()=>{
 const api=await import('../lib/index.mjs');assert.equal(api.stickyIntervalLayout,layout);assert.deepEqual(api.stickyIntervalLayout(base),layout(base));
});
