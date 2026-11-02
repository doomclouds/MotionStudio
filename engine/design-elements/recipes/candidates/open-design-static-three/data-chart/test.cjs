'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');const{createCanvas}=require('../shared/runtime.cjs').canvasApi();const{loadFonts,render,sha}=require('./render.cjs');const{draw,validate,chartGeometry,drawChart}=require('./paint.cjs');const{reference,transfer}=require('./fixtures.cjs');const env=loadFonts(),results=[];
const copy=x=>JSON.parse(JSON.stringify(x));function test(name,fn){fn();results.push({name,status:'PASS'})}
function rejects(change,base=reference){const x=copy(base);change(x);assert.throws(()=>render(x,env));}
function frozen(x){Object.freeze(x);for(const v of Object.values(x))if(v&&typeof v==='object')frozen(v);return x}
test('both fixtures validate',()=>{assert.equal(validate(reference),true);assert.equal(validate(transfer),true)});
test('reference geometry exactly preserves source coordinates',()=>assert.deepEqual(chartGeometry(reference.chart).points.map(x=>[x.x,x.y]),[[60,410],[180,405],[300,395],[420,380],[540,355],[660,320],[780,270],[900,195],[1020,90]]));
test('linear-value mode uses a zero-baseline scale',()=>{const g=chartGeometry(transfer.chart);for(const q of g.points)assert.equal(q.y,420-3*q.value);assert.deepEqual(g.ticks.map(x=>x.y),[420,300,180,60])});
test('reference input without mismatch acknowledgment rejected',()=>rejects(x=>delete x.chart.acknowledgeAxisMismatch));
test('missing synthetic disclosure rejected',()=>rejects(x=>x.chart.disclosure='real statistics'));
test('missing visible synthetic footer rejected',()=>rejects(x=>x.footer[0]='Source · Industry statistics'));
test('real-data claim rejected',()=>rejects(x=>x.chart.dataKind='measured'));
test('unknown chart mode rejected',()=>rejects(x=>x.chart.mode='guess'));
test('nonfinite coordinate rejected',()=>rejects(x=>x.chart.points[0].x=NaN));
test('unordered reference geometry rejected',()=>rejects(x=>x.chart.points[1].x=59));
test('out-of-plot coordinate rejected',()=>rejects(x=>x.chart.points[0].y=500));
test('invalid zero-baseline domain rejected',()=>rejects(x=>x.chart.domain=[10,120],transfer));
test('linear value outside domain rejected',()=>rejects(x=>x.chart.points[0].value=121,transfer));
test('nonfinite domain rejected',()=>rejects(x=>x.chart.domain=[0,Infinity],transfer));
test('incorrect fixed frame dimensions rejected',()=>rejects(x=>x.width=1280));
test('deformed chart aspect ratio rejected',()=>rejects(x=>x.chart.bounds.height=100));
test('missing/invalid annotation target rejected',()=>rejects(x=>x.chart.annotations[0].index=99));
test('out-of-range accent index rejected',()=>rejects(x=>x.chart.accentStart=9));
test('unsupported glyph rejected before fallback',()=>rejects(x=>x.headline[0][0].text='🛸'));
test('headline overflow rejected without shrinking',()=>rejects(x=>x.headline[0][0].text='编辑'.repeat(40)));
test('footer overflow rejected without truncation',()=>{const x=copy(reference);x.footer[0]='Synthetic long footer '.repeat(30);assert.throws(()=>render(x,env),/Text overflow/)});
test('unknown caller font coverage rejected',()=>assert.throws(()=>render(reference)));
test('frozen inputs remain unchanged',()=>{const x=frozen(copy(reference)),before=JSON.stringify(x);render(x,env);assert.equal(JSON.stringify(x),before)});
test('canvas drawing state preserved on success and error',()=>{const g=createCanvas(1920,1080).getContext('2d');g.translate(3,5);g.fillStyle='#123456';g.globalAlpha=.73;g.setLineDash([2,3]);const state=()=>({matrix:[...g.getTransform().toFloat64Array()],fill:g.fillStyle,alpha:g.globalAlpha,dash:g.getLineDash()});const before=state();draw(g,reference,env);assert.deepEqual(state(),before);const bad=copy(reference);bad.headline[0][0].text='Long headline '.repeat(50);assert.throws(()=>draw(g,bad,env));assert.deepEqual(state(),before)});
test('byte-identical repeated renders in pinned runtime',()=>{assert.equal(sha(render(reference,env).png),sha(render(reference,env).png));assert.equal(sha(render(transfer,env).png),sha(render(transfer,env).png))});
test('transfer changes content, palette and data from same implementation',()=>assert.notEqual(sha(render(reference,env).png),sha(render(transfer,env).png)));
test('standalone chart composes inside caller-owned canvas',()=>{const g=createCanvas(800,400).getContext('2d'),p=copy(transfer.chart);p.bounds={x:10,y:10,width:660,height:276};const geo=drawChart(g,p,transfer.theme,env);assert.equal(geo.points.length,9)});
const out={status:'PASS',count:results.length,results,scope:'Native static only; no browser, motion, interaction, original data truth, or user acceptance claim.'};console.log(JSON.stringify(out,null,2));
