// V4 native Canvas scene adapter. Original scene modules are preserved, not re-drawn.
// The adapter only supplies the installed Canvas API and maps migrated assets.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const assets=process.env.FAVORITE52_ASSETS;if(!assets)throw Error('FAVORITE52_ASSETS must name the verified external asset cache');
const here=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(here,'..'),legacy=path.join(here,'legacy');
export const config={width:1920,height:1080,fps:30,duration:52};
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
export const dependencies=[...files(legacy),...JSON.parse(fs.readFileSync(path.join(project,'resources.lock.json'),'utf8')).assets.map(r=>path.join(assets,r.path))].map(f=>path.relative(here,f));
export async function createScene({ctx,canvasApi}){
 const modules=new Map();
 function assetPath(p){
  p=path.resolve(p);
  if(p.startsWith(path.join(legacy,'assets')+path.sep))p=path.join(assets,path.relative(path.join(legacy,'assets'),p));
  if(p.endsWith('Carousel-NotoSansCJK-Bold.ttc')&&!fs.existsSync(p))p=p.replace('Carousel-NotoSansCJK-Bold.ttc','Carousel-NotoSansCJKsc-Bold.otf');
  if(!(p.startsWith(legacy+path.sep)||p.startsWith(assets+path.sep)))throw Error('Scene read outside declared source/assets: '+p);
  return p;
 }
 const api={...canvasApi,GlobalFonts:{registerFromPath(p,family){const ok=canvasApi.GlobalFonts.registerFromPath(assetPath(p),family);if(!ok)throw Error('Font registration failed: '+p);return ok;}},loadImage(input){return canvasApi.loadImage(typeof input==='string'?assetPath(input):input);}};
 const readFS={readFileSync(p,...args){return fs.readFileSync(assetPath(p),...args);},existsSync(p){try{return fs.existsSync(assetPath(p));}catch{return false;}},writeFileSync(){throw Error('Scene modules may not write files');},mkdirSync(){throw Error('Scene modules may not create directories');}};
 function load(file){
  file=assetPath(file);if(modules.has(file))return modules.get(file).exports;
  if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  if(!file.endsWith('.cjs'))throw Error('Unexpected scene module: '+file);
  const module={exports:{}};modules.set(file,module);
  const require=id=>id==='@napi-rs/canvas'?api:id==='fs'?readFS:id==='path'?path:(id.startsWith('.')||path.isAbsolute(id))?load(path.resolve(path.dirname(file),id)):(()=>{throw Error('Unexpected scene import: '+id);})();
  require.main=null;
  new Function('require','module','exports','__filename','__dirname',fs.readFileSync(file,'utf8')+'\n//# sourceURL='+file)(require,module,module.exports,file,path.dirname(file));
  return module.exports;
 }
 const dispatcher=load(path.join(legacy,'source/dispatcher-v4.cjs'));
 await dispatcher.prepare(dispatcher.slots.map(s=>s.start));
 return {renderFrame(frame,t){dispatcher.render(ctx,t);},coverage:dispatcher.coverage()};
}
