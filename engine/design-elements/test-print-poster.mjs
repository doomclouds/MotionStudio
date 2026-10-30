import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {drawPoster,drawPaper,drawOverprint,recipes} from './print-poster.mjs';
const require=createRequire((process.env.MOTION_ENGINE_ROOT||new URL('../motion-render-core',import.meta.url).pathname)+'/package.json');const {createCanvas}=require('@napi-rs/canvas');
const canvas=createCanvas(1000,600),ctx=canvas.getContext('2d');
const render=r=>{drawPoster(ctx,r);return canvas.toBuffer('image/png');};
const a=render(recipes.listening);assert.deepEqual(a,render(recipes.listening));const b=render(recipes.workshop);assert.notDeepEqual(a,b);assert.deepEqual(b,render(recipes.workshop));
assert.throws(()=>drawPaper(ctx,{x:NaN,y:0,width:100,height:50}));assert.throws(()=>drawPaper(ctx,{x:0,y:0,width:10,height:50}));assert.throws(()=>drawOverprint(ctx,{text:'TOO WIDE',x:0,y:0,maxWidth:1}));assert.throws(()=>drawPoster(ctx,{shape:'unknown'}));
console.log('PASS: two content/subject recipes, deterministic frames, distinct pixels, four invalid inputs. Static synthetic tests, not aesthetic approval.');
