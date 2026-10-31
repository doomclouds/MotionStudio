// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planField, particleFieldTile, place} from './index.mjs';
import {loadCanvas} from './runtime.mjs';
import {examples, scheduleBoard, routeDiagram} from './examples/compositions.mjs';

const api = loadCanvas();
const base = {width: 200, height: 160, count: 80, seed: 1, radius: 65};
const pixels = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
const alpha = c => pixels(c).filter((_, i) => i % 4 === 3);
const sha = b => createHash('sha256').update(b).digest('hex');
function build(spec = base, pixelRatio = 1) {
  let canvas;
  const tile = particleFieldTile({pixelRatio, createCanvas(w, h) { canvas = api.createCanvas(w, h); return canvas; }}, spec);
  return {tile, canvas};
}
function invalid(spec) {
  let allocations = 0;
  assert.throws(() => particleFieldTile({createCanvas() { allocations++; throw Error('allocated'); }}, spec),
    error => error.message !== 'allocated');
  assert.equal(allocations, 0);
}
test('pure plan has complete default contract and deep-frozen points', () => {
  const p = planField({width: 200, height: 160});
  assert.deepEqual([p.count, p.seed, p.aperture, p.opacity, p.exposure, p.color, p.padding],
    [3000, 1, .15, .85, 'single', '#8f7adc', 4]);
  assert.ok(Object.isFrozen(p) && Object.isFrozen(p.points) && p.points.every(Object.isFrozen));
  assert.throws(() => p.points[0].x = 1); assert.throws(() => p.points.push({x: 0, y: 0}));
});
test('no random, clock, mutable ambient seed or caller mutation', () => {
  const oldRandom = Math.random, oldNow = Date.now;
  try {
    Math.random = Date.now = () => { throw Error('ambient entropy'); };
    const input = Object.freeze({...base});
    assert.deepEqual(planField(input), planField(input)); assert.deepEqual(input, base);
  } finally { Math.random = oldRandom; Date.now = oldNow; }
});
test('zero seed/count/opacity/aperture preserved; distinct seed/rotation distinct', () => {
  const p = planField({...base, seed: 0, count: 0, opacity: 0, aperture: 0});
  assert.deepEqual([p.seed, p.count, p.opacity, p.aperture, p.points.length], [0, 0, 0, 0, 0]);
  assert.notDeepEqual(planField({...base, seed: 0}).points, planField(base).points);
  assert.notDeepEqual(planField({...base, rotation: .1}).points, planField(base).points);
  assert.equal(planField({...base, color: '#Ab12Cd'}).color, '#ab12cd');
});
test('seed 0 and uint32 maximum produce stable known coordinates', () => {
  // Direct independent first-sample reference of the documented unsigned generator.
  for (const seed of [0, 1, 4294967295]) {
    let x = (seed + 0x6D2B79F5) >>> 0;
    x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    const u = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    const p = planField({...base, count: 1, seed});
    assert.equal(p.points[0].x, 100 + Math.fround(.15 + .85 * u) * 65);
    assert.equal(p.points[0].y, 80);
  }
});
test('uniform radius (not area), bounded squares, and full angular sample', () => {
  const p = planField({width: 1600, height: 1000, count: 20000, seed: 0, pointSize: 4});
  let mean = 0, firstHalf = 0;
  for (const point of p.points) {
    const r = Math.hypot(point.x - p.centerX, point.y - p.centerY) / p.radius;
    assert.ok(r >= .15 - 1e-7 && r <= 1 + 1e-7); mean += r;
    if (r < .575) firstHalf++;
    assert.ok(point.x >= 0 && point.y >= 0 && point.x + 4 <= p.width && point.y + 4 <= p.height);
  }
  assert.ok(Math.abs(mean / p.count - .575) < .012);
  assert.ok(firstHalf > 9500 && firstHalf < 10500);
});
const bad = {
  width: [undefined, null, false, '200', NaN, Infinity, -Infinity, 95, 1601, 200.5],
  height: [undefined, null, '160', 95, 1001, 160.5],
  count: [undefined, null, '80', -1, 20001, .5, NaN],
  seed: [undefined, null, '1', -1, 4294967296, .5, Infinity],
  centerX: [undefined, null, -1, 201, 1], centerY: [undefined, null, -1, 161, 1],
  radius: [undefined, null, 7.999, 801, 99], aperture: [undefined, null, -.001, .9501, '0'],
  rotation: [undefined, null, Math.PI * 2 + .001, -Math.PI * 2 - .001],
  pointSize: [undefined, null, 0, .249, 4.001, '1'],
  color: [undefined, null, 'red', '#fff', '#00000000', 'url(x)'],
  opacity: [undefined, null, -.01, 1.001, '1'], exposure: [undefined, null, 'settled', 'live', true],
};
for (const [key, values] of Object.entries(bad)) test(`invalid ${key}: no allocation`, () => {
  for (const value of values) invalid({...base, [key]: value});
});
test('records reject arrays/prototypes/symbols/unknown fields/accessors/nonenumerable fields', () => {
  let reads = 0;
  const getter = Object.defineProperty({...base}, 'seed', {enumerable: true, get() { reads++; return 1; }});
  for (const v of [null, [], new Date(), Object.create(base), {...base, fps: 60}, {...base, [Symbol()]: 1},
    getter, Object.defineProperty({...base}, 'seed', {value: 1, enumerable: false})]) invalid(v);
  assert.equal(reads, 0);
  assert.deepEqual(planField(Object.assign(Object.create(null), base)), planField(base));
});
test('required dimensions cannot be absent', () => { invalid({height: 160}); invalid({width: 200}); invalid({}); });
test('environment rejects malformed fields before allocation and never reads getters', () => {
  let reads = 0, calls = 0;
  const factory = () => { calls++; throw Error('bad allocation'); };
  for (const env of [null, [], {}, {createCanvas: null}, {createCanvas: factory, pixelRatio: undefined},
    ...[0, 3, 1.5, null, NaN, '1'].map(pixelRatio => ({createCanvas: factory, pixelRatio})),
    {createCanvas: factory, fps: 60}, Object.defineProperty({}, 'createCanvas', {enumerable: true, get() { reads++; return factory; }})]) {
    assert.throws(() => particleFieldTile(env, base), e => e.message !== 'bad allocation');
  }
  assert.equal(reads, 0); assert.equal(calls, 0);
});
test('minimum dimensions and all inclusive scalar boundaries', () => {
  for (const spec of [
    {width: 96, height: 96, count: 0, seed: 0, radius: 8, centerX: 8, centerY: 8, aperture: 0, pointSize: .25, opacity: 0, rotation: -Math.PI * 2},
    {width: 1600, height: 1000, count: 20000, seed: 4294967295, radius: 498, centerX: 800, centerY: 498, pointSize: 4, aperture: .95, opacity: 1, rotation: Math.PI * 2},
  ]) assert.equal(planField(spec).points.length, spec.count);
});
test('conservative envelope is strict even at zero count; exact edges allowed', () => {
  assert.ok(planField({...base, centerX: 65, centerY: 65}));
  for (const patch of [{centerX: 64.999}, {centerY: 64.999}, {centerX: 135}, {centerY: 95}]) invalid({...base, count: 0, ...patch});
  assert.ok(planField({...base, centerX: 134.2, centerY: 94.2}));
});
for (const ratio of [1, 2]) for (const exposure of ['single', 'lifted']) test(`four guards and central hole ${ratio}x/${exposure}`, () => {
  const {tile, canvas} = build({...base, count: 1500, aperture: .5, exposure}, ratio);
  assert.deepEqual([tile.pixelWidth, tile.pixelHeight], [208 * ratio, 168 * ratio]);
  const data = pixels(canvas); let nonempty = 0;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const a = data[(y * canvas.width + x) * 4 + 3]; if (a) nonempty++;
    if (x < 4 * ratio || x >= 204 * ratio || y < 4 * ratio || y >= 164 * ratio) assert.equal(a, 0);
    if (Math.hypot(x - 104 * ratio, y - 84 * ratio) < 22 * ratio) assert.equal(a, 0);
  }
  assert.ok(nonempty > 1000);
});
test('lifted exposure is exact alpha-byte map without adding new nonzero pixels', () => {
  const a = alpha(build(base).canvas), b = alpha(build({...base, exposure: 'lifted'}).canvas);
  let changed = 0;
  for (let i = 0; i < a.length; i++) {
    const f = a[i] / 255; assert.equal(b[i], Math.round(255 * f / (.28 + .72 * f)));
    if (b[i] > a[i]) changed++; if (a[i] === 0) assert.equal(b[i], 0);
  }
  assert.ok(changed > 80);
});
test('opacity/count zero: every RGBA byte transparent in both modes', () => {
  for (const exposure of ['single', 'lifted']) for (const patch of [{opacity: 0}, {count: 0}])
    assert.ok(pixels(build({...base, ...patch, exposure}).canvas).every(x => x === 0));
});
test('opacity is per point; dense overdraw may exceed it', () => {
  const low = alpha(build({...base, count: 20000, radius: 8, pointSize: 4, opacity: .1}).canvas);
  assert.ok(Math.max(...low) > 26); // Do not promise a layer-wide alpha ceiling.
  assert.ok(low.some(x => x > 0 && x < 255));
});
test('seed repeat produces exact pixels and PNG, different seed changes output', () => {
  const a = build().canvas.toBuffer('image/png'), b = build().canvas.toBuffer('image/png');
  assert.deepEqual(a, b); assert.notEqual(sha(a), sha(build({...base, seed: 2}).canvas.toBuffer('image/png')));
});
test('maximum allocation is bounded and renders without clipping guard', () => {
  const {canvas, tile} = build({width: 1600, height: 1000, count: 20000, seed: 4294967295, pointSize: 4, exposure: 'lifted'}, 2);
  assert.equal(canvas.width * canvas.height * 4, 25933824);
  assert.equal(tile.plan.points.length, 20000);
  const data = pixels(canvas);
  for (let x = 0; x < canvas.width; x++) { assert.equal(data[x * 4 + 3], 0); assert.equal(data[((canvas.height - 1) * canvas.width + x) * 4 + 3], 0); }
  for (let y = 0; y < canvas.height; y++) { assert.equal(data[(y * canvas.width) * 4 + 3], 0); assert.equal(data[(y * canvas.width + canvas.width - 1) * 4 + 3], 0); }
});
test('opaque handle is frozen and copy/fabrication is not placeable', () => {
  const {tile} = build(); let calls = 0;
  assert.ok(Object.isFrozen(tile)); assert.equal(tile.canvas, undefined);
  for (const t of [{}, {...tile}, Object.create(tile), null]) assert.throws(() => place({drawImage() { calls++; }}, t, 0, 0));
  assert.equal(calls, 0);
});
test('place is exactly one drawImage using logical guard offset', () => {
  const {tile, canvas} = build(base, 2), calls = [];
  place({drawImage(...args) { calls.push(args); }}, tile, 10.5, 20.25);
  assert.deepEqual(calls, [[canvas, 6.5, 16.25, 208, 168]]);
});
test('invalid placement leaves caller pixels and state untouched', () => {
  const {tile} = build(), canvas = api.createCanvas(40, 40), c = canvas.getContext('2d');
  c.fillStyle = '#ff0012'; c.fillRect(0, 0, 40, 40); c.translate(1, 2); c.globalAlpha = .6;
  const before = pixels(canvas), transform = c.getTransform();
  for (const [x, y] of [[null, 0], [NaN, 0], [0, Infinity], [100001, 0], [0, -100001], ['0', 0]]) assert.throws(() => place(c, tile, x, y));
  assert.deepEqual(pixels(canvas), before); assert.deepEqual(c.getTransform(), transform); assert.equal(c.globalAlpha, .6);
  assert.throws(() => place({}, tile, 0, 0));
});
test('path, transform, clip, styles and destination blending match direct drawImage', () => {
  const a = api.createCanvas(400, 300), b = api.createCanvas(400, 300), ca = a.getContext('2d'), cb = b.getContext('2d');
  const {tile, canvas} = build(base, 2);
  for (const c of [ca, cb]) {
    c.fillStyle = '#5a6c91'; c.fillRect(0, 0, 400, 300); c.save();
    c.translate(7, 9); c.scale(.9, 1.1); c.beginPath(); c.rect(5, 5, 250, 180); c.clip();
    c.beginPath(); c.moveTo(3, 250); c.lineTo(370, 30);
    c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.globalAlpha = .7; c.globalCompositeOperation = 'screen';
    c.font = '17px sans-serif'; c.letterSpacing = '2px'; c.wordSpacing = '3px';
  }
  place(ca, tile, 20, 10); cb.drawImage(canvas, 16, 6, 208, 168); ca.stroke(); cb.stroke();
  assert.deepEqual(pixels(a), pixels(b)); assert.deepEqual(ca.getTransform(), cb.getTransform());
  for (const key of ['fillStyle', 'strokeStyle', 'globalAlpha', 'globalCompositeOperation', 'font', 'letterSpacing', 'wordSpacing']) assert.equal(ca[key], cb[key]);
  ca.restore(); cb.restore(); ca.stroke(); cb.stroke(); assert.deepEqual(pixels(a), pixels(b));
});
test('factory errors are explicit; reused/wrong-size/missing-method canvases do not paint', () => {
  let paint = 0;
  for (const factory of [() => null, () => ({width: 1, height: 1}),
    (width, height) => ({width, height, getContext() { return {fillRect() { paint++; }}; }})])
    assert.throws(() => particleFieldTile({createCanvas: factory}, base));
  assert.equal(paint, 0);
  const canvas = api.createCanvas(208, 168), env = {createCanvas: () => canvas};
  particleFieldTile(env, base); const before = pixels(canvas);
  assert.throws(() => particleFieldTile(env, base)); assert.deepEqual(pixels(canvas), before);
});
test('trusted factory resize is detected before placement; pixel tampering is outside contract', () => {
  const {tile, canvas} = build(); canvas.width = 1; let paint = 0;
  assert.throws(() => place({drawImage() { paint++; }}, tile, 0, 0)); assert.equal(paint, 0);
});
for (const [i, render] of [scheduleBoard, routeDiagram].entries()) test(`font-free different content/size fixture ${examples[i].id}`, () => {
  const a = render(api), b = render(api);
  assert.deepEqual([a.width, a.height], [examples[i].width, examples[i].height]);
  assert.deepEqual(a.toBuffer('image/png'), b.toBuffer('image/png'));
  assert.ok(alpha(a).every(x => x === 255));
});
