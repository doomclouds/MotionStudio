'use strict';
const fs=require('node:fs'),path=require('node:path');
const inside=(child,parent)=>child===parent||child.startsWith(parent+path.sep);
function repositoryRoot(start){
  let p=path.resolve(start);
  while(true){
    if(fs.existsSync(path.join(p,'.git'))&&fs.existsSync(path.join(p,'SOURCE-SCOPE.md'))&&fs.existsSync(path.join(p,'engine/design-elements/catalog.json')))return p;
    const next=path.dirname(p);if(next===p)return null;p=next;
  }
}
function outputTarget(value,packageRoot=__dirname){
  if(typeof value!=='string'||!path.isAbsolute(value))throw Error('absolute new output directory required');
  const target=path.resolve(value),root=fs.realpathSync(packageRoot),repo=repositoryRoot(root);
  if(inside(target,root)||(repo&&inside(target,repo)))throw Error('outputs must be outside package and repository');
  let current=target;
  while(true){const stat=fs.lstatSync(current,{throwIfNoEntry:false});if(stat?.isSymbolicLink())throw Error('symlink path refused');if(current===target&&stat)throw Error('new directory required');if(stat&&!stat.isDirectory())throw Error('directory ancestor required');const next=path.dirname(current);if(next===current)break;current=next;}
  return target;
}
function writeExclusive(directory,name,bytes){
  if(typeof name!=='string'||path.basename(name)!==name||name==='.'||name==='..')throw Error('output basename required');
  fs.writeFileSync(path.join(directory,name),bytes,{flag:'wx'});
}
module.exports={outputTarget,repositoryRoot,writeExclusive};
