'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const LOCK=require('./font-lock.json'),environments=new WeakSet();
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function validGitRoot(root){
  try {
    const marker=path.join(root,'.git');let dir=marker;const st=fs.statSync(marker);
    if(st.isFile()){const match=/^gitdir: ([^\r\n]+)\r?\n?$/.exec(fs.readFileSync(marker,'utf8'));if(!match)return false;dir=path.resolve(root,match[1]);}
    else if(!st.isDirectory())return false;
    if(!/^(ref: refs\/[^\s]+|[0-9a-f]{40,64})$/.test(fs.readFileSync(path.join(dir,'HEAD'),'utf8').trim()))return false;
    let common=dir;const shared=path.join(dir,'commondir');if(fs.existsSync(shared))common=path.resolve(dir,fs.readFileSync(shared,'utf8').trim());
    return fs.statSync(path.join(common,'objects')).isDirectory()&&fs.statSync(path.join(common,'config')).isFile();
  }catch(e){return e.code==='EACCES'||e.code==='EPERM';}
}
function boundary(){let p=__dirname;for(;;){if(validGitRoot(p))return p;if(path.dirname(p)===p)break;p=path.dirname(p);}return __dirname;}
function external(p,kind,{exists=true}={}){
  if(typeof p!=='string'||!path.isAbsolute(p))throw new TypeError(`${kind} must be an absolute external path`);
  const normalized=path.resolve(p),root=fs.realpathSync(boundary());
  const real=exists?fs.realpathSync(normalized):path.join(fs.realpathSync(path.dirname(normalized)),path.basename(normalized));
  if(real!==normalized)throw new Error(`${kind}: symlink ancestors not allowed`);
  const rel=path.relative(root,real);if(rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw new Error(`${kind} must be outside repository`);
  return real;
}
function readRegular(p,expectedBytes){const fd=fs.openSync(p,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const st=fs.fstatSync(fd);if(!st.isFile())throw new Error('Regular file required');if(expectedBytes!==undefined&&st.size!==expectedBytes)throw new Error('Font size mismatch');return fs.readFileSync(fd);}finally{fs.closeSync(fd);}}
function loadFeatureStackEnvironment({canvasModule=process.env.FEATURE_STACK_CANVAS,fontDir=process.env.FEATURE_STACK_FONTS,pixelRatio=2}={}){
  if(typeof pixelRatio!=='number'||!Number.isFinite(pixelRatio)||pixelRatio<1||pixelRatio>4)throw new RangeError('pixelRatio must be 1..4');
  const mod=external(canvasModule,'canvasModule'),dir=external(fontDir,'fontDir');
  if(JSON.parse(readRegular(path.join(mod,'package.json'))).version!=='0.1.100')throw new Error('Canvas 0.1.100 required');
  const api=require(mod),bytes=LOCK.outputs.map(f=>{const p=path.join(dir,f.file);const b=readRegular(p,f.bytes);if(sha(b)!==f.sha256)throw new Error(`Font SHA mismatch: ${f.file}`);return b;});
  for(let i=0;i<LOCK.outputs.length;i++)if(!api.GlobalFonts.register(bytes[i],LOCK.outputs[i].alias))throw new Error(`Font registration failed: ${LOCK.outputs[i].alias}`);
  const env=Object.freeze({canvasApi:api,pixelRatio});environments.add(env);return env;
}
function assertEnvironment(env){if(!environments.has(env))throw new TypeError('Use loadFeatureStackEnvironment with exact external fonts');}
function writeExternal(p,data){const out=external(p,'output',{exists:false});const fd=fs.openSync(out,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);try{fs.writeFileSync(fd,data);}finally{fs.closeSync(fd);}}
module.exports={loadFeatureStackEnvironment,assertEnvironment,writeExternal};
