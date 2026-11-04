// Explicit optional source comparison. No default test skip/pass on missing oracle.
import assert from 'node:assert/strict';
import {loadVerifiedUpstream,upstreamOracleIdentity} from './upstream-oracle.mjs';
import {spotInkShaderSources} from './shader-sources.mjs';
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--upstream'){console.error(JSON.stringify({status:'NOT_RUN',error:'Required: --upstream /absolute/riso.js'}));process.exit(2);}
try{
 const source=await loadVerifiedUpstream(args[1]);
 const vertex=/const VS = `(.*?)`;/s.exec(source)[1];let fragment=/const FS = `(.*?)`;/s.exec(source)[1];
 const a=fragment.indexOf('  if (uWaterY'),b=fragment.indexOf('  return d;',a);fragment=fragment.slice(0,a)+fragment.slice(b);
 fragment=fragment.split('\n').filter(l=>!l.startsWith('uniform float uWater')&&!l.startsWith('uniform float uRefl')).join('\n');
 assert.equal(vertex,spotInkShaderSources.vertex);assert.equal(fragment,spotInkShaderSources.fragment);
 console.log(JSON.stringify({status:'PASS',identity:upstreamOracleIdentity,scope:'source text only; water branch/uniforms removed; no pixel equivalence claim'}));
}catch(error){const missing=error.code==='ENOENT';console.error(JSON.stringify({status:missing?'NOT_RUN':'FAIL',error:String(error)}));process.exitCode=missing?2:1;}
