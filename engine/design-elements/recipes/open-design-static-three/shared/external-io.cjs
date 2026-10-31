'use strict';
const fs=require('fs'),path=require('path');
const inside=(p,r)=>p===r||p.startsWith(r+path.sep);
function repositoryRoot(start=__dirname){for(let p=path.resolve(start);;p=path.dirname(p)){if(fs.existsSync(path.join(p,'.git')))return fs.realpathSync(p);if(path.dirname(p)===p)throw Error('Repository root not located; pass explicit root for extracted package')}}
function externalPath(input,repo=repositoryRoot()){
 if(typeof input!=='string'||!path.isAbsolute(input))throw Error('Absolute external path required');const target=path.resolve(input);let ancestor=target;
 for(;;){try{fs.lstatSync(ancestor);break}catch(e){if(e.code!=='ENOENT')throw e;const p=path.dirname(ancestor);if(p===ancestor)throw Error('Existing ancestor required');ancestor=p}}
 const real=path.resolve(fs.realpathSync(ancestor),path.relative(ancestor,target));if(inside(real,fs.realpathSync(repo)))throw Error('Path resolves inside repository');return real;
}
function inputDirectory(input){const p=externalPath(input);if(!fs.statSync(p).isDirectory())throw Error('External font directory required');return p}
function readRegular(file,maxBytes){const s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink())throw Error('Regular non-symlink input required');if(s.size>maxBytes)throw Error('Input exceeds byte budget');return fs.readFileSync(file)}
function writeNewDirectory(input,files){const dir=externalPath(input);try{fs.lstatSync(dir);throw Error('Output directory must be new; refusing overwrite or symlink')}catch(e){if(e.code!=='ENOENT')throw e}for(const[n,b]of Object.entries(files)){if(path.basename(n)!==n||!Buffer.isBuffer(b))throw Error('Output files must be flat named buffers')}fs.mkdirSync(dir,{recursive:true});for(const[n,b]of Object.entries(files))fs.writeFileSync(path.join(dir,n),b,{flag:'wx'});return dir}
module.exports={repositoryRoot,externalPath,inputDirectory,readRegular,writeNewDirectory};
