// Instrumented fake API only: proves JS call/cleanup paths, NOT GPU behavior.
import test from 'node:test';import assert from 'node:assert/strict';import {createSpotInkCompositor} from './spot-ink.mjs';import {neutralOptions} from './fixtures.mjs';
class FakeCanvas {constructor(gl,w=320,h=200){this.gl=gl;this.width=w;this.height=h;}getContext(){return this.gl;}}
function fixture({compile=true}={}){
 const deleted=[],calls=[];let lost=false,error=0;
 const gl=new Proxy({COMPILE_STATUS:1,LINK_STATUS:2,NO_ERROR:0,getShaderParameter:()=>compile,getProgramParameter:()=>true,getShaderInfoLog:()=> 'compile-failed',getAttribLocation:()=>0,getUniformLocation:()=>({}),isContextLost:()=>lost,getError:()=>error}, {get(o,k){if(k in o)return o[k];if(k.startsWith('create'))return()=>({kind:k});if(k.startsWith('delete'))return x=>deleted.push(x);if(k.toUpperCase()===k)return k;return(...args)=>calls.push([k,args]);}});
 return {gl,deleted,calls,lose:()=>lost=true,error:()=>error=1280};
}
function setup(gl){globalThis.HTMLCanvasElement=FakeCanvas;const inputCanvas=new FakeCanvas(null),outputCanvas=new FakeCanvas(gl);return {inputCanvas,outputCanvas};}
test('instrumented allocation/delete balance and dispose twice',()=>{const f=fixture(),c=createSpotInkCompositor(setup(f.gl));c.render(neutralOptions);assert.equal(f.calls.filter(x=>x[0]==='drawArrays').length,1);c.dispose();assert.equal(f.deleted.length,6);c.dispose();assert.equal(f.deleted.length,6);assert.throws(()=>c.render(neutralOptions),/disposed/);});
test('instrumented compile failure cleans allocated resources',()=>{const f=fixture({compile:false});assert.throws(()=>createSpotInkCompositor(setup(f.gl)),/compile-failed/);assert.equal(f.deleted.length,2);});
test('instrumented lost context, error and resize rejection',()=>{let f=fixture(),config=setup(f.gl),c=createSpotInkCompositor(config);config.inputCanvas.width=10;assert.throws(()=>c.render(neutralOptions),/resized/);config.inputCanvas.width=320;f.error();assert.throws(()=>c.render(neutralOptions),/render error/);f.lose();assert.throws(()=>c.render(neutralOptions),/context lost/);c.dispose();});
test('instrumented unavailable context and invalid size',()=>{assert.throws(()=>createSpotInkCompositor(setup(null)),/unavailable/);const c=setup(null);c.outputCanvas.width=0;assert.throws(()=>createSpotInkCompositor(c),/dimensions/);});
