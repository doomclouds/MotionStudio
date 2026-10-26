import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {sampleFiniteSettle as sample,composeTransform,transformPoint} from '../lib/index.mjs';
const options={amplitude:.3,oscillations:2.3,decay:3};
test('finite settle exact endpoints and analytic derivative, bounded amplitude',()=>{
 for(const amplitude of [-1,0,.3,1])for(const oscillations of [1,2.3,4])for(const decay of [0,3,8]){
 const o={amplitude,oscillations,decay};
 for(const u of [0,1])assert.deepEqual(sample(u,o),{residual:0,derivative:0});
 for(let i=1;i<100;i++){const u=i/100,v=sample(u,o),h=1e-6,der=(sample(u+h,o).residual-sample(u-h,o).residual)/(2*h);
 assert.ok(Math.abs(der-v.derivative)<1e-6);assert.ok(Math.abs(v.residual)<=Math.abs(amplitude));}
 for(const u of [1e-8,1-1e-8]){assert.ok(Math.abs(sample(u,o).residual)<1e-12);assert.ok(Math.abs(sample(u,o).derivative)<1e-5);}
 }
});
test('finite settle rejects illegal options and preserves deterministic independent seeking',()=>{
 for(const u of [null,NaN,Infinity,-.1,1.1])assert.throws(()=>sample(u,options));
 for(const o of [null,{}, {...options,extra:1},{...options,amplitude:2},{...options,oscillations:0},{...options,decay:9}])assert.throws(()=>sample(.5,o));
 const expected=new Map([0,.1,.7,1].map(u=>[u,sample(u,options)]));for(const u of [1,.1,0,.7])assert.deepEqual(sample(u,options),expected.get(u));
 const url=new URL('../lib/settle.mjs',import.meta.url).href;
 assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import {sampleFiniteSettle as s} from '${url}'; console.log(JSON.stringify(s(.7,${JSON.stringify(options)})))`],{encoding:'utf8'})),sample(.7,options));
});
test('anchored geometric settling retains foot contact at 24/30/60 fps and reduced mode',()=>{
 for(const fps of [24,30,60])for(const reducedMotion of [false,true])for(let frame=0;frame<=fps*2;frame++){
 const u=frame/(fps*2),r=reducedMotion?0:sample(u,options).residual,sy=1+.15*r;
 const fixed=composeTransform({scaleX:1/sy,scaleY:sy,pivot:{x:0,y:40}});
 const p=transformPoint(fixed,{x:0,y:40});assert.ok(Math.abs(p.y-40)<1e-10);assert.ok(sy>0);
 }
});
