/** Narrow original importer for caller-supplied Hanzi Writer/Make Me a Hanzi data.
 * No network, dataset, license conversion or third-party engine implementation. */
import {compileOrderedStrokeReveal,record,dense,finite} from './index.mjs';
const arities={M:2,L:2,Q:4,C:6,Z:0};
function parseOutline(text){
 if(typeof text!=='string'||text.length<1||text.length>262144)throw TypeError('Bounded outline string required');
 // Deliberately not a general SVG parser: only explicit absolute M L Q C Z.
 const tokens=[];const token=/\s+|[MLQCZ]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/gy;let cursor=0;
 while(cursor<text.length){token.lastIndex=cursor;const m=token.exec(text);if(!m)throw TypeError('Unsupported SVG outline syntax');cursor=token.lastIndex;if(!/^\s+$/.test(m[0]))tokens.push(m[0]);if(tokens.length>57344)throw RangeError('Too many outline tokens');}
 const commands=[];for(let i=0;i<tokens.length;){const op=tokens[i++];if(!Object.hasOwn(arities,op))throw TypeError('Explicit absolute command required');const values=[];for(let n=0;n<arities[op];n++){if(i>=tokens.length||/^[MLQCZ]$/.test(tokens[i]))throw TypeError('Missing command coordinates');values.push(finite(Number(tokens[i++]),-1e6,1e6,'coordinate'));}commands.push({op,values});}
 return commands;
}
export function compileHanziStrokeReveal(spec){
 record(spec,['strokes','medians','startTime','strokeDuration','liftDuration','revealWidth'],'Hanzi input');dense(spec.strokes,1,256,'strokes');dense(spec.medians,spec.strokes.length,spec.strokes.length,'medians');
 const strokes=spec.strokes.map((s,i)=>{dense(spec.medians[i],2,4096,'median');return{outline:parseOutline(s),median:spec.medians[i].map(p=>{dense(p,2,2,'median point');return{x:finite(p[0],-1e6,1e6,'x'),y:finite(p[1],-1e6,1e6,'y')};}),duration:spec.strokeDuration,revealWidth:spec.revealWidth};});
 return compileOrderedStrokeReveal({strokes,startTime:spec.startTime,liftDuration:spec.liftDuration});
}
