export const cases = [
 {name:'listening-room-glass',props:{bounds:{x:64,y:100,width:620,height:380},data:{variant:'glass',title:'LISTENING ROOM',subtitle:'A quiet surface for the next discovery',radius:36,padding:32,elevation:2,opacity:.14},theme:{ink:'#ffffff',muted:'#e6edff',edge:'#ffffff',surface:'#ffffff',shadow:'#12234f',fontSize:30}}},
 {name:'print-workshop-paper',props:{bounds:{x:450,y:140,width:460,height:320},data:{variant:'paper',title:'PRINT / FOLD / SHARE',subtitle:'A tactile note in an editorial composition',radius:0,padding:28,elevation:2},theme:{surface:'#f4e6bb',ink:'#23211e',muted:'#544b38',edge:'#23211e',shadow:'#23211e',fontSize:24}}}
];
export function backdrop({ctx,width,height}){const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,'#284dac');g.addColorStop(.45,'#8b53a4');g.addColorStop(1,'#f57870');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);}
export default cases;
