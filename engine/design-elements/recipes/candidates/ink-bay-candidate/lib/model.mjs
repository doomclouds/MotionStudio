// SPDX-License-Identifier: MIT
import{record,dense,text,append,freeze}from'./input.mjs';
const issued=new WeakSet();
export function createRows(input){const p=record(input,['rows']),rows=dense(p.rows,1,8),out=[],keys=new Set();for(const row of rows){const r=record(row,['key','headline','side','notes']),key=text(r.key,1,24);if(!/^[A-Za-z][A-Za-z0-9-]*$/.test(key)||keys.has(key))throw Error('unique identifier');keys.add(key);const headline=text(r.headline,2,40),side=r.side;if(side!=='left'&&side!=='right')throw Error('side');const notes=[];for(const s of dense(r.notes,1,4))append(notes,text(s,1,60));append(out,{key,headline,side,notes})}const model=freeze({rows:out});issued.add(model);return model}
export const isRows=x=>issued.has(x);
