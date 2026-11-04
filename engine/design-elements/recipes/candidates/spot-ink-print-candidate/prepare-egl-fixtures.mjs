import {createExternalOutput} from './output-directory.mjs';
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {options} from './validation.mjs';import {drawFixture,neutralOptions} from './fixtures.mjs';
const require=createRequire(import.meta.url);const {createCanvas}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
const dir=await createExternalOutput();
for(let i=0;i<2;i++){const c=drawFixture(createCanvas(320,200),i);await fs.writeFile(path.join(dir,`geometry-${i}.png`),c.toBuffer('image/png'));}
const variants=[neutralOptions,{...neutralOptions,off:[[2,-1],[-3,2],[1,1]],rot:[.0005,-.0005,0],seed:8,sheet:3,boil:.35},{...neutralOptions,gate:[1,0,.4],sweep:[80,120,170],period:9,grain:2}];
for(let i=0;i<variants.length;i++)await fs.writeFile(path.join(dir,`options-${i}.json`),JSON.stringify({width:320,height:200,options:options(variants[i],320)},null,2));
console.log(dir);
