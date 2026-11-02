/** Candidate: orthographic front-hemisphere projection of spherical Gaussian splats.
 * Original analytic scalar field; NOT volumetric rendering, PBR, fluid simulation,
 * physical lighting, or the shader of any reference video. Angles are caller-owned.
 */
import {number, integer} from '../../validate.mjs';
const plans = new WeakMap();
function record(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw Error('plain data object required');
  const copy = {};
  for (const key of Reflect.ownKeys(value)) {
    if (!keys.includes(key)) throw Error('unknown field');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!Object.hasOwn(descriptor, 'value')) throw Error('accessors unsupported');
    copy[key] = descriptor.value;
  }
  for (const key of keys) if (!Object.hasOwn(copy, key)) throw Error(`missing ${key}`);
  return copy;
}
/** direction is normalized at compile; sigma is chord-space spread, not pixels. */
export function compileSphericalSplats(input) {
  const {lobes} = record(input, ['lobes']);
  if (!Array.isArray(lobes) || Object.getPrototypeOf(lobes) !== Array.prototype || lobes.length > 32) throw Error('0..32 lobes required');
  for (const key of Reflect.ownKeys(lobes)) {
    if (key === 'length') continue;
    if (!/^(0|[1-9][0-9]*)$/.test(String(key)) || Number(key) >= lobes.length ||
        !Object.hasOwn(Object.getOwnPropertyDescriptor(lobes, key), 'value')) throw Error('dense data array required');
  }
  const compiled = [];
  for (let i = 0; i < lobes.length; i++) {
    if (!Object.hasOwn(lobes, i)) throw Error('sparse lobes');
    const lobe = record(lobes[i], ['direction', 'sigma', 'strength']);
    const direction = record(lobe.direction, ['x', 'y', 'z']);
    const x = number(direction.x, -1e4, 1e4), y = number(direction.y, -1e4, 1e4), z = number(direction.z, -1e4, 1e4);
    const size = Math.hypot(x, y, z);
    if (size < 1e-8) throw Error('nonzero direction required');
    const sigma = number(lobe.sigma, .03, 2), strength = number(lobe.strength, 0, 8);
    compiled.push({x:x/size, y:y/size, z:z/size, inverseVariance:1/(sigma*sigma), strength});
  }
  const plan = Object.freeze({lobeCount:compiled.length});
  plans.set(plan, compiled);
  return plan;
}
/** Output arrays are fresh owned copies. Screen y is down, z points at viewer.
 * Inverse yaw then inverse pitch samples the field on the unit hemisphere.
 * Coverage is a one-pixel radial linear feather, not exact area integration.
 */
export function sampleSphericalSplats(plan, input) {
  const lobes = plans.get(plan);
  if (!lobes) throw Error('compiled spherical splat plan required');
  const p = record(input, ['width', 'height', 'yaw', 'pitch']);
  const width = integer(p.width, 1, 512), height = integer(p.height, 1, 512);
  const yaw = number(p.yaw, -1e4, 1e4), pitch = number(p.pitch, -1e4, 1e4);
  if (width * height * Math.max(1, lobes.length) > 4194304) throw Error('field evaluation budget exceeded');
  const density = new Float64Array(width*height), coverage = new Float64Array(width*height);
  const scale = Math.min(width, height)/2, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    const i = row*width+column;
    let x = (column+.5-width/2)/scale, y = (row+.5-height/2)/scale;
    const radius = Math.hypot(x, y);
    const alpha = Math.min(1, Math.max(0, .5+(1-radius)*scale));
    coverage[i] = alpha;
    if (alpha === 0) continue;
    // Feather samples outside the ideal disk are projected back to its rim.
    if (radius > 1) { x /= radius; y /= radius; }
    const z = Math.sqrt(Math.max(0, 1-x*x-y*y));
    const rx = cy*x-sy*z, rz = sy*x+cy*z;
    const ry = cp*y+sp*rz, zz = -sp*y+cp*rz;
    let sum = 0;
    for (const l of lobes) {
      const dot = Math.min(1, Math.max(-1, rx*l.x+ry*l.y+zz*l.z));
      sum += l.strength*Math.exp((dot-1)*l.inverseVariance);
    }
    density[i] = -Math.expm1(-sum);
  }
  return {width, height, density, coverage};
}
