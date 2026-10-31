// SPDX-License-Identifier: MIT
// New fictional content. These are authored editorial compositions, not an app shell.
import {createFileTiles} from '../file-tiles.mjs';
const item=(id,name,kind)=>({id,name,kind});
export function fieldStudyInput(){return {columns:3,rows:2,cellWidth:200,cellHeight:240,offset:3,selectedIds:['f0','f4','f9'],items:[
 item('f0','Archive','folder'),item('f1','Brief.txt','text'),item('f2','Cards.zip','package'),
 item('f3','Drafts','folder'),item('f4','Field.txt','text'),item('f5','Maps','folder'),
 item('f6','Notes.txt','text'),item('f7','Print.zip','package'),item('f8','Sketches','folder'),item('f9','Readme.txt','text')]};}
export function editionInput(){return {columns:2,rows:3,cellWidth:220,cellHeight:260,offset:0,selectedIds:[],items:[
 item('p0','Covers','folder'),item('p1','Essay.txt','text'),item('p2','Figures','folder'),
 item('p3','Issue.zip','package'),item('p4','Proof.txt','text'),item('p5','Sources','folder'),
 item('p6','Index.txt','text'),item('p7','Press.zip','package'),item('p8','Type.txt','text')]};}
function writer(ctx,width,height,plans){return (s,x,y,size,bold,maxWidth,color)=>{
 ctx.font=`${size}px PGSans${bold?600:400}`;const z=ctx.measureText(s),left=Math.max(0,z.actualBoundingBoxLeft),span=Math.max(z.width,z.actualBoundingBoxRight)+left;
 const ink={left:x,top:y,right:x+left+z.actualBoundingBoxRight,bottom:y+z.actualBoundingBoxAscent+z.actualBoundingBoxDescent};
 if(span>maxWidth||ink.left<0||ink.top<0||ink.right>width||ink.bottom>height)throw RangeError('composition text fit');
 ctx.fillStyle=color;ctx.fillText(s,x+left,y+z.actualBoundingBoxAscent);plans.push({text:s,ink,size,bold});
};}
export function renderFieldStudy(api){
 const width=1240,height=940,c=api.createCanvas(width,height),q=c.getContext('2d'),plans=[],t=writer(q,width,height,plans),tiles=createFileTiles(api);
 const grid=tiles.fileGridTile(fieldStudyInput()),summary=tiles.paneSummaryTile({width:600,label:'Sample',grid,path:['Field study','Batch B']}),g=grid.plan;
 q.fillStyle='#f1eee7';q.fillRect(0,0,width,height);q.fillStyle='#d57942';q.fillRect(48,40,38,5);
 t('RESEARCH PACKS / SYNTHETIC CONTENT',104,35,14,true,800,'#494c62');
 t('Field notes, ordered.',48,79,54,true,1100,'#20263e');
 q.fillStyle='#ffffff';q.fillRect(48,192,600,480);tiles.place(q,grid,48,192);tiles.place(q,summary,48,696);
 q.fillStyle='#20263e';q.fillRect(704,192,488,649);t('ONE LIST. TWO VIEWS.',744,230,26,true,408,'#fff5e7');
 t(String(g.visible).padStart(2,'0'),744,300,100,true,408,'#ffb575');
 t(`VISIBLE OF ${g.total} AUTHORED ITEMS`,744,416,18,true,408,'#fff5e7');
 q.fillStyle='#596078';q.fillRect(744,466,408,1);
 const hidden=g.selectedTotal-g.selectedVisible;
 t(`${g.selectedTotal} selected across the list`,744,505,22,true,408,'#fff5e7');
 t(`${g.selectedVisible} inside this window`,744,552,20,false,408,'#d9dceb');
 t(`${hidden} outside this window`,744,592,20,false,408,'#d9dceb');
 t(`Offset ${g.offset} / ${g.remaining} after this window`,744,662,18,false,408,'#d9dceb');
 t('COUNTS COME FROM THE SAME HANDLE',744,768,13,true,408,'#ffb575');
 t('STATIC COMPOSITION / NO FILES READ / NO DEVICE',48,884,14,true,1144,'#494c62');
 return {canvas:c,model:{scene:'field-study',width,height,grid:g,summary:summary.plan,compositionText:plans}};
}
export function renderEdition(api){
 const width=1120,height=1160,c=api.createCanvas(width,height),q=c.getContext('2d'),plans=[],t=writer(q,width,height,plans),tiles=createFileTiles(api);
 const grid=tiles.fileGridTile(editionInput()),summary=tiles.paneSummaryTile({width:1008,label:'Sample',grid,path:['Edition desk','Proof set']}),g=grid.plan;
 q.fillStyle='#eef0f6';q.fillRect(0,0,width,height);q.fillStyle='#41305d';q.fillRect(0,0,width,128);
 t('EDITION DESK',56,34,40,true,1008,'#ffffff');t('FICTIONAL MATERIALS / STATIC SELECTION-FREE VIEW',56,91,13,true,1008,'#ded7ea');
 q.fillStyle='#fff9ef';q.fillRect(56,160,440,780);tiles.place(q,grid,56,160);
 q.fillStyle='#e2dded';q.fillRect(544,160,520,780);
 t('Make the list legible.',584,205,32,true,440,'#41305d');
 t(`${g.total} items`,584,302,64,true,440,'#41305d');
 t(`${g.folders} folders / ${g.files} files`,584,391,24,false,440,'#41305d');
 q.fillStyle='#bbb1cc';q.fillRect(584,454,440,1);
 t(`${g.visible} placed in this view`,584,504,26,true,440,'#41305d');
 t(`${g.remaining} remain after this view`,584,554,22,false,440,'#594f6b');
 t(`${g.selectedTotal} selected / ${g.selectedVisible} selected here`,584,608,22,false,440,'#594f6b');
 t('No selection is not an empty list.',584,715,20,true,440,'#41305d');
 t('Input order is preserved.',584,759,20,false,440,'#594f6b');
 t('Names are labels, not disk paths.',584,799,20,false,440,'#594f6b');
 t('STATIC / NO DEVICE',584,888,15,true,440,'#41305d');
 tiles.place(q,summary,56,972);
 return {canvas:c,model:{scene:'edition-desk',width,height,grid:g,summary:summary.plan,compositionText:plans}};
}
