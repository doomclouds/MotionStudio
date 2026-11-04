import test from 'node:test';
import assert from 'node:assert/strict';
import {compileArrivalField,sampleArrivalField} from '../../../../node.mjs';
const q=n=>({n:String(n),d:'1'});
test('arrival field: integer line distance has exact rational arrival independent of input order',()=>{
 const sources=[{id:'z',position:{x:0,y:0},at:q(0)},{id:'a',position:{x:20,y:0},at:q(1)}];
 const points=Array.from({length:21},(_,x)=>({id:'p'+x,position:{x,y:0}}));
 const spec={sources,speed:1,tickRate:10};const state=sampleArrivalField(compileArrivalField(spec),{points});
 for(const p of state.points){const x=p.position.x;assert.deepEqual(p.arrival,q(Math.min(x,21-x)));assert.equal(p.winnerSourceId,x<21-x?'z':'a');}
 assert.deepEqual(state,sampleArrivalField(compileArrivalField({...spec,sources:[...sources].reverse()}),{points:[...points].reverse()}));
});
test('arrival field: default barrel stays browser-safe without Node-only field exports',async()=>{
 const api=await import('../../../../index.mjs');assert.equal('compileArrivalField' in api,false);assert.equal('sampleArrivalField' in api,false);
});
