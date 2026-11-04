/** Fixed 30° isometric camera; derived from LemoLab. See CREDITS.md and LICENSE*. */
const C30 = Math.cos(Math.PI / 6);
const WORLD = 1e9, SCREEN = 1e16, MIN_ZOOM = 1e-6, MAX_ZOOM = 1e6;

function number(value, min, max, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${label} must be a finite number in [${min}, ${max}]`);
  }
  return value;
}

// Inspect descriptors, never read input properties. Ordinary/null-prototype
// records only; proxies are not a supported security boundary (see README).
function record(value, keys, label) {
  if (value === null || typeof value !== 'object') throw new TypeError(`${label} must be a plain record`);
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) throw new TypeError(`${label} must be a plain record`);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const own = Reflect.ownKeys(descriptors);
  if (own.length !== keys.length || own.some(key => !keys.includes(key))) {
    throw new TypeError(`${label} has missing or unknown fields`);
  }
  const result = Object.create(null);
  for (const key of keys) {
    const d = descriptors[key];
    if (!d || !Object.hasOwn(d, 'value') || !d.enumerable) throw new TypeError(`${label}.${key} must be an enumerable data field`);
    result[key] = d.value;
  }
  return result;
}

/** Validate once per camera change. No DOM, drawing, timing or mutable inputs. */
export function createIsometricCamera(input) {
  const v = record(input, ['width', 'height', 'center', 'zoom'], 'camera');
  const c = record(v.center, ['x', 'y', 'z'], 'center');
  const width = number(v.width, 1e-6, 1e6, 'width');
  const height = number(v.height, 1e-6, 1e6, 'height');
  const x = number(c.x, -WORLD, WORLD, 'center.x');
  const y = number(c.y, -WORLD, WORLD, 'center.y');
  const z = number(c.z, -WORLD, WORLD, 'center.z');
  const zoom = number(v.zoom, MIN_ZOOM, MAX_ZOOM, 'zoom');
  const snapshot = Object.freeze({width, height, center: Object.freeze({x, y, z}), zoom});
  return Object.freeze({
    snapshot,
    project(px, py, pz) {
      number(px, -WORLD, WORLD, 'x');
      number(py, -WORLD, WORLD, 'y');
      number(pz, -WORLD, WORLD, 'z');
      const X = px - x, Y = py - y;
      return [width / 2 + (X - Y) * C30 * zoom,
        height / 2 + ((X + Y) * 0.5 - (pz - z)) * zoom];
    },
    unproject(sx, sy, planeZ = 0) {
      number(sx, -SCREEN, SCREEN, 'screen.x');
      number(sy, -SCREEN, SCREEN, 'screen.y');
      number(planeZ, -WORLD, WORLD, 'planeZ');
      const u = (sx - width / 2) / (C30 * zoom);
      const v = (sy - height / 2) / zoom + (planeZ - z);
      return [v + u / 2 + x, v - u / 2 + y];
    },
  });
}

/** Constant ratio change for equal progress steps; easing belongs to caller. */
export function logZoom(from, to, progress) {
  number(from, MIN_ZOOM, MAX_ZOOM, 'from');
  number(to, MIN_ZOOM, MAX_ZOOM, 'to');
  number(progress, 0, 1, 'progress');
  if (progress === 0 || from === to) return from;
  if (progress === 1) return to;
  return Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * progress);
}
