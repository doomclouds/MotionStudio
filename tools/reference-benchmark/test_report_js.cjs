#!/usr/bin/env node
/** Offline control-state regression for report.py's actual embedded JavaScript.
 * Uses mocked DOM/video objects: validates logic ONLY, never media decoding,
 * browser layout, playback synchronization accuracy, or actual listening.
 * Run: node tools/reference-benchmark/test_report_js.cjs [report.py]
 * No network calls, credentials, or private input paths.
 */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');
const sourcePath=process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname,'report.py');
const src=fs.readFileSync(sourcePath,'utf8');
const js=src.split("JS=r'''\n")[1].split("\n'''")[0];
class El{constructor(){this.handlers={};this.classList={toggle(){}};this.currentTime=0;this.volume=1;this.muted=false;this.paused=true;this.readyState=4;this.dataset={};this.parentElement={};} addEventListener(t,fn){this.handlers[t]=fn;}setAttribute(){}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true;}emit(t,event={}){return this.handlers[t]?.({target:this,...event});}}
const ids=['reference-video','candidate-video','play-button','seek','play-time','play-error','gain-note','level-match'];let els=Object.fromEntries(ids.map(k=>[k,new El()]));
const config={clips:[{reference:'data:one',candidate:'data:two',start_s:8,end_s:18},{reference:'data:three',candidate:'data:four',start_s:36,end_s:46}],lufs:[-23.9,-24.8]};els['report-config']={textContent:JSON.stringify(config)};
const radios=['reference','candidate','none'].map(value=>Object.assign(new El(),{value}));const wins=[0,1].map(i=>Object.assign(new El(),{dataset:{window:String(i)}}));
const document={getElementById:k=>els[k],querySelectorAll:q=>q==='input[name=listen]'?radios:q==='[data-window]'?wins:[]};
vm.runInNewContext(js,{document,window:{addEventListener(){}},requestAnimationFrame(){},ResizeObserver:class{observe(){}},console});
(async()=>{let A=els['reference-video'],B=els['candidate-video'];assert.deepEqual([A.muted,B.muted],[false,true]);radios[1].emit('change');assert.deepEqual([A.muted,B.muted],[true,false]);await els['play-button'].emit('click');assert.deepEqual([A.paused,B.paused],[false,false]);els['level-match'].checked=true;els['level-match'].emit('change');assert(Math.abs(A.volume-Math.pow(10,-.9/20))<1e-8);assert.equal(B.volume,1);els['level-match'].checked=false;els['level-match'].emit('change');assert.equal(A.volume,1);assert.equal(B.volume,1);A.muted=false;A.emit('volumechange');assert.deepEqual([A.muted,B.muted],[true,false]);els.seek.value=3.5;els.seek.emit('input');assert.equal(A.currentTime,3.5);assert.equal(B.currentTime,3.5);wins[1].emit('click');assert.equal(A.currentTime,0);assert.equal(B.currentTime,0);assert(A.paused&&B.paused);assert.equal(els['play-time'].textContent,'36.00s / 46.00s');radios[2].emit('change');assert(A.muted&&B.muted);assert(els['gain-note'].textContent.includes('UNVERIFIED'));console.log('PASS: mocked DOM control-state tests (NOT browser playback verification): exclusive A/B, raw/level-match, paired seek, segment reset, silence, no review-status upgrade');})();
