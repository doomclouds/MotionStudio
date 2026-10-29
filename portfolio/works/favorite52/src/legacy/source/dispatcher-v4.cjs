/** Integration adapter. Missing ranges throw; never insert black/reference footage. */
const fs=require('fs'),path=require('path'),{createCanvas}=require('@napi-rs/canvas');
const slots=[
 [0,180,'opening/render-opening.cjs','ctx'],[180,369,'v3/brand-ui/render-brand-ui.cjs','ctx'],
 [369,549,'carousel-v3/render-carousel.cjs','carousel'],[549,690,'entrance/render-entrance.cjs','ctx'],
 [690,795,'v3/game/probe.cjs','canvas'],[795,915,'v3/game/gates-next.cjs','canvas'],[915,1020,'v3/game/fall.cjs','canvas'],
 [1020,1200,'crowd-v4/render-crowd.cjs','canvas'],[1200,1380,'boss-v4/render-boss.cjs','ctx'],[1380,1560,'v3/outro/render-outro.cjs','ctx']
].map(([start,end,file,api])=>({start,end,file,api}));const loaded=new Map();let bridge;
function slotFor(frame){let s=slots.find(s=>frame>=s.start&&frame<s.end);if(!s)throw Error(`Frame ${frame} outside 0..1559`);return s;}
function configure(m,s){if(m.setCardTail)m.setCardTail((ctx,t)=>ctx.drawImage(require('./carousel-v3/render-carousel.cjs').renderCarousel(t),0,0));return m;}
async function load(s){if(loaded.has(s.file))return loaded.get(s.file);let p=path.resolve(__dirname,s.file);if(!fs.existsSync(p))throw Error(`UNIMPLEMENTED range ${s.start/30}..${s.end/30}: ${s.file}`);let m=configure(require(p),s);if(m.prepare)await m.prepare();else if(m.init)await m.init();loaded.set(s.file,m);return m;}
async function prepare(frames){if(!Array.isArray(frames)||!frames.length)throw Error('Explicit frame list required. Full-film preparation is not implied.');for(let frame of frames){let s=slotFor(frame);await load(s);if(s.api==='carousel'&&!bridge){let m=await load(slots[1]);bridge=createCanvas(1920,1080);m.render(bridge.getContext('2d'),12.16);}}}
function renderCanvas(t){let frame=Math.round(t*30),s=slotFor(frame),m=loaded.get(s.file);if(!m)throw Error('Call prepare([frame]) before render: '+s.file);t=frame/30;
 if(s.api==='canvas')return m.render(t);
 if(s.api==='carousel')return m.renderCarousel(t,{previousFrame:bridge});
 let out=createCanvas(1920,1080);m.render(out.getContext('2d'),t);return out;
}
function render(ctx,t){let out=renderCanvas(t);ctx.save();ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.drawImage(out,0,0);ctx.restore();}
function coverage(){return slots.map(s=>({...s,present:fs.existsSync(path.resolve(__dirname,s.file))}));}
module.exports={configure,slots,slotFor,prepare,render,renderCanvas,coverage};
