// MIT. Restricted static geometry; trusted JavaScript intrinsics and Canvas factory.
import {record,dense,integer,append,freeze,finite} from './data.mjs';
const matrices=new WeakSet(),nests=new WeakSet();
const color=v=>{if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v))throw new TypeError('primitive opaque #RRGGBB');return v.toLowerCase();};
export function createRunMatrix(input){
 const q=record(input,['rows']),rows=dense(q.rows,1,32),segments=[];let columns=0,bits=0,singles=0;
 for(let y=0;y<rows.length;y++){const r=rows[y];if(typeof r!=='string'||!/^[01]{1,64}$/.test(r))throw new TypeError('primitive binary rows');if(!y)columns=r.length;else if(columns!==r.length)throw new RangeError('equal widths');
  for(let x=0;x<columns;){if(r[x]==='0'){x++;continue;}const start=x;while(x<columns&&r[x]==='1'){x++;bits++;}const span=x-start;append(segments,{row:y,column:start,span});if(span===1)singles++;}}
 if(!bits)throw new RangeError('at least one occupied bit');const m=freeze({kind:'run-matrix',rows,columns,rowCount:rows.length,bits,singles,bars:segments.length-singles,segments});matrices.add(m);return m;
}
export function createNestedTile(input){
 const q=record(input,['layers']),layers=[];let prev=-1;
 for(const v of dense(q.layers,1,8)){const z=record(v,['inset','color']);integer(z.inset,0,4800,'inset basis points');if(z.inset<=prev||(!layers.length&&z.inset!==0))throw new RangeError('first inset0 then strictly increasing');append(layers,{inset:z.inset,color:color(z.color),squareArea:(10000-2*z.inset)**2});prev=z.inset;}
 for(let i=0;i<layers.length;i++)Object.defineProperty(layers[i],'visibleArea',{value:layers[i].squareArea-(i+1<layers.length?layers[i+1].squareArea:0),enumerable:true});
 const m=freeze({kind:'nested-tile',layers,layerCount:layers.length,areaDenominator:100000000});nests.add(m);return m;
}
function model(v,set){if(!set.has(v))throw new TypeError('issued immutable model');return v;}
export function createGeometryKit(input){
 const e=record(input,['createCanvas']);if(typeof e.createCanvas!=='function')throw new TypeError('trusted fresh Canvas factory');const createCanvas=e.createCanvas,plans=new WeakSet(),tiles=new WeakSet();
 const issued=p=>{freeze(p);plans.add(p);return p;};
 const dimensions=(w,h,r)=>{integer(r,1,3,'integer pixelRatio');if(w>2400||h>2400||w*r>4096||h*r>4096||w*h*r*r>6000000)throw new RangeError('bounded physical result');};
 function runPlan(m,options){model(m,matrices);const o=record(options,['cell','rowGap','thickness','padding','color','pixelRatio']);integer(o.cell,8,80,'cell');integer(o.rowGap,0,40,'rowGap');integer(o.thickness,1,Math.floor(.75*o.cell),'thickness');integer(o.padding,4,64,'padding');const fill=color(o.color),width=m.columns*o.cell+2*o.padding,height=m.rowCount*(o.cell+o.rowGap)-o.rowGap+2*o.padding;dimensions(width,height,o.pixelRatio);const capsules=[];
  for(const s of m.segments)append(capsules,{x:o.padding+(s.column+.125)*o.cell,y:o.padding+s.row*(o.cell+o.rowGap)+(o.cell-o.thickness)/2,width:(s.span-.25)*o.cell,height:o.thickness,radius:o.thickness/2,row:s.row,column:s.column,span:s.span});
  return issued({kind:'runs',model:m,width,height,pixelRatio:o.pixelRatio,fill,capsules});
 }
 function nestedPlan(m,options){model(m,nests);const o=record(options,['size','padding','pixelRatio']);integer(o.size,8,1000,'size');integer(o.padding,4,64,'padding');const width=o.size+2*o.padding;dimensions(width,width,o.pixelRatio);const squares=[];
  for(const l of m.layers){const inset=o.size*l.inset/10000;append(squares,{x:o.padding+inset,y:o.padding+inset,width:o.size-2*inset,height:o.size-2*inset,fill:l.color,inset:l.inset,visibleArea:l.visibleArea});}
  return issued({kind:'nested',model:m,width,height:width,pixelRatio:o.pixelRatio,squares});
 }
 function tile(p){if(!plans.has(p))throw new TypeError('issued plan');const canvas=createCanvas(p.width*p.pixelRatio,p.height*p.pixelRatio),c=canvas.getContext('2d');c.scale(p.pixelRatio,p.pixelRatio);
  if(p.kind==='runs'){c.fillStyle=p.fill;for(const r of p.capsules){c.beginPath();c.roundRect(r.x,r.y,r.width,r.height,r.radius);c.fill();}}
  else for(const r of p.squares){c.fillStyle=r.fill;c.fillRect(r.x,r.y,r.width,r.height);}
  const t=Object.freeze({canvas,plan:p,width:p.width,height:p.height});tiles.add(t);return t;
 }
 function place(c,t,x,y){if(!tiles.has(t))throw new TypeError('issued tile');finite(x);finite(y);c.drawImage(t.canvas,x,y,t.width,t.height);}
 return Object.freeze({runPlan,nestedPlan,tile,place});
}
