import {record,number,dense} from '../../internal/coverage-validation.mjs';
// Unit-square / centered-circle intersection area. Independent of output scale.
function area(r) {
  if (r<=0.5) return Math.PI*r*r;
  return Math.PI*r*r-4*(r*r*Math.acos(0.5/r)-0.5*Math.sqrt(r*r-0.25));
}
function radius(c) {
  if(c===0) return 0;
  if(c===1) return Math.SQRT1_2;
  if(c<=Math.PI/4) return Math.sqrt(c)/Math.sqrt(Math.PI);
  let lo=0.5,hi=Math.SQRT1_2;
  for(let i=0;i<54;i++){const mid=(lo+hi)/2;if(area(mid)<c)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
/** Coverage means ideal clipped-circle area divided by cell area; not pixel AA accuracy. */
export function halftoneScreen(spec) {
  record(spec,['columns','rows','values','cellSize','origin','angle'],'screen');
  const {columns,rows,values,cellSize,origin,angle}=spec;
  number(columns,1,1024,'columns',true);number(rows,1,1024,'rows',true);
  if(columns*rows>65536) throw RangeError('screen: max 65536 cells');
  number(cellSize,0.001,10000,'cellSize');number(angle,-Math.PI*2,Math.PI*2,'angle');
  record(origin,['x','y'],'origin');number(origin.x,-1e7,1e7,'origin.x');number(origin.y,-1e7,1e7,'origin.y');
  dense(values,columns*rows);for(const c of values)number(c,0,1,'coverage');
  const c=Math.cos(angle),s=Math.sin(angle),matrix=Object.freeze([c,s,-s,c,origin.x,origin.y]);
  // Conservative bound of all transformed corners (and any clipped rendered geometry).
  const extent=columns*cellSize+rows*cellSize;
  if(!Number.isFinite(extent)||Math.max(Math.abs(origin.x),Math.abs(origin.y))+extent>3e7)throw RangeError('screen: derived geometry exceeds coordinate budget');
  const cells=[];
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
    const x=column*cellSize,y=row*cellSize,coverage=values[row*columns+column];
    cells.push(Object.freeze({id:`${column}:${row}`,column,row,coverage,center:Object.freeze([x+cellSize/2,y+cellSize/2]),clip:Object.freeze([x,y,cellSize,cellSize]),radius:radius(coverage)*cellSize}));
  }
  return Object.freeze({columns,rows,cellSize,matrix,cells:Object.freeze(cells)});
}
