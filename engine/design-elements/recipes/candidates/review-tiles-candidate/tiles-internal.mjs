// Changed native fixed-canvas interpretation of OpenDesign orbit-github.
// Original RD mark and generic icons; synthetic data, no network/product integration.
const P=Object.freeze({bg:'#f6f8fa',paper:'#ffffff',ink:'#1f2328',muted:'#656d76',line:'#d0d7de',top:'#24292f',green:'#1a7f37',purple:'#8250df',red:'#cf222e',blue:'#0969da',yellow:'#fff8c5'});
const ascii=(s,n,empty=false)=>typeof s==='string'&&s.length<=(n)&& (empty||s.length>0)&&/^[\x20-\x7e]*$/.test(s);
const hex=s=>typeof s==='string'&&/^#[0-9a-fA-F]{6}$/.test(s);
const integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
function indexedRows(input,check){const rows=[];for(let i=0;i<input.length;i++){if(!Object.hasOwn(input,i))throw new TypeError('dense own rows required');rows.push(check(input[i]));}return rows;}
function style(c,size=14,role='body',color=P.ink){c.font=`${size}px ${role==='mono'?'ReviewTileMono':role==='bold'?'ReviewTileBold':'ReviewTileSans'}`;c.textAlign='left';c.textBaseline='alphabetic';c.direction='ltr';c.letterSpacing='0px';c.wordSpacing='0px';c.fontKerning='auto';c.fillStyle=color;}
function text(c,s,x,y,size=14,role='body',color=P.ink,align='left'){style(c,size,role,color);c.textAlign=align;c.fillText(s,x,y)}
function box(c,x,y,w,h,fill,stroke=null,r=0,lw=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke()}}
function path(c,points,color,width=1.4){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function circle(c,x,y,r,fill,stroke=null,lw=1){c.beginPath();c.arc(x,y,r,0,2*Math.PI);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function icon(c,name,x,y,color,size){c.save();c.translate(x,y);c.scale(size/16,size/16);path(c,[[4,1],[10,1],[13,4],[13,15],[4,15],[4,1]],color);path(c,[[10,1],[10,5],[13,5]],color);c.restore()}
function widthOf(c,s,size=12,role='body'){style(c,size,role);return c.measureText(s).width}
function diffPreviewTile(api,{file,lines,width=872}){
 if(!integer(width,320,1000)||!ascii(file,90)||!Array.isArray(lines)||lines.length<1||lines.length>12)throw new RangeError('diff bounds');
 const rows=indexedRows(lines,r=>{if(!r||!['context','add','remove'].includes(r.kind)||!integer(r.lineNo,1,9999)||!ascii(r.text,160,true))throw new TypeError('diff row');return{kind:r.kind,lineNo:r.lineNo,text:r.text}});
 const m=api.createCanvas(1,1).getContext('2d');if(widthOf(m,file,12,'mono')>width-40||rows.some(r=>widthOf(m,r.text,12,'mono')>width-76))throw new RangeError('diff text width');
 const h=30+20*rows.length,out=api.createCanvas(width*2,h*2),c=out.getContext('2d');c.scale(2,2);c.save();c.beginPath();c.roundRect(.5,.5,width-1,h-1,6);c.clip();box(c,0,0,width,h,P.paper);box(c,0,0,width,30,P.bg);icon(c,'file',12,8,P.muted,12);text(c,file,31,20,12,'mono',P.muted);path(c,[[0,29.5],[width,29.5]],P.line,1);
 rows.forEach((r,i)=>{const y=30+i*20,bg=r.kind==='add'?'#dafbe1':r.kind==='remove'?'#ffebe9':P.paper,ink=r.kind==='add'?'#116329':r.kind==='remove'?'#82071e':P.muted;box(c,0,y,width,20,bg);text(c,String(r.lineNo),36,y+14,12,'mono','#a5a9ad','right');text(c,r.kind==='add'?'+':r.kind==='remove'?'-':' ',48,y+14,12,'mono',ink);text(c,r.text,72,y+14,12,'mono',ink)});c.restore();box(c,.5,.5,width-1,h-1,null,P.line,6);return out;
}
function reviewerSummaryTile(api,{reviewers,caption='',width=872}){
 if(!integer(width,320,1000)||!Array.isArray(reviewers)||reviewers.length<1||reviewers.length>8||!ascii(caption,70,true))throw new RangeError('reviewers bounds');
 const rows=indexedRows(reviewers,r=>{if(!r||!ascii(r.initials,2)||!['approved','pending','none'].includes(r.status)||!hex(r.color))throw new TypeError('reviewer');return{initials:r.initials,status:r.status,color:r.color}});
 const approved=rows.filter(r=>r.status==='approved').length,label=`${approved} of ${rows.length} reviewers approved`+(caption?' - '+caption:'');const start=rows.length*16+16,m=api.createCanvas(1,1).getContext('2d');if(widthOf(m,label,12)>width-start-4)throw new RangeError('review summary width');
 const out=api.createCanvas(width*2,56),c=out.getContext('2d');c.scale(2,2);rows.forEach((r,i)=>{const x=10+i*16;circle(c,x,12,10,r.color,P.paper,2);text(c,r.initials,x,15,9,'bold',P.paper,'center');const color=r.status==='approved'?P.green:r.status==='pending'?'#bf8700':P.line;circle(c,x+6,19,5,color,P.paper,1.5);if(r.status==='approved')path(c,[[x+3.8,19],[x+5.4,20.5],[x+8.2,17.3]],P.paper,1)});text(c,label,start,17,12,'body',P.muted);return out;
}

export function bindTiles(api){return Object.freeze({diffPreviewTile:props=>diffPreviewTile(api,props),reviewerSummaryTile:props=>reviewerSummaryTile(api,props)});}
