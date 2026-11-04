import {object,number,integer,choice,freeze} from '../../../validate.mjs';
import {itemIds} from '../../../internal/layout-input.mjs';
import {dense,dimension,placed} from '../../../internal/structured-layout-support.mjs';

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
