// SPDX-License-Identifier: MIT
// Original static composition example. No upstream text, fonts, icons or media.
// Not a new family, ranking service, live connector or responsive UI.
import {draw as surface} from '../families/material-surfaces/index.mjs';
import {layoutMetricStrip} from '../recipes/candidates/metric-strip/metric-strip.mjs';
const string=(s)=>{if(typeof s!=='string'||!s.trim()||/[\r\n]/.test(s))throw TypeError('nonempty single-line text');return s;};
export function planBriefing(input){
 const {title,details,priorityIds}=input;
 string(title);
 if(!Array.isArray(details)||details.length<2||details.length>6)throw RangeError('2–6 details');
 if(!Array.isArray(priorityIds)||priorityIds.length<1||priorityIds.length>3)throw RangeError('1–3 selected priorities');
 const seen=new Set();const rows=Array.from(details,(d)=>{if(!d)throw TypeError('dense details');for(const k of ['id','title','note'])string(d[k]);if(seen.has(d.id))throw TypeError('duplicate detail id');seen.add(d.id);if(!['ready','open'].includes(d.state))throw TypeError('explicit state');return {id:d.id,title:d.title,note:d.note,state:d.state};});
 const selected=new Set();const priorities=Array.from(priorityIds,(id)=>{if(selected.has(id))throw TypeError('duplicate priority id');selected.add(id);const row=rows.find(d=>d.id===id);if(!row)throw RangeError('missing detail id');return {...row};});
 const metrics=layoutMetricStrip({bounds:{x:48,y:160,width:1104,height:116},items:[{id:'total',label:'Listed records',kind:'count',value:rows.length},{id:'open',label:'Open records',kind:'count',value:rows.filter(d=>d.state==='open').length},{id:'selected',label:'Selected priorities',kind:'count',value:priorities.length}]});
 return {title,rows,priorities,metrics,staticOnly:true};
}
export function renderBriefing(api,input,fontFamily){
 if(typeof fontFamily!=='string'||!api.GlobalFonts.has(fontFamily))throw TypeError('explicit registered font required');
 const plan=planBriefing(input),canvas=api.createCanvas(1200,1000),ctx=canvas.getContext('2d'),calls=[],labels=[];
 const p={background:'#eeeae2',surface:'#fbfaf7',ink:'#233b39',muted:'#586a68',accent:'#246858',edge:'#cbd4cc'};
 const label=(text,x,y,size,maxWidth,color=p.ink)=>{ctx.font=`400 ${size}px ${fontFamily}`;const width=ctx.measureText(text).width;if(width>maxWidth)throw RangeError('text overflow: '+text);labels.push({text,x,y,size,width,maxWidth});ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(text,x,y);};
 const panel=(region,bounds,fill=p.surface)=>{const result=surface(ctx,{bounds,data:{variant:'opaque',padding:20,radius:12,elevation:0},theme:{surface:fill,edge:p.edge,ink:p.ink,fontFamily,fontSize:20}});calls.push({region,id:result.id,bounds:result.bounds});return result;};
 ctx.fillStyle=p.background;ctx.fillRect(0,0,1200,1000);
 label('FIELD NOTES / FICTIONAL STATIC SNAPSHOT',48,50,13,1104,p.accent);
 label(plan.title,48,108,38,1104);
 calls.push({region:'summary',id:plan.metrics.id,items:plan.metrics.cards.length});
 for(const card of plan.metrics.cards){const b={...card.bounds,width:card.bounds.width-12};panel('metric-'+card.id,b);label(card.valueText,b.x+20,b.y+48,32,b.width-40);label(card.label,b.x+20,b.y+85,16,b.width-40,p.muted);}
 label('SELECTED NEXT / AUTHOR-CHOSEN ORDER',48,322,14,1104,p.accent);
 const pw=(1104-(plan.priorities.length-1)*16)/plan.priorities.length;
 plan.priorities.forEach((d,i)=>{const x=48+i*(pw+16);panel('priority-'+d.id,{x,y:346,width:pw,height:130},'#e0eadd');label(String(i+1).padStart(2,'0')+' / '+d.state.toUpperCase(),x+20,380,13,pw-40,p.accent);label(d.title,x+20,416,20,pw-40);label('Record '+d.id,x+20,449,13,pw-40,p.muted);});
 label('ALL LISTED RECORDS / SAME IDS AND TITLES',48,524,14,1104,p.accent);
 panel('details',{x:48,y:548,width:1104,height:48+plan.rows.length*54});
 plan.rows.forEach((d,i)=>{const y=582+i*54;label(d.id,68,y,13,90,p.muted);label(d.title,176,y,18,490);label(d.state.toUpperCase(),1000,y,13,130,p.accent);label(d.note,176,y+20,13,790,p.muted);});
 label('Re-render after edits. No automatic refresh, urgency inference or connected sources.',48,970,14,1104,p.muted);
 return {canvas,plan:{...plan,calls,labels}};
}
export const briefs={
 workshop:{title:'A repair afternoon at the shared bench',details:[{id:'bench',title:'Clear the workbench',note:'Leave one flat area for the demonstration.',state:'open'},{id:'tools',title:'Sort the hand tools',note:'Keep each tool beside its printed label.',state:'ready'},{id:'lamp',title:'Check the desk lamp',note:'Record the observed fault before selecting parts.',state:'open'}],priorityIds:['lamp','bench']},
 archive:{title:'Prepare a small neighborhood archive',details:[{id:'map',title:'Label the street map',note:'Use the date printed on the original folder.',state:'open'},{id:'cards',title:'Count the index cards',note:'Keep blank cards separate from catalogued records.',state:'ready'},{id:'shelf',title:'Mark the shelf groups',note:'Match group names to the finding aid.',state:'open'},{id:'scan',title:'Review the scan list',note:'The list is a plan, not a claim that scans exist.',state:'open'},{id:'table',title:'Set the reading table',note:'Leave space for two open folders.',state:'ready'},{id:'note',title:'Write a visitor note',note:'Explain handling rules in ordinary language.',state:'open'}],priorityIds:['map','note','shelf']}
};
