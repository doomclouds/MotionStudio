// SPDX-License-Identifier: Apache-2.0
// Node-only test/example adapter, not imported by the portable field module.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '../../../..');
const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep);
export function loadCanvas() {
  const root = process.env.PARTICLE_RUNTIME;
  if (typeof root !== 'string' || !path.isAbsolute(root)) throw Error('PARTICLE_RUNTIME: absolute external runtime required');
  const real = fs.realpathSync(root);
  if (inside(fs.realpathSync(repoRoot), real)) throw Error('runtime must be outside repository');
  const require = createRequire(path.join(real, 'package.json'));
  const manifest = require('@napi-rs/canvas/package.json');
  if (manifest.name !== '@napi-rs/canvas' || manifest.version !== '0.1.100') throw Error('pinned canvas 0.1.100 required');
  return require('@napi-rs/canvas');
}
export function newOutput(raw) {
  if (typeof raw !== 'string' || !path.isAbsolute(raw)) throw Error('output must be absolute');
  // Inspect lexical final component BEFORE realpath: dangling symlinks are also existing outputs.
  try { fs.lstatSync(raw); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = fs.realpathSync(path.dirname(raw));
    const out = path.join(parent, path.basename(raw));
    if (inside(fs.realpathSync(repoRoot), out)) throw Error('output must be outside repository');
    return out;
  }
  throw Error('output must be new, not an existing path or symlink');
}
