// SPDX-License-Identifier: Apache-2.0
// Changed native layout: independent annotated demo tiles only; no original invoice adapter.
import {computeInvoice,money,basisPercent,object} from './model.mjs';
export const palette=Object.freeze({ink:'#15140f',muted:'#6e6a5d',line:'#ddd6c4',green:'#1f4d3a',soft:'#e3ece8'});
const families=Object.freeze({body:'DemoLedgerBody',bold:'DemoLedgerBold',display:'DemoLedgerDisplay',mono:'DemoLedgerMono'});
function style(g,size,face,color=palette.ink,align='left'){g.font=`${size}px "${families[face]}"`;g.fillStyle=color;g.textAlign=align;g.textBaseline='alphabetic';g.direction='ltr';g.letterSpacing='0px';g.wordSpacing='0px';}
function planText(g,value,x,y,size,face,slot,color=palette.ink,align='left'){style(g,size,face,color,align);const m=g.measureText(value),ink={left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent};if(ink.left<slot[0]-.01||ink.right>slot[2]+.01||ink.top<slot[1]-.01||ink.bottom>slot[3]+.01)throw new RangeError('Text ink overflow in bounded demo slot');return{value,x,y,size,face,color,align};}
function wrap(g,note){style(g,12.5,'body');const lines=[];let line='';for(const word of note.split(' ')){if(g.measureText(word).width>390)throw new RangeError('Word overflow');const next=line?line+' '+word:word;if(g.measureText(next).width>390){lines.push(line);line=word;}else line=next;}lines.push(line);if(lines.length>2)throw new RangeError('Note exceeds two lines');return lines;}
function paintText(g,p){style(g,p.size,p.face,p.color,p.align);g.fillText(p.value,p.x,p.y);}
function rule(g,x,y,w,color=palette.line,h=1){g.fillStyle=color;g.fillRect(x,y,w,h);}
function rounded(g,x,y,w,h,color,r=6){g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();}
export function lineItemsTile(api,items){
 const model=computeInvoice(items),m=api.createCanvas(1,1).getContext('2d'),width=676,height=74+94*model.rows.length,plans=[];
 const add=(s,x,y,size,face,slot,color,align)=>plans.push(planText(m,s,x,y,size,face,slot,color,align));
 add('NOT PAYABLE / DEMO LINE ITEMS',12,21,12,'mono',[0,0,width,30],palette.green);
 add('DESCRIPTION',12,50,10.5,'mono',[0,33,402,60],palette.muted);
 [['QTY',452,412],['RATE',556,464],['AMOUNT',664,568]].forEach(([s,x,l])=>add(s,x,50,10.5,'mono',[l,33,x+2,60],palette.muted,'right'));
 model.rows.forEach((row,i)=>{const y=94+i*94;add(row.title,12,y,14,'bold',[10,y-17,404,y+5]);wrap(m,row.note).forEach((s,k)=>add(s,12,y+24+k*19,12.5,'body',[10,y+10,404,y+49],palette.muted));[[String(row.quantity),452,412],[money(row.rateCents),556,464],[money(row.amount),664,568]].forEach(([s,x,l])=>add(s,x,y,13.5,'mono',[l,y-17,x+2,y+5],palette.ink,'right'));});
 const canvas=api.createCanvas(width*2,height*2),g=canvas.getContext('2d');g.scale(2,2);rule(g,0,64,width,palette.ink,2);model.rows.forEach((r,i)=>rule(g,0,157+i*94,width));plans.forEach(p=>paintText(g,p));return canvas;
}
export function totalsTile(api,items,options={}){
 object(options,['retainerBps','taxBps']);const retainerBps=options.retainerBps??0,taxBps=options.taxBps??0;if(options.retainerBps===null||options.taxBps===null)throw new TypeError('Null rate rejected');
 const model=computeInvoice(items,retainerBps,taxBps),m=api.createCanvas(1,1).getContext('2d'),plans=[];
 const add=(s,x,y,size,face,slot,color,align)=>plans.push(planText(m,s,x,y,size,face,slot,color,align));
 add('NOT PAYABLE',8,22,14,'mono',[0,0,320,30],palette.green);
 [['Subtotal',money(model.subtotal),55,palette.ink],[`Demo retainer (${basisPercent(retainerBps)})`,(model.retainer?'-':'')+money(model.retainer),88,palette.green],[`Demo tax (${basisPercent(taxBps)})`,money(model.tax),121,palette.muted],['Net before demo tax',money(model.net),154,palette.ink]].forEach(([label,value,y,color])=>{add(label,8,y,13,'body',[0,y-17,190,y+5],color);add(value,312,y,13,'body',[202,y-17,320,y+5],color,'right')});
 add('Demo total',16,217,20,'display',[16,184,142,233],'#ffffff');add(money(model.total),304,217,20,'display',[154,184,304,233],'#ffffff','right');
 add('DEMO TAX ONLY / NOT PAYABLE',8,263,11,'mono',[0,246,320,276],palette.green);
 const canvas=api.createCanvas(640,560),g=canvas.getContext('2d');g.scale(2,2);rule(g,0,171,320);rounded(g,0,180,320,59,palette.ink);plans.forEach(p=>paintText(g,p));return canvas;
}
