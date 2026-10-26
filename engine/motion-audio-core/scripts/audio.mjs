#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {prepareMix,probeSource,validateAudioPlan,capabilities} from '../lib/audio.mjs';
const usage='Usage: node audio.mjs capabilities | validate --timeline FILE | probe --source FILE --source-root ROOT [--source-root ROOT] | render --timeline FILE --work FRESH_DIR --source-root ROOT [--view ID] [--aac]';
const [action,...args]=process.argv.slice(2),options={},roots=[];
try{
 for(let i=0;i<args.length;i++){const key=args[i];if(key==='--aac'){options.aac=true;continue;}if(!['--timeline','--work','--source-root','--source','--view','--output'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error(usage);const value=args[++i];if(key==='--source-root')roots.push(value);else{if(options[key])throw Error('Duplicate option');options[key]=value;}}
 const controller=new AbortController();const abort=()=>controller.abort();process.once('SIGINT',abort);process.once('SIGTERM',abort);let result,mix;
 try{if(action==='capabilities')result=await capabilities({signal:controller.signal});else if(action==='probe')result=await probeSource(options['--source'],{sourceRoots:roots,signal:controller.signal});else if(action==='validate')result=validateAudioPlan(JSON.parse(await readFile(options['--timeline'],'utf8')));else if(action==='render'){const timelinePath=resolve(options['--timeline']);const document=validateAudioPlan(JSON.parse(await readFile(timelinePath,'utf8')));mix=await prepareMix(document,{sourceBaseDir:dirname(timelinePath),sourceRoots:roots,workDir:options['--work'],signal:controller.signal});result=await mix.render({viewId:options['--view'],encodeAAC:options.aac??false});}else throw Error(usage);const json=JSON.stringify(result,null,2)+'\n';if(options['--output'])await writeFile(options['--output'],json,{flag:'wx'});else process.stdout.write(json);}finally{await mix?.close();process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort);}
}catch(error){process.stderr.write(`${error.message}\n`);process.exitCode=1;}
