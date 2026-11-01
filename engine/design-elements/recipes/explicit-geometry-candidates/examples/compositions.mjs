import{createRunMatrix,createNestedTile,createGeometryKit}from'../index.mjs';
// Newly authored sample-only uppercase shapes; NOT a core font/dictionary API.
const letters={A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],I:['11111','00100','00100','00100','00100','00100','11111'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],R:['11110','10001','10001','11110','10100','10010','10001'],T:['11111','00100','00100','00100','00100','00100','00100']};
function word(s){return createRunMatrix({rows:Array.from({length:7},(_,i)=>Array.from(s,c=>letters[c][i]).join('0'))});}
const nest=(colors,insets)=>createNestedTile({layers:colors.map((color,i)=>({color,inset:insets[i]}))});
function text(c,s,x,y,size,color,max){c.font=`${size}px GeometryBody`;c.textBaseline='alphabetic';const m=c.measureText(s);if(m.actualBoundingBoxLeft>x||m.actualBoundingBoxRight>max||y-m.actualBoundingBoxAscent<0||y+m.actualBoundingBoxDescent>c.canvas.height)throw new Error('example actual text fit');c.fillStyle=color;c.fillText(s,x,y);}
export function compose(native,which){const kit=createGeometryKit({createCanvas:native.createCanvas});let canvas,c,placements=[],labels=[],models;
 const put=(name,plan,x,y)=>{const t=kit.tile(plan);if(x<0||y<0||x+t.width>canvas.width||y+t.height>canvas.height)throw new Error('example tile fit');kit.place(c,t,x,y);placements.push({name,x,y,width:t.width,height:t.height,plan});return t;};
 const label=(s,x,y,size,color,max)=>{text(c,s,x,y,size,color,max);labels.push({text:s,x,y,size,color});};
 if(which==='exhibition'){
  canvas=native.createCanvas(1400,960);c=canvas.getContext('2d');c.fillStyle='#101c25';c.fillRect(0,0,1400,960);
  const title=word('FORM'),sub=word('LAB'),tileModels=[nest(['#ef6a44','#f6e8d1','#213f65'],[0,1450,3400]),nest(['#f4c85b','#101c25','#f4c85b'],[0,1200,3000]),nest(['#aac5c6','#355963','#e4f3dd'],[0,2200,4050])];models={title,sub,tileModels};
  label('01 / A SYNTHETIC EXHIBITION',48,52,18,'#b6c5c8',700);label('COMPOSING FROM SIMPLE RULES',910,52,16,'#b6c5c8',440);
  put('primary mark',kit.runPlan(title,{cell:34,rowGap:1,thickness:19,padding:8,color:'#f5e9d2',pixelRatio:1}),40,90);
  put('secondary mark',kit.runPlan(sub,{cell:23,rowGap:2,thickness:10,padding:8,color:'#ef6a44',pixelRatio:1}),48,395);
  label('A language of runs and frames.',48,650,31,'#f5e9d2',560);label('One binary matrix becomes continuous capsules.',48,696,19,'#b6c5c8',590);label('Ordered square layers create a separate material rhythm.',48,728,19,'#b6c5c8',590);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)put(`frame ${row*3+col+1}`,kit.nestedPlan(tileModels[(row+col)%3],{size:145,padding:4,pixelRatio:1}),865+col*165,190+row*178);
  c.strokeStyle='#53636b';c.beginPath();c.moveTo(48,831);c.lineTo(1350,831);c.stroke();
  label(`${title.bits+sub.bits} occupied bits / ${title.segments.length+sub.segments.length} capsule runs`,48,877,19,'#f5e9d2',700);label('9 tiled studies / 3 explicit layer stacks',865,877,18,'#b6c5c8',480);label('ORIGINAL COMPOSITION / NO REAL EVENT',48,920,14,'#8ca1aa',650);
 }else if(which==='fieldguide'){
  canvas=native.createCanvas(1200,1100);c=canvas.getContext('2d');c.fillStyle='#eee6d6';c.fillRect(0,0,1200,1100);
  const title=word('TILE'),sub=word('ATELIER'),tileModels=[nest(['#385c48','#e5b38d','#f6efdf','#b54538'],[0,1050,2300,3900]),nest(['#d99d4b','#f3ecd9','#574567'],[0,1900,3750]),nest(['#a94937','#ddc7a0','#2b4e62','#e5d6a8'],[0,800,2550,4500]),nest(['#7c8c9e','#efdfc1'],[0,3100])];models={title,sub,tileModels};
  label('FIELD GUIDE / 02',50,58,17,'#355342',350);label('FORM IS A SET OF EXPLICIT DECISIONS.',590,58,16,'#355342',550);
  for(let row=0;row<4;row++)for(let col=0;col<2;col++)put(`specimen ${row*2+col+1}`,kit.nestedPlan(tileModels[(row*2+col)%4],{size:192,padding:4,pixelRatio:1}),46+col*222,118+row*224);
  put('stacked title',kit.runPlan(title,{cell:24,rowGap:6,thickness:13,padding:8,color:'#203f36',pixelRatio:1}),590,130);
  put('small word',kit.runPlan(sub,{cell:12,rowGap:1,thickness:6,padding:8,color:'#a94937',pixelRatio:1}),590,403);
  label('Small parts, many compositions.',594,579,25,'#203f36',550);label('Eight specimens. Four authored color sequences.',594,627,18,'#355342',550);label('No random motif or hidden image is required.',594,657,18,'#355342',550);
  for(let i=0;i<tileModels.length;i++){const m=tileModels[i],outer=m.layers[0].visibleArea/m.areaDenominator*100;label(`${String(i+1).padStart(2,'0')}  ${m.layerCount} layers / outer band ${outer.toFixed(2)}%`,594,735+i*43,18,'#355342',550);}
  label('Area describes authored geometry, not material usage.',594,943,16,'#355342',550);label(`${title.segments.length+sub.segments.length} runs / ${title.bits+sub.bits} bits / no font in the marks`,594,982,16,'#355342',550);label('FICTIONAL EDITORIAL SAMPLE / STATIC 2D',50,1064,15,'#355342',650);
 }else throw new Error('known composition');
 return{canvas,metadata:{which,width:canvas.width,height:canvas.height,models,placements,labels}};
}
