export function record(value, keys, name) {
  if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw TypeError(`${name}: plain record required`);
  const out = Object.create(null);
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!keys.includes(key) || !Object.hasOwn(descriptor, 'value')) throw TypeError(`${name}: unknown key or accessor`);
    out[key] = descriptor.value;
  }
  if (Object.getOwnPropertySymbols(value).length) throw TypeError(`${name}: symbol key`);
  return out;
}
export function number(value, name, low, high, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high || (integer && !Number.isInteger(value))) throw RangeError(name);
  return value;
}
export function ascii(value, name, max = 40) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || !/^[\x20-\x7e]+$/.test(value)) throw TypeError(`${name}: printable nonblank ASCII`);
  return value;
}
export function color(value) { if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) throw TypeError('six-digit hex color'); return value.toLowerCase(); }
export const def = (x, fallback) => x === undefined ? fallback : x;
export function freeze(value) { if (value && typeof value === 'object') { for (const x of Object.values(value)) freeze(x); Object.freeze(value); } return value; }
