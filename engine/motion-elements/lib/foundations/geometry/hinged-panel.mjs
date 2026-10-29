/** Rigid convex planar hinge in authored XYZ. Projection, time and drawing are caller-owned. */
const plans = new WeakSet(), states = new WeakMap();
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
function object(value, allowed, required = allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype) throw Error('plain object required');
  for (const key of Reflect.ownKeys(value)) if (!allowed.includes(key)) throw Error(`unknown field ${String(key)}`);
  for (const key of required) if (!Object.hasOwn(value, key)) throw Error(`missing ${key}`);
}
function verticesArray(values) {
  if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype ||
      values.length < 3 || values.length > 64) throw Error('3..64 vertices in an ordinary same-realm array');
  for (let i = 0; i < values.length; i++) if (!Object.hasOwn(values, i)) throw Error('sparse vertices');
  for (const key of Reflect.ownKeys(values)) {
    if (key !== 'length' && !(typeof key === 'string' && /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < values.length)) {
      throw Error('unknown vertices array field');
    }
  }
  return values;
}
const number = (value, max = 1e4) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > max) throw Error('bounded finite number required');
  return value;
};
const point = p => { object(p, ['x', 'y', 'z']); return {x: number(p.x), y: number(p.y), z: number(p.z)}; };
const sub = (a, b) => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
const cross = (a, b) => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const length = a => Math.hypot(a.x, a.y, a.z);
const unit = a => {
  const size = length(a);
  if (size < 1e-8) throw Error('degenerate vector');
  return {x: a.x / size, y: a.y / size, z: a.z / size};
};
const transform = (m, p, vector = false) => ({
  x: m[0] * p.x + m[1] * p.y + m[2] * p.z + (vector ? 0 : m[3]),
  y: m[4] * p.x + m[5] * p.y + m[6] * p.z + (vector ? 0 : m[7]),
  z: m[8] * p.x + m[9] * p.y + m[10] * p.z + (vector ? 0 : m[11]),
});
function multiply(a, b) {
  const m = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) m[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c];
    m[r * 4 + 3] = a[r * 4] * b[3] + a[r * 4 + 1] * b[7] + a[r * 4 + 2] * b[11] + a[r * 4 + 3];
  }
  return m;
}

export function compileHingedPanel(spec) {
  object(spec, ['vertices', 'hinge']);
  const vertices = verticesArray(spec.vertices).map(point);
  object(spec.hinge, ['from', 'to']);
  const from = point(spec.hinge.from), to = point(spec.hinge.to), axis = unit(sub(to, from));
  const normal = unit(cross(sub(vertices[1], vertices[0]), sub(vertices[2], vertices[0])));
  const scale = Math.max(1, ...vertices.map(p => length(sub(p, vertices[0])))), tolerance = scale * 1e-9;
  for (const p of [...vertices, from, to]) {
    if (Math.abs(dot(sub(p, vertices[0]), normal)) > tolerance) throw Error('vertices and hinge must share a plane');
  }
  // Every non-edge vertex must be strictly inside every directed edge half-space.
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length], edge = sub(b, a);
    if (length(edge) < 1e-8) throw Error('duplicate vertices');
    for (let j = 0; j < vertices.length; j++) {
      if (j === i || j === (i + 1) % vertices.length) continue;
      if (dot(cross(edge, sub(vertices[j], a)), normal) <= tolerance * length(edge)) throw Error('strictly convex ordered vertices required');
    }
  }
  const centroid = {x: 0, y: 0, z: 0};
  for (const p of vertices) for (const k of ['x', 'y', 'z']) centroid[k] += p[k] / vertices.length;
  const plan = freeze({vertices, hinge: {from, to}, axis, normal, centroid, tolerance});
  plans.add(plan);
  return plan;
}

export function sampleHingedPanel(plan, options) {
  if (!plans.has(plan)) throw Error('compiled plan required from this module');
  object(options, ['angle', 'parent'], ['angle']);
  const angle = number(options.angle, Math.PI * 2), parent = Object.hasOwn(options, 'parent') ? options.parent : undefined;
  if (Object.hasOwn(options, 'parent') && !states.has(parent)) throw Error('parent must be a sampled state from this module');
  const depth = parent ? states.get(parent) + 1 : 1;
  if (depth > 128) throw Error('maximum 128 sampled hierarchy levels');
  const {x, y, z} = plan.axis, c = Math.cos(angle), s = Math.sin(angle), u = 1 - c;
  let matrix = [
    c + x * x * u, x * y * u - z * s, x * z * u + y * s, 0,
    y * x * u + z * s, c + y * y * u, y * z * u - x * s, 0,
    z * x * u - y * s, z * y * u + x * s, c + z * z * u, 0,
  ];
  const a = plan.hinge.from, r = transform(matrix, a);
  matrix[3] = a.x - r.x;
  matrix[7] = a.y - r.y;
  matrix[11] = a.z - r.z;
  if (parent) matrix = multiply(parent.matrix, matrix);
  const state = freeze({
    angle, matrix, vertices: plan.vertices.map(p => transform(matrix, p)),
    normal: transform(matrix, plan.normal, true), centroid: transform(matrix, plan.centroid),
    hinge: {from: transform(matrix, plan.hinge.from), to: transform(matrix, plan.hinge.to)},
  });
  states.set(state, depth);
  return state;
}

/** Uncounted point helper: the same sampled matrix, not another geometry mechanism. */
export function transformHingedPoint(state, p) {
  if (!states.has(state)) throw Error('sampled state required from this module');
  return freeze(transform(state.matrix, point(p)));
}
