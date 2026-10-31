// SPDX-License-Identifier: MIT
// Narrow standalone source projection policy, not the host repository's policy suite.
import fs from 'node:fs';import path from 'node:path';import {root} from './runtime.mjs';
const files=JSON.parse(fs.readFileSync(path.join(root,'package-files.json'))),seen=new Set();
for(const f of files){
 if(typeof f!=='string'||f.includes('..')||path.isAbsolute(f)||seen.has(f))throw Error('invalid member');seen.add(f);
 if(!/\.(mjs|py|json|txt|md)$/.test(f)&&f!=='LICENSE')throw Error('non-text source member');
 const p=path.join(root,f),s=fs.lstatSync(p);if(s.isSymbolicLink()||!s.isFile())throw Error('regular source member');
 const raw=fs.readFileSync(p);if(raw.includes(0))throw Error('binary source member');
 const text=raw.toString('utf8');
 for(const bad of[/libfile_[a-z0-9]+/i,/file_[0-9a-f]{20,}/i,/\/workspace\//,/\/tmp\/od-/,/PRIVATE[-_]MANIFEST/])if(bad.test(text))throw Error('private/environment leakage: '+f);
}
if(!seen.has('LICENSE')||!seen.has('licenses/OpenMTP-MIT.txt')||!seen.has('licenses/Inter-OFL.txt')||!seen.has('licenses/Canvas-MIT.txt'))throw Error('license omission');
const p=JSON.parse(fs.readFileSync(path.join(root,'provenance.json')));if(p.formalFamilyIncrement!==0||p.candidateRecipes!==1||p.publicFamilyRegistration!==false)throw Error('candidate scope');
for(const f of['file-tiles.mjs','examples/compositions.mjs']){const s=fs.readFileSync(path.join(root,f),'utf8');for(const bad of[/loadImage/,/data:image/,/https?:\/\//,/readdir/,/child_process/,/navigator/,/fetch\(/])if(bad.test(s))throw Error('render dependency: '+f);}
console.log(JSON.stringify({status:'PASS',textMembers:files.length,fontBinaries:0,referenceImages:0,privateAuditFiles:0,formalFamiliesAdded:0}));
