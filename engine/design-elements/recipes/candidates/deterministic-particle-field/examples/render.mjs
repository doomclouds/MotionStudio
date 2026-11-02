// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadCanvas, newOutput} from '../runtime.mjs';
import {examples, scheduleBoard, routeDiagram} from './compositions.mjs';
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--output') throw Error('usage: node examples/render.mjs --output ABSOLUTE_NEW_EXTERNAL_DIR');
const output = newOutput(args[1]); // Fail before runtime loading, painting or writing.
const api = loadCanvas();
const images = [scheduleBoard(api), routeDiagram(api)].map(canvas => canvas.toBuffer('image/png'));
fs.mkdirSync(output); // Exclusive create: concurrent existing paths and symlinks cannot win silently.
const records = images.map((bytes, i) => {
  const file = examples[i].id + '.png';
  fs.writeFileSync(path.join(output, file), bytes, {flag: 'wx'});
  return {...examples[i], file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
});
fs.writeFileSync(path.join(output, 'rendered.json'), JSON.stringify({renderer: '@napi-rs/canvas@0.1.100', fonts: 0,
  data: 'fictional, decorative, not measured', staticOnly: true, images: records}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(records));
