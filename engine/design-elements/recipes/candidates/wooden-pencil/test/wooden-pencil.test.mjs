import test from 'node:test';
import assert from 'node:assert/strict';
import {drawWoodenPencil} from '../index.mjs';
import {drawConsumer} from '../examples/consumers.mjs';
import {loadNativeCanvas} from '../../../../../motion-render-core/lib/native.mjs';

const {api} = loadNativeCanvas();
const canvas = () => api.createCanvas(640, 440);
const pixels = c => Buffer.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
const pixel = (g, x, y) => [...g.getImageData(x, y, 1, 1).data];
function render(input) { const c = canvas(); drawWoodenPencil(c.getContext('2d'), input); return pixels(c); }

test('local contact is the exact geometric tip, before any parent transform', () => {
  const c = canvas(), g = c.getContext('2d');
  const result = drawWoodenPencil(g, {x: 40, y: 100, angle: 0, shadow: false});
  assert.deepEqual(result.contact, {x: 40, y: 100});
  assert.deepEqual(result.visibleTip, result.contact); assert.equal(result.shadowTip, null);
  assert.deepEqual(pixel(g, 46, 100), [58, 54, 51, 255]);
  assert.equal(pixel(g, 38, 100)[3], 0);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.contact));
});

test('lift is scaled caller-local negative Y, not the rotated pencil axis', () => {
  const g = canvas().getContext('2d');
  const raised = drawWoodenPencil(g, {x: 40, y: 100, angle: 0, lift: 1, shadow: false});
  assert.deepEqual(raised.contact, {x: 40, y: 100});
  assert.deepEqual(raised.visibleTip, {x: 40, y: 76});
  assert.deepEqual(pixel(g, 46, 76), [58, 54, 51, 255]);
  assert.equal(pixel(g, 46, 100)[3], 0);
  const smaller = drawWoodenPencil(g, {x: 40, y: 300, angle: Math.PI / 2, length: 280, lift: .5});
  assert.deepEqual(smaller.visibleTip, {x: 40, y: 294});
  assert.deepEqual(smaller.shadowTip, {x: 47, y: 307});
});

test('source material parts remain visually distinct and blue/red core is explicit', () => {
  const g = canvas().getContext('2d');
  drawWoodenPencil(g, {x: 30, y: 100, angle: 0, shadow: false});
  assert.deepEqual(pixel(g, 65, 100), [233, 201, 154, 255]);
  assert.deepEqual(pixel(g, 180, 89), [74, 118, 196, 255]);
  assert.deepEqual(pixel(g, 180, 100), [47, 90, 168, 255]);
  assert.deepEqual(pixel(g, 180, 110), [34, 67, 127, 255]);
  assert.deepEqual(pixel(g, 542, 100), [185, 178, 166, 255]);
  assert.deepEqual(pixel(g, 570, 100), [229, 154, 154, 255]);
  drawWoodenPencil(g, {x: 30, y: 220, angle: 0, lead: 'red', shadow: false});
  assert.deepEqual(pixel(g, 36, 220), [179, 38, 30, 255]);
});

test('parent transform and alpha are inherited by both pencil and hard shadow', () => {
  const g = canvas().getContext('2d'); g.translate(15, 25); g.scale(.5, .5); g.globalAlpha = .5;
  const alpha = g.globalAlpha;
  const result = drawWoodenPencil(g, {x: 40, y: 100, angle: 0, lift: 1});
  assert.deepEqual(result.visibleTip, {x: 40, y: 76});
  assert.ok(Math.abs(pixel(g, 100, 63)[3] - 255 * alpha) <= 1);
  // Center of shadow far from the raised body. Parent alpha multiplies 0.16.
  assert.ok(Math.abs(pixel(g, 100, 86)[3] - 255 * alpha * .16) <= 1);
  assert.deepEqual(['a', 'b', 'c', 'd', 'e', 'f'].map(k => g.getTransform()[k]), [.5, 0, 0, .5, 15, 25]);
  assert.equal(g.globalAlpha, alpha);
  const hidden = canvas().getContext('2d'); hidden.globalAlpha = 0;
  drawWoodenPencil(hidden, {x: 30, y: 100});
  assert.ok(hidden.getImageData(0, 0, 640, 440).data.every(x => x === 0));
});

test('actual subsequent drawing proves caller style/clip/transform/alpha restoration', () => {
  const c = canvas(), g = c.getContext('2d'), control = canvas(), h = control.getContext('2d');
  const setup = k => {
    k.translate(11, 13); k.scale(.9, 1.1); k.globalAlpha = .65;
    k.fillStyle = '#abcdee'; k.strokeStyle = '#2468ac'; k.lineWidth = 7;
    k.lineCap = 'round'; k.lineJoin = 'bevel'; k.miterLimit = 6; k.setLineDash([9, 4]); k.lineDashOffset = 2;
    k.beginPath(); k.rect(0, 0, 600, 370); k.clip();
  };
  setup(g); setup(h); drawWoodenPencil(g, {x: 10, y: 80, angle: .2, lead: 'red'});
  const paint = k => {
    k.clearRect(0, 300, 700, 100); k.fillRect(20, 310, 30, 40);
    k.beginPath(); k.moveTo(80, 325); k.lineTo(250, 325); k.stroke(); k.fillRect(590, 360, 70, 50);
  };
  paint(g); paint(h);
  assert.deepEqual(Buffer.from(g.getImageData(0, 343, 640, 97).data), Buffer.from(h.getImageData(0, 343, 640, 97).data));
  assert.deepEqual(g.getLineDash(), [9, 4]); assert.equal(g.lineDashOffset, 2);
  assert.deepEqual([...g.getTransform().toFloat64Array()], [...h.getTransform().toFloat64Array()]);
});

test('all save levels restore after errors in shadow, wood, metal or eraser drawing', () => {
  for (const failure of ['fill', 'stroke', 'fillRect', 'quadraticCurveTo']) {
    const c = canvas(), g = c.getContext('2d'), h = canvas().getContext('2d');
    for (const k of [g, h]) { k.translate(8, 9); k.globalAlpha = .6; k.fillStyle = '#abcdef'; k.setLineDash([3, 6]); }
    const save = g.save.bind(g), restore = g.restore.bind(g), original = g[failure].bind(g);
    let depth = 0;
    g.save = () => { save(); depth++; }; g.restore = () => { restore(); depth--; };
    g[failure] = () => { throw new Error('injected drawing failure'); };
    assert.throws(() => drawWoodenPencil(g, {x: 20, y: 70}), /injected drawing failure/);
    assert.equal(depth, 0); g[failure] = original;
    g.fillRect(20, 340, 10, 10); h.fillRect(20, 340, 10, 10);
    assert.deepEqual(pixel(g, 31, 352), pixel(h, 31, 352));
    assert.deepEqual(g.getLineDash(), [3, 6]); assert.equal(g.getTransform().e, 8);
  }
});

test('strict records reject extras, accessors, wrong prototypes and absent fields without drawing', () => {
  const c = canvas(), g = c.getContext('2d'); let getterCalls = 0, saves = 0;
  const save = g.save.bind(g); g.save = () => { saves++; save(); };
  const getter = {x: 10, get y() { getterCalls++; return 10; }};
  const hidden = Object.defineProperty({x: 0}, 'y', {value: 0, enumerable: false});
  for (const input of [null, [], 3, {}, {x: 0}, getter, hidden,
    {x: 0, y: 0, extra: 1}, {x: 0, y: 0, [Symbol('x')]: 1},
    Object.assign(Object.create({y: 0}), {x: 0})]) {
    assert.throws(() => drawWoodenPencil(g, input), TypeError);
  }
  assert.equal(getterCalls, 0); assert.equal(saves, 0); assert.ok(pixels(c).every(x => x === 0));
  assert.doesNotThrow(() => drawWoodenPencil(g, Object.assign(Object.create(null), {x: 0, y: 0})));
});

test('number and enum boundaries are finite, strict and never silently clamped', () => {
  const g = canvas().getContext('2d');
  for (const key of ['x', 'y', 'angle', 'length', 'lift']) {
    for (const value of [NaN, Infinity, -Infinity, null, undefined, '1', true]) {
      assert.throws(() => drawWoodenPencil(g, {x: 0, y: 0, [key]: value}), RangeError);
    }
  }
  for (const bad of [{x: 1000001}, {y: -1000001}, {angle: 2 * Math.PI + 1e-9},
    {length: 55.99}, {length: 1120.01}, {lift: -.01}, {lift: 1.01},
    {lead: 'graphite'}, {lead: null}, {shadow: 0}, {shadow: undefined}]) {
    assert.throws(() => drawWoodenPencil(g, {x: 0, y: 0, ...bad}));
  }
  for (const input of [{x: -1e6, y: 1e6, angle: -2 * Math.PI, length: 56, lift: 0},
    {x: 1e6, y: -1e6, angle: 2 * Math.PI, length: 1120, lift: 1}]) {
    assert.doesNotThrow(() => drawWoodenPencil(g, input));
  }
  assert.throws(() => drawWoodenPencil({}, {x: 0, y: 0}), TypeError);
});

test('unrelated semantic consumers share ink endpoint, not a recolored scene', () => {
  const outputs = [];
  for (const kind of ['route', 'triangle']) {
    const c = canvas(), g = c.getContext('2d'), result = drawConsumer(g, kind, .73);
    assert.deepEqual(result.pencil.contact, result.section.vertices.at(-1).position);
    assert.deepEqual(result.pencil.visibleTip, result.pencil.contact);
    assert.equal(result.pencil.lead, 'blue'); outputs.push(pixels(c));
    if (kind === 'triangle') {
      assert.equal(pixel(g, 310, 315)[3], 255); // right-angle square retained
      assert.equal(pixel(g, 195, 324)[3], 0); // unequal legs must not show equal-length ticks
      assert.equal(pixel(g, 324, 225)[3], 0);
    }
    assert.equal(drawConsumer(g, kind, 0).pencil, null);
  }
  assert.notDeepEqual(outputs[0], outputs[1]);
  assert.throws(() => drawConsumer(canvas().getContext('2d'), 'route', NaN));
});

test('repeated and shuffled absolute states produce byte-identical Native pixels', () => {
  const specs = Array.from({length: 16}, (_, i) => ({x: 40 + i * 3, y: 120 + i * 5,
    angle: -.25 + i * .03, length: 224 + i * 4, lift: (i % 4) / 3, lead: i % 2 ? 'red' : 'blue'}));
  const expected = specs.map(render);
  // Fixed shuffled order, not Math.random or renderer-owned frame state.
  const order = [9, 3, 15, 0, 7, 13, 2, 10, 4, 12, 1, 14, 6, 11, 5, 8, 0, 9, 15];
  for (const i of order) assert.deepEqual(render(specs[i]), expected[i]);
  assert.notDeepEqual(expected[0], expected[1]);
});
