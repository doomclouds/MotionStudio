import test from'node:test';import assert from'node:assert/strict';import{loadNativeCanvas}from'../../motion-render-core/lib/native.mjs';import{compileSpriteAtlas,sampleSpriteAtlas}from'../lib/foundations/raster/sprite-atlas.mjs';
const{api}=loadNativeCanvas();
test('Native RGBA source rectangle and isolated crop exclude neighboring cells',()=>{
 const atlas=api.createCanvas(6,2),ctx=atlas.getContext('2d'),im=ctx.createImageData(6,2);for(let y=0;y<2;y++)for(let x=0;x<6;x++){let i=(y*6+x)*4;im.data.set(x<3?[255,0,0,[255,128,0][x]]:[0,255,0,255],i);}ctx.putImageData(im,0,0);
 const plan=compileSpriteAtlas({atlas:{width:6,height:2},frames:[{id:'red',rect:{x:0,y:0,width:3,height:2},durationTicks:2},{id:'green',rect:{x:3,y:0,width:3,height:2},durationTicks:3}],mode:'loop',startTick:0});
 for(const [tick,color]of[[0,0],[1,0],[2,1],[4,1],[5,0]]){const s=sampleSpriteAtlas(plan,tick),r=s.rect,exact=ctx.getImageData(r.x,r.y,r.width,r.height);assert.equal(exact.data.length,24);for(let n=0;n<6;n++){assert.equal(exact.data[n*4+2],0);assert.equal(exact.data[n*4+(1-color)],0);if(color===0)assert.equal(exact.data[n*4+3],[255,128,0][n%3]);else assert.equal(exact.data[n*4+3],255);}
  // Recommended caller adapter: exact RGBA extraction into its own surface,
  // then scale only that isolated surface. No drawImage atlas subrect filtering.
  const cell=api.createCanvas(r.width,r.height);cell.getContext('2d').putImageData(exact,0,0);const out=api.createCanvas(18,12),o=out.getContext('2d');o.imageSmoothingEnabled=true;o.drawImage(cell,0,0,18,12);const pixels=o.getImageData(0,0,18,12).data;for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i+(1-color)],0);assert.equal(pixels[i+2],0);}if(!color)assert([...pixels].some((v,i)=>i%4===3&&v>0&&v<255));
 }
});
