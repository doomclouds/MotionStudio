/** Unregistered candidate: interpolate shared boundaries of a fixed ordered partition. */
import {object, number, id} from '../../validate.mjs';
const plans = new WeakMap();
function data(value, keys) {
  object(value, keys, keys);
  for (const key of keys) if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value')) throw Error('accessors unsupported');
  return value;
}
function endpoint(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 128) throw Error('1..128 bands required');
  for (const key of Reflect.ownKeys(items)) {
    if (key === 'length') continue;
    if (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= items.length ||
        !Object.hasOwn(Object.getOwnPropertyDescriptor(items, key), 'value')) throw Error('dense data array required');
  }
  const ids = [], weights = [];
  for (let i=0; i<items.length; i++) {
    if (!Object.hasOwn(items, i)) throw Error('sparse bands');
    const row = data(items[i], ['id', 'weight']);
    ids.push(id(row.id)); weights.push(number(row.weight, 0, 1e12));
  }
  if (new Set(ids).size !== ids.length) throw Error('duplicate ID');
  const total = weights.reduce((a,b)=>a+b, 0);
  if (total <= 0) throw Error('positive total required');
  let sum = 0;
  const boundaries = [0];
  for (const weight of weights) { sum += weight; boundaries.push(sum/total); }
  boundaries[boundaries.length-1] = 1;
  return {ids, boundaries};
}
export function compileOrderedBands(input) {
  data(input, ['from', 'to']);
  const from = endpoint(input.from), to = endpoint(input.to);
  if (from.ids.length !== to.ids.length || from.ids.some((key,i)=>key !== to.ids[i])) throw Error('same ordered IDs required; no identity morph');
  const plan = Object.freeze({bandCount:from.ids.length});
  plans.set(plan, {ids:from.ids, from:from.boundaries, to:to.boundaries});
  return plan;
}
/** progress is caller-owned [0,1], not time. Output is normalized geometry only. */
export function sampleOrderedBands(plan, progress) {
  const p = plans.get(plan);
  if (!p) throw Error('compiled ordered bands required');
  number(progress, 0, 1);
  const boundaries = p.from.map((a,i)=> progress === 0 ? a : progress === 1 ? p.to[i] : (1-progress)*a+progress*p.to[i]);
  boundaries[0] = 0; boundaries[boundaries.length-1] = 1;
  return {boundaries, bands:p.ids.map((id,i)=>({id, start:boundaries[i], end:boundaries[i+1], fraction:boundaries[i+1]-boundaries[i]}))};
}
