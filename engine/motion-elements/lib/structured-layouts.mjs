/** Bounded, clock-free layouts for uniform grids and intrinsic-size stacks. */
import {object, number, integer, choice, freeze} from './validate.mjs';
import {itemIds} from './layouts.mjs';
import {composeTransform, transformBounds} from './matrix.mjs';

function dense(values) {
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
const dimension = value => number(value, .001, 10000);

function placed(itemId, width, height, x, y, zIndex) {
  const rect = {x: 0, y: 0, width, height};
  const matrix = composeTransform({x, y});
  return {itemId, rect, matrix, zIndex, geometryBounds: transformBounds(matrix, rect)};
}

/** Fixed-size, row-major cells. This does not calculate dates or event durations. */
export function gridLayout(input) {
  object(input, ['itemIds', 'width', 'height', 'columns', 'gap'], ['itemIds', 'width', 'height', 'columns', 'gap']);
  const ids = itemIds(dense(input.itemIds));
  const width = dimension(input.width), height = dimension(input.height);
  const columns = integer(input.columns, 1, 128), gap = number(input.gap, 0, 10000);
  return freeze(ids.map((itemId, i) => placed(
    itemId, width, height, (i % columns) * (width + gap), Math.floor(i / columns) * (height + gap), i,
  )));
}

/** Input-order, intrinsic-size stack. No wrapping, sorting, collision solving or clock. */
export function constraintStackLayout(input) {
  object(input, ['items', 'axis', 'gap'], ['items', 'axis', 'gap']);
  const axis = choice(input.axis, ['x', 'y']), gap = number(input.gap, 0, 10000);
  const items = dense(input.items).map(item => {
    object(item, ['itemId', 'width', 'height'], ['itemId', 'width', 'height']);
    return {itemId: item.itemId, width: dimension(item.width), height: dimension(item.height)};
  });
  itemIds(items.map(item => item.itemId));
  let cursor = 0;
  return freeze(items.map((item, i) => {
    const result = placed(item.itemId, item.width, item.height, axis === 'x' ? cursor : 0, axis === 'y' ? cursor : 0, i);
    cursor += item[axis === 'x' ? 'width' : 'height'] + gap;
    return result;
  }));
}
