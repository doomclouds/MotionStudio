import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const packageRoot=path.dirname(fileURLToPath(import.meta.url));
const inside=(p,r)=>p===r||p.startsWith(r+path.sep);
function isMotionRepo(p){return fs.existsSync(path.join(p,'engine/motion-elements'))&&fs.existsSync(path.join(p,'engine/design-elements'))&&fs.existsSync(path.join(p,'.git'));}
export function outputDirectory(arg){
 if(typeof arg!=='string'||!path.isAbsolute(arg))throw TypeError('absolute NEW output directory');const dir=path.resolve(arg);if(dir!==arg)throw TypeError('normalized absolute output');
 if(inside(dir,packageRoot))throw Error('output outside package');
 if(fs.lstatSync(dir,{throwIfNoEntry:false}))throw Error('new output directory required');
 let p=path.dirname(dir);while(true){const st=fs.lstatSync(p);if(st.isSymbolicLink()||!st.isDirectory())throw Error('trusted regular parent directories');if(isMotionRepo(p))throw Error('output outside MotionStudio repository');if(p===path.dirname(p))break;p=path.dirname(p);}
 fs.mkdirSync(dir);return dir;
}
export function writeNew(dir,name,bytes){if(!/^[a-z0-9-]+\.(png|json)$/.test(name))throw TypeError('safe output name');fs.writeFileSync(path.join(dir,name),bytes,{flag:'wx'});}
