// Original synthetic, font-free consumers. No shared paint engine or final reveal.
import {drawFlatColorBrush, flatBrushGeometry} from '../index.mjs';
const stateAt = (x, y, width, length, color, lift = 0) =>
  ({x: x + .18 * length, y, width, length, color, lift, angle: 0});
function progress(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new RangeError('progress must be 0..1');
}
// Private example-local quadrilateral, not a stroke/path API. Never round capped.
function ribbon(ctx, start, end, y, width, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(start, y - width / 2); ctx.lineTo(end, y - width / 2);
  ctx.lineTo(end, y + width / 2); ctx.lineTo(start, y + width / 2); ctx.closePath(); ctx.fill();
}
// A color sample strip: one straight painted ribbon, current edge follows its end.
export function drawSampleRibbon(ctx, fraction, showTool = true) {
  progress(fraction);
  const end = 40 + 220 * fraction, options = stateAt(end, 80, 24, 140, '#357d86');
  ctx.save();
  try {
    ribbon(ctx, 40, end, 80, 24, '#357d86');
    return showTool ? drawFlatColorBrush(ctx, options) : flatBrushGeometry(options);
  } finally { ctx.restore(); }
}
function concaveClip(ctx) {
  ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(260, 40); ctx.lineTo(260, 100);
  ctx.lineTo(160, 100); ctx.lineTo(160, 190); ctx.lineTo(40, 190); ctx.closePath();
}
// An L-shaped paper color patch, made only from five independently clipped rows.
// Each row's caller-authored phase has a painting interval then a lifted return.
// No whole-shape replacement at fraction=1. The clip is never itself filled.
export function drawConcavePatch(ctx, fraction, showTool = true) {
  progress(fraction);
  const phase = fraction * 5, row = Math.min(4, Math.floor(phase));
  const local = fraction === 1 ? 1 : phase - row;
  const painting = local < .75, painted = Math.min(1, local / .75);
  const rowY = i => 55 + i * 30;
  const right = i => i < 2 ? 260 : 160;
  const start = i => i % 2 ? right(i) : 40, end = i => i % 2 ? 40 : right(i);
  const tip = start(row) + (end(row) - start(row)) * painted;
  const lift = painting ? 0 : 1;
  const returnFraction = painting ? 0 : (local - .75) / .25;
  const y = rowY(row) + (row < 4 ? 30 * returnFraction : 0);
  const options = stateAt(tip, y, 30, 140, '#bb6046', lift);
  ctx.save();
  try {
    ctx.save();
    try {
      concaveClip(ctx); ctx.clip();
      for (let i = 0; i < row; i++) ribbon(ctx, start(i), end(i), rowY(i), 30, '#bb6046');
      ribbon(ctx, start(row), tip, rowY(row), 30, '#bb6046');
    } finally { ctx.restore(); }
    return showTool ? drawFlatColorBrush(ctx, options) : flatBrushGeometry(options);
  } finally { ctx.restore(); }
}
