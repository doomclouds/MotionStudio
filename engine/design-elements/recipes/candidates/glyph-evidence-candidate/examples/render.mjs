// SPDX-License-Identifier: Apache-2.0
import {createEnvironment,write,target} from '../runtime.mjs';import {renderExamples} from './scenes.mjs';
const out=target(process.argv[2]),env=createEnvironment(),r=renderExamples(env),files={};for(const n of ['advance','marks']){files[n+'.png']=r[n].toBuffer('image/png');files[n+'-layout.json']=Buffer.from(JSON.stringify(r.layouts[n],null,2)+'\n');}
const m=r.kit.model({text:'j.f AV',instance:'serif-soft',size:180}),tile=r.kit.specimenTile(m,{width:800,height:250,ink:'#d56740'});files['transparent.png']=r.kit.png(tile);files['transparent-layout.json']=Buffer.from(JSON.stringify(tile.plan,null,2)+'\n');write(out,files);console.log('PASS six artifacts; two complete compositions and one transparent tile');
