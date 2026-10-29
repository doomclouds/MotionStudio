/** Explicit piecewise scalar keyframes on the existing rational project clock. */
import {object, number, choice, bool, freeze} from './validate.mjs';
import {range, progress, time} from './time.mjs';
import {lerp} from './math.mjs';

function knots(values) {
  if (!Array.isArray(values) || values.length < 2 || values.length > 256) {
    throw Error('Expected 2..256 keyframes');
  }
  for (let i = 0; i < values.length; i++) {
    if (!Object.hasOwn(values, i)) throw Error('Sparse keyframe array');
  }
  for (const key of Reflect.ownKeys(values)) {
    if (key !== 'length' && !(typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < values.length)) {
      throw Error('Unknown keyframe array field');
    }
  }
  const result = values.map(knot => {
    object(knot, ['at', 'value', 'interpolation'], ['at', 'value', 'interpolation']);
    return {at: number(knot.at, 0, 1), value: number(knot.value), interpolation: choice(knot.interpolation, ['linear', 'hold'])};
  });
  if (result[0].at !== 0 || result.at(-1).at !== 1 || result.some((k, i) => i > 0 && k.at <= result[i - 1].at)) {
    throw Error('Keyframes must strictly increase and span 0..1');
  }
  return result;
}

// Interpret a normalized numeric knot by its canonical decimal string. Keep
// interval decisions exact even when converting project Time to float rounds up.
function decimalRatio(value) {
  const [mantissa, exponent = '0'] = String(value).split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  const power = Number(exponent) - fraction.length;
  const digits = BigInt(whole + fraction);
  return power >= 0 ? {n: digits * 10n ** BigInt(power), d: 1n}
    : {n: digits, d: 10n ** BigInt(-power)};
}

// Convert only after the local interval subtraction. Scaling the quotient avoids
// Infinity/Infinity for subnormal decimal knots while retaining Number precision.
function unitRatio(n, d) {
  if (n <= 0n) return 0;
  if (n >= d) return 1;
  const exponent = n.toString(2).length - d.toString(2).length;
  const shift = 55 - exponent;
  const quotient = Number((n << BigInt(shift)) / d);
  return quotient * 2 ** -Math.min(shift, 1022) * 2 ** -Math.max(0, shift - 1022);
}

/** At a knot, the outgoing interval wins. At end, return the last exact value. */
export function sampleKeyframeTrack(spec, at, context = {}) {
  object(spec, ['range', 'params'], ['range', 'params']);
  object(spec.params, ['knots'], ['knots']);
  object(context, ['reducedMotion']);
  const reduced = Object.hasOwn(context, 'reducedMotion') ? bool(context.reducedMotion) : false;
  const timing = range(spec.range), projectTime = time(at);
  const clock = progress(projectTime, timing), values = knots(spec.params.knots);
  const numerator = (BigInt(projectTime.n) * BigInt(timing.start.d) - BigInt(timing.start.n) * BigInt(projectTime.d)) * BigInt(timing.duration.d);
  const denominator = BigInt(projectTime.d) * BigInt(timing.start.d) * BigInt(timing.duration.n);
  const reached = knot => {
    if (reduced || clock.phase === 'after') return true;
    if (clock.phase === 'before') return false;
    const boundary = decimalRatio(knot.at);
    return numerator * boundary.d >= denominator * boundary.n;
  };
  let segment = 0;
  while (segment < values.length - 2 && reached(values[segment + 1])) segment++;
  const from = values[segment], to = values[segment + 1];
  const a = decimalRatio(from.at), b = decimalRatio(to.at);
  const fraction = unitRatio((numerator * a.d - a.n * denominator) * b.d,
    denominator * (b.n * a.d - a.n * b.d));
  const value = reduced || clock.phase === 'after' ? values.at(-1).value
    : from.interpolation === 'hold' ? from.value : lerp(from.value, to.value, fraction);
  return freeze({...clock, value, segment});
}
