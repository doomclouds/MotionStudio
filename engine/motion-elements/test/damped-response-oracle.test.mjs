import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{compileDampedResponse,sampleDampedResponse}from'../lib/foundations/motion/damped-response.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/damped-response-oracle.json',import.meta.url)));
test('static independent 100-decimal matrix-exponential fixtures cover stiff, critical and long-phase regimes without runtime Python dependencies',()=>{
 assert.equal(fixture.cases.length,84);
 for(const [index,c]of fixture.cases.entries()){
  const plan=compileDampedResponse(c.spec);assert.equal(plan.omega,c.omega);const actual=sampleDampedResponse(plan,c.time);
  for(const key of ['position','velocity']){
   const expected=c.expected[key],scale=Math.max(1,Math.abs(expected),key==='velocity'?c.omega*16:16),allowed=c.toleranceMultiplier*scale;
   assert.ok(Math.abs(actual[key]-expected)<=allowed,JSON.stringify({index,key,actual:actual[key],expected,allowed}));
  }
 }
});
