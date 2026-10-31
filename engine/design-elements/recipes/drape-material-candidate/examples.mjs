// SPDX-License-Identifier: MIT
import {compileDrape,createDrapeKit} from './index.mjs';
import {hero,atlas} from './fixtures.mjs';
import {label} from './example-type.mjs';
export function renderExamples(api) {
 const kit=createDrapeKit({createCanvas:(w,h)=>api.createCanvas(w,h)}),files={};
 function surface(w,h,bg){const c=api.createCanvas(w,h),g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,w,h);return[c,g,[]];}
 const [a,c,la]=surface(1080,1440,'#f0e9df'),model=compileDrape(hero),tile=kit.tile(model,{ratio:2});
 label(c,'MATERIAL / STUDY',80,47,2,'#746658',la);label(c,'01',900,47,3,'#746658',la);
 label(c,'FOLD',80,110,31,'#241e29',la);label(c,'STATIC',838,250,4,'#a95231',la);label(c,'2D',838,290,4,'#a95231',la);
 kit.place(c,tile,80,360);
 c.fillStyle='#a95231';c.fillRect(80,1208,920,2);label(c,'COLOUR SHAPED BY REPETITION',80,1234,3,'#241e29',la);
 c.fillStyle=model.low;c.fillRect(80,1290,80,30);c.fillStyle=model.high;c.fillRect(172,1290,80,30);
 label(c,'SEED '+model.seed,310,1289,3,'#241e29',la);label(c,'BASE FREQ '+model.parameters.folds,650,1289,3,'#241e29',la);
 label(c,model.low.toUpperCase()+' / '+model.high.toUpperCase(),80,1339,2,'#746658',la);
 label(c,'NO CLOTH SIMULATION / NO PHOTOGRAPH',80,1386,2,'#746658',la);
 const main={canvas:[1080,1440],model,field:{x:80,y:360,width:920,height:820,ratio:2},labels:la,meaning:'Color endpoint chips and seed/folds derive from the model. Abstract field, not a physical sample.'};
 files['study.png']=a.toBuffer('image/png');files['study-layout.json']=Buffer.from(JSON.stringify(main,null,2)+'\n');files['material-layer.png']=kit.png(tile);
 const[b,d,lb]=surface(1600,1000,'#121722');label(d,'COLOUR / NOT FABRIC',60,32,2,'#b2a69a',lb);label(d,'DRAPE ATLAS',60,78,11,'#f2eadd',lb);label(d,'02',1410,78,11,'#cf9b75',lb);
 d.fillStyle='#554f51';d.fillRect(60,184,1480,2);const panels=[];
 for(let i=0;i<atlas.length;i++){const m=compileDrape(atlas[i]),t=kit.tile(m),x=60+(i%3)*504,y=230+Math.floor(i/3)*350;kit.place(d,t,x,y);label(d,String(i+1).padStart(2,'0')+' / SEED '+m.seed+' / FREQ '+m.parameters.folds,x,y+299,2,'#f2eadd',lb);label(d,m.low.toUpperCase()+' - '+m.high.toUpperCase(),x,y+324,2,'#b2a69a',lb);panels.push({x,y,model:m,ratio:t.ratio});}
 d.fillStyle='#554f51';d.fillRect(60,938,1480,2);label(d,'SIX FIXED PALETTES / SEVEN SEEDED PARAMETERS / ZERO IMAGE INPUTS',60,963,2,'#b2a69a',lb);
 files['atlas.png']=b.toBuffer('image/png');files['atlas-layout.json']=Buffer.from(JSON.stringify({canvas:[1600,1000],panels,labels:lb,meaning:'Each panel is an independent compiled material. Labels are derived; color is aesthetic, not a numeric scale.'},null,2)+'\n');return files;
}
