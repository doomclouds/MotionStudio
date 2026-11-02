// SPDX-License-Identifier: MIT
// IO/runtime adapter adapted from WICKROOM MIT; no font registration or assets.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
export const ROOT=path.dirname(fileURLToPath(import.meta.url));
export function regular(p){if(typeof p!=='string'||!path.isAbsolute(p)||path.normalize(p)!==p)throw Error('normalized absolute');for(let q=p;;q=path.dirname(q)){if(fs.lstatSync(q,{throwIfNoEntry:false})?.isSymbolicLink())throw Error('no symlink');if(q===path.dirname(q))break;}return p;}
export function loadNative(){if(process.env.DISABLE_SYSTEM_FONTS_LOAD!=='1')throw Error('disable system font auto-discovery');const dir=regular(process.env.VOLUME_RUNTIME||ROOT),req=createRequire(path.join(dir,'package.json'));if(req('@napi-rs/canvas/package.json').version!=='0.1.100')throw Error('Native0.1.100');return req('@napi-rs/canvas');}
export function writeNew(dest,files){regular(dest);if(fs.existsSync(dest)||dest===ROOT||dest.startsWith(ROOT+path.sep)||!fs.statSync(path.dirname(dest)).isDirectory())throw Error('new outside directory');for(const [n,b]of Object.entries(files))if(!/^[a-z0-9-]+\.(png|json)$/.test(n)||!Buffer.isBuffer(b))throw Error('file');fs.mkdirSync(dest);for(const[n,b]of Object.entries(files))fs.writeFileSync(path.join(dest,n),b,{flag:'wx'});}
