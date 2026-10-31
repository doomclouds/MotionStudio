// SPDX-License-Identifier: Apache-2.0
// Modified from OpenDesign worker-visualizer; see NOTICE and RIGHTS.md.
// Static seeded geometry only: no worker, motion, physics, performance or data claims.
const minted = new WeakMap();
const usedCanvases = new WeakSet();
const TAU = Math.PI * 2;
const KEYS = ['width', 'height', 'count', 'seed', 'centerX', 'centerY', 'radius',
  'aperture', 'rotation', 'pointSize', 'color', 'opacity', 'exposure'];

function record(value, name, keys) {
  if (!value || typeof value !== 'object' ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw TypeError(`${name}: plain record required`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !keys.includes(key)) throw TypeError(`${name}: unknown field`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!('value' in descriptor) || !descriptor.enumerable) throw TypeError(`${name}: enumerable data fields only`);
    if (descriptor.value === undefined) throw TypeError(`${name}.${key}: omit instead of undefined`);
  }
}
function number(value, name, min, max, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max ||
      (integer && !Number.isInteger(value))) throw RangeError(`${name}: out of contract`);
  return value;
}
const supplied = (object, key, fallback) => Object.hasOwn(object, key) ? object[key] : fallback;
function random32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Pure bounded model. Frozen output, including every point; no ambient random/time. */
export function planField(spec) {
  record(spec, 'field', KEYS);
  const width = number(supplied(spec, 'width'), 'width', 96, 1600, true);
  const height = number(supplied(spec, 'height'), 'height', 96, 1000, true);
  const count = number(supplied(spec, 'count', 3000), 'count', 0, 20000, true);
  const seed = number(supplied(spec, 'seed', 1), 'seed', 0, 4294967295, true);
  const centerX = number(supplied(spec, 'centerX', width / 2), 'centerX', 0, width);
  const centerY = number(supplied(spec, 'centerY', height / 2), 'centerY', 0, height);
  const radius = number(supplied(spec, 'radius', Math.min(width, height) * .46), 'radius', 8, 800);
  const aperture = number(supplied(spec, 'aperture', .15), 'aperture', 0, .95);
  const rotation = number(supplied(spec, 'rotation', 0), 'rotation', -TAU, TAU);
  const pointSize = number(supplied(spec, 'pointSize', .8), 'pointSize', .25, 4);
  const opacity = number(supplied(spec, 'opacity', .85), 'opacity', 0, 1);
  const color = supplied(spec, 'color', '#8f7adc');
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) throw TypeError('color: #rrggbb required');
  const exposure = supplied(spec, 'exposure', 'single');
  if (!['single', 'lifted'].includes(exposure)) throw TypeError('exposure: single or lifted required');
  // Top-left anchored squares, not centered circles. The entire conservative envelope must fit.
  if (centerX - radius < 0 || centerY - radius < 0 ||
      centerX + radius + pointSize > width || centerY + radius + pointSize > height) {
    throw RangeError('field disk plus point square exceeds layout');
  }
  const random = random32(seed), points = [];
  for (let i = 0; i < count; i++) {
    const angle = i / count * TAU + rotation;
    const radiusFraction = aperture + (1 - aperture) * random();
    points.push(Object.freeze({
      x: centerX + Math.fround(Math.cos(angle) * radiusFraction) * radius,
      y: centerY + Math.fround(Math.sin(angle) * radiusFraction) * radius,
    }));
  }
  return Object.freeze({width, height, count, seed, centerX, centerY, radius, aperture,
    rotation, pointSize, color: color.toLowerCase(), opacity, exposure, padding: 4,
    distribution: 'uniform radius; evenly spaced angles; seeded static sample',
    points: Object.freeze(points)});
}

/** Allocate a private transparent raster; all model checks precede allocation. */
export function particleFieldTile(env, spec) {
  record(env, 'environment', ['createCanvas', 'pixelRatio']);
  if (!Object.hasOwn(env, 'createCanvas') || typeof env.createCanvas !== 'function') {
    throw TypeError('createCanvas: own factory function required');
  }
  const pixelRatio = number(supplied(env, 'pixelRatio', 1), 'pixelRatio', 1, 2, true);
  const plan = planField(spec);
  const pixelWidth = (plan.width + 8) * pixelRatio;
  const pixelHeight = (plan.height + 8) * pixelRatio;
  const canvas = env.createCanvas(pixelWidth, pixelHeight);
  if (!canvas || typeof canvas !== 'object' || usedCanvases.has(canvas) ||
      canvas.width !== pixelWidth || canvas.height !== pixelHeight || typeof canvas.getContext !== 'function') {
    throw TypeError('factory: fresh canvas with exact requested dimensions required');
  }
  usedCanvases.add(canvas);
  const context = canvas.getContext('2d');
  const methods = ['scale', 'translate', 'fillRect'];
  if (plan.exposure === 'lifted') methods.push('resetTransform', 'getImageData', 'putImageData');
  if (!context || methods.some(key => typeof context[key] !== 'function')) throw TypeError('factory: Canvas 2D required');
  context.scale(pixelRatio, pixelRatio);
  context.translate(4, 4);
  context.fillStyle = plan.color;
  context.globalAlpha = plan.opacity;
  for (const point of plan.points) context.fillRect(point.x, point.y, plan.pointSize, plan.pointSize);
  if (plan.exposure === 'lifted') {
    // One static byte mapping; not a live accumulation or physical light model.
    context.resetTransform();
    context.globalAlpha = 1;
    const image = context.getImageData(0, 0, pixelWidth, pixelHeight);
    for (let i = 3; i < image.data.length; i += 4) {
      const alpha = image.data[i] / 255;
      image.data[i] = Math.round(255 * alpha / (.28 + .72 * alpha));
    }
    context.putImageData(image, 0, 0);
  }
  // No exposed canvas: a copied/fabricated handle cannot be placed or resize this raster.
  const tile = Object.freeze({plan, pixelRatio, pixelWidth, pixelHeight});
  minted.set(tile, {canvas, width: plan.width + 8, height: plan.height + 8, pixelWidth, pixelHeight});
  return tile;
}

/** Standard image placement, preserving caller state/path and respecting its clip/transform. */
export function place(ctx, tile, x, y) {
  const internal = minted.get(tile);
  if (!internal) throw TypeError('tile: returned handle required');
  number(x, 'x', -100000, 100000);
  number(y, 'y', -100000, 100000);
  if (!ctx || typeof ctx.drawImage !== 'function') throw TypeError('Canvas 2D drawImage required');
  if (internal.canvas.width !== internal.pixelWidth || internal.canvas.height !== internal.pixelHeight) {
    throw TypeError('factory-owned canvas was resized');
  }
  ctx.drawImage(internal.canvas, x - 4, y - 4, internal.width, internal.height);
}
