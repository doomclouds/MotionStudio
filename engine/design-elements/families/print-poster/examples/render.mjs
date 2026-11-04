import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {drawPoster,recipes} from '../index.mjs';
import {loadCanvas} from './runtime.mjs';
export function renderExamples(){
 const api=loadCanvas();
 return {fonts:api.fontIdentities,frames:Object.entries(recipes).map(([id,recipe])=>{const canvas=api.createCanvas(1000,600);drawPoster(canvas.getContext('2d'),recipe);const png=canvas.toBuffer('image/png');return{id,width:1000,height:600,sha256:createHash('sha256').update(png).digest('hex'),png};})};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.length && (args.length!==2||args[0]!=='--out'||!path.isAbsolute(args[1])))throw Error('Usage: node examples/render.mjs [--out /absolute/new-external-directory]');
 const result=renderExamples();
 if(args.length){const out=path.resolve(args[1]);const root=path.resolve(new URL('../../../../..',import.meta.url).pathname);if(out===root||out.startsWith(root+path.sep))throw Error('Output must be outside repository/Skill root');mkdirSync(out,{recursive:false});for(const frame of result.frames)writeFileSync(path.join(out,frame.id+'.png'),frame.png,{flag:'wx'});}
 console.log(JSON.stringify({fonts:result.fonts,frames:result.frames.map(({png,...record})=>record),visualReview:'NOT_RUN',userAcceptance:'NOT_RUN'},null,2));
}
