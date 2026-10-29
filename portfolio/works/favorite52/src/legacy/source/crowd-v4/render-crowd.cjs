const {createCanvas}=require('@napi-rs/canvas'),base=require('../v3/game/crowd.cjs'),curve=require('./warning-camera.json');
async function prepare(){await base.prepare()}
function render(t){const im=base.render(t),f=Math.round(t*30),q=curve.find(x=>x.frame===f);if(!q)return im;let dx=q.x-921,dy=q.y-111;const out=createCanvas(1920,1080),c=out.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(im,0,0);c.drawImage(im,dx,dy);return out;}
module.exports={prepare,render};
