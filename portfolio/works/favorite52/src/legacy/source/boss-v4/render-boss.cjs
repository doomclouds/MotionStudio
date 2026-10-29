// V4 only: measured whole-scene camera translations over frozen V3.1.
const B=require('../boss-v3/render-boss.cjs'),{createCanvas}=require('@napi-rs/canvas'),offsets=require('./measured-shake.json');let layer;
async function prepare(){await B.prepare();if(!layer)layer=createCanvas(1920,1080)}
function render(g,t){const n=Math.round(t*30),v=offsets[n];if(!v)return B.render(g,t);const c=layer.getContext('2d');c.clearRect(0,0,1920,1080);B.render(c,t);g.save();g.fillStyle='#131310';g.fillRect(0,0,1920,1080);g.imageSmoothingEnabled=false;g.drawImage(layer,v[0],v[1]);g.restore()}
module.exports={...B,prepare,render,offsets};
