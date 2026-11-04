import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='transition.linear-mask');
assert(item);
const q=n=>({n:String(n),d:'1'});const spec={...item.example,params:{width:8,height:4,angle:0,mode:'band'}};const mid=api.sampleTransition(spec,q(2));assert.equal(mid.revealProgress,.5);assert.equal(Math.min(...mid.polygon.map(p=>p.x)),2);assert.equal(Math.max(...mid.polygon.map(p=>p.x)),6);assert.equal(Math.min(...mid.polygon.map(p=>p.y)),0);assert.equal(Math.max(...mid.polygon.map(p=>p.y)),4);assert.equal(api.sampleTransition(spec,q(1)).polygon.length,0);assert.equal(api.sampleTransition(spec,q(3)).polygon.length,4);assert.deepEqual(mid,api.sampleTransition(spec,q(2)));
console.log('transition.linear-mask contract PASS');
