// Optional external Canvas execution. No dependencies/fonts/output are vendored.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readFileSync,mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,relative,sep,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {briefs,renderConsumer} from './consumers.mjs';
export function verifyConsumers(api,fontFamily){
 const records=[],outputs=[];
 for(const [name,d]of Object.entries(briefs)){
  const before=JSON.stringify(d),on=renderConsumer(api,d,{fontFamily}),off=renderConsumer(api,d,{fontFamily,enabled:false});
  assert.equal(JSON.stringify(d),before);
  const a=on.mask,b=off.mask;let changed=0,solid=0,aa=0,unchangedOpaque=0;
  for(let i=0;i<a.alpha.length;i++){
   assert.equal(a.rgba[4*i+3],a.alpha[i]);assert.equal(b.rgba[4*i+3],a.alpha[i]);
   if(a.alpha[i]){solid++;if(a.alpha[i]<255)aa++;if(a.rgba[4*i]!==b.rgba[4*i])changed++;else if(a.alpha[i]===255)unchangedOpaque++;}
   else assert.equal(a.rgba[4*i],0);
  }
  assert.ok(changed>0&&changed<solid);assert.ok(aa>0&&unchangedOpaque>0);
  // Flood-fill exterior transparent pixels; remaining zero-alpha components
  // are real enclosed holes, not simply a transparent surrounding canvas.
  const visited=new Uint8Array(a.alpha.length),queue=[0];visited[0]=1;
  for(let head=0;head<queue.length;head++){
   const i=queue[head],x=i%a.width,y=Math.floor(i/a.width);
   for(const n of [x>0?i-1:-1,x<a.width-1?i+1:-1,y>0?i-a.width:-1,y<a.height-1?i+a.width:-1])
    if(n>=0&&!visited[n]&&!a.alpha[n]){visited[n]=1;queue.push(n);}
  }
  let enclosedTransparentPixels=0;for(let i=0;i<a.alpha.length;i++)if(!a.alpha[i]&&!visited[i])enclosedTransparentPixels++;
  assert.ok(enclosedTransparentPixels>0);
  const pixels=on.canvas.getContext('2d').getImageData(0,0,d.width,d.height).data;
  const flat=off.canvas.getContext('2d').getImageData(0,0,d.width,d.height).data;
  const repeat=renderConsumer(api,d,{fontFamily}).canvas.getContext('2d').getImageData(0,0,d.width,d.height).data;
  assert.deepEqual(pixels,repeat);let composedChanged=0;
  const r=on.rimBounds;
  for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++){
   const i=(y*d.width+x)*4;const diff=pixels[i]!==flat[i]||pixels[i+1]!==flat[i+1]||pixels[i+2]!==flat[i+2];
   if(diff){composedChanged++;assert.ok(x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height);assert.ok(a.alpha[(y-r.y)*r.width+x-r.x]>0);}
  }
  assert.ok(composedChanged>0);assert.deepEqual(on.regions,off.regions);
  assert.throws(()=>renderConsumer(api,{...d,title:['A'.repeat(24),'FORM']},{fontFamily}),/overflows/);
  assert.throws(()=>renderConsumer(api,{...d,title:Array(2)},{fontFamily}));
  assert.throws(()=>renderConsumer(api,d,{fontFamily,enabled:'false'}));
  records.push({name,width:d.width,height:d.height,solid,aa,changed,enclosedTransparentPixels,unchangedOpaque,composedChanged,alphaPreserved:true,isolatedAblation:true,deterministic:true});
  outputs.push({name,on:on.canvas,off:off.canvas});
 }
 return {records,outputs};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const modulePath=process.env.CONTOUR_CANVAS_MODULE,fontPath=process.env.CONTOUR_FONT_FILE,out=process.argv[2];
 if(!modulePath||!fontPath||!out)throw new Error('CONTOUR_CANVAS_MODULE, CONTOUR_FONT_FILE and external output directory required');
 mkdirSync(out,{recursive:true});const output=realpathSync(out),repo=realpathSync(new URL('../../../../..',import.meta.url));
 const rel=relative(repo,output);if(rel===''||(!rel.startsWith(`..${sep}`)&&rel!=='..'&&!isAbsolute(rel)))throw new Error('Evidence directory must be outside repository');
 const api=createRequire(import.meta.url)(resolve(modulePath));const fontFamily='ContourConsumer';
 if(!api.GlobalFonts.registerFromPath(resolve(fontPath),fontFamily))throw new Error('Font registration failed');
 const {records,outputs}=verifyConsumers(api,fontFamily);
 for(const {name,on,off}of outputs){
  for(const [mode,canvas]of [['on',on],['off',off]])writeFileSync(resolve(output,`${name}-${mode}.png`),canvas.toBuffer('image/png'));
  const sheet=api.createCanvas(on.width*2,on.height),c=sheet.getContext('2d');c.drawImage(on,0,0);c.drawImage(off,on.width,0);writeFileSync(resolve(output,`${name}-ablation.png`),sheet.toBuffer('image/png'));
  const small=api.createCanvas(on.width/2,on.height/2);small.getContext('2d').drawImage(on,0,0,small.width,small.height);writeFileSync(resolve(output,`${name}-half.png`),small.toBuffer('image/png'));
 }
 const report={fontSHA256:createHash('sha256').update(readFileSync(fontPath)).digest('hex'),node:process.version,records,limits:['synthetic static consumers','no user approval','not PBR or 3D','one supplied font and Canvas environment']};
 writeFileSync(resolve(output,'consumer-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
