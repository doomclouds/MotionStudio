import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as api from '../../../../index.mjs';
const catalog=JSON.parse(readFileSync(new URL('../../../../../catalog.json',import.meta.url)));
const item=catalog.elements.find(e=>e.id==='composition.glyph-run-path');
assert(item);
const plan=api.compileCubicPath(item.exampleSetup.path),run=api.layoutGlyphRunOnPath(plan,item.example);
assert.equal(run.span,64);assert.equal(run.endDistance,84);assert.deepEqual(run.glyphs.map(g=>g.distance),[36,70]);
const line=api.compileCubicPath({segments:[{p0:{x:0,y:0},p1:{x:100,y:0},p2:{x:200,y:0},p3:{x:300,y:0}}],tolerance:.01});
const straight=api.layoutGlyphRunOnPath(line,item.example);
for(const [i,x] of [36,70].entries()){assert(Math.abs(straight.glyphs[i].position.x-x)<1e-10);assert.equal(straight.glyphs[i].position.y,-10);assert.equal(straight.glyphs[i].angle,0);}
assert(Object.isFrozen(run.glyphs[0].position));assert.deepEqual(run,api.layoutGlyphRunOnPath(plan,item.example));
assert.throws(()=>api.layoutGlyphRunOnPath({...plan},item.example));
assert.throws(()=>api.layoutGlyphRunOnPath(line,{...item.example,startDistance:250}));
console.log('composition.glyph-run-path contract PASS');
