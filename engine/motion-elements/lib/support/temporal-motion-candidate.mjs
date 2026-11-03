/** Original, bounded position-history sampler. Unregistered research candidate. */
function record(value, keys, label) {
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${label}: plain record required`);
  const own = Reflect.ownKeys(value);
  if (own.length !== keys.length || own.some(key => !keys.includes(key))) throw new TypeError(`${label}: exact fields required`);
  for (const key of keys) if (!Object.hasOwn(value, key) || !('value' in Object.getOwnPropertyDescriptor(value, key))) throw new TypeError(`${label}: data fields required`);
  return value;
}
function number(value, lo, hi, label) {
  if (!Number.isFinite(value) || value < lo || value > hi) throw new RangeError(`${label}: finite number in [${lo}, ${hi}] required`);
  return value;
}
/** Number seconds; samplePosition is caller-owned, pure absolute-time data. */
export function sampleTemporalMotion(input) {
  record(input, ['time', 'history', 'samples', 'velocityStep', 'samplePosition'], 'input');
  const {time, history, samples, velocityStep, samplePosition} = input;
  number(time, 0, 3600, 'time');
  number(history, 1e-6, 10, 'history');
  number(samples, 2, 32, 'samples');
  if (!Number.isInteger(samples)) throw new RangeError('samples: integer required');
  number(velocityStep, 1e-6, 1, 'velocityStep');
  if (typeof samplePosition !== 'function') throw new TypeError('samplePosition: function required');
  // Resource/parameter checks above precede callbacks. Copy immediately so a provider
  // may reuse a scratch point; no caller-owned object survives in the output.
  const cache = new Map();
  function at(t) {
    if (!cache.has(t)) {
      const p = record(samplePosition(t), ['x', 'y'], 'position');
      const x = number(p.x, -1e6, 1e6, 'position.x');
      const y = number(p.y, -1e6, 1e6, 'position.y');
      cache.set(t, Object.freeze({time: t, x, y}));
    }
    return cache.get(t);
  }
  const points = Array.from({length: samples}, (_, i) => at(Math.max(0, time - history * i / (samples - 1))));
  const head = points[0], previous = at(Math.max(0, time - velocityStep));
  const dt = time - previous.time;
  const vx = dt === 0 ? 0 : (head.x - previous.x) / dt;
  const vy = dt === 0 ? 0 : (head.y - previous.y) / dt;
  const speed = Math.hypot(vx, vy);
  if (![vx, vy, speed].every(Number.isFinite)) throw new RangeError('derived velocity must be finite; interval is too small for position change');
  return Object.freeze({
    points: Object.freeze(points),
    velocity: Object.freeze({x: vx, y: vy, speed, angle: speed === 0 ? 0 : Math.atan2(vy, vx), interval: dt}),
    evaluations: cache.size,
  });
}
