import test from 'node:test';
import assert from 'node:assert/strict';
import {drawDryEraseMarker} from '../index.mjs';
import {drawTriangleConstruction, drawSeriesCircuit} from '../examples/consumers.mjs';
import {loadNativeCanvas} from '../../../../../motion-render-core/lib/native.mjs';

const {api} = loadNativeCanvas();
const canvas = (width = 560, height = 300) => api.createCanvas(width, height);
const pixels = c => Buffer.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
const pixel = (g, x, y) => [...g.getImageData(x, y, 1, 1).data];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

test('nominal contact, felt-curve front and lift are distinct caller-local geometry', () => {
  const c = canvas(), g = c.getContext('2d');
  const r = drawDryEraseMarker(g, {x: 60, y: 120, angle: 0, length: 430, shadow: false});
  assert.deepEqual(r.contact, {x: 60, y: 120}); assert.deepEqual(r.bodyAnchor, r.contact);
  assert.deepEqual(r.feltFront, {x: 55, y: 120}); assert.ok(Object.isFrozen(r.feltFront));
  assert.equal(pixel(g, 54, 120)[3], 0); assert.ok(pixel(g, 56, 120)[3] > 200);
  assert.ok(pixel(g, 60, 120)[3] > 200); // The nominal anchor lies INSIDE the felt footprint.
  g.clearRect(0, 0, 560, 300);
  const lifted = drawDryEraseMarker(g, {x: 60, y: 120, angle: 0, length: 430, lift: 1, shadow: false});
  assert.deepEqual(lifted.contact, r.contact); close(lifted.bodyAnchor.x, 56.1); close(lifted.bodyAnchor.y, 94);
  close(lifted.feltFront.x, 51.1); assert.ok(pixel(g, 57, 94)[3] > 200);
  assert.equal(pixel(g, 60, 120)[3], 0);
  const rotated = drawDryEraseMarker(g, {x: 40, y: 80, angle: Math.PI / 2, length: 86, lift: .5, shadow: false});
  close(rotated.bodyAnchor.x, 39.61); close(rotated.bodyAnchor.y, 77.4);
  close(rotated.feltFront.x, 39.61); close(rotated.feltFront.y, 76.4);
});

test('strict input validation rejects unknown fields/getters before touching Canvas', () => {
  let touched = 0, read = 0;
  const ctx = new Proxy({}, {get() { touched++; throw Error('Canvas touched'); }});
  const invalid = [null, [], new Date(), {}, {x: 1}, {x: 0, y: 0, extra: 1},
    {x: 0, y: 0, [Symbol('extra')]: 1}, {x: 0, y: 0, get angle() { read++; return 0; }}];
  for (const key of ['x', 'y', 'angle', 'length', 'lift']) {
    for (const bad of [undefined, null, '1', NaN, Infinity, -Infinity, {}, 1n]) invalid.push({x: 0, y: 0, [key]: bad});
  }
  invalid.push(...[{x: 1e6 + 1}, {y: -1e6 - 1}, {angle: 7}, {length: 23}, {length: 431},
    {lift: -.01}, {lift: 1.01}, {ink: '#fff'}, {ink: 'red'}, {ink: undefined}, {shadow: 1}, {shadow: null}].map(v => ({x: 0, y: 0, ...v})));
  for (const value of invalid) assert.throws(() => drawDryEraseMarker(ctx, value), /required|missing|supported|finite|#RRGGBB|boolean/);
  assert.equal(touched, 0); assert.equal(read, 0);
  const good = Object.assign(Object.create(null), {x: -0, y: 0, shadow: false});
  const r = drawDryEraseMarker(canvas().getContext('2d'), good); assert.ok(Object.is(r.contact.x, 0));
});

test('bounded blur strings always use ordinary positive decimal notation', () => {
  const filters = [], calls = [];
  const g = {globalAlpha: .5, set filter(v) { filters.push(v); }};
  for (const key of ['save', 'restore', 'translate', 'transform', 'rotate', 'scale', 'beginPath', 'moveTo',
    'lineTo', 'quadraticCurveTo', 'closePath', 'roundRect', 'fill', 'fillRect']) g[key] = (...args) => calls.push([key, ...args]);
  g.createLinearGradient = () => ({addColorStop() {}});
  for (const length of [24, 86.000000001, 430]) for (const lift of [0, 1e-12, .5, 1]) {
    drawDryEraseMarker(g, {x: 0, y: 0, length, lift});
  }
  for (const value of filters.filter(v => v !== 'none')) {
    assert.match(value, /^blur\(\d+\.\d{6}px\)$/); const n = Number(value.slice(5, -3));
    assert.ok(n > .33 && n <= 16);
  }
  assert.equal(calls.filter(c => c[0] === 'save').length, calls.filter(c => c[0] === 'restore').length);
});

function prepare(g) {
  g.beginPath(); g.rect(10, 10, 450, 220); g.clip();
  g.translate(13, 17); g.rotate(.08); g.scale(.9, 1.1); g.globalAlpha = .55;
  g.globalCompositeOperation = 'source-over'; g.fillStyle = '#abcdee'; g.strokeStyle = '#a82d43';
  g.lineWidth = 7; g.setLineDash([9, 4]); g.lineCap = 'square'; g.lineJoin = 'bevel';
  g.shadowColor = '#3c793f'; g.shadowBlur = 2; g.shadowOffsetX = 3; g.shadowOffsetY = -2; g.filter = 'blur(1px)';
}
function subsequent(g) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 560, 300); g.restore();
  g.fillRect(30, 40, 85, 44); g.beginPath(); g.moveTo(90, 120); g.lineTo(350, 190); g.stroke();
  g.fillRect(430, 210, 100, 100); // Also checks the caller clip after drawing.
}
test('actual subsequent pixels verify transform/alpha/styles/filter/shadow/clip restoration', () => {
  const a = canvas(), b = canvas(), g = a.getContext('2d'), h = b.getContext('2d'); prepare(g); prepare(h);
  const before = g.getTransform(); drawDryEraseMarker(g, {x: 100, y: 130, angle: 0, length: 200, lift: .7});
  assert.deepEqual(g.getTransform(), before); assert.deepEqual(g.getLineDash(), [9, 4]);
  subsequent(g); subsequent(h); assert.ok(pixels(a).equals(pixels(b)), 'post-draw Native pixels differ');
});

test('no world reset, caller alpha/transform/composite are consumed in the icon itself', () => {
  const a = canvas(), b = canvas(), g = a.getContext('2d'), h = b.getContext('2d');
  g.translate(40, 30); g.globalAlpha = .5;
  g.setTransform = () => { throw Error('world reset forbidden'); };
  const p = {x: 70, y: 100, angle: 0, length: 150, shadow: false};
  drawDryEraseMarker(g, p); h.globalAlpha = .5; drawDryEraseMarker(h, {...p, x: 110, y: 130});
  assert.ok(pixels(a).equals(pixels(b)), 'post-draw Native pixels differ'); assert.ok(pixel(g, 150, 130)[3] < 200);
  const empty = canvas(), e = empty.getContext('2d'); e.globalCompositeOperation = 'source-atop';
  drawDryEraseMarker(e, p); assert.ok(pixels(empty).every(v => v === 0));
});

test('shadow and barrel exceptions balance save levels and restore real paint state', () => {
  for (const failureAt of [1, 3]) {
    const a = canvas(), b = canvas(), g = a.getContext('2d'), h = b.getContext('2d'); prepare(g); prepare(h);
    const save = g.save.bind(g), restore = g.restore.bind(g), fill = g.fill.bind(g);
    let depth = 0, calls = 0; g.save = () => { save(); depth++; }; g.restore = () => { restore(); depth--; };
    g.fill = (...args) => { if (++calls === failureAt) throw Error('injected backend failure'); return fill(...args); };
    assert.throws(() => drawDryEraseMarker(g, {x: 90, y: 140}), /injected backend failure/);
    assert.equal(depth, 0); g.fill = fill; subsequent(g); subsequent(h); assert.ok(pixels(a).equals(pixels(b)), 'post-draw Native pixels differ');
  }
});

test('two semantic consumers share the exact visible prefix endpoint and keep lift out of ink', () => {
  const outputs = [];
  for (const consumer of [drawTriangleConstruction, drawSeriesCircuit]) {
    const c = canvas(), g = c.getContext('2d'), zero = consumer(g, 0);
    assert.equal(zero.marker, null); assert.equal(zero.section.empty, true);
    g.clearRect(0, 0, 560, 300); const result = consumer(g, .72);
    assert.deepEqual(result.marker.contact, result.section.vertices.at(-1).position); outputs.push(pixels(c));
    g.clearRect(0, 0, 560, 300); const lifted = consumer(g, .72, 1);
    assert.deepEqual(lifted.section, result.section); assert.deepEqual(lifted.marker.contact, result.marker.contact);
    assert.notDeepEqual(lifted.marker.bodyAnchor, result.marker.bodyAnchor);
  }
  assert.ok(!outputs[0].equals(outputs[1]));
});

test('Native pixels repeat in permuted/repeated input order with no stateful time or randomness', () => {
  const states = [
    [drawTriangleConstruction, .18, 0], [drawSeriesCircuit, .72, .3],
    [drawTriangleConstruction, 1, 1], [drawSeriesCircuit, 0, 0], [drawSeriesCircuit, 1, 0],
  ];
  const render = i => { const c = canvas(); const [draw, progress, lift] = states[i]; draw(c.getContext('2d'), progress, lift); return pixels(c); };
  const expected = states.map((_, i) => render(i));
  const reused = canvas(), g = reused.getContext('2d');
  for (const i of [3, 1, 4, 0, 2, 1, 3, 0, 4, 2]) {
    assert.ok(render(i).equals(expected[i]), `repeat mismatch at ${i}`);
    g.clearRect(0, 0, reused.width, reused.height);
    const [draw, progress, lift] = states[i]; draw(g, progress, lift);
    assert.ok(pixels(reused).equals(expected[i]), `reused context mismatch at ${i}`);
  }
});
