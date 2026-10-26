import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function sandbox(t) {
  const dir = await mkdtemp(join(tmpdir(), 'motion-audio-test-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  return dir;
}
// Synthetic IEEE float WAV: no downloaded/licensed or private fixture assets.
export async function fixture(dir, name, samples, {rate = 48000, channels = 1} = {}) {
  if (samples.length % channels) throw Error('Incomplete interleaved sample frame');
  const bytes = Buffer.alloc(44 + samples.length * 4);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(3, 20); bytes.writeUInt16LE(channels, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * channels * 4, 28);
  bytes.writeUInt16LE(channels * 4, 32); bytes.writeUInt16LE(32, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(samples.length * 4, 40);
  samples.forEach((value, i) => bytes.writeFloatLE(value, 44 + i * 4));
  const localPath = join(dir, name + '.wav');
  await writeFile(localPath, bytes);
  return {localPath, expectedSha256: hash(bytes)};
}
export function decode(path, {rate = 48000, channels = 1} = {}) {
  const bytes = execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-i', path,
    '-map', '0:a:0', '-ar', String(rate), '-ac', String(channels), '-c:a', 'pcm_f32le', '-f', 'f32le', 'pipe:1'],
  {maxBuffer: 32 * 1024 * 1024, timeout: 15000});
  return Array.from({length: bytes.length / 4}, (_, i) => bytes.readFloatLE(i * 4));
}
export async function fileHash(path) { return hash(await readFile(path)); }
export function available() {
  try { for (const tool of ['ffmpeg', 'ffprobe']) execFileSync(tool, ['-version'], {stdio: 'ignore', timeout: 5000}); return true; }
  catch { return false; }
}
export function almost(actual, expected, tolerance = 1e-7) {
  if (actual.length !== expected.length) throw Error(`Sample count ${actual.length}, expected ${expected.length}`);
  for (let i = 0; i < actual.length; i++) if (!Number.isFinite(actual[i]) || Math.abs(actual[i] - expected[i]) > tolerance)
    throw Error(`Sample ${i}: ${actual[i]}, expected ${expected[i]} ± ${tolerance}`);
}
