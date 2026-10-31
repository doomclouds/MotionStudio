import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {record} from './input.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const verified=new WeakMap();
const LOCK_SHA='3a4a3f5fcab4b94e6be681fefc3b850b0f608d6c5603ae6adfbd29018e0e1b9e';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function regularAbsolute(file){
 if(typeof file!=='string'||!path.isAbsolute(file)||path.resolve(file)!==file)throw TypeError('normalized absolute resource path');
 let p=path.resolve(file);while(true){const st=fs.lstatSync(p);if(st.isSymbolicLink())throw Error('symlink resource');if(p===path.resolve(file)&&!st.isFile())throw Error('regular font required');if(p===path.dirname(p))break;p=path.dirname(p);}
 return fs.readFileSync(file);
}
export function loadNative(){
 const require=createRequire(import.meta.url),info=require('@napi-rs/canvas/package.json');
 if(info.version!=='0.1.100')throw Error('Canvas 0.1.100 required');
 return require('@napi-rs/canvas');
}
export function loadEnvironment(api,options){
 if(!api||typeof api.createCanvas!=='function'||typeof api.ImageData!=='function'||typeof api.GlobalFonts?.register!=='function'||typeof api.GlobalFonts?.has!=='function')throw TypeError('trusted Native Canvas API');
 const o=record(options,['fontPath']);
 if(typeof o.fontPath!=='string'||!path.isAbsolute(o.fontPath))throw TypeError('absolute external font path');
 const fp=path.resolve(o.fontPath);if(fp===root||fp.startsWith(root+path.sep))throw Error('font outside package');
 let ancestor=path.dirname(fp);while(true){if(fs.existsSync(path.join(ancestor,'.git'))&&fs.existsSync(path.join(ancestor,'engine/motion-elements'))&&fs.existsSync(path.join(ancestor,'engine/design-elements')))throw Error('font outside MotionStudio repository');if(ancestor===path.dirname(ancestor))break;ancestor=path.dirname(ancestor);}
 const raw=regularAbsolute(path.join(root,'font-lock.json'));if(digest(raw)!==LOCK_SHA)throw Error('font lock identity');
  if(digest(regularAbsolute(path.join(root,'licenses/Liberation-OFL.txt')))!=='93fed46019c38bbe566b479d22148e2e8a1e85ada614accb0211c37b2c61c19b')throw Error('license identity');
 if(digest(regularAbsolute(path.join(root,'licenses/Liberation-distribution-copyright.txt')))!=='f32df582a2aab128c07b2f7e36e7b928dc5f6bd82657b905c04f91459f9e5cf9')throw Error('license identity');
 const lock=JSON.parse(raw),b=regularAbsolute(o.fontPath);
 if(b.length!==lock.bytes||digest(b)!==lock.sha256)throw Error('font identity');
 if(!api.GlobalFonts.register(b,lock.family)||!api.GlobalFonts.has(lock.family))throw Error('font registration failed');
 const env=Object.freeze({family:lock.family});verified.set(env,api);return env;
}
export function assertEnvironment(api,env){if(verified.get(env)!==api)throw TypeError('verified environment for same Canvas API');}
