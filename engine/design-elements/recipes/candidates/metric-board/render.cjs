const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {outputTargets}=require('./output-preflight.cjs');
const output=require.main===module?outputTargets(process.env.METRIC_OUTPUT||'metric-output'):null;
const font=process.env.METRIC_FONT;
if(!font)throw Error('Set METRIC_FONT to the exact IBM Plex Mono Regular font; see font-lock.json');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const {drawMetric}=require('./metrics.cjs');
const lock=require('./font-lock.json');if(crypto.createHash('sha256').update(fs.readFileSync(font)).digest('hex')!==lock.sha256)throw Error('font identity mismatch');
if(!GlobalFonts.registerFromPath(font,'MetricMono'))throw Error('font registration failed');
function draw(g,variant='board'){
 g.save();g.fillStyle='#ece9fa';g.fillRect(0,0,960,540);
 g.fillStyle='#34285d';g.font='16px MetricMono';g.fillText('A REUSABLE NUMERIC DISPLAY / STATIC RECIPE',48,54);
 g.fillStyle='#d97a35';g.fillRect(48,166,56,4);g.fillStyle='#34285d';g.font='34px MetricMono';g.fillText(variant==='board'?'Studio production':'Workshop attendance',48,110);
 g.font='16px MetricMono';g.fillText('Illustrative values, not connected to a service',48,146);
 const data=variant==='board'?[['Completed',57,'count'],['Planned',80,'count'],['Completion',71.25,'percent'],['Revisions',12,'count']]:[['Registered',240,'count'],['Attended',186,'count'],['Attendance',77.5,'percent'],['Sessions',6,'count']];
 data.forEach(([label,value,kind],i)=>drawMetric(g,{label,value,kind},{x:48+(i%2)*448,y:196+Math.floor(i/2)*142,w:416,h:116}));
 g.font='14px MetricMono';g.fillStyle='#5b527a';g.fillText('Percentages rounded to one decimal. Counts are exact inputs.',48,510);g.restore();
}
function render(variant='board'){const c=createCanvas(960,540);draw(c.getContext('2d'),variant);return c.toBuffer('image/png')}
module.exports={render,draw};
if(require.main===module){
 const {dir,targets}=output;
 const results=targets.map(([v,f])=>[f,render(v)]);fs.mkdirSync(dir,{recursive:true});for(const [f,b] of results)fs.writeFileSync(f,b,{flag:'wx'});
}
