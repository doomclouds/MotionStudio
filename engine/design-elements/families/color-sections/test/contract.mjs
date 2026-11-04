import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {id,version,guidance,draw,validate} from '../index.mjs';
import {drawAsset} from '../../../index.mjs';
import {examples} from '../examples/cases.mjs';
import {loadCanvas} from '../examples/runtime.mjs';
import {renderExamples} from '../examples/render.mjs';
const api=loadCanvas(),checks=[],clone=x=>structuredClone(x),canvas=()=>api.createCanvas(1200,1000);
function check(name,fn){fn();checks.push(name)}
function rejects(change){const p=clone(examples[0]);change(p);const c=canvas(),before=c.toBuffer('image/png');assert.throws(()=>draw(c.getContext('2d'),p));assert.deepEqual(c.toBuffer('image/png'),before);}
check('canonical metadata and no old runtime aliases',()=>{
 const root=new URL('../../../',import.meta.url),a=JSON.parse(readFileSync(new URL('catalog.json',root))).assets.find(a=>a.id===id);
 assert.equal(version,a.version);assert.equal(a.entry,'families/color-sections/index.mjs');assert.equal(a.sample,'families/color-sections/examples/cases.mjs');assert.equal(a.example,'families/color-sections/examples/render.mjs');assert.equal(new URL(guidance,new URL('../index.mjs',import.meta.url)).href,new URL(a.guidance,root).href);
 for(const p of ['color-sections.mjs','docs/color-sections.md','examples/color-sections.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('both font-free Native examples repeat and remain distinct',()=>{const a=renderExamples(),b=renderExamples();assert.deepEqual(a.map(x=>x.sha256),b.map(x=>x.sha256));assert.equal(a.length,2);assert.notEqual(a[0].sha256,a[1].sha256);});
check('direct and dispatcher pixels agree and caller state/inputs survive',()=>{
 for(const p of examples){const before=clone(p),a=canvas(),b=canvas(),x=a.getContext('2d'),y=b.getContext('2d');for(const c of [x,y]){c.translate(7,11);c.globalAlpha=.7;c.fillStyle='#abcdef';c.lineJoin='bevel';}const matrix=x.getTransform(),alpha=x.globalAlpha;
  const g=draw(x,p);assert.deepEqual(g,drawAsset(y,{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));assert.deepEqual(p,before);assert.equal(x.fillStyle,'#abcdef');assert.equal(x.lineJoin,'bevel');assert.equal(x.globalAlpha,alpha);for(const key of ['a','b','c','d','e','f'])assert.equal(x.getTransform()[key],matrix[key]);
 }
});
check('both orientations conserve span and return absolute slots and reading order',()=>{
 for(const orientation of ['horizontal','vertical'])for(const ratio of [.25,.44,.75]){const p=clone(examples[0]);p.bounds={x:23,y:41,width:500,height:400};p.data={...p.data,orientation,ratio,gap:24};const g=draw(canvas().getContext('2d'),p),[a,b]=g.regions,h=orientation==='horizontal',axis=h?'width':'height',cross=h?'height':'width',coord=h?'x':'y';
  assert.equal(a.x,p.bounds.x);assert.equal(a.y,p.bounds.y);assert.equal(a[cross],p.bounds[cross]);assert.equal(b[cross],p.bounds[cross]);assert.ok(Math.abs(a[axis]+b[axis]+24-p.bounds[axis])<1e-9);assert.ok(Math.abs(a[axis]/(a[axis]+b[axis])-ratio)<1e-9);assert.equal(b[coord],a[coord]+a[axis]+24);assert.deepEqual(g.readingOrder,p.data.regions.map(r=>r.id));assert.deepEqual(g.regions.map(r=>r.role),p.data.regions.map(r=>r.role));assert.deepEqual(g.bounds,p.bounds);
 }
});
check('integer boundaries have exact red/blue areas and surface-colored gap pixels',()=>{
 for(const orientation of ['horizontal','vertical']){const p=clone(examples[0]),h=orientation==='horizontal';p.bounds={x:20,y:30,width:h?400:240,height:h?240:400};p.theme.surface='#00ff00';p.data={...p.data,orientation,ratio:h?.4:.75,gap:h?20:16,regions:[{id:'a',role:'promise',fill:'#ff0000'},{id:'b',role:'proof',fill:'#0000ff'}]};const c=canvas(),ctx=c.getContext('2d'),g=draw(ctx,p),px=ctx.getImageData(p.bounds.x,p.bounds.y,p.bounds.width,p.bounds.height).data;let red=0,blue=0,green=0;
  for(let i=0;i<px.length;i+=4){assert.equal(px[i+3],255);if(px[i]===255&&px[i+1]===0&&px[i+2]===0)red++;else if(px[i]===0&&px[i+1]===0&&px[i+2]===255)blue++;else if(px[i]===0&&px[i+1]===255&&px[i+2]===0)green++;else assert.fail('unexpected blended integer-boundary pixel');}
  assert.equal(red,g.regions[0].width*g.regions[0].height);assert.equal(blue,g.regions[1].width*g.regions[1].height);assert.equal(green,p.data.gap*(h?p.bounds.height:p.bounds.width));
 }
});
check('gap defaults, zero gap and minimum usable span remain exact',()=>{
 const p=clone(examples[0]);delete p.data.gap;const g=draw(canvas().getContext('2d'),p);assert.equal(g.regions[1].x-g.regions[0].width,16);p.data.gap=null;assert.deepEqual(draw(canvas().getContext('2d'),p),g);
 p.data.gap=0;const z=draw(canvas().getContext('2d'),p);assert.equal(z.regions[1].x,z.regions[0].x+z.regions[0].width);
 p.bounds.width=160;p.data.gap=80;p.data.ratio=.25;const min=draw(canvas().getContext('2d'),p);assert.equal(min.regions[0].width,20);assert.equal(min.regions[1].width,60);
});
check('bad ratios, IDs, fills, orientation and unusable spans reject before pixels',()=>{
 for(const change of [p=>p.data.ratio=.249,p=>p.data.ratio=.751,p=>p.data.ratio=NaN,p=>p.data.orientation='diagonal',p=>p.data.gap=-1,p=>p.data.gap=81,p=>p.data.regions.pop(),p=>p.data.regions[1].id=p.data.regions[0].id,p=>p.data.regions[0].role='',p=>p.data.regions[0].fill='red',p=>p.theme.ink='red',p=>p.bounds.width=95])rejects(change);
});
check('theme contract is required but identical region fills and arbitrary roles are not rejected',()=>{const p=clone(examples[0]);p.data.regions[1].fill=p.data.regions[0].fill;p.data.regions[0].role='caller-defined, not an automatic accessibility claim';assert.equal(validate(p),p);assert.doesNotThrow(()=>draw(canvas().getContext('2d'),p));rejects(p=>p.theme.fontFamily='');});
console.log(JSON.stringify({status:'PASS',family:id,tests:checks.length,checks,limits:['Native static geometry and pixels only','no fonts required','no frozen-work restore/render or new acceptance']}));
