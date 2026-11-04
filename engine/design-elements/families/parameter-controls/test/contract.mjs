import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {draw,validate,id,version,guidance} from '../index.mjs';
import {drawAsset} from '../../../index.mjs';
import {cases} from '../examples/cases.mjs';
import {loadCanvas} from '../examples/runtime.mjs';
import {renderExamples} from '../examples/render.mjs';
const api=loadCanvas(),checks=[];
function check(name,fn){fn();checks.push(name)}
const canvas=()=>api.createCanvas(1100,800);
const clone=x=>structuredClone(x);
check('catalog resolves canonical identity and self-description without legacy paths',()=>{
 const root=new URL('../../../',import.meta.url),a=JSON.parse(readFileSync(new URL('catalog.json',root))).assets.find(a=>a.id===id);
 assert.equal(version,a.version);assert.equal(a.entry,'families/parameter-controls/index.mjs');assert.ok(existsSync(new URL(guidance,new URL('../index.mjs',import.meta.url))));
 for(const p of ['parameter-controls.mjs','docs/parameter-controls.md','examples/parameter-controls.mjs'])assert.ok(!existsSync(new URL(p,root)));
});
check('two real examples differ and repeat deterministically',()=>{
 const a=renderExamples(),b=renderExamples();assert.deepEqual(a.frames.map(f=>f.sha256),b.frames.map(f=>f.sha256));assert.notEqual(a.frames[0].sha256,a.frames[1].sha256);
});
check('both orientations map min midpoint max to actual thumb geometry',()=>{
 for(const sample of cases)for(const q of [0,.5,1]){const p=clone(sample.props);p.data.value=p.data.min+q*(p.data.max-p.data.min);const before=clone(p),ctx=canvas().getContext('2d');ctx.globalAlpha=.7;const alpha=ctx.globalAlpha;const g=draw(ctx,p);assert.deepEqual(p,before);assert.equal(ctx.globalAlpha,alpha);assert.equal(g.normalized,q);for(const axis of ['x','y'])assert.equal(g.thumb[axis],g.track.start[axis]+q*(g.track.end[axis]-g.track.start[axis]));}
});
check('registry calls same canonical implementation',()=>{
 const p=cases[0].props,a=canvas(),b=canvas();assert.deepEqual(draw(a.getContext('2d'),p),drawAsset(b.getContext('2d'),{assetId:id,version,props:p}));assert.deepEqual(a.toBuffer('image/png'),b.toBuffer('image/png'));
});
check('invalid range, value, precision, ticks, orientation and overlap fail before pixels',()=>{
 for(const change of [p=>p.data.max=p.data.min,p=>p.data.value=999,p=>p.data.precision=4,p=>p.data.ticks=22,p=>p.data.orientation='diagonal',p=>{p.bounds.height=160;p.theme.fontSize=32},p=>p.data.label='W'.repeat(60)]){const p=clone(cases[0].props);change(p);const c=canvas(),before=c.toBuffer('image/png');assert.throws(()=>draw(c.getContext('2d'),p));assert.deepEqual(c.toBuffer('image/png'),before);}
});
check('disabled is explicit and validation does not clamp input',()=>{const p=clone(cases[0].props);p.data.disabled=true;const g=draw(canvas().getContext('2d'),p);assert.equal(g.disabled,true);assert.equal(g.value,p.data.value);p.data.value=p.data.max+1;assert.throws(()=>validate(p));});
console.log(JSON.stringify({status:'PASS',tests:checks.length,checks,limits:['native static technical only','not browser or interactive','not visual or user acceptance']}));
