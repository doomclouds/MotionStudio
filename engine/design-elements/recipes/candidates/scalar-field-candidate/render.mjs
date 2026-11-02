import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as api from '@napi-rs/canvas';
import {renderExamples} from './examples.mjs';
const target=process.argv[2];
if(!target||!path.isAbsolute(target))throw Error('absolute NEW output directory required');
// Trusted parent; no ancestor-symlink/TOCTOU security promise.
if(fs.existsSync(target)){throw Error('output already exists');}
try{fs.lstatSync(target);throw Error('output leaf exists');}catch(e){if(e.code!=='ENOENT')throw e;}
const images=renderExamples(api);const files=images.map(x=>({name:x.id+'.png',bytes:x.canvas.toBuffer('image/png'),plans:x.plans}));
fs.mkdirSync(target);for(const x of files)fs.writeFileSync(path.join(target,x.name),x.bytes,{flag:'wx'});
fs.writeFileSync(path.join(target,'outputs.json'),JSON.stringify(files.map(x=>({file:x.name,sha256:crypto.createHash('sha256').update(x.bytes).digest('hex'),plans:x.plans})),null,2)+'\n',{flag:'wx'});
console.log('2 synthetic static compositions; no fonts/images/reference assets');
