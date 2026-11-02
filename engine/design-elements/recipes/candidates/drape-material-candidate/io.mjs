// SPDX-License-Identifier: MIT
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const inside=(p,r)=>p===r||p.startsWith(r+path.sep);
function motionRepo(p){return fs.existsSync(path.join(p,'.git'))&&fs.existsSync(path.join(p,'engine/motion-elements'))&&fs.existsSync(path.join(p,'engine/design-elements'));}
export function checkOutput(arg) {
 if(typeof arg!=='string'||!path.isAbsolute(arg)||path.resolve(arg)!==arg)throw TypeError('normalized absolute NEW output directory');
 if(inside(arg,root))throw Error('output outside package');if(fs.lstatSync(arg,{throwIfNoEntry:false}))throw Error('output must not exist');
 let p=path.dirname(arg);while(true){const s=fs.lstatSync(p);if(s.isSymbolicLink()||!s.isDirectory())throw Error('regular non-symlink ancestors');if(motionRepo(p))throw Error('output outside recognized MotionStudio repository');if(p===path.dirname(p))break;p=path.dirname(p);}return arg;
}
export function writeOutputs(arg,files) {
 const out=checkOutput(arg),entries=Object.entries(files);if(!entries.length||entries.some(([n,b])=>!(/^[a-z0-9-]+\.(png|json)$/.test(n))||!Buffer.isBuffer(b)))throw TypeError('internal named buffers');
 fs.mkdirSync(out);for(const[n,b]of entries)fs.writeFileSync(path.join(out,n),b,{flag:'wx'});return out;
}
