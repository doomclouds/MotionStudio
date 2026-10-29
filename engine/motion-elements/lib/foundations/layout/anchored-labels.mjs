/** Explicit finite candidate boxes, greedily placed by priority. No text measurement or clock. */
import {object, number, id, freeze, fail} from '../../validate.mjs';
import {composeTransform, transformBounds} from '../../matrix.mjs';
function record(value, keys) {
  object(value, keys, keys);
  for (const key of keys) if (!('value' in Object.getOwnPropertyDescriptor(value, key))) fail('Expected own data fields');
  return value;
}
function dense(value, min, max) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length < min || value.length > max) fail('Expected bounded ordinary same-realm array');
  for (const key of Reflect.ownKeys(value)) if (key !== 'length' && !(typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < value.length)) fail('Unknown array field');
  for (let i = 0; i < value.length; i++) {
    const d = Object.getOwnPropertyDescriptor(value, String(i));
    if (!d || !('value' in d) || !d.enumerable) fail('Expected dense enumerable data array');
  }
  return value;
}
function point(value) {
  record(value, ['x','y']);
  return {x:number(value.x, -1e6, 1e6), y:number(value.y, -1e6, 1e6)};
}
function bounds(value) {
  record(value, ['x','y','width','height']);
  return {x:number(value.x, -1e6, 1e6), y:number(value.y, -1e6, 1e6), width:number(value.width, .001, 1e6), height:number(value.height, .001, 1e6)};
}
function inside(a, b) {
  return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
}
function conflict(a, b, clearance) {
  const gapX = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
  const gapY = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
  return gapX < clearance && gapY < clearance;
}
export function placeAnchoredLabels(input) {
  record(input, ['labels','obstacles','viewport','clearance']);
  const viewport = bounds(input.viewport), clearance = number(input.clearance, 0, 10000);
  const obstacles = dense(input.obstacles, 0, 128).map(bounds), seen = new Set();
  const labels = dense(input.labels, 0, 128).map((value, index) => {
    record(value, ['itemId','anchor','width','height','priority','offsets']);
    const itemId = id(value.itemId);
    if (seen.has(itemId)) fail('Duplicate label ID');
    seen.add(itemId);
    return {itemId, anchor:point(value.anchor), width:number(value.width, .001, 10000), height:number(value.height, .001, 10000), priority:number(value.priority, -1e6, 1e6), offsets:dense(value.offsets, 1, 16).map(point), index};
  });
  const accepted = [], items = Array(labels.length), placements = Array(labels.length);
  const ordered = [...labels].sort((a,b) => a.priority > b.priority ? -1 : a.priority < b.priority ? 1 : a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0);
  for (const label of ordered) {
    let chosen = null, candidateIndex = null;
    for (let i = 0; i < label.offsets.length; i++) {
      const offset = label.offsets[i], box = {x:label.anchor.x + offset.x, y:label.anchor.y + offset.y, width:label.width, height:label.height};
      if (!inside(box, viewport) || obstacles.some(b => conflict(box, b, clearance)) || accepted.some(b => conflict(box, b, clearance))) continue;
      chosen = box; candidateIndex = i; accepted.push(box); break;
    }
    placements[label.index] = {itemId:label.itemId, status:chosen ? 'placed' : 'unplaced', candidateIndex, anchor:{...label.anchor}};
    if (chosen) {
      const rect = {x:0, y:0, width:label.width, height:label.height}, matrix = composeTransform({x:chosen.x, y:chosen.y});
      items[label.index] = {itemId:label.itemId, rect, matrix, zIndex:label.index, geometryBounds:transformBounds(matrix, rect)};
    }
  }
  return freeze({items:items.filter(Boolean), placements, placedCount:accepted.length, unplacedCount:labels.length - accepted.length});
}
