import {loadEnvironment,writeOutputs,sha,externalDirectory} from '../runtime.mjs';import {composeRoute,composePattern} from './compositions.mjs';
const out=process.argv[2];externalDirectory(out,{fresh:true});const api=loadEnvironment(),files={},info=[];
for(const[name,fn]of [['route',composeRoute],['pattern',composePattern]]){const r=fn(api),png=r.canvas.toBuffer('image/png'),layout=Buffer.from(JSON.stringify(r.layout,null,2)+'\n');files[name+'.png']=png;files[name+'.json']=layout;info.push({name,width:r.canvas.width,height:r.canvas.height,sha256:sha(png),layoutSHA256:sha(layout)});}
files['outputs.json']=Buffer.from(JSON.stringify({static:true,synthetic:true,images:info},null,2)+'\n');writeOutputs(out,files);process.stdout.write(JSON.stringify(info)+'\n');
