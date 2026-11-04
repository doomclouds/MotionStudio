import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleScreenInkPath as sample} from './screen-ink-path.mjs';

const square = [[0, 0], [14, 0], [14, 14], [0, 14]];
const base = () => ({points: square.map(p => p.slice()), closed: true, amplitude: 1.2, seed: 4.2});
const near = (a, b, tolerance = 1e-12) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)), `${a} != ${b}`);
function pairsNear(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((p, i) => p.forEach((value, j) => near(value, expected[i][j])));
}

// Numerical fixtures from the pinned upstream toScreen + boilPts + core helpers.
// No upstream renderer/scene, browser or private production input is required.
test('fixed upstream numerical fixture: closed square and blended seam', () => {
  pairsNear(sample(base()), [
    [0.31381823225710254, 0.31381823225710254], [7, 0.32458026016196845],
    [13.847235148463056, 0.152764851536943], [13.693579086428574, 7],
    [13.617623571647771, 13.617623571647771], [7, 13.39015478392353],
    [0.39204600059579436, 13.607953999404206], [0.5610589024410271, 7],
  ]);
});
test('fixed upstream numerical fixture: open reflection/shear and repeated vertex', () => {
  pairsNear(sample({points: [[1, 2], [8, 2], [8, 2], [8, 9], [20, 15]], matrix: [-1.5, .25, .5, 2, 17, -3], closed: false, amplitude: 2.5, seed: -17.125}), [
    [16.577215811164123, 1.7132948669847496], [9.734149549559636, 2.6696223841969764],
    [6.7231396605527864, 6.245764315203412], [8.113964632954033, 13.065174756898854],
    [6.531272718847235, 18.57271044864228], [1.4323065363756793, 22.967380370150863],
    [-3.2642494138712403, 28.170319356515606], [-5.7959440998428615, 31.704055900157137],
  ]);
});
test('seven-unit accumulated screen arc length crosses source corners', () => {
  const result = sample({points: [[0, 0], [3, 0], [3, 4], [9, 4]], closed: false, amplitude: 0});
  assert.deepEqual(result, [[0, 0], [3, 4], [9, 4]]);
  assert.deepEqual(sample({points: [[0, 0], [10, 0]], closed: false, amplitude: 0}), [[0, 0], [7, 0], [10, 0]]);
  assert.deepEqual(sample({points: [[0, 0], [14, 0]], closed: false, amplitude: 0}), [[0, 0], [7, 0], [14, 0]]);
});
test('matrix is [a,b,c,d,e,f]; scaling precedes resampling, singular matrices are valid', () => {
  const points = [[1, 2], [8, 2]];
  assert.deepEqual(sample({points, matrix: [2, 0, 0, 3, 5, -1], closed: false, amplitude: 0}), [[7, 5], [14, 5], [21, 5]]);
  assert.deepEqual(sample({points, matrix: [-2, 0, 0, 3, 5, -1], closed: false, amplitude: 0}), [[3, 5], [-4, 5], [-11, 5]]);
  assert.deepEqual(sample({points, matrix: [0, 0, 0, 0, 5, -1], closed: false}), [[5, -1], [5, -1]]);
});
test('consecutive zero-length edges preserve carry and endpoint behavior', () => {
  const o = {points: [[0, 0], [7, 0], [7, 0], [7, 0], [14, 0]], closed: false, amplitude: 0};
  assert.deepEqual(sample(o), [[0, 0], [7, 0], [14, 0]]);
  assert.deepEqual(sample({points: [[9, 2], [9, 2], [9, 2]], closed: true}), [[9, 2]]);
  assert.deepEqual(sample({points: [[9, 2], [9, 2]], closed: false}), [[9, 2], [9, 2]]);
  assert.deepEqual(sample({points: [[9, 2]], closed: true}), [[9, 2]]);
  const singleton = sample({points: [[9, 2]], closed: false});
  assert.deepEqual(singleton, [[9, 2], [9, 2]]);
  assert.notEqual(singleton[0], singleton[1]);
});
test('closed paths include final edge and omit repeated first point', () => {
  const expected = [[0, 0], [7, 0], [14, 0], [14, 7], [14, 14], [7, 14], [0, 14], [0, 7]];
  assert.deepEqual(sample({...base(), amplitude: 0}), expected);
  assert.deepEqual(sample({...base(), points: [...square, square[0]], amplitude: 0}), expected);
  assert.deepEqual(sample({...base(), points: [...square, square[0]]}), sample(base()));
});
test('open endpoints are exact without boil, but are not pinned when boiled', () => {
  const o = {points: [[0, 0], [21, 0]], closed: false, seed: 4.2};
  const raw = sample({...o, amplitude: 0}), boiled = sample({...o, amplitude: 1.2});
  assert.deepEqual(raw[0], [0, 0]); assert.deepEqual(raw.at(-1), [21, 0]);
  assert.notEqual(boiled[0][1], 0); assert.notEqual(boiled.at(-1)[1], 0);
  assert.equal(boiled[0][0], 0); assert.equal(boiled.at(-1)[0], 21);
  // Fewer than three resampled points bypass boil, including a short open segment.
  assert.deepEqual(sample({points: [[0, 0], [6, 0]], closed: false, amplitude: 9}), [[0, 0], [6, 0]]);
});
test('normal displacement is bounded; a reversing secant has zero displacement', () => {
  const o = {points: [[0, 0], [7, 0], [0, 0]], closed: false, amplitude: 3, seed: 7};
  const result = sample(o);
  assert.deepEqual(result[1], [7, 0]);
  assert.ok(Math.abs(result[0][1]) <= 3 * 1.15);
  assert.ok(Math.abs(result.at(-1)[1]) <= 3 * 1.15);
});
test('two unrelated synthetic geometries: stepped tile outline and open waveform', () => {
  const fixtures = [
    {points: [[-9, -9], [26, -9], [26, 5], [12, 5], [12, 26], [-9, 26]], closed: true},
    {points: Array.from({length: 17}, (_, i) => [i * 9 - 72, Math.sin(i * .7) * 18 + (i % 3) * 2]), closed: false},
  ];
  for (const geometry of fixtures) for (const matrix of [[1, 0, 0, 1, 0, 0], [-2, .3, .4, 1.5, 17, -5], [.2, 0, 0, 4, -8, 2]]) {
    const raw = sample({...geometry, matrix, amplitude: 0});
    for (const seed of [-1000000, -17.125, 0, .25, 23.7, 1000000]) {
      const amplitude = 2.2, ink = sample({...geometry, matrix, amplitude, seed});
      assert.equal(ink.length, raw.length);
      ink.forEach((p, i) => {
        assert.ok(p.every(Number.isFinite));
        const dx = p[0] - raw[i][0], dy = p[1] - raw[i][1];
        assert.ok(Math.hypot(dx, dy) <= amplitude * 1.15 + 1e-10);
        const a = raw[geometry.closed ? (i - 1 + raw.length) % raw.length : Math.max(0, i - 1)];
        const b = raw[geometry.closed ? (i + 1) % raw.length : Math.min(raw.length - 1, i + 1)];
        near(dx * (b[0] - a[0]) + dy * (b[1] - a[1]), 0, 1e-10);
      });
    }
  }
});
test('default values equal explicit values; null-prototype record is supported', () => {
  const minimal = {points: square};
  const explicit = {points: square, matrix: [1, 0, 0, 1, 0, 0], closed: true, amplitude: 1.2, seed: 0};
  assert.deepEqual(sample(minimal), sample(explicit));
  assert.deepEqual(sample(Object.assign(Object.create(null), explicit)), sample(explicit));
});
test('inputs stay unchanged, all output pairs are fresh, later calls ignore returned mutations', () => {
  const o = {...base(), matrix: [1, 0, 0, 1, 0, 0]}, before = structuredClone(o);
  const first = sample(o), second = sample(o);
  assert.deepEqual(o, before); assert.deepEqual(first, second); assert.notEqual(first, second);
  assert.equal(new Set(first).size, first.length);
  first.forEach((p, i) => {assert.notEqual(p, second[i]); assert.ok(!o.points.includes(p));});
  first[0][0] = 999; first.push([0, 0]);
  assert.deepEqual(sample(o), second);
  Object.freeze(o.matrix); o.points.forEach(Object.freeze); Object.freeze(o.points); Object.freeze(o);
  assert.deepEqual(sample(o), second);
});
test('shuffled absolute seeds and unrelated intervening calls leave identical results', () => {
  const states = [0, 23.7, 47.4, -17.125, .5];
  const expected = states.map(seed => sample({...base(), seed}));
  for (const index of [4, 0, 3, 2, 1, 3, 0, 4, 1]) {
    sample({points: [[1, 2], [14, 19]], closed: false, seed: index * 8});
    assert.deepEqual(sample({...base(), seed: states[index]}), expected[index]);
  }
  assert.notDeepEqual(expected[0], expected[1]);
});
test('strict record fields reject missing/unknown/inherited/accessor shapes', () => {
  for (const bad of [undefined, null, [], new Date(), new Number(1), {}, Object.create({points: square}), {...base(), extra: 1}, {...base(), [Symbol()]: 1}]) assert.throws(() => sample(bad), TypeError);
  let reads = 0;
  for (const key of ['points', 'matrix', 'closed', 'amplitude', 'seed']) {
    const input = base();
    Object.defineProperty(input, key, {get() {reads++; throw Error('getter ran');}, enumerable: true});
    assert.throws(() => sample(input), TypeError);
    const hidden = base(); Object.defineProperty(hidden, key, {value: 0, enumerable: false});
    assert.throws(() => sample(hidden), TypeError);
  }
  assert.equal(reads, 0);
});
test('array validation rejects holes, extra fields, subclasses, tuples of wrong size and getters', () => {
  class Points extends Array {}
  const malformed = [null, {}, new Float64Array([0, 1]), new Points([0, 0]), [[0, 0], , [1, 2]], Object.assign([[0, 0]], {extra: 1}), Object.assign([[0, 0]], {[Symbol()]: 1})];
  for (const points of malformed) assert.throws(() => sample({points}), TypeError);
  for (const p of [[0], [0, 1, 2], {x: 0, y: 1}]) assert.throws(() => sample({points: [p]}));
  for (const matrix of [null, [1, 0], [1, 0, 0, 1, 0, 0, 0], new Float64Array(6)]) assert.throws(() => sample({...base(), matrix}));
  let reads = 0;
  for (const at of ['outer', 'point', 'matrix']) {
    const o = {...base(), matrix: [1, 0, 0, 1, 0, 0]};
    const target = at === 'outer' ? o.points : at === 'point' ? o.points[0] : o.matrix;
    Object.defineProperty(target, '0', {get() {reads++; throw Error('getter ran');}, enumerable: true});
    assert.throws(() => sample(o), TypeError);
  }
  assert.equal(reads, 0);
});
test('no coercion, nonfinite values, out-of-bounds numbers or explicit undefined defaults', () => {
  for (const value of [undefined, null, '1', NaN, Infinity, -Infinity, 1n, {}, false]) {
    for (const key of ['amplitude', 'seed']) assert.throws(() => sample({...base(), [key]: value}), RangeError);
    assert.throws(() => sample({points: [[value, 0]]}), RangeError);
    assert.throws(() => sample({...base(), matrix: [value, 0, 0, 1, 0, 0]}), RangeError);
  }
  for (const value of [undefined, null, 'true', 0, 1]) assert.throws(() => sample({...base(), closed: value}), TypeError);
  assert.throws(() => sample({...base(), matrix: undefined}), TypeError);
  for (const amplitude of [-1, 1e6 + 1]) assert.throws(() => sample({...base(), amplitude}), RangeError);
  for (const seed of [-1e6 - 1, 1e6 + 1]) assert.throws(() => sample({...base(), seed}), RangeError);
  assert.throws(() => sample({points: [[1e9 + 1, 0]]}), RangeError);
  assert.throws(() => sample({...base(), matrix: [1e6 + 1, 0, 0, 1, 0, 0]}), RangeError);
});
test('point cap is enforced before traversal; fully degenerate maximum input stays bounded', () => {
  assert.throws(() => sample({points: []}), RangeError);
  assert.throws(() => sample({points: new Array(65537)}), RangeError);
  assert.deepEqual(sample({points: Array.from({length: 65536}, () => [0, 0])}), [[0, 0]]);
});
test('sample cap is inclusive and over-cap requests throw rather than truncate or allocate unboundedly', () => {
  const max = 262144, last = (max - 1) * 7;
  const exact = sample({points: [[0, 0], [last, 0]], closed: false, amplitude: 0});
  assert.equal(exact.length, max); assert.deepEqual(exact.at(-1), [last, 0]);
  assert.throws(() => sample({points: [[0, 0], [last + 1, 0]], closed: false, amplitude: 0}), RangeError);
  assert.throws(() => sample({points: [[0, 0], [1e9, 0]], closed: false}), RangeError);
  assert.throws(() => sample({points: [[0, 0], [1e6, 0], [0, 0]], amplitude: 0}), RangeError);
});
test('accepted arithmetic boundaries are finite even when transformed coordinates are huge', () => {
  const result = sample({points: [[1e9, -1e9]], matrix: [1e6, -1e6, -1e6, 1e6, 1e6, -1e6], amplitude: 1e6, seed: -1e6, closed: false});
  assert.deepEqual(result, [[2e15 + 1e6, -2e15 - 1e6], [2e15 + 1e6, -2e15 - 1e6]]);
  assert.ok(result.flat().every(Number.isFinite));
});
