/** Fixed half-open numeric intervals -> minimum interchangeable horizontal lanes. */
import {object, number, id, freeze, fail} from '../../validate.mjs';
import {composeTransform, transformBounds} from '../../matrix.mjs';
function dense(a) {
  if (!Array.isArray(a) || Object.getPrototypeOf(a) !== Array.prototype || a.length > 128) fail('Expected ordinary same-realm array of 0..128 items');
  for (let i = 0; i < a.length; i++) if (!Object.hasOwn(a, i)) fail('Sparse array');
  for (const k of Reflect.ownKeys(a)) if (k !== 'length' && !(typeof k === 'string' && /^(0|[1-9][0-9]*)$/.test(k) && Number(k) < a.length)) fail('Unknown array field');
  return a;
}
function interval(value, keys) {
  object(value, keys, keys);
  const start = number(value.start, -1e6, 1e6), end = number(value.end, -1e6, 1e6);
  if (!(start < end)) fail('Expected positive half-open interval');
  return {start, end};
}
const order = (a,b) => a.start < b.start ? -1 : a.start > b.start ? 1 : a.end < b.end ? -1 : a.end > b.end ? 1 : a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0;
export function intervalLaneLayout(input) {
  object(input, ['items','domain','width','laneHeight','laneGap'], ['items','domain','width','laneHeight','laneGap']);
  const domain = interval(input.domain, ['start','end']);
  const width = number(input.width, .001, 10000), laneHeight = number(input.laneHeight, .001, 10000), laneGap = number(input.laneGap, 0, 10000);
  const span = domain.end - domain.start, seen = new Set();
  const events = dense(input.items).map((item,index) => {
    const time = interval(item, ['itemId','start','end']), itemId = id(item.itemId);
    if (seen.has(itemId)) fail('Duplicate item ID');
    seen.add(itemId);
    if (time.start < domain.start || time.end > domain.end) fail('Interval outside domain');
    const x = ((time.start - domain.start) / span) * width;
    const right = ((time.end - domain.start) / span) * width;
    const itemWidth = right - x;
    // Keep emitted local rectangles in the existing layout-handoff input domain.
    if (!Number.isFinite(itemWidth) || itemWidth < .001) fail('Projected interval width below .001');
    return {itemId, ...time, index, x, itemWidth};
  });
  const lanes = [], ends = [], items = Array(events.length);
  for (const event of [...events].sort(order)) {
    let lane = ends.findIndex(end => end <= event.start);
    if (lane < 0) {
      lane = lanes.length;
      lanes.push({itemIds: [], y: lane * (laneHeight + laneGap), height: laneHeight});
    }
    ends[lane] = event.end;
    lanes[lane].itemIds.push(event.itemId);
    const rect = {x:0, y:0, width:event.itemWidth, height:laneHeight};
    const matrix = composeTransform({x:event.x, y:lanes[lane].y});
    items[event.index] = {itemId:event.itemId, rect, matrix, zIndex:event.index, geometryBounds:transformBounds(matrix,rect)};
  }
  return freeze({items, lanes, laneCount:lanes.length, width, height:lanes.length ? lanes.at(-1).y + laneHeight : 0, domain});
}
