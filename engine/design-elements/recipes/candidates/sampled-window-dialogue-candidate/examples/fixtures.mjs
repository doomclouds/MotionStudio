export const edition={title:'Edition review',groupGap:12,participants:[{id:'mara',label:'Mara'},{id:'sol',label:'Sol'},{id:'aya',label:'Aya'}],messages:[
{id:'m1',author:'mara',minute:555,lines:['The first proof feels too busy.','Leave a pause between the windows.']},
{id:'m2',author:'mara',minute:559,lines:['The purple field can stay intact.']},
{id:'m3',author:'sol',minute:563,lines:['I moved one strip to the right.','The sample order now reads clearly.']},
{id:'m4',author:'aya',minute:568,lines:['Keep the caption outside the art.']},
{id:'m5',author:'aya',minute:570,lines:['No marks imply measured values.']},
{id:'m6',author:'sol',minute:588,lines:['Ready for another paper proof.']}]};
export const garden={title:'After-hours field notes',groupGap:8,participants:[{id:'rui',label:'Rui'},{id:'noa',label:'Noa'}],messages:[
{id:'g1',author:'rui',minute:1170,lines:['Three windows, one invented garden.']},
{id:'g2',author:'rui',minute:1176,lines:['The long strip carries the warm leaves.']},
{id:'g3',author:'noa',minute:1180,lines:['I will keep the surrounding space dark.']},
{id:'g4',author:'noa',minute:1183,lines:['A quiet gap separates each sample.']},
{id:'g5',author:'rui',minute:1195,lines:['Tomorrow we can choose a new source.']}]};
export function printPixels(){const width=700,height=800,pixels=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const dot=(x%48-24)**2+(y%48-24)**2<(5+13*y/height)**2,band=(Math.floor(y/94)+Math.floor(x/180))%3;const c=dot?[245,111,172]:band===0?[57,32,95]:band===1?[99,65,140]:[230,210,236],i=(y*width+x)*4;pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=255;}return {width,height,pixels};}
export function gardenPixels(){const width=1100,height=550,pixels=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){let c=[36,28,42];for(let k=0;k<9;k++){const cx=70+k*128,cy=140+(k%3)*110,dx=x-cx,dy=y-cy,a=k*.7;const u=dx*Math.cos(a)+dy*Math.sin(a),v=-dx*Math.sin(a)+dy*Math.cos(a);if((u/90)**2+(v/32)**2<1)c=k%2?[230,147,113]:[132,102,123];if(dx*dx+dy*dy<180)c=[255,224,161];}const i=(y*width+x)*4;pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=255;}return {width,height,pixels};}
export const editionWindows={width:570,height:680,panels:[{id:'high',x:0,y:0,width:390,height:150,u0:0,v0:0,u1:1000000,v1:220000},{id:'mid',x:90,y:174,width:480,height:210,u0:0,v0:250000,u1:1000000,v1:580000},{id:'low',x:0,y:408,width:480,height:260,u0:0,v0:600000,u1:1000000,v1:1000000}]};
export const gardenWindows={width:1004,height:330,panels:[{id:'long',x:0,y:0,width:1004,height:96,u0:0,v0:0,u1:1000000,v1:400000},{id:'left',x:0,y:116,width:474,height:198,u0:0,v0:380000,u1:470000,v1:1000000},{id:'right',x:504,y:116,width:500,height:198,u0:500000,v0:380000,u1:1000000,v1:1000000}]};
