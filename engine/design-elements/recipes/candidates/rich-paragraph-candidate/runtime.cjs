'use strict';
// Trusted local adapter only. No network, global fallback search or automatic install.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createRichParagraphEngine}=require('./paragraph.cjs');
function sourceRoot(){let p=__dirname;while(true){if(fs.existsSync(path.join(p,'SOURCE-SCOPE.md'))&&fs.existsSync(path.join(p,'engine')))return p;const q=path.dirname(p);if(p===q)return __dirname;p=q;}}
const ROOT=sourceRoot();
function external(value,type){
  if(typeof value!=='string'||!path.isAbsolute(value))throw Error('Explicit absolute external path required');
  const p=path.resolve(value),rel=path.relative(ROOT,p);if(!rel||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw Error('Resource/output must be outside source repository');
  const parts=p.slice(path.parse(p).root.length).split(path.sep);let at=path.parse(p).root;
  for(const part of parts){at=path.join(at,part);const stat=fs.lstatSync(at);if(stat.isSymbolicLink())throw Error('Symlink path rejected');}
  const s=fs.statSync(p);if(type==='file'?!s.isFile():!s.isDirectory())throw Error('Wrong resource path type');return p;
}
function loadEnvironment(options={}){
  const canvasPath=external(options.canvasPath??process.env.OD_RICH_CANVAS,'directory');
  const pkg=JSON.parse(fs.readFileSync(path.join(canvasPath,'package.json'),'utf8'));if(pkg.name!=='@napi-rs/canvas'||pkg.version!=='0.1.100')throw Error('Pinned Canvas 0.1.100 required');
  const fontDir=external(options.fontDir??process.env.OD_RICH_FONTS,'directory'),locks=require('./font-lock.json').files;
  const files=locks.map(r=>{const p=external(path.join(fontDir,r.file),'file'),b=fs.readFileSync(p);if(b.length!==r.bytes||crypto.createHash('sha256').update(b).digest('hex')!==r.sha256)throw Error('Font identity mismatch');return p;});
  const api=require(canvasPath);for(let i=0;i<files.length;i++)if(!api.GlobalFonts.registerFromPath(files[i],['RichDemoSans','RichDemoMono'][i]))throw Error('Font registration failed');
  const faces={text:{family:'RichDemoSans',weight:400,variations:'"wght" 400, "opsz" 14'},em:{family:'RichDemoSans',weight:600,variations:'"wght" 600, "opsz" 14'},code:{family:'RichDemoMono',weight:400,variations:'"wght" 400'}};
  return Object.freeze({api,faces,engine:createRichParagraphEngine({createCanvas:api.createCanvas,faces})});
}
function outputDirectory(value){return external(value??process.env.OD_RICH_OUTPUT,'directory');}
function writeExclusive(directory,name,bytes){if(!/^[a-z0-9-]+\.(png|json)$/.test(name))throw Error('Safe output filename required');const dir=external(directory,'directory');fs.writeFileSync(path.join(dir,name),bytes,{flag:'wx'});}
module.exports={loadEnvironment,outputDirectory,writeExclusive,external};
