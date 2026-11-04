/** Run from repository root; synthetic inputs only, no renderer or media. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileFiniteParticles, sampleFiniteParticles} from '../../../../index.mjs';
const input = {seed: 23, emissions: [{
  id: 'trail', birth: 2,
  position: {x: [10, 10], y: [20, 20]},
  velocity: {x: [3, 3], y: [-4, -4]},
  acceleration: {x: 2, y: 6}, lifetime: [4, 4],
}]};
const plan = compileFiniteParticles(input);
assert.equal(sampleFiniteParticles(plan, 1).alive.length, 0);
assert.equal(sampleFiniteParticles(plan, 2).alive.length, 1);
const atThree = sampleFiniteParticles(plan, 3);
assert.deepEqual(atThree.alive[0], {
  id: 'trail', birth: 2, death: 6, age: 1, progress: .25,
  x: 14, y: 19, vx: 5, vy: 2,
});
assert.equal(sampleFiniteParticles(plan, 6).alive.length, 0);
assert.deepEqual(sampleFiniteParticles(plan, 3), atThree);
assert.throws(() => compileFiniteParticles({...input, seed: -1}));
assert.throws(() => sampleFiniteParticles(JSON.parse(JSON.stringify(plan)), 3));
const catalog = JSON.parse(readFileSync(new URL('../../../../../catalog.json', import.meta.url)));
const item = catalog.elements.find(e => e.id === 'motion.finite-particles');
assert(item);
const registered = sampleFiniteParticles(compileFiniteParticles(item.example), .5);
assert.deepEqual(registered.alive.map(({id, x, y}) => ({id, x, y})), [{id: 'a', x: .5, y: 1}]);
console.log('motion.finite-particles contract PASS');
