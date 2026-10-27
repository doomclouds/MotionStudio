export const fail = message => { throw new Error(message); };
export function object(value, allowed, required = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('Expected plain object');
  for (const key of Reflect.ownKeys(value)) if (!allowed.includes(key)) fail(`Unknown field: ${String(key)}`);
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`Missing field: ${String(key)}`);
  return value;
}
export function number(value, min = -1e9, max = 1e9) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(`Expected finite number in ${min}..${max}`);
  return value;
}
export function integer(value, min, max) { number(value, min, max); if (!Number.isSafeInteger(value)) fail('Expected safe integer'); return value; }
export function choice(value, options) { if (!options.includes(value)) fail(`Expected one of: ${options.join(', ')}`); return value; }
export function point(value) { object(value, ['x', 'y'], ['x', 'y']); return {x: number(value.x), y: number(value.y)}; }
export function bool(value) { if (typeof value !== 'boolean') fail('Expected boolean'); return value; }
export function id(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) fail('Invalid element instance ID'); return value; }
export const optional = (value, fallback) => value === undefined ? fallback : value;
export function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
