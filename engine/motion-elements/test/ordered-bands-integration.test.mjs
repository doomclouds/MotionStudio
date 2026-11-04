import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../lib/index.mjs';
import * as implementation from '../lib/foundations/layout/ordered-bands.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url)));
test('ordered bands public compile/sample share canonical plan identity and catalog executes',()=>{
 assert.equal(api.compileOrderedBands,implementation.compileOrderedBands);assert.equal(api.sampleOrderedBands,implementation.sampleOrderedBands);
 const e=catalog.elements.find(e=>e.id==='composition.ordered-bands');
 assert.equal(e.status,'experimental');assert.equal(e.evidence.originalProductionTransfer,'NOT_RUN');
 assert.equal(e.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(e.evidence.audioListening,'NOT_LISTENED');
 const plan=api.compileOrderedBands(e.example);assert.deepEqual(api.sampleOrderedBands(plan,.5),implementation.sampleOrderedBands(plan,.5));
 assert.equal(api.sampleOrderedBands(plan,1).bands[0].fraction,.8);assert.throws(()=>api.sampleOrderedBands({...plan},.5));
});
