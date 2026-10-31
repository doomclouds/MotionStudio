'use strict';
const source=require('../light-leak/film-frame.cjs');
function drawLightField(ctx,p,env){source.validateField(p);const b=p.bounds;if(!env?.canvasApi?.createCanvas)throw Error('canvasApi required');if(!Number.isInteger(b.width)||!Number.isInteger(b.height)||b.width<120||b.height<80||Math.abs(b.x)>8192||Math.abs(b.y)>8192)throw Error('Candidate integer bounds min120x80 required');const tile=env.canvasApi.createCanvas(b.width,b.height);const result=source.drawField(tile.getContext('2d'),{...p,bounds:{...b,x:0,y:0}},env);ctx.drawImage(tile,b.x,b.y);return{...result,bounds:{...b},hotCenter:{x:b.x+result.hotCenter.x,y:b.y+result.hotCenter.y},kind:'procedural-static-light-field'}}
module.exports={drawLightField};
