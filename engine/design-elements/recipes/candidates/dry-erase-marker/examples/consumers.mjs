// Original synthetic content, not upstream scene code or a handwriting/physics engine.
import {drawDryEraseMarker} from '../index.mjs';
import {compilePolylineSections, extractPolylineSection} from '../../../../../motion-elements/lib/support/polyline-sections.mjs';

const triangle = compilePolylineSections({points: [{x: 66, y: 210}, {x: 212, y: 72}]});
const circuit = compilePolylineSections({points: [
  {x: 82, y: 190}, {x: 82, y: 74}, {x: 288, y: 74}, {x: 288, y: 190}, {x: 174, y: 190},
]});
function fraction(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw RangeError('fraction 0..1 required');
  return value;
}
function line(ctx, points) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
function active(ctx, plan, progress, lift, angle) {
  const section = extractPolylineSection(plan, {startDistance: 0, endDistance: plan.totalLength * progress});
  if (section.empty) return {section, marker: null};
  line(ctx, section.vertices.map(v => [v.position.x, v.position.y]));
  const contact = section.vertices.at(-1).position;
  const marker = drawDryEraseMarker(ctx, {...contact, angle, length: 128, ink: '#2a5cb3', lift});
  return {section, marker};
}
function frame(ctx, draw) {
  ctx.save();
  try {
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
    ctx.strokeStyle = '#334455'; ctx.fillStyle = '#ffffff';
    return draw();
  } finally { ctx.restore(); }
}

// First consumer: construct the diagonal of a right triangle from established orthogonal legs.
export function drawTriangleConstruction(ctx, progress, lift = 0) {
  fraction(progress); fraction(lift);
  return frame(ctx, () => {
    line(ctx, [[66, 210], [212, 210], [212, 72]]);
    line(ctx, [[198, 210], [198, 196], [212, 196]]);
    // Equal subdivision ticks on the base, authored diagram only.
    for (const x of [102.5, 139, 175.5]) line(ctx, [[x, 205], [x, 215]]);
    ctx.strokeStyle = '#2a5cb3';
    return active(ctx, triangle, progress, lift, -.28);
  });
}

// Second consumer: connect a battery to a lamp around a series-circuit schematic.
// Symbols/path are illustrative; no voltage, current, simulation or electrical advice.
export function drawSeriesCircuit(ctx, progress, lift = 0) {
  fraction(progress); fraction(lift);
  return frame(ctx, () => {
    // Battery at the lower gap; the circuit path grows separately and keeps every corner.
    line(ctx, [[82, 190], [124, 190]]); line(ctx, [[124, 171], [124, 209]]);
    line(ctx, [[142, 179], [142, 201]]); line(ctx, [[142, 190], [174, 190]]);
    ctx.strokeStyle = '#2a5cb3';
    const result = active(ctx, circuit, progress, lift, -.86);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#334455';
    ctx.beginPath(); ctx.arc(185, 74, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    line(ctx, [[172, 61], [198, 87]]); line(ctx, [[172, 87], [198, 61]]);
    return result;
  });
}
