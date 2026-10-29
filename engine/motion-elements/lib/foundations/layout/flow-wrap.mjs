/** Input-order intrinsic row wrapping. Static geometry, not a CSS or packing engine. */
import {object, number, id, freeze, fail} from '../../validate.mjs';
import {composeTransform, transformBounds} from '../../matrix.mjs';

function dense(values) {
  if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype || values.length > 128) {
    fail('Expected 0..128 entries in an ordinary same-realm array');
  }
  for (let i = 0; i < values.length; i++) if (!Object.hasOwn(values, i)) fail('Sparse array');
  for (const key of Reflect.ownKeys(values)) {
    if (key !== 'length' && !(typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < values.length)) fail('Unknown array field');
  }
  return values;
}

export function flowWrapLayout(input) {
  object(input, ['items', 'width', 'columnGap', 'rowGap'], ['items', 'width', 'columnGap', 'rowGap']);
  const width = number(input.width, .001, 10000);
  const columnGap = number(input.columnGap, 0, 10000), rowGap = number(input.rowGap, 0, 10000);
  const seen = new Set();
  const source = dense(input.items).map(item => {
    object(item, ['itemId', 'width', 'height'], ['itemId', 'width', 'height']);
    const itemId = id(item.itemId);
    if (seen.has(itemId)) fail('Duplicate item ID');
    seen.add(itemId);
    const w = number(item.width, .001, 10000), h = number(item.height, .001, 10000);
    if (w > width) fail('Item wider than container');
    return {itemId, width: w, height: h};
  });
  const items = [], rows = [];
  let row;
  for (const item of source) {
    // This left-associated IEEE expression, not an epsilon/exact-real test,
    // defines whether the next item remains in the current row.
    let x = row ? row.width + columnGap : 0;
    let right = x + item.width;
    if (!row || right > width) {
      const y = row ? row.y + row.height + rowGap : 0;
      row = {itemIds: [], y, width: 0, height: 0};
      rows.push(row);
      x = 0;
      right = item.width;
    }
    const rect = {x: 0, y: 0, width: item.width, height: item.height};
    const matrix = composeTransform({x, y: row.y});
    items.push({itemId: item.itemId, rect, matrix, zIndex: items.length, geometryBounds: transformBounds(matrix, rect)});
    row.itemIds.push(item.itemId);
    row.width = right;
    row.height = Math.max(row.height, item.height);
  }
  return freeze({items, rows, width, height: row ? row.y + row.height : 0});
}
