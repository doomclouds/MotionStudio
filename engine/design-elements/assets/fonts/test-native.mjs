import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {readReviewedFont} from './read-font.mjs';
import {loadNativeCanvas} from '../../../motion-render-core/lib/native.mjs';
const {api}=loadNativeCanvas(),root=new URL('./',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
test('exact licensed font bytes register and render actual Chinese through Native',()=>{
 assert.ok(manifest.fonts.length>0);const hashes=[];
 for(const [i,f] of manifest.fonts.entries()){
  const {bytes}=readReviewedFont(f.id);assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL(f.licenseFile,root))).digest('hex'),f.licenseSha256);
  const family=`Reviewed Chinese ${i}`;assert.ok(api.GlobalFonts.register(bytes,family));
  const c=api.createCanvas(800,140),g=c.getContext('2d');g.font=`40px "${family}"`;g.fillStyle='#243a55';g.fillText('白板动画：中文手写，逐笔绘制。',10,60);
  assert.ok(g.measureText('白板动画：中文手写，逐笔绘制。').width<780);
  const p=g.getImageData(0,0,800,140).data;assert.ok(p.some(v=>v!==0));hashes.push(createHash('sha256').update(p).digest('hex'));
 }
 assert.equal(new Set(hashes).size,hashes.length,'Distinct font identities should not silently render the same fallback');
});
