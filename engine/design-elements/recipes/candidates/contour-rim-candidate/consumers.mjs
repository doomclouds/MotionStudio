// Original synthetic consumers. Caller owns Canvas, fonts and media output.
// These compositions validate transfer of a raster helper, not a registered family.
import {shadeContourRim} from './index.mjs';
import {state, color, text} from '../../../shared.mjs';

export const briefs=Object.freeze({
  'open-form':Object.freeze({kind:'type',width:960,height:600,title:['OPEN','FORM'],kicker:'LETTERFORM WORKSHOP / 02',body:'Explore the space inside a letter.',footer:'SATURDAY 10:00  /  STUDIO 04',face:[210,216,205],background:'#142b25',ink:'#f1f3dd',accent:'#c9e595',bandWidth:3}),
  'loop-tool':Object.freeze({kind:'object',width:800,height:800,title:['Keep the','essentials.'],kicker:'FIELD TOOLS / CONCEPT 07',body:'Open-loop silhouette study.',footer:'SYNTHETIC PRODUCT CONCEPT',face:[207,201,185],background:'#ede8db',ink:'#263d37',accent:'#566e63',bandWidth:5}),
});
function check(api,d,fontFamily,enabled){
 if(typeof api?.createCanvas!=='function'||typeof api?.ImageData!=='function')throw new TypeError('Caller Canvas createCanvas and ImageData required');
 if(!d||!['type','object'].includes(d.kind))throw new TypeError('type or object brief required');
 const size=d.kind==='type'?[960,600]:[800,800];if(d.width!==size[0]||d.height!==size[1])throw new RangeError('Fixed composition dimensions required');
 if(!Array.isArray(d.title)||d.title.length!==2||[0,1].some(k=>!Object.hasOwn(d.title,k)))throw new TypeError('Two explicit title lines required');
 d.title.forEach(s=>text(s,'title',24));for(const k of ['kicker','body','footer'])text(d[k],k,70);
 for(const k of ['background','ink','accent'])color(d[k],k);
 text(fontFamily,'fontFamily',100);if(typeof enabled!=='boolean')throw new TypeError('enabled boolean required');
}
function label(c,value,x,y,size,fontFamily,color,width,weight=400){
 c.font=`${weight} ${size}px "${fontFamily}"`;c.textBaseline='alphabetic';c.textAlign='left';
 const m=c.measureText(value);if(m.width>width)throw new RangeError('Copy overflows its explicit slot');
 c.fillStyle=color;c.fillText(value,x,y);
 return {text:value,x,y,width:m.width,height:size};
}
// Result includes exact input mask and shaded bytes so callers can audit ablation
// without trying to infer alpha from an opaque final composition.
export function renderConsumer(api,brief,{fontFamily,enabled=true}={}){
 check(api,brief,fontFamily,enabled);const d=brief;
 const canvas=api.createCanvas(d.width,d.height),c=canvas.getContext('2d');
 const mask=api.createCanvas(d.kind==='type'?860:400,d.kind==='type'?320:430),m=mask.getContext('2d');
 m.fillStyle='#ffffff';
 if(d.kind==='type'){
  m.font=`400 154px "${fontFamily}"`;m.textBaseline='alphabetic';m.textAlign='left';
  for(const [i,line]of d.title.entries()){
   const metrics=m.measureText(line),x=12+metrics.actualBoundingBoxLeft,y=145+i*155;
   if(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight>mask.width-24||y-metrics.actualBoundingBoxAscent<2||y+metrics.actualBoundingBoxDescent>=mask.height-2)throw new RangeError('Title ink overflows mask; edit content, do not shrink');
   m.fillText(line,x,y);
  }
 }else{
  // Independently authored flat carry-tool silhouette. The inner loop is a hole,
  // not a highlight; lower teeth suggest attachment, not a physical CAD model.
  m.beginPath();m.roundRect(85,18,230,288,90);m.fill();
  m.fillRect(160,260,80,140);m.fillRect(222,330,65,30);m.fillRect(222,380,45,20);
  m.globalCompositeOperation='destination-out';m.beginPath();m.roundRect(132,65,136,174,60);m.fill();
  m.globalCompositeOperation='source-over';
 }
 const source=m.getImageData(0,0,mask.width,mask.height).data,alpha=new Uint8Array(mask.width*mask.height);
 for(let i=0;i<alpha.length;i++)alpha[i]=source[i*4+3];
 const params={width:mask.width,height:mask.height,alpha,bandWidth:d.bandWidth,face:d.face,edgeBase:d.kind==='type'?180:162,contrast:d.kind==='type'?43:50,light:[-.6,-.8],enabled};
 const rgba=shadeContourRim(params);m.putImageData(new api.ImageData(rgba,mask.width,mask.height),0,0);
 const position=d.kind==='type'?{x:50,y:130}:{x:374,y:236};
 const regions=[];
 state(c,()=>{
  c.fillStyle=d.background;c.fillRect(0,0,d.width,d.height);
  regions.push(label(c,d.kicker,50,62,14,fontFamily,d.accent,d.width-100,700));
  if(d.kind==='object'){
   d.title.forEach((s,i)=>regions.push(label(c,s,50,145+i*60,50,fontFamily,d.ink,700)));
   // Annotation and a fine baseline serve the object sheet, not headline texture.
   c.strokeStyle=d.accent;c.lineWidth=1;c.beginPath();c.moveTo(50,526);c.lineTo(360,526);c.stroke();
   regions.push(label(c,'07',50,492,80,fontFamily,d.accent,280));
  }
  c.drawImage(mask,position.x,position.y);
  regions.push(label(c,d.body,50,d.kind==='type'?508:708,22,fontFamily,d.ink,d.width-100));
  regions.push(label(c,d.footer,50,d.height-36,12,fontFamily,d.accent,d.width-100));
 });
 return {canvas,mask:{width:mask.width,height:mask.height,alpha,rgba},rimBounds:{...position,width:mask.width,height:mask.height},regions,semantics:d.kind==='type'?'Workshop invitation; title carries decorative rim':'Illustrative tool concept; silhouette has no manufacturing claim'};
}
