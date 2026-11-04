import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='fragment.fixed-tiles');
assert(item);
const q=n=>({n:String(n),d:'1'});const spec={...item.example,sourceRect:{x:0,y:0,width:11,height:7},columns:3,rows:2};const plan=api.compileTileScatter(spec);assert.equal(plan.tiles.length,6);assert.equal(plan.tiles.reduce((a,t)=>a+t.sourceRect.width*t.sourceRect.height,0),77);assert.deepEqual(plan.tiles.slice(0,3).map(t=>t.sourceRect.width),[3,4,4]);assert(api.sampleTileScatter(plan,q(0),{direction:'out'}).atHome);assert(api.sampleTileScatter(plan,q(3),{direction:'in'}).atHome);assert.deepEqual(api.sampleTileScatter(plan,q(1),{direction:'out'}),api.sampleTileScatter(plan,q(2),{direction:'in'}));assert.throws(()=>api.sampleTileScatter({...plan},q(0),{direction:'out'}));
console.log('fragment.fixed-tiles contract PASS');
