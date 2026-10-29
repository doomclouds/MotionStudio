import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import * as api from '../lib/index.mjs';import * as convolution from '../lib/foundations/raster/convolution.mjs';import * as projection from '../lib/foundations/raster/projective-raster.mjs';import * as masonry from '../lib/foundations/layout/masonry.mjs';import * as labels from '../lib/foundations/layout/anchored-labels.mjs';import {queryCatalog} from '../lib/catalog-query.mjs';import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const catalog=JSON.parse(readFileSync(new URL('../catalog.json',import.meta.url)));
const ids=['raster.neighborhood-convolution','raster.projective-quad','composition.masonry','composition.anchored-labels'];
test('four canonical modules retain same function objects, alias and branded plans through index',()=>{
 for(const mod of [convolution,projection,masonry,labels])for(const [k,v]of Object.entries(mod))assert.equal(api[k],v,k);
 assert.equal(api.mapProjectivePoint,api.projectRasterPoint);
 const plan=api.compileProjectiveRaster(catalog.elements.find(x=>x.id===ids[1]).example);assert.deepEqual(api.mapProjectivePoint(plan,{x:1,y:2}),projection.projectRasterPoint(plan,{x:1,y:2}));assert.throws(()=>api.mapProjectivePoint({...plan},{x:1,y:2}));
});
test('all four public examples execute without importing film or private assets',()=>{
 for(const id of ids){const entry=catalog.elements.find(e=>e.id===id);const result=api[entry.api](entry.example);assert.ok(result);}
 const entry=catalog.elements.find(e=>e.id===ids[3]);assert.equal(api.placeAnchoredLabels(entry.example).placements[0].candidateIndex,1);
});
test('new rasters feed caller Canvas and layout transforms while source bytes and caller state stay separate',()=>{
 const pixels=new Uint8ClampedArray(4*4*4);for(let i=0;i<pixels.length;i+=4)pixels.set([i*3%256,80,170,255],i);const source={width:4,height:4,data:pixels},before=[...pixels];
 const blurred=api.convolveRGBA(api.compileConvolution({kernel:[[1,2,1]],boundary:'clamp',effect:'blur',amount:1,alphaMode:'preserve'}),source);
 const warped=api.warpProjectiveRGBA(api.compileProjectiveRaster({sourceWidth:4,sourceHeight:4,outputWidth:48,outputHeight:32,quad:[{x:0,y:0},{x:48,y:0},{x:48,y:32},{x:0,y:32}]}),blurred);
 const wall=api.masonryLayout({items:[{itemId:'a',height:32},{itemId:'b',height:24}],columns:2,columnWidth:48,columnGap:8,rowGap:5});
 const note=api.placeAnchoredLabels({labels:[{itemId:'note',anchor:{x:24,y:12},width:40,height:12,priority:1,offsets:[{x:16,y:0},{x:0,y:42}]}],obstacles:wall.items.map(x=>x.geometryBounds),viewport:{x:0,y:0,width:120,height:90},clearance:2});assert.equal(note.placements[0].candidateIndex,1);
 const {api:native}=loadNativeCanvas(),tile=native.createCanvas(48,32),tc=tile.getContext('2d'),im=tc.createImageData(48,32);im.data.set(warped.data);tc.putImageData(im,0,0);const canvas=native.createCanvas(120,90),ctx=canvas.getContext('2d');
 const render=()=>{ctx.reset();ctx.globalAlpha=.5;ctx.translate(1,2);const alpha=ctx.globalAlpha,initial=ctx.getTransform();for(const item of wall.items){ctx.save();ctx.transform(...item.matrix);ctx.drawImage(tile,0,0,item.rect.width,item.rect.height);ctx.restore();}for(const item of note.items){ctx.save();ctx.transform(...item.matrix);ctx.fillRect(0,0,item.rect.width,item.rect.height);ctx.restore();}assert.equal(ctx.globalAlpha,alpha);assert.deepEqual(ctx.getTransform(),initial);return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');};
 assert.equal(render(),render());assert.deepEqual([...pixels],before);assert.notEqual(blurred.data,pixels);assert.notEqual(warped.data,blurred.data);
});
test('four foundations do not increase recipes or collapse two films and quality gates',()=>{
 assert.equal(catalog.elements.length,67);assert.equal(catalog.elements.filter(e=>e.kind!=='recipe').length,60);assert.equal(catalog.elements.filter(e=>e.kind==='recipe').length,7);assert.equal(queryCatalog(catalog,{kind:'raster'}).total,8);
 for(const id of ids){const result=queryCatalog(catalog,{id});assert.equal(result.total,1);const entry=result.results[0].element;assert.equal(entry.status,'experimental');for(const k of ['artisticReview','ownerArtisticAcceptance'])assert.equal(entry.evidence[k],'PENDING_USER');assert.equal(entry.evidence.normalSpeedViewing,'NOT_DONE');assert.equal(entry.evidence.audioListening,'NOT_LISTENED');assert.equal(entry.evidence.originalProductionTransfer,'NOT_RUN');assert.equal(entry.evidence.visualDemo,null);assert.match(entry.evidence.callEvidenceScope,/actual/i);entry.example.__test=1;assert.equal(catalog.elements.find(e=>e.id===id).example.__test,undefined);}
 assert.match(queryCatalog(catalog,{id:ids[0]}).results[0].element.evidence.sourceVersionRelation,/stricter/);assert.match(queryCatalog(catalog,{id:ids[2]}).results[0].element.evidence.sourceVersionRelation,/byte-match/);
});
