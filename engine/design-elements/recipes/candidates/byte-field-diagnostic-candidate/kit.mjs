import {assertField, copyFieldRGBA, sampleField} from './model.mjs';
import {record, number, ascii, color, def, freeze} from './input.mjs';
import {assertEnvironment} from './runtime.mjs';
export function createDiagnosticKit(api, env) {
  assertEnvironment(api, env);
  const measure = api.createCanvas(1, 1).getContext('2d');
  const normalize = (c, size) => { c.font = `${size}px ${env.sans}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.direction = 'ltr'; c.letterSpacing = '0px'; c.wordSpacing = '0px'; };
  function textPlan(value, x, baseline, size, width, height) {
    normalize(measure, size); const m = measure.measureText(value), bounds = {left: x - m.actualBoundingBoxLeft - 1, right: x + m.actualBoundingBoxRight + 1, top: baseline - m.actualBoundingBoxAscent - 1, bottom: baseline + m.actualBoundingBoxDescent + 1};
    if (!Object.values(bounds).every(Number.isFinite) || bounds.left < 0 || bounds.top < 0 || bounds.right > width || bounds.bottom > height) throw RangeError('text ink exceeds tile');
    return {value, x, baseline, size, bounds};
  }
  function tile(canvas, plan) {
    return Object.freeze({canvas, plan, width: plan.width, height: plan.height, place(ctx, x, y) {
      number(x, 'x', -1e6, 1e6); number(y, 'y', -1e6, 1e6);
      if (!ctx || typeof ctx.save !== 'function' || typeof ctx.restore !== 'function' || typeof ctx.drawImage !== 'function') throw TypeError('trusted context');
      ctx.save(); try { ctx.drawImage(canvas, x, y); } finally { ctx.restore(); }
    }});
  }
  function createFieldLayer(model) {
    assertField(model); const p = freeze({kind: 'scalar-field', width: model.width, height: model.height, mode: model.mode, phase: model.phase});
    const canvas = api.createCanvas(p.width, p.height), c = canvas.getContext('2d'); c.putImageData(new api.ImageData(copyFieldRGBA(model), p.width, p.height), 0, 0); return tile(canvas, p);
  }
  function planHistogram(model, input) {
    assertField(model); const p = record(input, ['width', 'height', 'accent', 'background'], 'histogram');
    const width = number(p.width, 'width', 200, 1400, true), height = number(p.height, 'height', 120, 700, true), accent = color(def(p.accent, '#1799d2')), background = color(def(p.background, '#303136'));
    const plot = {x: 42, y: 32, width: width - 57, height: height - 58}, peak = Math.max(...model.stats.bins);
    const labels = [textPlan('count / 32 bins', 9, 17, 12, width, height), textPlan(String(peak), 6, 31, 10, width, height), textPlan('0', plot.x, height - 7, 11, width, height), textPlan('255', width - 33, height - 7, 11, width, height)];
    const bars = model.stats.bins.map((count, i) => ({count, x: plot.x + i * plot.width / 32, y: plot.y + plot.height * (1 - count / peak), width: plot.width / 32 - .6, height: plot.height * count / peak}));
    return freeze({kind: 'histogram', width, height, accent, background, count: model.stats.count, plot, peak, labels, bars});
  }
  function createHistogram(model, input) {
    const p = planHistogram(model, input), canvas = api.createCanvas(p.width, p.height), c = canvas.getContext('2d'); c.fillStyle = p.background; c.fillRect(0, 0, p.width, p.height);
    c.fillStyle = '#555860'; c.fillRect(p.plot.x, p.plot.y, 1, p.plot.height); c.fillRect(p.plot.x, p.plot.y + p.plot.height, p.plot.width, 1);
    c.fillStyle = p.accent; for (const b of p.bars) c.fillRect(b.x, b.y, b.width, b.height);
    c.fillStyle = '#d8dbe1'; for (const t of p.labels) { normalize(c, t.size); c.fillText(t.value, t.x, t.baseline); } return tile(canvas, p);
  }
  function planSampleNote(model, input) {
    assertField(model); const p = record(input, ['x', 'y', 'width', 'title'], 'sample note'), sample = sampleField(model, p.x, p.y);
    const width = number(p.width, 'width', 260, 640, true), height = 108, title = ascii(def(p.title, 'Bounded CPU sample'), 'title', 40);
    const rows = [title, `Pixel (${sample.x}, ${sample.y}) : ${sample.value} / 255`, `Mode: ${model.mode}`, 'Synthetic data; no GPU execution'];
    const labels = rows.map((value, i) => textPlan(value, 9, 23 + i * 24, 15, width, height));
    return freeze({kind: 'sample-note', width, height, sample, labels});
  }
  function createSampleNote(model, input) {
    const p = planSampleNote(model, input), canvas = api.createCanvas(p.width, p.height), c = canvas.getContext('2d'); c.fillStyle = '#242424'; c.fillRect(0, 0, p.width, p.height); c.fillStyle = '#515151'; c.fillRect(4, 31, p.width - 8, 1); c.fillStyle = '#ededed';
    for (const t of p.labels) { normalize(c, t.size); c.fillText(t.value, t.x, t.baseline); } return tile(canvas, p);
  }
  return Object.freeze({createFieldLayer, planHistogram, createHistogram, planSampleNote, createSampleNote});
}
