import assert from 'node:assert/strict';import{createHash}from'node:crypto';import{createCanvas,Path2D,items,render}from'./render.mjs';import{drawBars,planBars}from'./design/bars.mjs';
const sha=c=>createHash('sha256').update(c.toBuffer('image/png')).digest('hex');let checks=0;
assert.equal(sha(render()),'432970bde28394cf0e5040f8e8bbacf671f07b139619a658975930df8555db4d');checks++;
const base=createCanvas(1440,810);drawBars(base.getContext('2d'),{items,Path2D});
for(const spacing of [-25,25]){const c=createCanvas(1440,810),g=c.getContext('2d');g.wordSpacing=spacing+'px';g.letterSpacing='10px';g.direction='rtl';g.textAlign='right';g.textBaseline='top';const before=[g.wordSpacing,g.letterSpacing,g.direction,g.textAlign,g.textBaseline];const data=structuredClone(items);drawBars(g,{items:data,Path2D});assert.equal(sha(c),sha(base));assert.deepEqual([g.wordSpacing,g.letterSpacing,g.direction,g.textAlign,g.textBaseline],before);assert.deepEqual(data,items);checks+=3;
for(const label of ['a\nb','a\tb','中文','<b>','W'.repeat(32)]){const before=sha(c);assert.throws(()=>drawBars(g,{items:[{label,value:2},{label:'B',value:1},{label:'C',value:3}],width:480,height:320,Path2D}));assert.equal(sha(c),before);checks++;}}
assert.equal(planBars({items:[{label:'zero',value:0}]}).bars[0].height,0);checks++;
for(const bad of ['auto','log']){assert.throws(()=>planBars({items,scale:bad}));checks++;}
console.log(checks+' composition regression assertions PASS; static regression only, no new motion/aesthetic acceptance');
