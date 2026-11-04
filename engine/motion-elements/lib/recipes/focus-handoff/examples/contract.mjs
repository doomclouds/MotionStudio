import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='recipe.focus-handoff');
assert(item);
const plan=api.compileFocusHandoff(item.example),q=(n,d=1)=>({n:String(n),d:String(d)});
for(const at of [q(0),q(2),q(4),q(7)]){const s=api.sampleFocusHandoff(plan,at);assert.deepEqual(s.layers.map(l=>l.itemId),item.example.cardIds);assert.equal(s.layers.find(l=>l.itemId===item.example.selectedId).zIndex,3);}
const final=api.sampleFocusHandoff(plan,q(7)).layers.find(l=>l.itemId===item.example.selectedId);assert.equal(final.content.nextReveal,1);assert.equal(final.content.drawPrevious,false);
const a=api.sampleFocusHandoff(plan,q(235,100)).layers.find(l=>l.itemId===item.example.selectedId),b=api.sampleFocusHandoff(plan,q(4)).layers.find(l=>l.itemId===item.example.selectedId);assert.deepEqual(a.matrix,b.matrix);
assert.throws(()=>api.sampleFocusHandoff({...plan},q(0)));assert.throws(()=>api.compileFocusHandoff({...item.example,selectedId:'missing'}));
console.log('recipe.focus-handoff contract PASS');
