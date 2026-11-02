import {createScalarFieldKit} from './index.mjs';
// New synthetic geometry; not sampled from a reference or derived artwork.
export const briefs=Object.freeze([
 Object.freeze({id:'ember-sequence',purpose:'Three material swatches, warm/cool hierarchy, quiet margins'}),
 Object.freeze({id:'tidal-map',purpose:'Large circular focal field and small parameter comparisons; mineral green is contextual, not banned'})
]);
export function renderExamples(api){
 const kit=createScalarFieldKit(api),images=[];
 const a=api.createCanvas(960,640),q=a.getContext('2d');q.fillStyle='#eee9e1';q.fillRect(0,0,960,640);
 const variations=[{phase:-1.3,frequency:2.4,palette:[[26,22,38],[148,65,48],[245,193,125]]},{phase:.35,frequency:4.1,palette:[[25,24,43],[83,87,142],[224,187,152]]},{phase:2.15,frequency:6.2,palette:[[36,25,29],[177,76,49],[243,211,158]]}];
 const plans=[];variations.forEach((v,i)=>{const tile=kit.fieldTile({width:264,height:456,...v});kit.place(q,tile,52+i*296,76);plans.push(tile.plan);q.fillStyle=['#ad5237','#555b99','#b9653b'][i];q.fillRect(52+i*296,554,36+24*i,5);q.fillStyle='#c8c0b5';q.fillRect(52+i*296,584,264,1);});images.push({id:briefs[0].id,canvas:a,plans});
 const b=api.createCanvas(960,640),r=b.getContext('2d');r.fillStyle='#152526';r.fillRect(0,0,960,640);
 const main=kit.fieldTile({width:520,height:520,phase:-2.4,frequency:3.2,palette:[[14,37,40],[53,119,113],[224,205,151]]});
 r.save();r.beginPath();r.arc(316,320,260,0,Math.PI*2);r.clip();kit.place(r,main,56,60);r.restore();
 const ps=[main.plan];for(let i=0;i<3;i++){const t=kit.fieldTile({width:248,height:144,phase:.8+i*1.4,frequency:1.5+i*1.8,palette:[[27,38,42],[89,133,133],[226,205,166]]});kit.place(r,t,652,72+i*176);ps.push(t.plan);r.fillStyle='#ddbd83';r.fillRect(620,72+i*176,4,144);}
 images.push({id:briefs[1].id,canvas:b,plans:ps});return images;
}
