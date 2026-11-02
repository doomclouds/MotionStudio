import{compileTiming,createTimingKit}from'./index.mjs';
import{HANDOFF,CAPTURE}from'./fixtures.mjs';
export function buildExamples(api,env){
 const kit=createTimingKit(api,env),files={},models=[compileTiming(HANDOFF),compileTiming(CAPTURE)];
 const text=(c,s,x,y,size=20,color='#26364b')=>{c.font=`${size}px TimingSans`;c.fillStyle=color;c.direction='ltr';c.letterSpacing='0px';c.wordSpacing='0px';c.textAlign='left';c.textBaseline='alphabetic';c.fillText(s,x,y);};
 const summary=m=>({cycles:m.cycles,halfTicks:m.ticks,rows:m.rows.length,busLabels:m.rows.filter(r=>r.type==='bus').flatMap(r=>r.values.filter(s=>s.label!==null).map(s=>s.label)),highCells:Object.fromEntries(m.rows.filter(r=>r.type==='digital').map(r=>[r.name,r.values.reduce((a,b)=>a+b,0)]))});
 {
  const m=models[0],c=api.createCanvas(1440,800),g=c.getContext('2d');g.fillStyle='#f3eee5';g.fillRect(0,0,1440,800);
  text(g,'SIGNAL NOTES / STUDY 01',80,62,18,'#87513d');text(g,'A request, held until ready.',80,132,46);text(g,'One synthetic model. Four aligned lanes. No running hardware.',80,175,22,'#637083');
  g.fillStyle='#ffffff';g.fillRect(60,215,1320,426);const tile=kit.timingDiagramTile({model:m,width:640,labelWidth:120});kit.place(g,tile,80,247,2);
  const s=summary(m);text(g,`${s.cycles} cycles  /  ${s.halfTicks} half-ticks  /  ${s.rows} lanes  /  token ${s.busLabels.join(', ')}`,80,700,24);
  text(g,'Hatching means unspecified symbol. Tick numbers are unitless, not measured time.',80,744,18,'#637083');
  files['handoff.png']=c.toBuffer('image/png');files['handoff-layout.json']=JSON.stringify({canvas:[1440,800],summary:s,diagram:tile.plan,placement:{x:80,y:247,scale:2}},null,2)+'\n';
 }
 {
  const m=models[1],c=api.createCanvas(1200,1280),g=c.getContext('2d');g.fillStyle='#eaf0f5';g.fillRect(0,0,1200,1280);
  text(g,'SIGNAL NOTES / STUDY 02',80,62,18,'#58688a');text(g,'Shared ticks, different views.',80,126,42);text(g,'A complete diagram and two independently composed lanes.',80,170,21,'#637083');
  g.fillStyle='#ffffff';g.fillRect(50,205,1100,466);const diagram=kit.timingDiagramTile({model:m,width:520,labelWidth:130});kit.place(g,diagram,80,230,2);
  text(g,'DETAIL / SYMBOL PARTITIONS',80,724,19,'#58688a');g.fillStyle='#ffffff';g.fillRect(50,750,1100,125);const bus=kit.laneTile({row:m.rows[2],cycles:m.cycles,width:510});kit.place(g,bus,90,780,2);
  text(g,'DETAIL / HOLD STATE',80,928,19,'#58688a');g.fillStyle='#ffffff';g.fillRect(50,954,1100,125);const hold=kit.laneTile({row:m.rows[3],cycles:m.cycles,width:510});kit.place(g,hold,90,984,2);
  const s=summary(m);text(g,`${s.cycles} cycles / ${s.halfTicks} half-ticks / ${s.rows} lanes / ${s.busLabels.join(' - ')}`,80,1141,23);
  text(g,`Hold-high cells: ${s.highCells.hold} / ${s.halfTicks}. These are cells, not duration measurements.`,80,1185,18,'#637083');text(g,'Static composition only. No sampler, protocol simulator, playback or animation.',80,1230,18,'#637083');
  files['capture.png']=c.toBuffer('image/png');files['capture-layout.json']=JSON.stringify({canvas:[1200,1280],summary:s,diagram:diagram.plan,details:[bus.plan,hold.plan]},null,2)+'\n';files['symbol-lane.png']=kit.png(bus);
 }
 return files;
}
