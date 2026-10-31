import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';import {bindTiles} from './tiles-internal.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
/** Explicit setup; no downloading. Global font registry is process-wide. */
export function createReviewTiles({fontRoot,canvasModule='@napi-rs/canvas'}={}){
 if(typeof fontRoot!=='string'||!path.isAbsolute(fontRoot))throw Error('absolute fontRoot required');
 const require=createRequire(import.meta.url),api=require(canvasModule),pkg=require(canvasModule+'/package.json');if(pkg.name!=='@napi-rs/canvas'||pkg.version!=='0.1.100')throw Error('pinned canvas required');
 const locks=JSON.parse(fs.readFileSync(path.join(root,'asset-lock.json'),'utf8'));
 for(const f of locks){const p=path.join(fontRoot,f.file),s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==f.sha256)throw Error('font identity');}
 for(const f of locks)if(!api.GlobalFonts.registerFromPath(path.join(fontRoot,f.file),f.alias))throw Error('font registration');
 return bindTiles(api);
}
