/** Screen-space resampling and line boil, derived from LemoLab. See CREDITS.md and LICENSE*. */
const STEP = 7, NOISE_SCALE = 38;
const MAX_POINTS = 65536, MAX_SAMPLES = 262144;
const POINT_BOUND = 1e9, MATRIX_BOUND = 1e6;
const IDENTITY = Object.freeze([1, 0, 0, 1, 0, 0]);
const FIELDS = ['points', 'matrix', 'closed', 'amplitude', 'seed'];

function number(value, min, max, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${label} must be a finite number in [${min}, ${max}]`);
  }
  return value;
}

function options(value) {
  if (value === null || typeof value !== 'object') throw new TypeError('options must be a plain record');
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) throw new TypeError('options must be a plain record');
  const result = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    if (!FIELDS.includes(key)) throw new TypeError('options has an unknown field');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
      throw new TypeError(`options.${key} must be an enumerable data field`);
    }
    result[key] = descriptor.value;
  }
  if (!Object.hasOwn(result, 'points')) throw new TypeError('points is required');
  return result;
}

// Reject sparse arrays, subclasses, added keys and accessors without reading getters.
// Proxies/altered built-ins are not a supported security boundary.
function array(value, min, max, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be an ordinary array`);
  }
  const length = Object.getOwnPropertyDescriptor(value, 'length').value;
  if (length < min || length > max) throw new RangeError(`${label} requires ${min}..${max} entries`);
  const keys = Reflect.ownKeys(value);
  if (keys.length !== length + 1) throw new TypeError(`${label} must be dense without added fields`);
  const result = new Array(length);
  for (let i = 0; i < length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) {
      throw new TypeError(`${label}[${i}] must be an enumerable data entry`);
    }
    result[i] = descriptor.value;
  }
  return result;
}

const lerp = (a, b, t) => a + (b - a) * t;
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const vnoise = x => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i), hash(i + 1), u);
};

/** Pure absolute-state sample. Returns fresh screen-coordinate [x,y] pairs. */
export function sampleScreenInkPath(input) {
  const o = options(input);
  const matrix = Object.hasOwn(o, 'matrix') ? array(o.matrix, 6, 6, 'matrix') : IDENTITY;
  matrix.forEach((v, i) => number(v, -MATRIX_BOUND, MATRIX_BOUND, `matrix[${i}]`));
  const closed = Object.hasOwn(o, 'closed') ? o.closed : true;
  if (typeof closed !== 'boolean') throw new TypeError('closed must be a boolean');
  const amplitude = number(Object.hasOwn(o, 'amplitude') ? o.amplitude : 1.2, 0, 1e6, 'amplitude');
  const seed = number(Object.hasOwn(o, 'seed') ? o.seed : 0, -1e6, 1e6, 'seed');
  const points = array(o.points, 1, MAX_POINTS, 'points');
  const screen = points.map((value, i) => {
    const p = array(value, 2, 2, `points[${i}]`);
    const x = number(p[0], -POINT_BOUND, POINT_BOUND, `points[${i}][0]`);
    const y = number(p[1], -POINT_BOUND, POINT_BOUND, `points[${i}][1]`);
    return [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]];
  });

  const sampled = [];
  const append = (x, y) => {
    if (sampled.length >= MAX_SAMPLES) throw new RangeError(`path exceeds ${MAX_SAMPLES} output samples`);
    sampled.push([x, y]);
  };
  append(screen[0][0], screen[0][1]);
  let acc = 0;
  const edges = closed ? screen.length : screen.length - 1;
  for (let i = 0; i < edges; i++) {
    const a = screen[i], b = screen[(i + 1) % screen.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // A single edge this long cannot fit, even before counting the other edges.
    if (d > MAX_SAMPLES * STEP) throw new RangeError(`path exceeds ${MAX_SAMPLES} output samples`);
    let pos = STEP - acc;
    while (pos < d) {
      const u = pos / d;
      append(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u);
      pos += STEP;
    }
    acc = d - (pos - STEP);
  }
  if (!closed) append(screen[screen.length - 1][0], screen[screen.length - 1][1]);
  if (amplitude <= 0 || sampled.length < 3) return sampled;

  const n = sampled.length, L = n * STEP, out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = sampled[(i - 1 + n) % n], b = sampled[(i + 1) % n], p = sampled[i];
    const ia = closed ? a : sampled[Math.max(0, i - 1)];
    const ib = closed ? b : sampled[Math.min(n - 1, i + 1)];
    let nx = -(ib[1] - ia[1]), ny = ib[0] - ia[0];
    const length = Math.hypot(nx, ny) || 1;
    nx /= length; ny /= length;
    const x = i * STEP / NOISE_SCALE;
    let v = vnoise(x + seed) * 2 - 1;
    if (closed) v = lerp(v, vnoise(x - L / NOISE_SCALE + seed) * 2 - 1, i / n);
    const v2 = vnoise(x * 2.3 + seed * 1.7 + 50) * 2 - 1;
    const displacement = (v * .8 + v2 * .35) * amplitude;
    out[i] = [p[0] + nx * displacement, p[1] + ny * displacement];
  }
  return out;
}
