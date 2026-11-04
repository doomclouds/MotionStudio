import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as base from '../lib/index.mjs';
import * as node from '../lib/node.mjs';

const root=new URL('../',import.meta.url);
function graph(url,seen=new Set(),externals=new Set()) {
 if(seen.has(url.href))return {seen,externals};seen.add(url.href);
 const s=readFileSync(url,'utf8');
 for(const m of s.matchAll(/(?:^|;)\s*(?:import|export)\s*(?:\{[^}]*\}|\*)\s*from\s*['"]([^'"]+)['"]/gm)) {
  if(m[1].startsWith('.'))graph(new URL(m[1],url),seen,externals);else externals.add(m[1]);
 }
 return {seen,externals};
}
test('default entry does not acquire arrival runtime; legacy baseline crypto boundary remains explicit',()=>{
 const g=graph(new URL('lib/index.mjs',root));
 assert.deepEqual([...g.externals],['node:crypto']);
 assert(![...g.seen].some(x=>x.endsWith('/foundations/field/arrival-field.mjs')));
 assert([...g.seen].some(x=>x.includes('/motion-timeline-core/lib/timeline.mjs')));
 for(const name of ['compileArrivalField','sampleArrivalField']){assert.equal(Object.hasOwn(base,name),false);assert.equal(typeof node[name],'function');}
 const n=graph(new URL('lib/node.mjs',root));assert([...n.seen].some(x=>x.includes('/motion-timeline-core/lib/timeline.mjs')));
});
test('public Node and default support exports use identical module instances',()=>{
 for(const name of ['compileSpriteAtlas','sampleSpriteAtlas','compilePolylineSections','extractPolylineSection'])assert.equal(base[name],node[name]);
});
test('package self-reference resolves default and explicit Node entry to canonical instances',async()=>{
 const p=await import('motion-elements'),n=await import('motion-elements/node');
 assert.equal(p.compileFiniteParticles,base.compileFiniteParticles);assert.equal(n.compileArrivalField,node.compileArrivalField);
 const pkg=JSON.parse(readFileSync(new URL('package.json',root)));
 assert.deepEqual(pkg.exports['./node'],{node:'./lib/node.mjs'});
});
test('new non-arrival implementation graphs introduce no Node or external dependencies',()=>{
 for(const path of ['foundations/motion/finite-particles/index.mjs','foundations/layout/weighted-hierarchy/index.mjs','foundations/raster/temporal-exposure/index.mjs','foundations/layout/poisson-disc/index.mjs','foundations/raster/sprite-atlas.mjs','foundations/motion/fixed-string-wave/index.mjs','foundations/geometry/visibility-fan/index.mjs','foundations/field/grid-transport/index.mjs','support/polyline-sections.mjs','foundations/motion/hard-disc-events/index.mjs','foundations/geometry/ray-chain/index.mjs','foundations/geometry/voronoi-cells.mjs','foundations/layout/minimum-cost-assignment.mjs','foundations/geometry/rectangle-obstacle-route.mjs','foundations/geometry/radial-landmark-warp.mjs','foundations/raster/distance-transform.mjs','foundations/raster/palette-diffusion.mjs','foundations/field/reaction-diffusion.mjs']){
 assert.deepEqual([...graph(new URL('lib/'+path,root)).externals],[],path);
 }
});
test('explicit registration manifest matches catalog, API and excluded support accounting',async()=>{
 const manifest=JSON.parse(readFileSync(new URL('examples/registration-manifest.json',root)));
 const cat=JSON.parse(readFileSync(new URL('catalog.json',root)));
 const api=JSON.parse(readFileSync(new URL('docs/public-api.json',root)));
 assert.equal(manifest.foundationIncrement,17);assert.equal(manifest.ids.length,17);assert.equal(new Set(manifest.ids).size,17);
 assert.equal(manifest.baselineFoundations+manifest.foundationIncrement,manifest.preparedFoundations);
 assert.equal(cat.elements.filter(e=>e.kind!=='recipe').length,manifest.preparedFoundations+1);
 assert.equal(cat.elements.filter(e=>e.id==='composition.ordered-bands').length,1); // post-manifest registration
 assert.equal(cat.elements.filter(e=>e.kind==='recipe').length,manifest.recipes);
 assert.deepEqual(api.defaultExports,Object.keys(base).sort());assert.deepEqual(api.nodeOnlyAdditionalExports,['compileArrivalField','sampleArrivalField']);
 assert.deepEqual(api.catalog,cat.elements.map(({id,api,entry})=>({id,api,entry})));
 for(const id of manifest.ids)assert.equal(cat.elements.filter(e=>e.id===id).length,1);
 for(const name of manifest.supportsExcluded)assert(!cat.elements.some(e=>e.id.endsWith('.'+name)));
 const {runRegisteredExamples}=await import('../examples/registered-foundations.mjs');assert.equal((await runRegisteredExamples()).length,17);
});

test('retired candidate entry paths are absent; current public functions are canonical',async()=>{
 for(const path of ['lib/candidate-index.mjs','lib/seven-foundations-candidate-index.mjs','lib/attractor-field.mjs','lib/two-link-ik.mjs','lib/sticky-interval.mjs'])assert.equal(existsSync(new URL(path,root)),false);
 const mapping={voronoiCells:'geometry/voronoi-cells',minimumCostAssignment:'layout/minimum-cost-assignment',routeRectangles:'geometry/rectangle-obstacle-route',compileRadialWarp:'geometry/radial-landmark-warp',distanceTransform:'raster/distance-transform',paletteDiffuse:'raster/palette-diffusion',reactionDiffusion:'field/reaction-diffusion'};
 for(const [name,path]of Object.entries(mapping)){const m=await import(new URL('lib/foundations/'+path+'.mjs',root));assert.equal(base[name],m[name]);}
 const arrival=await import('../lib/foundations/field/arrival-field.mjs');assert.equal(node.compileArrivalField,arrival.compileArrivalField);
});
