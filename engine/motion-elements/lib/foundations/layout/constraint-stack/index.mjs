import {object,number,integer,choice,freeze} from '../../../validate.mjs';
import {itemIds} from '../../../internal/layout-input.mjs';
import {dense,dimension,placed} from '../../../internal/structured-layout-support.mjs';

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
