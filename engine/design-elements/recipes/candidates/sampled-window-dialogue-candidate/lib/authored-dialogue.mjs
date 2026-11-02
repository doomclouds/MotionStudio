import {record,dense,integer,id,ascii,append,freeze,finite} from './data.mjs';
const models=new WeakSet();
const time=m=>`D${Math.floor(m/1440)+1} ${String(Math.floor(m%1440/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export function createDialogueModel(input){
 const q=record(input,['title','participants','messages','groupGap']);ascii(q.title,1,52,'title');integer(q.groupGap,0,120,'group gap minutes');
 const participants=[],people=new Map(),messages=[],ids=new Set(),groups=[];let last=-1;
 for(const v of dense(q.participants,1,8)){const p=record(v,['id','label']);id(p.id);ascii(p.label,1,24,'participant');if(people.has(p.id))throw new TypeError('duplicate participant');people.set(p.id,p.label);append(participants,{...p});}
 for(const v of dense(q.messages,1,32)){const m=record(v,['id','author','minute','lines']);id(m.id);id(m.author);if(ids.has(m.id)||!people.has(m.author))throw new TypeError('message id/reference');ids.add(m.id);integer(m.minute,0,10079);if(m.minute<last)throw new RangeError('messages must be chronologically authored');last=m.minute;
  const lines=[];for(const line of dense(m.lines,1,5))append(lines,ascii(line,1,80,'authored line'));const message={id:m.id,author:m.author,minute:m.minute,time:time(m.minute),lines};append(messages,message);
  let g=groups.at(-1);if(!g||g.author!==m.author||Math.floor(g.end/1440)!==Math.floor(m.minute/1440)||m.minute-g.end>q.groupGap){g={author:m.author,label:people.get(m.author),start:m.minute,end:m.minute,startTime:time(m.minute),messages:[]};append(groups,g);}g.end=m.minute;append(g.messages,message);
 }
 const model=freeze({title:q.title,groupGap:q.groupGap,participants,messages,groups,messageCount:messages.length,groupCount:groups.length,activeAuthors:new Set(messages.map(m=>m.author)).size});models.add(model);return model;
}
export function createDialogueEngine(input){
 const env=record(input,['createCanvas','regularFamily','semiboldFamily']);if(typeof env.createCanvas!=='function')throw new TypeError('trusted fresh Canvas factory');
 for(const f of [env.regularFamily,env.semiboldFamily])if(typeof f!=='string'||!/^[A-Za-z][A-Za-z0-9]{1,48}$/.test(f))throw new TypeError('registered font alias');
 const scratch=env.createCanvas(1,1),measure=scratch.getContext('2d'),plans=new WeakSet();
 const font=(role,size)=>`${size}px ${role==='regular'?env.regularFamily:env.semiboldFamily}`;
 function line(text,x,baseline,size,role,color,box){measure.font=font(role,size);const m=measure.measureText(text),l=x-m.actualBoundingBoxLeft,r=x+m.actualBoundingBoxRight,t=baseline-m.actualBoundingBoxAscent,b=baseline+m.actualBoundingBoxDescent;if(![l,r,t,b,m.width].every(Number.isFinite)||l<box.x||r>box.x+box.width||t<box.y||b>box.y+box.height)throw new RangeError('actual text ink outside slot');return {text,x,baseline,size,role,color,ink:{left:l,right:r,top:t,bottom:b},box};}
 function plan(model,options={}){
  if(!models.has(model))throw new TypeError('issued dialogue model');const q=record(options,['width','padding','fontSize','maxHeight','theme'],[]);const width=integer(q.width===undefined?640:q.width,400,1100),padding=integer(q.padding===undefined?24:q.padding,20,48),fontSize=integer(q.fontSize===undefined?18:q.fontSize,14,24),maxHeight=integer(q.maxHeight===undefined?1400:q.maxHeight,180,2000),theme=q.theme===undefined?'paper':q.theme;if(!['paper','night'].includes(theme))throw new TypeError('theme');
  const colors=theme==='paper'?{ink:'#25213d',muted:'#655d75',accent:'#7b36b1',panel:'#f2eaf9',background:'#fffaf2'}:{ink:'#fff2df',muted:'#d0b9ce',accent:'#ff966e',panel:'#312735',background:'#211c27'};
  const lines=[],rects=[],bodyHeight=fontSize+12,headerH=fontSize+14,stampWidth=112,gap=20;let y=padding;
  append(lines,line(model.title,padding,y+26,25,'semibold',colors.ink,{x:padding,y,width:width-padding*2,height:34}));y+=40;
  append(lines,line(`${model.messageCount} messages / ${model.groupCount} author groups / ${model.activeAuthors} voices`,padding,y+17,13,'regular',colors.muted,{x:padding,y,width:width-2*padding,height:24}));y+=42;
  for(const g of model.groups){const top=y;const bodyX=padding+16,bodyW=width-2*padding-32-stampWidth-gap;
   append(lines,line(g.label,bodyX,y+fontSize+3,fontSize,'semibold',colors.accent,{x:bodyX,y,width:bodyW,height:headerH}));y+=headerH;
   for(const m of g.messages){for(let i=0;i<m.lines.length;i++){append(lines,line(m.lines[i],bodyX,y+fontSize+2,fontSize,'regular',colors.ink,{x:bodyX,y,width:bodyW,height:bodyHeight}));if(i===0)append(lines,line(m.time,width-padding-16-stampWidth,y+fontSize+1,12,'regular',colors.muted,{x:width-padding-16-stampWidth,y,width:stampWidth,height:bodyHeight}));y+=bodyHeight;}y+=8;}
   y+=8;append(rects,{x:padding,y:top-4,width:width-2*padding,height:y-top+4});y+=18;
  }
  const height=y+padding-18;if(height>maxHeight||width*height>2000000)throw new RangeError('dialogue canvas budget');const result=freeze({width,height,padding,fontSize,theme,colors,lines,rects,model});plans.add(result);return result;
 }
 function tile(p){if(!plans.has(p))throw new TypeError('plan issued by this engine');const canvas=env.createCanvas(p.width,p.height),ctx=canvas.getContext('2d');for(const r of p.rects){ctx.fillStyle=p.colors.panel;ctx.fillRect(r.x,r.y,r.width,r.height);ctx.fillStyle=p.colors.accent;ctx.fillRect(r.x,r.y,3,r.height);}ctx.textBaseline='alphabetic';for(const l of p.lines){ctx.font=font(l.role,l.size);ctx.fillStyle=l.color;ctx.fillText(l.text,l.x,l.baseline);}return Object.freeze({canvas,plan:p,place(host,x=0,y=0){finite(x);finite(y);if(!host||typeof host.drawImage!=='function')throw new TypeError('trusted host 2D context');host.drawImage(canvas,x,y);}});}
 return Object.freeze({plan,tile});
}
