/** Original weighted port allocation; envelope compilation is an existing mechanism. */
import {object,number,integer,id,freeze,fail} from './validate.mjs';
import {transformBounds} from './matrix.mjs';
import {compileSampledBand} from './sampled-band.mjs';
const lexical=(a,b)=>a<b?-1:a>b?1:0;
function sum(values){let total=0,correction=0;for(const value of values){const adjusted=value-correction,next=total+adjusted;correction=(next-total)-adjusted;total=next;}return total;}
function dense(a,max){
 if(!Array.isArray(a)||a.length>max)fail('Invalid array size');
 for(let i=0;i<a.length;i++)if(!Object.hasOwn(a,i))fail('Sparse array');
 for(const k of Reflect.ownKeys(a))if(k!=='length'&&!(typeof k==='string'&&/^(0|[1-9][0-9]*)$/.test(k)&&Number(k)<a.length))fail('Unknown array field');return a;
}
function box(v,derived=false){
 object(v,['x','y','width','height'],['x','y','width','height']);
 return{x:number(v.x,derived?-2e7:-1e7,derived?2e7:1e7),y:number(v.y,derived?-2e7:-1e7,derived?2e7:1e7),width:number(v.width,derived?0:.001,derived?2e7:1e7),height:number(v.height,derived?0:.001,derived?2e7:1e7)};
}
export function weightedFlowLayout(input){
 object(input,['nodes','links','unitsToPixels','portGap','samples'],['nodes','links','unitsToPixels','portGap','samples']);
 const scale=number(input.unitsToPixels,.001,1000),gap=number(input.portGap,0,10000),count=integer(input.samples,2,256),byId=new Map();
 const nodes=dense(input.nodes,64).map(n=>{
  object(n,['itemId','rect','matrix','zIndex','geometryBounds'],['itemId','rect','matrix','zIndex','geometryBounds']);
  const itemId=id(n.itemId);if(byId.has(itemId))fail('Duplicate node ID');
  const rect=box(n.rect),matrix=dense(n.matrix,6).map(x=>number(x,-1e7,1e7));
  if(matrix.length!==6||matrix[0]!==1||matrix[1]!==0||matrix[2]!==0||matrix[3]!==1)fail('Translation-only nodes required');
  integer(n.zIndex,0,255);const bounds=box(n.geometryBounds,true),expected=transformBounds(matrix,rect);
  for(const k of Object.keys(expected))if(Math.abs(bounds[k]-expected[k])>1e-7)fail('Stale node geometry');
  const node={itemId,bounds:expected,inputs:[],outputs:[]};byId.set(itemId,node);return node;
 });
 const seen=new Set(),links=dense(input.links,128).map(l=>{
  object(l,['linkId','fromId','toId','value'],['linkId','fromId','toId','value']);
  const linkId=id(l.linkId),fromId=id(l.fromId),toId=id(l.toId),value=number(l.value,0,1e6);
  if(seen.has(linkId))fail('Duplicate link ID');seen.add(linkId);
  const from=byId.get(fromId),to=byId.get(toId);if(!from||!to)fail('Unknown flow endpoint');
  if(fromId===toId||from.bounds.x+from.bounds.width>=to.bounds.x)fail('Flows require separated left-to-right nodes');
  const thickness=value*scale;
  if(value>0&&!(thickness>0&&thickness/2>0))fail('Positive flow thickness is numerically unrepresentable');
  const link={linkId,fromId,toId,value,thickness};from.outputs.push(link);to.inputs.push(link);return link;
 });
 const placements=new Map(links.map(l=>[l.linkId,{}])),ports=[],balances=[];
 for(const node of nodes){
  const result={itemId:node.itemId,inputs:[],outputs:[]};let incoming=0,outgoing=0;
  for(const side of ['inputs','outputs']){
   const other=side==='inputs'?'fromId':'toId',ordered=[...node[side]].sort((a,b)=>{
    const aa=byId.get(a[other]).bounds,bb=byId.get(b[other]).bounds;
    return aa.y+aa.height/2-(bb.y+bb.height/2)||lexical(a[other],b[other])||lexical(a.linkId,b.linkId);
   });
   // Gaps are reserved even for zero-weight identities: no discontinuous jump
   // when a link appears during a time-addressed data transition.
   const occupied=sum(ordered.map(l=>l.thickness))+Math.max(0,ordered.length-1)*gap;
   const tolerance=Number.EPSILON*32*Math.max(1,occupied,node.bounds.height);
   if(occupied-node.bounds.height>tolerance)fail('Flow ports exceed node height');
   let y=node.bounds.y+(node.bounds.height-occupied)/2;
   for(const link of ordered){
    const port={linkId:link.linkId,x:side==='inputs'?node.bounds.x:node.bounds.x+node.bounds.width,y:y+link.thickness/2,thickness:link.thickness};
    result[side].push(port);placements.get(link.linkId)[side==='inputs'?'target':'source']=port;y+=link.thickness+gap;
   }
   if(side==='inputs')incoming=sum(ordered.map(l=>l.value));else outgoing=sum(ordered.map(l=>l.value));
  }
  ports.push(result);balances.push({itemId:node.itemId,incoming,outgoing,net:incoming-outgoing});
 }
 return freeze({links:links.map(link=>{
  const {source,target}=placements.get(link.linkId),dx=target.x-source.x;
  const samples=Array.from({length:count},(_,i)=>{const t=i/(count-1),u=t*t*(3-2*t);return{x:i===0?source.x:i===count-1?target.x:source.x+dx*t,y:i===0?source.y:i===count-1?target.y:source.y+(target.y-source.y)*u,halfWidth:link.thickness/2};});
  return{...link,source:{...source},target:{...target},band:compileSampledBand({samples})};
 }),ports,balances});
}
