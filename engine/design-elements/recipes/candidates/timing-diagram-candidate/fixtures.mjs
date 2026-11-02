// Newly authored synthetic values. Ticks have no physical unit.
const digital=(name,values)=>({name,type:'digital',values});
const bus=(name,spans)=>({name,type:'bus',values:spans.map(([start,end,label])=>({start,end,label}))});
export const HANDOFF={cycles:5,rows:[digital('tick',Array.from({length:10},(_,i)=>1-i%2)),digital('offer',[0,0,1,1,1,1,0,0,0,0]),digital('ready',[1,1,0,0,1,1,1,1,1,1]),bus('token',[[0,2,null],[2,6,'Q4'],[6,10,null]])]};
export const CAPTURE={cycles:8,rows:[digital('sample',Array.from({length:16},(_,i)=>i%2)),digital('gate',[0,0,1,1,1,1,0,0,1,1,1,1,1,1,0,0]),bus('symbol',[[0,2,null],[2,6,'M1'],[6,8,null],[8,12,'N8'],[12,14,'P3'],[14,16,null]]),digital('hold',[0,0,0,0,1,1,1,1,0,0,0,0,1,1,0,0]),digital('commit',[0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0])]};
