import {number} from '../validate.mjs';
import {composeTransform,transformBounds} from '../matrix.mjs';

export function dense(values) {
  if (!Array.isArray(values) || values.length < 1 || values.length > 128) {
    throw Error('Expected 1..128 dense array entries');
  }
  for (let i = 0; i < values.length; i++) {
    if (!Object.hasOwn(values, i)) throw Error('Sparse array');
  }
  for (const key of Reflect.ownKeys(values)) {
    if (key !== 'length' && !(typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < values.length)) {
      throw Error('Unknown array field');
    }
  }
  return values;
}
export const dimension = value => number(value, .001, 10000);

export function placed(itemId, width, height, x, y, zIndex) {
  const rect = {x: 0, y: 0, width, height};
  const matrix = composeTransform({x, y});
  return {itemId, rect, matrix, zIndex, geometryBounds: transformBounds(matrix, rect)};
}
