// Dry-erase marker geometry/shading adapted from LemoLab lemo-opuscar wb.js.
// Copyright (c) 2026 LemoLab. MIT: see LICENSE-LemoLab.txt and CREDITS.md.
// Bounded caller-local adapter, validation and geometry reports: repository MIT.
const keys = ['x', 'y', 'angle', 'length', 'ink', 'lift', 'shadow'];
function record(value) {
  if (!value || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw TypeError('plain or null-prototype input record required');
  }
  for (const key of Reflect.ownKeys(value)) {
    if (!keys.includes(key) || !Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value')) {
      throw TypeError('only known own data fields are supported');
    }
  }
  for (const key of ['x', 'y']) if (!Object.hasOwn(value, key)) throw TypeError('missing ' + key);
}
function number(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw RangeError('finite bounded number required');
  }
  return value === 0 ? 0 : value;
}
function option(input, key, fallback) { return Object.hasOwn(input, key) ? input[key] : fallback; }
function context(ctx) {
  for (const key of ['save', 'restore', 'translate', 'transform', 'rotate', 'scale', 'beginPath',
    'moveTo', 'lineTo', 'quadraticCurveTo', 'closePath', 'roundRect', 'fill', 'fillRect', 'createLinearGradient']) {
    if (typeof ctx?.[key] !== 'function') throw TypeError('Canvas 2D context required');
  }
}
function rounded(ctx, x, y, width, height, radius) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
}

/** One deterministic 2D shaded icon. No camera, clock, ink drawing or implicit pen motion. */
export function drawDryEraseMarker(ctx, input) {
  record(input);
  const x = number(input.x, -1e6, 1e6), y = number(input.y, -1e6, 1e6);
  const angle = number(option(input, 'angle', -.95), -2 * Math.PI, 2 * Math.PI);
  const length = number(option(input, 'length', 120), 24, 430);
  const lift = number(option(input, 'lift', 0), 0, 1);
  const ink = option(input, 'ink', '#2a5cb3'), shadow = option(input, 'shadow', true);
  if (typeof ink !== 'string' || !/^#[0-9a-f]{6}$/i.test(ink)) throw TypeError('ink must be #RRGGBB');
  if (typeof shadow !== 'boolean') throw TypeError('shadow must be boolean');
  context(ctx);
  const s = length / 430, up = lift * 26 * s, ca = Math.cos(angle), sa = Math.sin(angle);
  const bodyX = x - up * .15, bodyY = y - up;
  const [r, g, b] = [1, 3, 5].map(i => parseInt(ink.slice(i, i + 2), 16));
  ctx.save();
  try {
    const alpha = ctx.globalAlpha;
    // The icon owns its filters/shadows but retains caller transform, clip, alpha and composite.
    ctx.filter = 'none'; ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    if (shadow) {
      ctx.save();
      try {
        // Bounded positive ordinary decimal syntax, never exponent notation.
        ctx.filter = `blur(${((6 + lift * 10) * s).toFixed(6)}px)`;
        ctx.fillStyle = `rgba(40,40,50,${.26 - lift * .08})`;
        ctx.globalAlpha = alpha;
        ctx.translate(x + up * .9 + 6 * s, y + up * 1.2 + 8 * s);
        ctx.transform(ca * 1.06, sa * .85 + .22, -sa, ca, 0, 0);
        rounded(ctx, 4 * s, -length * .06, length, length * .12, length * .05);
      } finally { ctx.restore(); }
    }
    ctx.translate(bodyX, bodyY); ctx.rotate(angle); ctx.scale(s, s);
    // Felt bullet. Its most forward axial point is (-5, 0), NOT the nominal (0, 0) anchor.
    ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(-2, -5);
    ctx.quadraticCurveTo(-8, 0, -2, 5); ctx.lineTo(20, 9); ctx.lineTo(20, -9); ctx.closePath(); ctx.fill();
    const collar = ctx.createLinearGradient(0, -22, 0, 22);
    collar.addColorStop(0, '#dfe2e6'); collar.addColorStop(.35, '#ffffff'); collar.addColorStop(1, '#8b9099');
    ctx.fillStyle = collar; ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(50, -24);
    ctx.lineTo(50, 24); ctx.lineTo(20, 10); ctx.closePath(); ctx.fill();
    const barrel = ctx.createLinearGradient(0, -26, 0, 26);
    barrel.addColorStop(0, '#e6e8eb'); barrel.addColorStop(.3, '#ffffff');
    barrel.addColorStop(.62, '#e9ebee'); barrel.addColorStop(1, '#9ea3ab');
    ctx.fillStyle = barrel; rounded(ctx, 48, -26, 300, 52, 6);
    const band = ctx.createLinearGradient(0, -26, 0, 26);
    band.addColorStop(0, `rgb(${r * .8 | 0},${g * .8 | 0},${b * .8 | 0})`);
    band.addColorStop(.3, `rgb(${Math.min(255, r * 1.25) | 0},${Math.min(255, g * 1.25) | 0},${Math.min(255, b * 1.25) | 0})`);
    band.addColorStop(1, `rgb(${r * .55 | 0},${g * .55 | 0},${b * .55 | 0})`);
    ctx.fillStyle = band; ctx.fillRect(150, -26, 110, 52);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(166, -6, 78, 5); ctx.fillRect(166, 4, 50, 3);
    ctx.fillStyle = band; rounded(ctx, 338, -29, 92, 58, 12);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(338, -29, 6, 58);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(350, -22, 70, 6);
  } finally { ctx.restore(); }
  return Object.freeze({
    contact: Object.freeze({x, y}),
    bodyAnchor: Object.freeze({x: bodyX, y: bodyY}),
    feltFront: Object.freeze({x: bodyX - 5 * s * ca, y: bodyY - 5 * s * sa}),
    length, lift, staticOnly: true,
  });
}
