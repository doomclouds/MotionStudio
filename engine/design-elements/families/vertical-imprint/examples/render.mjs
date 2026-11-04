import {pathToFileURL, fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {draw} from '../index.mjs';
import {examples} from './cases.mjs';
import {loadCanvas} from './runtime.mjs';
export function renderExamples(){
 const api=loadCanvas();
 return {fonts:api.fontIdentities,frames:examples.map((sample,index)=>{
  const name=sample.name??`example-${index+1}`,props=sample.props??sample;
  const canvas=api.createCanvas(Math.ceil(props.bounds.x+props.bounds.width+70),Math.ceil(props.bounds.y+props.bounds.height+70));
  const geometry=draw(canvas.getContext('2d'),props),png=canvas.toBuffer('image/png');
  return {name,geometry,width:canvas.width,height:canvas.height,sha256:createHash('sha256').update(png).digest('hex'),png};
 })};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);
 if(args.length&&(args.length!==2||args[0]!=='--out'||!path.isAbsolute(args[1])))throw Error('Usage: node examples/render.mjs [--out /absolute/new-external-directory]');
 const result=renderExamples();
 if(args.length){const out=path.resolve(args[1]),root=path.resolve(fileURLToPath(new URL('../../../../..',import.meta.url)));if(out===root||out.startsWith(root+path.sep))throw Error('Output must be outside repository/Skill root');mkdirSync(out,{recursive:false});for(const frame of result.frames)writeFileSync(path.join(out,frame.name+'.png'),frame.png,{flag:'wx'});}
 console.log(JSON.stringify({fonts:result.fonts,frames:result.frames.map(({png,...record})=>record),visualReview:'NOT_RUN',userAcceptance:'NOT_RUN'},null,2));
}
