import fs from'node:fs';import{createRequire}from'node:module';import{createHash}from'node:crypto';import{drawBars}from'./design/bars.mjs';
const resources=createRequire(import.meta.url)('./resources.cjs');
const {createCanvas,GlobalFonts,Path2D}=resources.canvas();
for(const[f,a]of[['Inter800.ttf','RollTitle'],['Inter500.ttf','RollSans'],['MonoBold.ttf','RollMono']])if(!GlobalFonts.registerFromPath(resources.font(f),a))throw Error('font registration failed');
export const items=[{label:'Mon',value:1200},{label:'Tue',value:2400},{label:'Wed',value:1800},{label:'Thu',value:4200},{label:'Fri',value:3600}];
export function render(){const cv=createCanvas(1440,810),c=cv.getContext('2d');c.fillStyle='#0e0e10';c.fillRect(0,0,1440,810);c.fillStyle='#f5f5f2';c.font='800 47px RollTitle';c.letterSpacing='-.94px';c.save();c.translate(115,0);c.scale(.955,1);c.fillText('This week on GitHub',0,127);c.restore();c.letterSpacing='0px';drawBars(c,{items,Path2D});return cv}
if(process.argv[1]===new URL(import.meta.url).pathname){const b=render().toBuffer('image/png');resources.write('faithful.png',b);console.log(createHash('sha256').update(b).digest('hex'))}
export{createCanvas,Path2D};
