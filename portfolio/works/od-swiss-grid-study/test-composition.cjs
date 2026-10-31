const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas}=require('./resources.cjs').canvas(),api=require('./render.cjs');
const sha=c=>crypto.createHash('sha256').update(c.toBuffer('image/png')).digest('hex');let checks=0;
const baseline=api.render().canvas;assert.equal(sha(baseline),'f66aa39fa71ed345244976bc7578169f30800f9b1ae72acbbccf07d10a76827c');checks++;
for(const spacing of [-25,25]){
 const c=createCanvas(1920,1080),g=c.getContext('2d');g.wordSpacing=spacing+'px';g.letterSpacing='12px';g.direction='rtl';g.textAlign='right';g.textBaseline='top';g.globalAlpha=.3;g.globalCompositeOperation='xor';g.shadowColor='#ff0000';g.shadowBlur=10;g.shadowOffsetX=20;
 const keys=['wordSpacing','letterSpacing','direction','textAlign','textBaseline','globalAlpha','globalCompositeOperation','shadowColor','shadowBlur','shadowOffsetX'];const before=keys.map(k=>g[k]);
 g.beginPath();g.rect(1,1,8,8);const scene=api.defaultScene(),copy=JSON.stringify(scene);api.compose(g,scene);assert.equal(sha(c),sha(baseline));assert.deepEqual(keys.map(k=>g[k]),before);assert.equal(JSON.stringify(scene),copy);checks+=3;
 g.globalAlpha=1;g.globalCompositeOperation='source-over';g.shadowBlur=0;g.shadowOffsetX=0;g.shadowColor='transparent';g.clearRect(0,0,1920,1080);g.fillStyle='#ff00ff';g.fill();assert.deepEqual([...g.getImageData(4,4,1,1).data],[255,0,255,255]);checks++;
}
for(const bad of [null,{}, {...api.defaultScene(),title:'W'.repeat(12)}, {...api.defaultScene(),stat:{value:'12.3%',label:'ABC'}}]){
 const c=createCanvas(1920,1080),g=c.getContext('2d');const before=sha(c);assert.throws(()=>api.compose(g,bad));assert.equal(sha(c),before);checks++;
}
const c=createCanvas(500,500),g=c.getContext('2d');g.translate(10,20);const clip=new (require('./resources.cjs').canvas().Path2D)();clip.rect(0,0,40,40);g.clip(clip);api.compose(g,api.defaultScene(),{scale:.25});assert.equal(g.getTransform().e,10);assert.equal(g.getImageData(100,100,1,1).data[3],0);checks++;
console.log(checks+' composition regression assertions PASS; static regression only, no new motion/aesthetic acceptance');
