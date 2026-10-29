import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {gridLayout, constraintStackLayout} from '../lib/structured-layouts.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const grid = {itemIds:['a','b','c'],width:10,height:20,columns:2,gap:3};
const stack = {items:[{itemId:'a',width:10,height:20},{itemId:'b',width:30,height:5}],axis:'y',gap:3};
function frozen(value) { if (value && typeof value === 'object') {assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);} }
for (const [name, fn, input, arrayKey] of [['grid',gridLayout,grid,'itemIds'],['stack',constraintStackLayout,stack,'items']]) {
  test(`${name}: strict complete fields, immutable detached deterministic state`, () => {
    const before=structuredClone(input), state=fn(input); frozen(state); assert.deepEqual(input,before);
    assert.deepEqual(fn(structuredClone(input)),state);
    for (const value of [null,[],{},new Date(),{...input,unknown:1},{...input,[Symbol('x')]:1}]) assert.throws(()=>fn(value));
    for (const key of Object.keys(input)) {
      const absent=structuredClone(input);delete absent[key];assert.throws(()=>fn(absent));
      assert.throws(()=>fn({...input,[key]:null}));
    }
    for (const array of [[],Array(2),Array(129).fill(name==='grid'?'a':stack.items[0])]) assert.throws(()=>fn({...input,[arrayKey]:array}));
    const extra=structuredClone(input);extra[arrayKey].extra=1;assert.throws(()=>fn(extra));
    const symbol=structuredClone(input);symbol[arrayKey][Symbol('x')]=1;assert.throws(()=>fn(symbol));
    const duplicate=structuredClone(input);duplicate[arrayKey][1]=duplicate[arrayKey][0];assert.throws(()=>fn(duplicate));
  });
}
test('grid row-major geometry, columns beyond length, dimension and capacity boundaries',()=>{
  const state=gridLayout(grid);assert.deepEqual(state.map(v=>v.matrix.slice(4)),[[0,0],[13,0],[0,23]]);
  assert.deepEqual(state[2].geometryBounds,{x:0,y:23,width:10,height:20});
  assert.equal(gridLayout({...grid,columns:128})[2].matrix[4],26);
  for (const columns of [0,129,1.5,NaN,Infinity])assert.throws(()=>gridLayout({...grid,columns}));
  for (const key of ['width','height'])for(const value of [0,-1,.0001,10001,NaN,Infinity])assert.throws(()=>gridLayout({...grid,[key]:value}));
  const ids=Array.from({length:128},(_,i)=>`i${i}`);
  assert.equal(gridLayout({...grid,itemIds:ids,columns:128,width:.001,height:10000,gap:10000}).length,128);
});
test('intrinsic stack uses each prior size, both axes, valid zero gap and nested rejection',()=>{
  assert.deepEqual(constraintStackLayout(stack).map(v=>v.matrix.slice(4)),[[0,0],[0,23]]);
  assert.deepEqual(constraintStackLayout({...stack,axis:'x'}).map(v=>v.matrix.slice(4)),[[0,0],[13,0]]);
  assert.equal(constraintStackLayout({...stack,gap:0})[1].matrix[5],20);
  assert.throws(()=>constraintStackLayout({...stack,axis:'z'}));
  for(const gap of [-1,10001,NaN,Infinity])assert.throws(()=>constraintStackLayout({...stack,gap}));
  for(const patch of [{width:0},{height:-1},{width:NaN},{itemId:''},{unknown:1},{[Symbol('x')]:1}])assert.throws(()=>constraintStackLayout({...stack,items:[{...stack.items[0],...patch}]}));
  for(const key of ['itemId','width','height']){const item={...stack.items[0]};delete item[key];assert.throws(()=>constraintStackLayout({...stack,items:[item]}));}
  const items=Array.from({length:128},(_,i)=>({itemId:`i${i}`,width:.001,height:10000}));assert.equal(constraintStackLayout({...stack,items,gap:10000}).at(-1).matrix[5],2540000);
});
test('Native pixel output is stable and preserves drawing context',()=>{
 const {api}=loadNativeCanvas(),canvas=api.createCanvas(80,80),ctx=canvas.getContext('2d');
 const render=states=>{ctx.clearRect(0,0,80,80);for(const state of states){ctx.save();try{ctx.transform(...state.matrix);ctx.fillStyle='#39c';ctx.fillRect(0,0,state.rect.width,state.rect.height);}finally{ctx.restore();}}return canvas.toBuffer('image/png');};
 const states=[gridLayout(grid),constraintStackLayout(stack)],images=states.map(render);
 for(const i of [1,0,1,0])assert.deepEqual(render(states[i]),images[i]);
 assert.equal(ctx.globalAlpha,1);assert.equal(ctx.getTransform().e,0);
 assert.equal(ctx.getImageData(1,1,1,1).data[3],255);assert.equal(ctx.getImageData(11,1,1,1).data[3],0);
});
test('separate processes reproduce both layouts byte-for-byte',()=>{
 const url=new URL('../lib/structured-layouts.mjs',import.meta.url).href;
 const code=`import {gridLayout as g,constraintStackLayout as s} from ${JSON.stringify(url)};console.log(JSON.stringify([g(${JSON.stringify(grid)}),s(${JSON.stringify(stack)})]));`;
 const run=()=>spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});const a=run(),b=run();assert.equal(a.status,0,a.stderr);assert.equal(a.stdout,b.stdout);
});
