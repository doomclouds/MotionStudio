// SPDX-License-Identifier: MIT
// Pure output-path preflight. Does not load Canvas, fonts or write files.
const fs=require('node:fs'),path=require('node:path');
function outputTargets(raw,source=__dirname){
 let dir=path.resolve(raw),ancestor=dir,tail=[];
 while(!fs.existsSync(ancestor)){
  if(fs.lstatSync(ancestor,{throwIfNoEntry:false})?.isSymbolicLink())throw Error('Output parent is a dangling symlink');
  tail.unshift(path.basename(ancestor));ancestor=path.dirname(ancestor);
 }
 if(!fs.statSync(ancestor).isDirectory())throw Error('Output parent must be a directory');
 dir=path.join(fs.realpathSync(ancestor),...tail);
 let repo=source;
 for(let a=source;;a=path.dirname(a)){if(fs.existsSync(path.join(a,'.git'))||(fs.existsSync(path.join(a,'engine'))&&fs.existsSync(path.join(a,'portfolio')))){repo=a;break}if(path.dirname(a)===a)break}
 if(dir===repo||dir.startsWith(repo+path.sep))throw Error('Output must be outside repository');
 const targets=['board','workshop'].map(v=>[v,path.join(dir,v+'.png')]);
 for(const [,f]of targets)if(fs.lstatSync(f,{throwIfNoEntry:false}))throw Error('Destination exists; refusing overwrite or symlink');
 return {dir,targets};
}
module.exports={outputTargets};
