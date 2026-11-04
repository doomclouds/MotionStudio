/** Original bounded ordered slice-and-dice hierarchy layout. No renderer or animation. */
const fail=m=>{throw new TypeError(m)}, finite=(v,lo,hi)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)fail('Number outside bounded domain');return v};
function object(o,keys){if(!o||Object.getPrototypeOf(o)!==Object.prototype||Reflect.ownKeys(o).some(k=>!keys.includes(k)))fail('Expected plain object with supported fields');for(const k of Reflect.ownKeys(o))if(!('value'in Object.getOwnPropertyDescriptor(o,k)))fail('Accessors unsupported');}
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o)}return o}
export function layoutWeightedHierarchy(input){
 object(input,['tree','bounds','axis']);const axis=input.axis??'x';if(axis!=='x'&&axis!=='y')fail('axis must be x or y');const b=input.bounds;object(b,['x','y','width','height']);const bounds={x:finite(b.x,-1e6,1e6),y:finite(b.y,-1e6,1e6),width:finite(b.width,.001,1e6),height:finite(b.height,.001,1e6)};
 const ids=new Set(),visited=new Set();let count=0;
 function read(n,depth){if(++count>256||depth>16)fail('Hierarchy resource limit');object(n,['id','weight','children']);if(typeof n.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(n.id)||ids.has(n.id)||visited.has(n))fail('Unique bounded IDs and acyclic tree required');ids.add(n.id);visited.add(n);
  if(Object.hasOwn(n,'children')){if(Object.hasOwn(n,'weight'))fail('Internal weights derived only');const c=n.children;if(!Array.isArray(c)||Object.getPrototypeOf(c)!==Array.prototype||!c.length||c.length>128||Reflect.ownKeys(c).length!==c.length+1)fail('Dense bounded children required');for(let i=0;i<c.length;i++)if(!Object.hasOwn(c,i)||!('value'in Object.getOwnPropertyDescriptor(c,String(i))))fail('Dense data children required');const children=c.map(x=>read(x,depth+1)),weight=children.reduce((s,x)=>s+x.weight,0);if(weight>1e12)fail('Total weight limit');return{id:n.id,children,weight};}
  return{id:n.id,weight:finite(n.weight,0,1e9)};
 }
 const tree=read(input.tree,0);if(tree.weight===0)fail('Root requires positive total weight');const nodes=[];
 function place(n,r,depth,parentId){if(n.weight>0&&(!(r.width*r.height>0)||!(r.x+r.width>r.x)||!(r.y+r.height>r.y)))fail('Positive area is not representable');nodes.push({id:n.id,parentId,depth,weight:n.weight,leaf:!n.children,rect:{...r}});if(!n.children)return;const horizontal=(depth%2===0)===(axis==='x'),start=horizontal?r.x:r.y,size=horizontal?r.width:r.height,end=start+size;let cursor=start;const last=n.children.findLastIndex(c=>c.weight>0);
  n.children.forEach((c,i)=>{const next=c.weight===0?cursor:i===last?end:cursor+size*(c.weight/n.weight);const span=next-cursor;if(c.weight>0&&(!(span>0)||!Number.isFinite(span)))fail('Positive region is not representable');const cr=horizontal?{x:cursor,y:r.y,width:span,height:r.height}:{x:r.x,y:cursor,width:r.width,height:span};if(n.weight===0){cr.width=0;cr.height=0;}place(c,cr,depth+1,n.id);cursor=next});
 }
 place(tree,bounds,0,null);return freeze({algorithm:'ordered-slice-dice',axis,totalWeight:tree.weight,bounds,nodes});
}
