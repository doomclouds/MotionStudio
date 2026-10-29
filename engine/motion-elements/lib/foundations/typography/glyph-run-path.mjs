/** Explicit glyph-cell layout over a compiled cubic path; no fonts, shaping or clock. */
import {object, number, id, freeze} from '../../validate.mjs';
import {sampleCubicPath} from '../geometry/cubic-path.mjs';

function glyphArray(value) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length < 1 || value.length > 256) {
    throw Error('Expected 1..256 ordinary glyph entries');
  }
  for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) throw Error('Sparse glyph entries');
  for (const key of Reflect.ownKeys(value)) {
    if (key !== 'length' && !(typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < value.length)) {
      throw Error('Unknown glyph array field');
    }
  }
  return value;
}

/**
 * Centers each caller-measured advance cell along the path, with explicit
 * inter-cell tracking and signed normal offset. The whole run must fit.
 */
export function layoutGlyphRunOnPath(plan, input) {
  // Brand-check before reading any plan metadata; no glyph can accept a forged plan.
  sampleCubicPath(plan, 0);
  object(input, ['glyphs', 'startDistance', 'tracking', 'normalOffset'], ['glyphs', 'startDistance', 'tracking', 'normalOffset']);
  const startDistance = number(input.startDistance, 0, plan.totalLength);
  const tracking = number(input.tracking, 0, 16384);
  const normalOffset = number(input.normalOffset, -16384, 16384);
  const ids = new Set();
  let span = 0;
  const cells = glyphArray(input.glyphs).map((glyph, index) => {
    object(glyph, ['glyphId', 'advance'], ['glyphId', 'advance']);
    const glyphId = id(glyph.glyphId), advance = number(glyph.advance, .001, 16384);
    if (ids.has(glyphId)) throw Error('Duplicate glyphId');
    ids.add(glyphId);
    if (index > 0) span += tracking;
    const center = span + advance / 2, end = span + advance;
    if (!Number.isFinite(end) || end <= span || center <= span || center >= end) throw Error('Numerically unrepresentable glyph cell');
    span = end;
    return {glyphId, advance, center};
  });
  // Subtraction is the canonical fit boundary; no epsilon, clamping or auto-fit.
  if (span > plan.totalLength - startDistance) throw Error('Glyph run exceeds path distance domain');
  const glyphs = cells.map(cell => {
    const distance = startDistance + cell.center;
    if (!Number.isFinite(distance) || distance < startDistance || distance > plan.totalLength) throw Error('Derived glyph distance out of range');
    const sample = sampleCubicPath(plan, distance / plan.totalLength);
    if (!sample.tangentDefined) throw Error(`Undefined path tangent at glyph ${cell.glyphId}`);
    const normal = {x: -sample.unitTangent.y, y: sample.unitTangent.x};
    const position = {x: sample.position.x + normalOffset * normal.x, y: sample.position.y + normalOffset * normal.y};
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) throw Error('Nonfinite glyph position');
    return {
      glyphId: cell.glyphId, advance: cell.advance, distance,
      position, pathPosition: {...sample.position}, normal,
      unitTangent: {...sample.unitTangent}, angle: sample.angle,
      segmentIndex: sample.segmentIndex, parameter: sample.parameter,
    };
  });
  return freeze({startDistance, endDistance: startDistance + span, span, tracking, normalOffset, glyphs});
}
