/** Experimental original layered DAG layout; fixed heuristic, not a crossing solver. */
import {object,number,id,freeze,fail} from './validate.mjs';
import {composeTransform,transformBounds} from './matrix.mjs';
function array(a,max){
 if(!Array.isArray(a)||a.length>max)fail('Invalid array size');
 for(let i=0;i<a.length;i++)if(!Object.hasOwn(a,i))fail('Sparse array');
 for(const k of Reflect.ownKeys(a))if(k!=='length'&&!(typeof k==='string'&&/^(0|[1-9][0-9]*)$/.test(k)&&Number(k)<a.length))fail('Unknown array field');
 return a;
}
const lexical=(a,b)=>a<b?-1:a>b?1:0;
export function layeredDagLayout(input){
 object(input,['nodes','links','layerGap','nodeGap'],['nodes','links','layerGap','nodeGap']);
 const layerGap=number(input.layerGap,.001,4096),nodeGap=number(input.nodeGap,0,4096),byId=new Map();
 const nodes=array(input.nodes,64).map((n,index)=>{
  object(n,['itemId','width','height'],['itemId','width','height']);
  const itemId=id(n.itemId);if(byId.has(itemId))fail('Duplicate node ID');
  const node={itemId,width:number(n.width,.001,4096),height:number(n.height,.001,4096),index};byId.set(itemId,node);return node;
 });
 const incoming=new Map(nodes.map(n=>[n.itemId,new Set()])),outgoing=new Map(nodes.map(n=>[n.itemId,new Set()])),linkIds=new Set();
 for(const l of array(input.links,128)){
  object(l,['linkId','fromId','toId'],['linkId','fromId','toId']);
  const linkId=id(l.linkId),fromId=id(l.fromId),toId=id(l.toId);
  if(linkIds.has(linkId))fail('Duplicate link ID');linkIds.add(linkId);
  if(!byId.has(fromId)||!byId.has(toId))fail('Unknown link endpoint');
  if(fromId===toId)fail('Self links are not a DAG');
  // Parallel links carry no extra topological weight.
  outgoing.get(fromId).add(toId);incoming.get(toId).add(fromId);
 }
 const remaining=new Map([...incoming].map(([k,v])=>[k,v.size]));
 const queue=[...remaining].filter(([,v])=>v===0).map(([k])=>k).sort(lexical);
 const levels=new Map(nodes.map(n=>[n.itemId,0]));let visited=0;
 while(queue.length){
  const current=queue.shift();visited++;
  for(const next of [...outgoing.get(current)].sort(lexical)){
   levels.set(next,Math.max(levels.get(next),levels.get(current)+1));
   remaining.set(next,remaining.get(next)-1);
   if(remaining.get(next)===0){queue.push(next);queue.sort(lexical);}
  }
 }
 if(visited!==nodes.length)fail('Directed cycle is unsupported');
 if(!nodes.length)return freeze({items:[],placements:[],extent:{width:0,height:0}});
 const layers=Array.from({length:Math.max(...levels.values())+1},()=>[]);
 for(const n of nodes)layers[levels.get(n.itemId)].push(n.itemId);
 for(const layer of layers)layer.sort(lexical);
 const ranks=()=>new Map(layers.flatMap(layer=>layer.map((node,i)=>[node,i/Math.max(1,layer.length-1)])));
 // Two fixed bidirectional barycentric sweeps. This can reduce crossings; it
 // does not prove a global minimum or route around intervening rectangles.
 for(let pass=0;pass<2;pass++)for(const direction of [1,-1]){
  const indices=Array.from({length:layers.length},(_,i)=>i);if(direction<0)indices.reverse();
  for(const index of indices){
   const rank=ranks(),neighbors=direction>0?incoming:outgoing;
   const score=k=>{const ns=[...neighbors.get(k)].sort(lexical);return ns.length?ns.reduce((sum,n)=>sum+rank.get(n),0)/ns.length:Infinity;};
   layers[index].sort((a,b)=>{const x=score(a),y=score(b);return x===y?lexical(a,b):x<y?-1:1;});
  }
 }
 const heights=layers.map(layer=>layer.reduce((sum,k)=>sum+byId.get(k).height,0)+(layer.length-1)*nodeGap);
 const maxHeight=Math.max(...heights),assigned=new Map();let x=0;
 layers.forEach((layer,level)=>{
  let y=(maxHeight-heights[level])/2;
  for(const [order,key] of layer.entries()){
   const n=byId.get(key),rect={x:0,y:0,width:n.width,height:n.height},matrix=composeTransform({x,y});
   assigned.set(key,{item:{itemId:key,rect,matrix,zIndex:n.index,geometryBounds:transformBounds(matrix,rect)},placement:{itemId:key,layer:level,order}});
   y+=n.height+nodeGap;
  }
  x+=Math.max(...layer.map(k=>byId.get(k).width))+layerGap;
 });
 return freeze({items:nodes.map(n=>assigned.get(n.itemId).item),placements:nodes.map(n=>assigned.get(n.itemId).placement),extent:{width:x-layerGap,height:maxHeight}});
}
