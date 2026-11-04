import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as direct from '../index.mjs';
import * as publicApi from '../../../../index.mjs';
const asset = new URL('../', import.meta.url);
const root = new URL('../../../../../', import.meta.url);
test('finite particle directory is the sole live implementation and guide', () => {
  const catalog = JSON.parse(readFileSync(new URL('catalog.json', root)));
  const item = catalog.elements.find(e => e.id === 'motion.finite-particles');
  assert.equal(item.evidence.guidance, 'lib/foundations/motion/finite-particles/README.md');
  assert(item.evidence.technicalTests.includes('lib/foundations/motion/finite-particles/test/finite-particles.test.mjs'));
  for (const path of ['lib/foundations/motion/finite-particles.mjs', 'docs/foundations/motion.finite-particles.md', 'test/finite-particles.test.mjs']) {
    assert.equal(existsSync(new URL(path, root)), false, `Retired alias: ${path}`);
  }
  for (const name of ['compileFiniteParticles', 'sampleFiniteParticles']) assert.equal(direct[name], publicApi[name]);
  for (const path of ['README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/finite-particles.test.mjs']) assert(existsSync(new URL(path, asset)));
});
test('finite particle entry has nine readable sections and live relative links', () => {
  const readme = readFileSync(new URL('README.md', asset), 'utf8');
  for (const heading of ['身份与机器索引', '设计意图', '适用与不适用', '视觉与动态行为', '参数与代码入口', '可执行示例', '依赖与恢复', '来源与权利', '验证与局限']) {
    assert(readme.includes(`## ${heading}\n`));
  }
  for (const name of ['README.md', 'design.md']) {
    const url = new URL(name, asset), content = readFileSync(url, 'utf8');
    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(match[1])) continue; // Source citations are not offline file dependencies.
      assert(existsSync(new URL(match[1].split('#')[0], url)), `${name}: ${match[1]}`);
    }
  }
});
test('asset example actually calls public API and checks current catalog example', () => {
  const result = execFileSync(process.execPath, [fileURLToPath(new URL('examples/contract.mjs', asset))], {encoding: 'utf8'});
  assert.match(result, /motion\.finite-particles contract PASS/);
});
