import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.sticky-interval');
assert(item);
const sample=scrollOffset=>api.stickyIntervalLayout({...item.example,scrollOffset});
const pinned=api.stickyIntervalLayout(item.example);
assert.deepEqual(pinned.rect,{x:20,y:10,width:180,height:30});
assert.deepEqual(pinned.thresholds,{pin:90,release:360});
for(const [offset,phase,y] of [[400,'released',-30],[0,'normal',100],[360,'pinned',10],[90,'pinned',10],[89,'normal',11],[361,'released',9]]) {
 const state=sample(offset);assert.equal(state.phase,phase);assert.equal(state.rect.y,y);
}
assert(Object.isFrozen(pinned.rect));assert.deepEqual(pinned,sample(200));
assert.throws(()=>api.stickyIntervalLayout({...item.example,rect:{...item.example.rect,height:301}}));
console.log('composition.sticky-interval contract PASS');
