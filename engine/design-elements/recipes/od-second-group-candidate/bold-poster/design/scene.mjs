import fs from'node:fs';import{pathToFileURL,fileURLToPath}from'node:url';import path from'node:path';import{createHash}from'node:crypto';import{drawTiltedType}from'./tilted-type.mjs';
export const config={width:1920,height:1080,fps:1,duration:1};
export function registerFonts(G,assetDir){const root=pathToFileURL(path.resolve(assetDir)+path.sep);for(const f of JSON.parse(fs.readFileSync(new URL('../font-lock.json',import.meta.url)))){const p=new URL(f.file,root);if(createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==f.sha256)throw Error('font SHA mismatch');if(!G.registerFromPath(fileURLToPath(p),'Bold'+f.file.slice(0,-4)))throw Error('font registration')}}
export function render(ctx,{alternate=false,canvasApi}={}){
 ctx.reset();ctx.fillStyle='#f5f2ef';ctx.fillRect(0,0,1920,1080);
 const text=(text,x,y,size,font='BoldSans500',color='#1c1410',spacing=0)=>drawTiltedType(ctx,{canvasApi,text,x,y,size,font,color,spacing});
 text(alternate?'FIELD NOTES':'MANIFESTO',110,114,22,'BoldSans700','#1c1410',6);
 text('VOL. 04 · 2026',1619,114,22,'BoldSans500','#1c1410',3);
 ctx.fillStyle='#d8000f';ctx.fillRect(310,105,1281,3);
 ctx.font='320px BoldDisplay';ctx.letterSpacing='1px';const fw=ctx.measureText(alternate?'07':'03').width;ctx.letterSpacing='0px';
 drawTiltedType(ctx,{canvasApi,text:alternate?'07':'03',x:1824-fw,y:373.04,size:320,font:'BoldDisplay',angle:-6,originX:1824-fw/2,originY:278,color:'#d8000f',spacing:1});
 ctx.font='150px BoldDisplay';const widest=ctx.measureText(alternate?'Keep it clear.':'Make it last.').width;
 const lines=alternate?['Keep it','simple.','Keep it clear.']:['Make it','loud.','Make it last.'];
 lines.forEach((s,i)=>drawTiltedType(ctx,{canvasApi,text:s,x:110,y:502.05+i*129,size:150,font:'BoldDisplay',angle:[-2,-4,2][i],originX:i?110+widest/2:110,originY:i?393+i*129+64.5:522,color:i===1?'#d8000f':'#1c1410'}));
 const body=alternate?['An alternate copy test — the same authored type hierarchy,','with one red accent and a deliberate reading order.']:['Every slide should land like a printed page — set in heavy','type, locked to one red accent, ruled in ink.'];
 body.forEach((s,i)=>text(s,114,819.72+i*47.6,34,'BoldItalic'));
 ctx.fillStyle='#1c1410';ctx.fillRect(110,941,1700,2);
 text('BOLD POSTER',110,979,18,'BoldSans500','#1c1410',3);text(alternate?'COPY STUDY':'HTML-VIDEO',1675,979,18,'BoldSans500','#d8000f',3);
}
