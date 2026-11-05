// Original synthetic content consumers, not Launch Race scenes or action tables.
import {drawWoodenPencil} from '../index.mjs';
import {compilePolylineSections, extractPolylineSection} from '../../../../../motion-elements/lib/support/polyline-sections.mjs';

const path = points => compilePolylineSections({points: points.map(([x, y]) => ({x, y}))});
const route = path([[70, 330], [170, 330], [170, 240], [300, 240], [300, 130]]);
const triangle = path([[70, 330], [330, 330], [330, 120], [70, 330]]);

/** Two distinct semantic uses: transit route annotation / geometry construction. */
export function drawConsumer(ctx, kind, progress) {
  if (kind !== 'route' && kind !== 'triangle') throw new TypeError('kind must be route or triangle');
  if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new RangeError('progress must be finite in [0,1]');
  }
  const plan = kind === 'route' ? route : triangle;
  const section = extractPolylineSection(plan, {startDistance: 0, endDistance: plan.totalLength * progress});
  ctx.save();
  try {
    ctx.strokeStyle = '#3a3633'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
    if (!section.empty) {
      ctx.beginPath();
      section.vertices.forEach(({position: p}, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke();
    }
    if (kind === 'route') {
      // Three fixed stations, distinct from the progressively drawn route.
      ctx.fillStyle = '#f3ead6';
      for (const [x, y] of [[70, 330], [170, 240], [300, 130]]) {
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
    } else {
      // Only a right-angle square; unequal legs carry no equal-length ticks.
      ctx.beginPath(); ctx.moveTo(310, 330); ctx.lineTo(310, 310); ctx.lineTo(330, 310);
      ctx.stroke();
    }
  } finally { ctx.restore(); }
  // No pen for a zero-length reveal. The only position source is visible ink's end.
  const pencil = section.empty ? null : drawWoodenPencil(ctx, {
    ...section.vertices.at(-1).position, angle: -.5, length: 224, lead: 'blue', lift: 0,
  });
  return {kind, section, pencil};
}
