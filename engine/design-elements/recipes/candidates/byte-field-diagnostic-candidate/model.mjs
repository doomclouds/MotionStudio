import {record, number, def, freeze} from './input.mjs';
const models = new WeakMap();
/** Original CPU scalar field. No shader, mesh, projection or external input. */
export function buildScalarField(input) {
  const p = record(input, ['width', 'height', 'mode', 'phase'], 'scalar field');
  const width = number(p.width, 'width', 32, 1600, true), height = number(p.height, 'height', 32, 1000, true);
  const mode = def(p.mode, 'split-ramp'), phase = number(def(p.phase, 0), 'phase', 0, Math.PI * 2);
  if (mode !== 'split-ramp' && mode !== 'wave') throw TypeError('known primitive mode');
  if (mode === 'split-ramp' && phase !== 0) throw RangeError('split-ramp phase must be zero');
  const gray = new Uint8Array(width * height), bins = Array(32).fill(0);
  let sum = 0, low = 255, high = 0, zero = 0, white = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = x / (width - 1), v = y / (height - 1);
    const raw = mode === 'split-ramp' ? (u < .5 ? .12 + 1.1 * u : 1) : .5 + .3 * Math.sin(2 * Math.PI * (2 * u + v) + phase) + .17 * Math.cos(2 * Math.PI * (u - 2 * v) - phase);
    const value = Math.round(255 * Math.max(0, Math.min(1, raw)));
    gray[y * width + x] = value; bins[value >> 3]++; sum += value;
    low = Math.min(low, value); high = Math.max(high, value); zero += value === 0; white += value === 255;
  }
  const model = freeze({width, height, mode, phase, quantization: 'round(clamp(value,0,1)*255)', stats: {count: gray.length, sum, min: low, max: high, mean: sum / gray.length, zero, white, bins}});
  models.set(model, gray); return model;
}
export function assertField(model) { if (!models.has(model)) throw TypeError('owned scalar field model'); }
export function sampleField(model, x, y) {
  assertField(model); number(x, 'sample x', 0, model.width - 1, true); number(y, 'sample y', 0, model.height - 1, true);
  const value = models.get(model)[y * model.width + x]; return freeze({x, y, value, normalized: value / 255});
}
export function copyFieldRGBA(model) {
  assertField(model); const gray = models.get(model), result = new Uint8ClampedArray(gray.length * 4);
  for (let i = 0; i < gray.length; i++) { result[i * 4] = result[i * 4 + 1] = result[i * 4 + 2] = gray[i]; result[i * 4 + 3] = 255; }
  return result;
}
