import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='reveal.local-geometry');
assert(item);
const calls=[];class Path2D{roundRect(...v){this.shape=['rounded',...v];}rect(...v){this.shape=['rect',...v];}}const ctx={save(){calls.push('save');},restore(){calls.push('restore');},clip(p){calls.push(p.shape);}};api.withLocalReveal(ctx,item.example,()=>calls.push('draw'),{Path2D});assert.deepEqual(calls,['save',['rounded',0,0,240,140,12],['rect',0,0,144,140],'draw','restore']);calls.length=0;api.withLocalReveal(ctx,{...item.example,progress:0},()=>calls.push('draw'),{Path2D});assert.deepEqual(calls,[]);assert.throws(()=>api.withLocalReveal(ctx,item.example,()=>{throw Error('draw failed');},{Path2D}));assert.equal(calls.at(-1),'restore');
console.log('reveal.local-geometry contract PASS');
