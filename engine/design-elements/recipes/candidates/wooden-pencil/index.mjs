/**
 * Wooden pencil adapted from RyanBowie's Launch Race drawPencil (MIT, 2026).
 * Fixed source, preserved design and adaptation differences: CREDITS.md.
 * Retain LICENSE-RyanBowie and LICENSE when redistributing this candidate.
 * Caller supplies absolute local state; no clock, world projection or ink path.
 */
const FIELDS = ['x', 'y', 'angle', 'length', 'lift', 'lead', 'shadow'];
const PAINT = Object.freeze({
  blue: Object.freeze(['#4a76c4', '#2f5aa8', '#22437f']),
  red: Object.freeze(['#d8574a', '#c0392b', '#962c21']),
});

function options(input) {
  if (!input || typeof input !== 'object' ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('options must be a plain record');
  }
  const out = Object.create(null);
  for (const key of Reflect.ownKeys(input)) {
    const d = Object.getOwnPropertyDescriptor(input, key);
    if (!FIELDS.includes(key) || !d || !Object.hasOwn(d, 'value') || !d.enumerable) {
      throw new TypeError('options require known enumerable own data fields');
    }
    out[key] = d.value;
  }
  for (const key of ['x', 'y']) if (!Object.hasOwn(out, key)) throw new TypeError(`${key} is required`);
  return out;
}
function number(value, min, max, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a finite number in [${min}, ${max}]`);
  }
  return value === 0 ? 0 : value;
}
function context(ctx) {
  for (const method of ['save', 'restore', 'translate', 'rotate', 'scale', 'beginPath',
    'moveTo', 'lineTo', 'closePath', 'quadraticCurveTo', 'fill', 'stroke', 'fillRect', 'setLineDash']) {
    if (typeof ctx?.[method] !== 'function') throw new TypeError('Canvas 2D context required');
  }
}
function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

/** Draw a fixed-proportion faceted pencil, anchored at its unlifted contact. */
export function drawWoodenPencil(ctx, input) {
  const o = options(input), get = (key, fallback) => Object.hasOwn(o, key) ? o[key] : fallback;
  const x = number(o.x, -1e6, 1e6, 'x'), y = number(o.y, -1e6, 1e6, 'y');
  const angle = number(get('angle', .62), -2 * Math.PI, 2 * Math.PI, 'angle');
  const length = number(get('length', 560), 56, 1120, 'length');
  const lift = number(get('lift', 0), 0, 1, 'lift'), lead = get('lead', 'blue'), shadow = get('shadow', true);
  if (lead !== 'blue' && lead !== 'red') throw new TypeError('lead must be blue or red');
  if (typeof shadow !== 'boolean') throw new TypeError('shadow must be boolean');
  context(ctx);
  const scale = length / 560, raise = 24 * scale * lift, offset = (6 + 16 * lift) * scale;
  const body = PAINT[lead];
  const shape = (ox, oy, isShadow) => {
    ctx.save();
    try {
      ctx.translate(x + ox, y + oy); ctx.rotate(angle); ctx.scale(scale, scale);
      if (isShadow) {
        ctx.fillStyle = '#2a1a0a';
        polygon(ctx, [[0, 0], [52, -15], [560, -15], [560, 15], [52, 15]]);
        return;
      }
      ctx.fillStyle = '#e9c99a';
      polygon(ctx, [[8, -2.3], [52, -15], [52, 15], [8, 2.3]]);
      ctx.strokeStyle = 'rgba(120,80,40,.35)';
      ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(52, -5); ctx.moveTo(24, 5); ctx.lineTo(52, 5); ctx.stroke();
      ctx.fillStyle = lead === 'red' ? '#b3261e' : '#3a3633';
      polygon(ctx, [[0, 0], [12, -3.4], [12, 3.4]]);
      [[-15, -5, body[0]], [-5, 5, body[1]], [5, 15, body[2]]].forEach(([a, b, color]) => {
        ctx.fillStyle = color;
        polygon(ctx, [[52 - Math.abs(a) * .12, a], [52 - Math.abs(b) * .12, b], [510, b], [510, a]]);
      });
      ctx.fillStyle = '#b9b2a6'; ctx.fillRect(510, -15, 22, 30);
      ctx.strokeStyle = 'rgba(60,50,40,.35)'; ctx.beginPath();
      for (let s = 514; s < 532; s += 5) { ctx.moveTo(s, -15); ctx.lineTo(s, 15); }
      ctx.stroke();
      ctx.fillStyle = '#e59a9a'; ctx.beginPath(); ctx.moveTo(532, -15); ctx.lineTo(554, -15);
      ctx.quadraticCurveTo(562, 0, 554, 15); ctx.lineTo(532, 15); ctx.closePath(); ctx.fill();
    } finally { ctx.restore(); }
  };
  ctx.save();
  try {
    const alpha = ctx.globalAlpha;
    // Explicit material strokes, independent of caller dash/width. Transform,
    // alpha, clip and composite remain caller-owned; all modified state restores.
    ctx.lineWidth = 1; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.miterLimit = 10;
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    if (shadow) { ctx.globalAlpha = alpha * .16; shape(offset, offset, true); }
    ctx.globalAlpha = alpha; shape(0, -raise, false);
  } finally { ctx.restore(); }
  return Object.freeze({
    contact: Object.freeze({x, y}), visibleTip: Object.freeze({x, y: y - raise}),
    shadowTip: shadow ? Object.freeze({x: x + offset, y: y + offset}) : null,
    length, lift, lead, staticOnly: true,
  });
}
