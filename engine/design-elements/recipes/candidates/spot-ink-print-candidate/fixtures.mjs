// Original, font-free synthetic content. No upstream scene, character or story.
export function drawFixture(canvas,variant=0) {
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.fillStyle='#000';c.fillRect(0,0,w,h);
 if(variant===0){
  for(let i=0;i<5;i++){c.fillStyle=`rgb(${Math.round(i*255/4)},0,0)`;c.fillRect(w*i/5,0,w/5,h*.5);}
  c.globalCompositeOperation='lighter';
  c.fillStyle='rgb(0,230,0)';c.beginPath();c.arc(w*.36,h*.60,h*.30,0,Math.PI*2);c.fill();
  c.fillStyle='rgb(0,0,150)';c.beginPath();c.arc(w*.62,h*.60,h*.27,0,Math.PI*2);c.fill();
 }else{
  c.save();c.translate(w*.5,h*.5);
  for(let i=0;i<12;i++){c.save();c.rotate(i*Math.PI/6);c.fillStyle=['rgb(255,0,0)','rgb(0,170,0)','rgb(0,0,210)'][i%3];c.fillRect(w*.10,-h*.035,w*.28,h*.07);c.restore();}
  c.restore();c.fillStyle='rgb(0,90,160)';c.fillRect(w*.43,h*.42,w*.14,h*.16);
  c.fillStyle='#000';c.fillRect(w*.48,h*.47,w*.04,h*.06);
 }
 c.globalCompositeOperation='source-over';return canvas;
}
export const neutralOptions={inks:[[35,75,68],[176,98,49],[81,67,135]],paper:[250,249,245],boil:0,period:7,seed:0,sheet:0,grain:1,off:[[0,0],[0,0],[0,0]],rot:[0,0,0],ang:[.2618,0,1.309],gate:[1,1,1],sweep:[1e5,1e5,1e5]};
