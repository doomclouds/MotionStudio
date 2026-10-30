// Fixed-size vertical editorial primitives. Geometry is page-space, not output pixels.
export const blankLayout = Object.freeze({page:[1242,1660],body:{size:42,step:46,columnPitch:84,capacity:19,top:160,rightCenter:900},bird:{x:75,y:780,height:560},seal:{x:470,y:1250,width:96,height:96},minimumBirdSealGap:20});
export function drawVerticalColumn(c,text,{cx,top,size,weight=500,spacing=4,color='#5C5852',spaceAdvance=4}){
 c.save();c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle=color;c.font=`${size}px XHSSerif${weight}`;c.letterSpacing='0px';let y=top;
 for(const ch of text){
  if(ch===' '){y+=spaceAdvance;continue;}
  // Browser vertical CJK comma/full stop occupy the upper-right of their em cell.
  const punctuation=ch==='，'||ch==='。';
  c.fillText(ch,cx+(punctuation?size*.32:0),y+size*.88-(punctuation?size*.70:0));y+=size+spacing;
 }
 c.restore();return{top,bottom:y,advance:y-top};
}
export function splitVerticalColumns(text,capacity=19){const a=[...text];return Array.from({length:Math.ceil(a.length/capacity)},(_,i)=>a.slice(i*capacity,(i+1)*capacity).join(''));}
export function assertHorizontalClearance(imageBox,sealBox,min=20){const gap=sealBox.x-(imageBox.x+imageBox.width);if(gap<min)throw Error(`bird/seal gap ${gap} < ${min}`);return gap;}
