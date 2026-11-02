// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {newOutput, repoRoot} from './runtime.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'particle-contract-'));
test.after(() => fs.rmSync(work, {recursive: true, force: true}));
const command = target => spawnSync(process.execPath, [path.join(here, 'examples/render.mjs'), '--output', target],
  {env: {...process.env, PARTICLE_RUNTIME: '/definitely-missing-runtime'}, encoding: 'utf8'});
test('output accepts only absolute, new, external location and does not create it', () => {
  const target = path.join(work, 'new'); assert.equal(newOutput(target), target); assert.ok(!fs.existsSync(target));
  for (const target of ['relative', '', path.join(repoRoot, 'particle-output'), path.join(work, 'missing', 'child')]) assert.throws(() => newOutput(target));
});
test('existing file and directory rejected without content change', () => {
  const file = path.join(work, 'existing.txt'); fs.writeFileSync(file, 'keep');
  for (const target of [work, file]) { assert.throws(() => newOutput(target)); assert.notEqual(command(target).status, 0); }
  assert.equal(fs.readFileSync(file, 'utf8'), 'keep');
});
test('dangling final-component symlink rejected lexically, with no target write or runtime load', () => {
  const target = path.join(work, 'absent'), link = path.join(work, 'dangling'); fs.symlinkSync(target, link);
  assert.throws(() => newOutput(link), /new/);
  const result = command(link); assert.notEqual(result.status, 0); assert.match(result.stderr, /new/);
  assert.ok(!result.stderr.includes('PARTICLE_RUNTIME')); assert.ok(!fs.existsSync(target)); assert.ok(fs.lstatSync(link).isSymbolicLink());
});
test('existing directory symlink and ancestor resolving inside repo both reject', () => {
  const link = path.join(work, 'dirlink'); fs.symlinkSync(work, link); assert.throws(() => newOutput(link));
  const repoLink = path.join(work, 'repo-link'); fs.symlinkSync(repoRoot, repoLink);
  assert.throws(() => newOutput(path.join(repoLink, 'new-output')), /outside/);
});
test('runtime rejects missing/relative/in-repo roots without install or network', () => {
  for (const root of ['', 'relative', repoRoot, '/definitely-missing-runtime']) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e',
      `import {loadCanvas} from ${JSON.stringify(new URL('./runtime.mjs', import.meta.url).href)};loadCanvas();`],
    {env: {...process.env, PARTICLE_RUNTIME: root}, encoding: 'utf8'});
    assert.notEqual(result.status, 0);
  }
});
test('wrong canvas version rejected explicitly', () => {
  const runtime = path.join(work, 'wrong-runtime'), p = path.join(runtime, 'node_modules/@napi-rs/canvas');
  fs.mkdirSync(p, {recursive: true}); fs.writeFileSync(path.join(p, 'package.json'), JSON.stringify({name: '@napi-rs/canvas', version: '0.0.0'}));
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import {loadCanvas} from ${JSON.stringify(new URL('./runtime.mjs', import.meta.url).href)};loadCanvas();`],
  {env: {...process.env, PARTICLE_RUNTIME: runtime}, encoding: 'utf8'});
  assert.notEqual(result.status, 0); assert.match(result.stderr, /pinned/);
});
