// SPDX-License-Identifier: MIT
import {setup,writeExact} from './runtime.mjs';
import {renderFieldStudy,renderEdition} from './examples/compositions.mjs';
const api=setup(),out=process.argv[2];
const scenes=[['field-study',renderFieldStudy(api)],['edition-desk',renderEdition(api)]];
const files={};
for(const [name,s]of scenes){files[name+'.png']=s.canvas.toBuffer('image/png');files[name+'.json']=Buffer.from(JSON.stringify(s.model,null,2)+'\n');}
writeExact(out,files);console.log(JSON.stringify({scenes:scenes.map(([name,s])=>({name,width:s.canvas.width,height:s.canvas.height})),realFilesRead:0,devices:0,interactive:false}));
