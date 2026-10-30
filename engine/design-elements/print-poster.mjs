// Original bounded static primitives; no source artwork, fonts, or timing.
export const id='design.print-poster.v1';
export const guidance='../../skills/motion-film-director/research/design-knowledge/cases/ui-003-print-poster.md';
const finite=(v,label)=>{if(!Number.isFinite(v))throw new TypeError(label);};
export function drawPaper(ctx,{x,y,width,height,rotation=0,fill='#f6eedc',ink='#202020',offset=8}){
 for(const [k,v]of Object.entries({x,y,width,height,rotation,offset}))finite(v,k);
 if(width<40||height<30||Math.abs(rotation)>15||offset<0||offset>20)throw new RangeError('paper bounds');
 ctx.save();try{ctx.translate(x+width/2,y+height/2);ctx.rotate(rotation*Math.PI/180);ctx.fillStyle=ink;ctx.fillRect(-width/2+offset,-height/2+offset,width,height);ctx.fillRect(-width/2,-height/2,width,height);ctx.fillStyle=fill;ctx.fillRect(-width/2+3,-height/2+3,width-6,height-6);}finally{ctx.restore();}
}
export function drawOverprint(ctx,{text,x,y,font='bold 64px serif',fill='#b53028',ink='#202020',offset=5,maxWidth=650}){
 for(const [k,v]of Object.entries({x,y,offset,maxWidth}))finite(v,k);
 if(typeof text!=='string'||!text.length||text.length>60||offset<0||offset>20||maxWidth<=0)throw new RangeError('text bounds');
 ctx.save();try{ctx.font=font;ctx.textAlign='left';ctx.textBaseline='alphabetic';if(ctx.measureText(text).width>maxWidth)throw new RangeError('text overflow');ctx.fillStyle=ink;ctx.fillText(text,x+offset,y+offset);ctx.fillStyle=fill;ctx.fillText(text,x,y);}finally{ctx.restore();}
}
// Synthetic examples use platform fonts supplied by the renderer, not source fonts.
export const recipes={
 listening:{title:'LISTEN TOGETHER',note:'ONE SIDE / ONE SESSION',price:'08 PM',paper:'#eadcbf',accent:'#b53028',counter:'#2548a5',shape:'record'},
 workshop:{title:'MAKE SOMETHING',note:'PRINT / FOLD / SHARE',price:'12 MAY',paper:'#eee4cf',accent:'#6b3b87',counter:'#b64a22',shape:'sheets'}
};
export function drawPoster(ctx,recipe){
 if(!recipe||!['record','sheets'].includes(recipe.shape))throw new RangeError('unsupported subject');
 ctx.save();try{
 ctx.fillStyle=recipe.paper;ctx.fillRect(0,0,1000,600);
 drawOverprint(ctx,{text:recipe.title,x:40,y:110,font:'bold 60px serif',fill:recipe.accent,maxWidth:920});
 drawPaper(ctx,{x:570,y:160,width:340,height:300,rotation:5,fill:recipe.counter});
 if(recipe.shape==='record'){ctx.fillStyle='#202020';ctx.beginPath();ctx.arc(740,310,125,0,Math.PI*2);ctx.fill();ctx.fillStyle=recipe.accent;ctx.beginPath();ctx.arc(740,310,35,0,Math.PI*2);ctx.fill();}
 else{drawPaper(ctx,{x:620,y:205,width:200,height:150,rotation:-8});drawPaper(ctx,{x:670,y:270,width:180,height:140,rotation:8,fill:recipe.paper});}
 drawPaper(ctx,{x:45,y:340,width:470,height:125,rotation:-3});
 drawOverprint(ctx,{text:recipe.note,x:65,y:410,font:'bold 22px sans-serif',fill:'#202020',offset:0,maxWidth:420});
 drawOverprint(ctx,{text:recipe.price,x:625,y:540,font:'bold 60px sans-serif',fill:recipe.counter,ink:'#d49a24',maxWidth:330});
 }finally{ctx.restore();}
}
