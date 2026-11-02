// SPDX-License-Identifier: MPL-2.0
import{fields,list,text,number,one,frozen,put}from'./input.mjs';
const known=new WeakSet();
// Modified extraction: no original fixture, brand, fixed palette or scene.
export function compileDataset(input){
 const q=fields(input,['name','times','series','cursor']),name=text(q.name,36),times=list(q.times,2,2401).map(t=>number(t,0,1e6));
 for(let i=1;i<times.length;i++)if(times[i]-times[i-1]<1e-6)throw RangeError('strict increasing sample times');
 if(times.at(-1)-times[0]<.001)throw RangeError('time span');
 const cursor=number(q.cursor,times[0],times.at(-1)),items=list(q.series,1,8),ids=new Set(),series=[];
 let left=0;while(left+1<times.length&&times[left+1]<cursor)left++;
 if(left===times.length-1)left--;
 const right=left+1,alpha=(cursor-times[left])/(times[right]-times[left]);
 for(const item of items){const s=fields(item,['id','label','unit','color','values']),id=text(s.id,32),label=text(s.label,24),unit=text(s.unit,6),color=s.color;
  if(typeof color!=='string'||!/^#[0-9a-fA-F]{6}$/.test(color))throw TypeError('explicit six-digit RGB color');
  if(!/^[A-Z0-9 .:/%+_-]+$/.test(label)||!/^[A-Z0-9 .:/%+_-]+$/.test(unit))throw TypeError('code-label alphabet');
  if(!/^[a-z][a-z0-9/-]*$/.test(id)||ids.has(id))throw TypeError('unique ASCII series id');ids.add(id);
  const values=list(s.values,times.length,times.length).map(v=>number(v,-1e6,1e6));let min=Infinity,max=-Infinity;for(const v of values){min=Math.min(min,v);max=Math.max(max,v);}
  put(series,{id,label,unit,color,values,min,max,cursorValue:values[left]+(values[right]-values[left])*alpha});
 }
 const m=frozen({name,times,series,cursor,timeDomain:[times[0],times.at(-1)],sampleCount:times.length,seriesCount:series.length,cursorBracket:{left,right,alpha},synthetic:true});known.add(m);return m;
}
export function dataset(m){if(!known.has(m))throw TypeError('compiled same-module dataset');return m;}
export function atCursor(m,id){dataset(m);const s=m.series.find(s=>s.id===id);if(!s)throw RangeError('series id');return s.cursorValue;}
export function changeCursor(m,t){dataset(m);return compileDataset({name:m.name,times:m.times,series:m.series.map(s=>({id:s.id,label:s.label,unit:s.unit,color:s.color,values:s.values})),cursor:t});}
