'use strict';
const {loadEnvironment,outputDirectory,writeExclusive}=require('../runtime.cjs');
const scenes=require('./compositions.cjs'),env=loadEnvironment(),out=outputDirectory();
for(const [name,fn]of Object.entries(scenes)){const r=fn(env);writeExclusive(out,name+'.png',r.canvas.toBuffer('image/png'));writeExclusive(out,name+'-layout.json',JSON.stringify(r.layouts,null,2)+'\n');console.log(name,r.layouts.map(l=>l.lineCount));}
