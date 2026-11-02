#!/usr/bin/env node
// Small offline launcher; existing module CLIs remain the advanced interfaces.
import {createRequire} from 'node:module';
import {readFile, mkdtemp, mkdir, access, realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname, join, resolve, relative, isAbsolute, sep, basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {spawnSync, spawn} from 'node:child_process';
const root=dirname(fileURLToPath(import.meta.url));
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const help=`MotionStudio ${version} — offline, code-first motion toolkit
Usage: node motionstudio.mjs <help|version|doctor|demo> [options]
  doctor [--full]             Check installed dependencies; never installs or calls APIs
  demo [--work NEW_DIRECTORY] Render the bundled 1-second silent technical fixture
                              Default: unique directory in the system temporary folder
  --canvas-module PATH       Existing Canvas installation (or MOTIONSTUDIO_CANVAS_MODULE)
  --ffmpeg PATH --ffprobe PATH  Existing executables (default: PATH lookup)
  --help / --version          Print help / version without checking dependencies

First-time setup: install Node.js >=24 and FFmpeg/ffprobe with libx264, then run:
  npm ci --prefix engine/motion-render-core --ignore-scripts
  node motionstudio.mjs doctor
  node motionstudio.mjs demo
Installation downloads dependencies; subsequent rendering is offline. No API key required.
Optional benchmark dependencies: Python >=3.12; see tools/reference-benchmark/README.md.
Advanced scenes/audio/streaming: skills/motion-film-director/scripts/render-shot.mjs --help
Demo is a technical smoke, not a film or artistic acceptance. No existing output is overwritten.
`;
const inside=(base,path)=>{const rel=relative(base,path);return !rel||(rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel));};
function probe(exe,args){const r=spawnSync(exe,args,{encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});return {ok:!r.error&&r.status===0,text:(r.stdout||'')+(r.stderr||''),reason:r.error?.code||`exit ${r.status}`};}
async function doctor(options){
 const checks=[]; const add=(name,ok,detail,fix)=>checks.push({name,ok,detail,fix});
 add('Node',Number(process.versions.node.split('.')[0])>=24,process.version,'Install Node.js >=24.');
 let entry;
 try {
  const req=createRequire(join(root,'engine/motion-render-core/package.json'));
  const target=options['--canvas-module']||process.env.MOTIONSTUDIO_CANVAS_MODULE||join(root,'engine/motion-render-core/node_modules/@napi-rs/canvas');
  entry=req.resolve(target);const api=req(entry);const pkg=req(join(dirname(entry),'package.json'));
  const png=api.createCanvas(2,2).toBuffer('image/png');
  add('Canvas',pkg.version==='0.1.100'&&png.length>8,`${pkg.version}: ${entry}`,'Run npm ci --prefix engine/motion-render-core --ignore-scripts; retain optional dependencies.');
 }catch {add('Canvas',false,'Missing or unable to load the native Canvas module.','Run npm ci --prefix engine/motion-render-core --ignore-scripts; unset an invalid MOTIONSTUDIO_CANVAS_MODULE.');}
 for(const [flag,name] of [['--ffmpeg','ffmpeg'],['--ffprobe','ffprobe']]){
  const r=probe(options[flag]||name,['-version']);add(name,r.ok,r.ok?r.text.split('\n')[0]:r.reason,`Install ${name} and put it on PATH, or pass ${flag} /path/to/${name}.`);
 }
 const enc=probe(options['--ffmpeg']||'ffmpeg',['-hide_banner','-encoders']);
 add('libx264',enc.ok&&/\blibx264\b/.test(enc.text),'Required for the default MP4 encoder.','Install an FFmpeg build containing libx264.');
 const outputParent=options['--work']?dirname(resolve(options['--work'])):tmpdir();
 try{await access(outputParent,constants.W_OK);add('Output parent',true,outputParent);}catch{add('Output parent',false,outputParent,'Choose an existing writable parent for --work, or a writable system temporary directory for the default demo.');}
 if(options['--full']){
  const py=probe('python3',['-c',"import sys; assert sys.version_info >= (3,12); import numpy, scipy, PIL, jsonschema; from importlib.metadata import version; print(sys.version.split()[0], numpy.__version__, scipy.__version__, PIL.__version__, version('jsonschema'))"]);
  add('Optional benchmark Python',py.ok,py.ok?py.text.trim():py.reason,'Install Python >=3.12, create a venv, then python -m pip install -r tools/reference-benchmark/requirements.txt.');
  const filters=probe(options['--ffmpeg']||'ffmpeg',['-hide_banner','-filters']);add('Optional benchmark ebur128',filters.ok&&/\bebur128\b/.test(filters.text),'Audio measurement filter.','Install an FFmpeg build with ebur128.');
 }
 for(const c of checks)console.log(`${c.ok?'PASS':'FAIL'} ${c.name}: ${c.detail}${!c.ok?'\n  Fix: '+c.fix:''}`);
 console.log('No key, network call, installation, media upload or artistic review performed.');
 return {ok:checks.every(c=>c.ok),entry};
}
async function main(){
 const args=process.argv.slice(2),command=args.shift()||'help';
 if(['help','--help','-h'].includes(command)){console.log(help);return;}
 if(['version','--version','-v'].includes(command)){console.log(version);return;}
 if(!['doctor','demo'].includes(command))throw Error(`Unknown command: ${command}. Run node motionstudio.mjs help.`);
 if(args.includes('--help')){console.log(help);return;}
 const options={};
 while(args.length){const key=args.shift();if(Object.hasOwn(options,key))throw Error(`Duplicate option: ${key}`);
  if(key==='--full'&&command==='doctor'){options[key]=true;continue;}
  if(!['--canvas-module','--ffmpeg','--ffprobe',...(command==='demo'?['--work']:[])].includes(key))throw Error(`Unknown option: ${key}`);
  const value=args.shift();if(!value||value.startsWith('--'))throw Error(`Missing value: ${key}`);options[key]=value;
 }
 const check=await doctor(options);if(!check.ok){process.exitCode=1;return;}
 if(command==='doctor')return;
 // Resolve and validate the parent before either creation path. Use the canonical
 // path for creation too, so a temp-directory symlink is not followed a second time.
 const requested=options['--work']?resolve(options['--work']):null;
 const parent=await realpath(requested?dirname(requested):tmpdir());
 const canonicalRoot=await realpath(root);
 const target=requested?join(parent,basename(requested)):join(parent,'motionstudio-demo-');
 if(inside(canonicalRoot,parent)||inside(canonicalRoot,target))throw Error('Demo work must be outside the repository.');
 let work;
 if(requested){
  work=target;
  await mkdir(work); // exclusive: even an empty existing directory is refused
 }else work=await mkdtemp(target);
 console.log(`Demo work: ${work}`);
 const argv=[join(root,'skills/motion-film-director/scripts/render-shot.mjs'),'--work',work,'--canvas-module',check.entry];
 for(const k of ['--ffmpeg','--ffprobe'])if(options[k])argv.push(k,options[k]);
 const child=spawn(process.execPath,argv,{stdio:'inherit'});
 const stop=signal=>child.kill(signal);const interrupt=()=>stop('SIGINT'),terminate=()=>stop('SIGTERM');
 process.on('SIGINT',interrupt);process.on('SIGTERM',terminate);
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code)=>resolve(code??1));});
 process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);
 process.exitCode=code;if(code===0)console.log(`Video: ${join(work,'output/shot.mp4')}`);
}
try{await main();}catch(e){console.error(`MotionStudio: ${e.code==='EEXIST'?'Work directory already exists; choose a new --work.':e.message}`);process.exitCode=1;}
