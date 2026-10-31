import{buildScalarField,createDiagnosticKit}from'./index.mjs';import{lessons}from'./fixtures.mjs';
// Only these two trusted authored compositions; not an arbitrary full-page layout API.
export function renderExamples(api,env){const kit=createDiagnosticKit(api,env);return lessons.map((f,index)=>{
 const model=buildScalarField(f.field),field=kit.createFieldLayer(model),hist=kit.createHistogram(model,{width:index?720:362,height:index?230:272,accent:f.accent,background:'#20252d'}),note=kit.createSampleNote(model,{...f.sample,width:index?520:362,title:index?'Read one quantized location':'One pixel, same source bytes'});
 const canvas=api.createCanvas(f.width,f.height),c=canvas.getContext('2d'),ink=[];
 c.fillStyle=index?'#f3efea':'#14191f';c.fillRect(0,0,f.width,f.height);
 function text(s,x,y,size,color=index?'#252934':'#f0eeea'){
  c.font=`${size}px ${env.sans}`;c.textBaseline='alphabetic';c.textAlign='left';c.direction='ltr';c.letterSpacing='0px';c.wordSpacing='0px';
  const m=c.measureText(s),b={left:x-m.actualBoundingBoxLeft-1,right:x+m.actualBoundingBoxRight+1,top:y-m.actualBoundingBoxAscent-1,bottom:y+m.actualBoundingBoxDescent+1};
  if(b.left<0||b.top<0||b.right>f.width||b.bottom>f.height)throw Error('example caption ink');ink.push({s,...b});c.fillStyle=color;c.fillText(s,x,y);
 }
 function line(x,y,w,color){c.fillStyle=color;c.fillRect(x,y,w,1);}
 const pos=index?{field:[54,203],hist:[54,582],note:[830,582]}:{field:[52,189],hist:[786,189],note:[786,500]};
 text(index?'02 / SAMPLE SPACE':'01 / DISTRIBUTION',52,48,14,index?'#75636c':'#d5a77f');
 text(index?'A field is many local values.':'From pixels to a distribution.',52,105,index?44:43);
 text(index?'A different phase changes every view together.':'A synthetic ramp, a flat region, and their shared 8-bit record.',54,143,17,index?'#636772':'#aeb6bf');
 for(const [key,layer]of[['field',field],['hist',hist],['note',note]])layer.place(c,...pos[key]);
 // The orange/purple location marker is host-owned geometry, not baked into source bytes.
 const [fx,fy]=pos.field,px=fx+f.sample.x+.5,py=fy+f.sample.y+.5;c.strokeStyle=f.accent;c.lineWidth=2;c.beginPath();c.arc(px,py,9,0,Math.PI*2);c.stroke();
 c.beginPath();c.moveTo(px-15,py);c.lineTo(px-6,py);c.moveTo(px+6,py);c.lineTo(px+15,py);c.moveTo(px,py-15);c.lineTo(px,py-6);c.moveTo(px,py+6);c.lineTo(px,py+15);c.stroke();
 const y=index?732:655;line(54,index?842:y-22,f.width-108,index?'#d9d2cb':'#38404a');
 text(`${model.stats.count.toLocaleString('en-US')} pixels  /  32 bins  /  mean ${model.stats.mean.toFixed(2)}`,index?830:54,y+12,index?17:19);
 text(index?'Quantization: round(clamp(value, 0, 1) x 255).':'Every bar counts displayed bytes; bar height is peak-normalized.',index?830:54,y+46,index?14:16,index?'#636772':'#aeb6bf');
 text('SYNTHETIC STATIC DATA / NO GPU OR LIVE MONITORING',54,f.height-27,12,index?'#75636c':'#9ba5ae');
 return{canvas,id:f.id,layout:{width:f.width,height:f.height,model,sourceSample:note.plan.sample,placements:pos,histogram:hist.plan,note:note.plan,captionInk:ink,hostMarker:{x:px,y:py,radius:9},notMotion:true}};
 });}
