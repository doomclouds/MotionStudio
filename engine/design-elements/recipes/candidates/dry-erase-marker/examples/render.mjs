// Caller-run static evidence only; no fonts, network, installation or upstream source loading.
import {writeFile, realpath, stat} from 'node:fs/promises';
import {dirname, isAbsolute, resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadNativeCanvas} from '../../../../../motion-render-core/lib/native.mjs';
import {drawDryEraseMarker} from '../index.mjs';
import {drawTriangleConstruction, drawSeriesCircuit} from './consumers.mjs';

const requested = process.argv[2];
if (!requested || !isAbsolute(requested)) throw Error('provide an absolute external output directory');
const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../..'));
const output = await realpath(requested), rel = relative(root, output);
if (rel === '' || (!rel.startsWith('..' + '/') && rel !== '..' && !isAbsolute(rel))) {
  throw Error('generated evidence must stay outside the source tree');
}
if (!(await stat(output)).isDirectory()) throw Error('output must be an existing directory');
const {api, version} = loadNativeCanvas();
for (const [name, draw, progress] of [
  ['triangle-construction', drawTriangleConstruction, .72],
  ['series-circuit', drawSeriesCircuit, .72],
]) {
  const c = api.createCanvas(480, 280), g = c.getContext('2d');
  g.fillStyle = '#f8fafb'; g.fillRect(0, 0, 480, 280); draw(g, progress);
  await writeFile(resolve(output, name + '.png'), c.toBuffer('image/png'));
}
const c = api.createCanvas(640, 320), g = c.getContext('2d');
g.fillStyle = '#f8fafb'; g.fillRect(0, 0, 640, 320);
for (const [x, y, angle, length, lift, ink] of [
  [45, 135, -.28, 280, 0, '#2a5cb3'], [355, 135, -.28, 220, 1, '#c8413a'],
  [45, 265, -.28, 128, 0, '#23262c'], [245, 265, -.28, 128, .5, '#2e7a4d'],
]) drawDryEraseMarker(g, {x, y, angle, length, lift, ink});
await writeFile(resolve(output, 'dry-erase-marker-specimen.png'), c.toBuffer('image/png'));
console.log(JSON.stringify({node: process.version, canvas: version, output, files: [
  'triangle-construction.png', 'series-circuit.png', 'dry-erase-marker-specimen.png',
]}));
