/*
 * Normalized umbrella geometry adapted from LemoLab's Pictogram Motion engine.js.
 * Copyright (c) 2026 LemoLab; modifications Copyright (c) 2026 MotionStudio contributors.
 * MIT. See LICENSE and LICENSE-LemoLab.txt. No Canvas, fonts, scene or timing dependency.
 */
const freezePoint = (x, y) => Object.freeze([x, y]);
const lerp = (a, b, t) => a + (b - a) * t;

/** Fixed-cost, immutable local geometry; caller provides paint and transforms. */
export function sampleUmbrellaPictogram(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Expected a plain options object.');
  }
  const proto = Object.getPrototypeOf(input);
  if (proto !== Object.prototype && proto !== null) throw new TypeError('Expected a plain options object.');
  if (Reflect.ownKeys(input).some(key => key !== 'openness')) throw new TypeError('Unknown option.');
  const openness = Object.hasOwn(input, 'openness') ? input.openness : 1;
  if (typeof openness !== 'number' || !Number.isFinite(openness)) throw new TypeError('openness must be finite.');
  if (openness < 0 || openness > 1.15) throw new RangeError('openness must be in [0, 1.15].');
  const capped = Math.min(openness, 1);
  const width = lerp(0.15, 1, openness);
  const height = lerp(1.12, 0.62, capped);
  const rimY = lerp(0.52, 0, capped);
  const scallopDepth = 0.03 + 0.11 * capped;
  const upper = [];
  for (let i = 0; i <= 28; i++) {
    const angle = Math.PI + (i / 28) * Math.PI;
    upper.push(freezePoint(width * Math.cos(angle), rimY + height * Math.sin(angle)));
  }
  const hem = [];
  for (let k = 0; k < 4; k++) {
    const xa = width * (1 - k * 0.5), xb = width * (1 - (k + 1) * 0.5);
    hem.push(Object.freeze({ control: freezePoint((xa + xb) / 2, rimY - scallopDepth * 2), end: freezePoint(xb, rimY) }));
  }
  const shaftEnd = lerp(0.98, 0.95, openness);
  return Object.freeze({
    openness, width, height, rimY, scallopDepth,
    canopy: Object.freeze({ upper: Object.freeze(upper), hem: Object.freeze(hem), closed: true }),
    gore: Object.freeze({ center: freezePoint(0, rimY), radiusX: width * 0.36, radiusY: height, rotation: 0, startAngle: Math.PI, endAngle: 0, anticlockwise: false, closed: true }),
    shaft: Object.freeze({ start: freezePoint(0, -height + rimY - 0.16), end: freezePoint(0, shaftEnd), width: 0.058 }),
    handle: Object.freeze({ center: freezePoint(-0.13, shaftEnd), radius: 0.13, startAngle: 0, endAngle: Math.PI, anticlockwise: false, width: 0.062 }),
    ferrule: Object.freeze({ start: freezePoint(0, rimY - height - 0.02), end: freezePoint(0, rimY - height - 0.14), width: 0.05 }),
    lineCap: 'round'
  });
}
