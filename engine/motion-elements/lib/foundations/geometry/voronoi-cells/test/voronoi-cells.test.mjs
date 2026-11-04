import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';
test('three-site area partition and nearest-site vertex certificate',()=>{
 const sites=[{x:1,y:1},{x:9,y:1},{x:5,y:8}],bounds={x:0,y:0,width:10,height:10};const cells=api.voronoiCells({sites,bounds});
 const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-a.y*b.x;},0))/2;
 assert(Math.abs(cells.reduce((s,c)=>s+area(c.vertices),0)-100)<1e-8);
 for(const cell of cells)for(const p of cell.vertices)for(const q of sites)assert(Math.hypot(p.x-cell.site.x,p.y-cell.site.y)<=Math.hypot(p.x-q.x,p.y-q.y)+1e-8);
});
test('outside site can be empty and query copies caller data',()=>{
 const input={sites:[{x:0,y:0},{x:1000,y:0}],bounds:{x:0,y:0,width:10,height:10}};const cells=api.voronoiCells(input);assert.equal(cells[1].vertices.length,0);input.sites[0].x=9;assert.equal(cells[0].site.x,0);
});
