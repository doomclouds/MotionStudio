// Offline Native determinism and exact accepted frame check; no artistic scoring.
import {createRequire} from 'node:module';import path from 'node:path';import {createHash} from 'node:crypto';import {createScene,config} from './design/scene.mjs';
const engine=process.env.MOTION_ENGINE_ROOT;if(!engine||!path.isAbsolute(engine))throw Error('Set MOTION_ENGINE_ROOT to an absolute Native engine directory');
const require=createRequire(path.join(engine,'package.json'));const api=require('@napi-rs/canvas');const canvas=api.createCanvas(config.width,config.height);const scene=await createScene({ctx:canvas.getContext('2d'),GlobalFonts:api.GlobalFonts,canvasApi:api});const hash=b=>createHash('sha256').update(b).digest('hex');
scene.render({time:0});const a=hash(canvas.toBuffer('image/png'));scene.render({time:999});const b=hash(canvas.toBuffer('image/png'));const expected='c13ca4e992fa022b3eb6f21a1ed9330736db7a0cdf2440ef5bfaba9e1a7367d4';if(a!==b||a!==expected)throw Error('Static output differs from recorded frame; check runtime/font contract');
console.log(JSON.stringify({status:'passed',width:1200,height:750,t0:a,t999:b,visual:'NOT_EVALUATED_BY_THIS_SCRIPT',scope:'Native static only'}));
