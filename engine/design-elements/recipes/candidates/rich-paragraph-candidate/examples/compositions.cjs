'use strict';
// Original fictional examples; neither is an article/template copy.
function label(g,s,x,y,size,color,weight=400){g.font=`${weight} ${size}px "RichDemoSans"`;g.fontVariationSettings=`"wght" ${weight}, "opsz" 14`;g.fillStyle=color;g.textBaseline='alphabetic';g.fillText(s,x,y);}
function fieldnote(env){
 const c=env.api.createCanvas(1080,680),g=c.getContext('2d');g.fillStyle='#f5f0e7';g.fillRect(0,0,1080,680);
 label(g,'FIELDNOTE  /  SYNTHETIC RELEASE',56,60,14,'#9e3d22',600);label(g,'Small changes.',56,134,54,'#282520',600);label(g,'Clear boundaries.',56,194,54,'#282520',600);
 const main={width:620,height:300,fontSize:23,lineHeight:40,padding:8,runs:[{kind:'text',text:'A release note should explain '},{kind:'em',text:'one change at a time'},{kind:'text',text:'. Use '},{kind:'code',text:'preview --local'},{kind:'text',text:' to inspect a fictional build, then describe what changed and what stayed the same. '},{kind:'em',text:'Evidence belongs beside the claim'},{kind:'text',text:'; never bury it.'}]};
 const side={width:300,height:260,fontSize:18,lineHeight:34,padding:16,colors:{text:'#f8efe7',em:'#ffba96',code:'#ece1ff',chip:'#35293e',chipBorder:'#5b4964'},runs:[{kind:'text',text:'Keep labels short. '},{kind:'em',text:'Name the constraint.'},{kind:'text',text:' An identifier such as '},{kind:'code',text:'demo-014'},{kind:'text',text:' is a synthetic marker, not a live ticket.'}]};
 g.fillStyle='#2b242b';g.fillRect(724,250,300,330);label(g,'02 / WRITING NOTES',740,284,14,'#ffba96',600);
 const layouts=[env.engine.draw(g,main,48,246),env.engine.draw(g,side,724,300)];
 g.fillStyle='#c7b9a9';g.fillRect(56,608,968,1);label(g,'Static composition study. No benchmark, live system, or product endorsement.',56,642,15,'#6f6153');
 return {canvas:c,layouts};
}
function archive(env){
 const c=env.api.createCanvas(1080,800),g=c.getContext('2d');g.fillStyle='#e9e7f1';g.fillRect(0,0,1080,800);g.fillStyle='#29243c';g.fillRect(0,0,1080,230);
 label(g,'COLLECTION ROOM / FICTIONAL WORKSHOP',48,57,14,'#c2b4ff',600);label(g,'A label is a small invitation.',48,122,43,'#faf8ff',600);label(g,'Two voices, one measured paragraph system.',48,172,21,'#d3cbe4');
 const palette={text:'#302b3d',em:'#6450a4',code:'#513b78',chip:'#f0ebfa',chipBorder:'#cabde0'};
 const models=[
  {width:444,height:340,fontSize:21,lineHeight:38,padding:12,colors:palette,runs:[{kind:'em',text:'Begin with what can be seen.'},{kind:'text',text:' Describe the material, the scale, and one small detail. The catalogue label '},{kind:'code',text:'shelf-07'},{kind:'text',text:' is fictional. It is kept together so that a reader can scan it without guessing where the name ends.'}]},
  {width:444,height:340,fontSize:21,lineHeight:38,padding:12,colors:palette,runs:[{kind:'text',text:'Leave space for '},{kind:'em',text:'a different interpretation'},{kind:'text',text:'. A short note can pair careful language with an inventory token such as '},{kind:'code',text:'study / 204'},{kind:'text',text:'. Neither the label nor this layout claims a real collection, object, or valuation.'}]}
 ];
 const layouts=[];for(let i=0;i<2;i++){const x=48+i*504;g.fillStyle='#fffeff';g.fillRect(x,276,480,420);label(g,i?'02  /  CONTEXT':'01  /  OBSERVATION',x+20,318,14,'#6450a4',600);layouts.push(env.engine.draw(g,models[i],x+18,338));}
 label(g,'Words wrap; identifiers do not. Change the content before shrinking the type.',48,752,18,'#62596e');return {canvas:c,layouts};
}
module.exports={fieldnote,archive};
