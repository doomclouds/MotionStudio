/** Synthetic transfer studies, not customer productions. No assets or implicit time. */
import {freeze, choice, bool, number} from '../lib/validate.mjs';
import {compileOrderedBands, sampleOrderedBands} from '../lib/foundations/layout/ordered-bands.mjs';
export const orderedBandStudies = freeze({
  workload: {title:'A week, rebalanced', subtitle:'40 hours / proposed allocation', labels:['Research','Build','Review'], ids:['research','build','review'], from:[8,24,8], to:[12,16,12], colors:['#427B86','#C9A86A','#756A90'], unit:'h'},
  inventory: {title:'What is on the shelf?', subtitle:'Composition / before and after restocking', labels:['Staples','Fresh','Pantry','Seasonal'], ids:['staples','fresh','pantry','seasonal'], from:[60,30,10,0], to:[40,50,30,40], colors:['#244F65','#558C80','#C79858','#B76D58'], unit:'units'},
});
export function createOrderedBandStudy(name, reducedMotion=false) {
  choice(name,Object.keys(orderedBandStudies));bool(reducedMotion);
  const study=orderedBandStudies[name];
  const plan=compileOrderedBands(Object.fromEntries(['from','to'].map(k=>[k,study.ids.map((id,i)=>({id,weight:study[k][i]}))])));
  const sample=progress=>{number(progress,0,1);return sampleOrderedBands(plan,reducedMotion?1:progress);};
  return {sample, draw(ctx,progress,width=1280,height=720) {
    number(width,1,1e6);number(height,1,1e6);
    const state=sample(progress);
    ctx.save();
    try {
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
      ctx.scale(width/1280,height/720);
      const ink=name==='workload'?'#183844':'#F7F0E4';
      ctx.fillStyle=name==='workload'?'#F4F0E7':'#102C37';ctx.fillRect(0,0,1280,720);
      const text=(str,x,y,size=22,color=ink)=>{ctx.fillStyle=color;ctx.font=`${size}px "Motion Gallery Sans", sans-serif`;ctx.fillText(str,x,y);};
      text('SYNTHETIC STUDY / '+(name==='workload'?'01':'02'),64,57,16);
      text(study.title,64,127,48);text(study.subtitle,66,169,23);
      const edges=state.boundaries.map(b=>Math.round(b*(name==='workload'?1152:340)));
      if(name==='workload') {
        state.bands.forEach((b,i)=>{ctx.fillStyle=study.colors[i];ctx.fillRect(64+edges[i],220,edges[i+1]-edges[i],116);});
        text('0 hours',64,370,17);text('40 hours',1125,370,17);
        state.bands.forEach((b,i)=>{const x=64+i*390;ctx.fillStyle=study.colors[i];ctx.fillRect(x,421,38,6);text(study.labels[i],x,473,25);text(`${study.from[i]}h  →  ${study.to[i]}h`,x,518,30);text(`Current share: ${(b.fraction*100).toFixed(1)}%`,x,558,19);});
        text('Same 40-hour budget. Shared boundaries move; categories keep their order.',64,638,20);
      } else {
        // Vertical bottom-up composition. Shared integer edges avoid rectangle seams.
        state.bands.forEach((b,i)=>{ctx.fillStyle=study.colors[i];ctx.fillRect(64,586-edges[i+1],260,edges[i+1]-edges[i]);});
        text('Share of stock',64,624,18);text('BEFORE',720,230,16);text('AFTER',900,230,16);text('SHARE NOW',1070,230,16);
        state.bands.forEach((b,i)=>{const y=292+i*77;ctx.fillStyle=study.colors[i];ctx.fillRect(391,y-20,18,18);text(study.labels[i],430,y,25);text(String(study.from[i]),720,y,25);text(String(study.to[i]),900,y,25);text(`${(b.fraction*100).toFixed(1)}%`,1070,y,25);});
        text('TOTAL UNITS',430,611,17);text('100',720,611,25);text('160',900,611,25);
        text('Animated shares are a transition, not measured inventory between counts.',64,677,19);
      }
      text(reducedMotion?'REDUCED MOTION / final allocation':'FIXED ORDER / explicit weights',820,57,16);
    } finally {ctx.restore();}
    return state;
  }};
}
