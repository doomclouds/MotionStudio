import{loadNative,loadEnvironment}from'./index.mjs';
import{buildExamples}from'./examples.mjs';
import{outputDirectory,writeNew}from'./io.mjs';
const api=loadNative(),env=loadEnvironment(api,{fontPath:process.env.TIMING_FONT});
// Complete all resources/model/paint checks before making a new destination.
const files=buildExamples(api,env),dir=outputDirectory(process.argv[2]);
for(const [name,data]of Object.entries(files))writeNew(dir,name,data);
console.log(JSON.stringify({outputs:Object.keys(files),staticOnly:true}));
