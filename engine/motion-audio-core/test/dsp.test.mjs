import test from 'node:test';
import assert from 'node:assert/strict';
import {fadeValue,envelope,pcmBuffer,fromPCM,measure} from '../lib/dsp.mjs';

test('one-sample fade is zero and equal-power endpoints are explicit',()=>{
 assert.equal(fadeValue(0,1),0);assert.equal(fadeValue(0,4,'equalPower'),0);assert.equal(fadeValue(3,4,'equalPower'),1);
 assert.ok(Math.abs(fadeValue(1,3,'equalPower')-Math.SQRT1_2)<1e-15);
});
test('gain points hold their endpoints and overlapping fades multiply',()=>{
 const points=[{sample:2,value:0.25},{sample:6,value:0.75}];
 assert.equal(envelope(0,8,[],points),0.25);assert.equal(envelope(7,8,[],points),0.75);assert.equal(envelope(3,8,[],points),0.375);
 const fades=[{direction:'in',samples:4,curve:'linear'},{direction:'out',samples:4,curve:'linear'}];
 assert.equal(envelope(1,4,fades,[]),2/9);
});
test('nonfinite samples reject; float output does not silently clip peaks',()=>{
 assert.throws(()=>pcmBuffer([NaN]),/Nonfinite/);assert.throws(()=>pcmBuffer([Infinity]),/Nonfinite/);
 assert.deepEqual([...fromPCM(pcmBuffer([1.5,-2,0]))],[1.5,-2,0]);
 const b=Buffer.alloc(4);b.writeFloatLE(NaN);assert.throws(()=>fromPCM(b),/Nonfinite/);
});
test('silence has unavailable dB peak; clipping is measured not repaired',()=>{
 assert.equal(measure([0,0],1).samplePeakDbFS,null);assert.equal(measure([0,0],1).silent,true);
 const m=measure([0.5,-1,1.5,0],2);assert.equal(m.frames,2);assert.equal(m.clippedSamples,2);assert.equal(m.samplePeak,1.5);
});
