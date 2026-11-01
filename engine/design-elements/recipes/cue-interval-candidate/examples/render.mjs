import{loadNative,setup,writeNew}from'../runtime.mjs';import{compositions}from'./compositions.mjs';
const a=process.argv.slice(2);if(a.length!==2||a[0]!=='--output')throw Error('--output NEW_ABSOLUTE_EXTERNAL_DIRECTORY');const api=loadNative(),env=await setup(api);writeNew(a[1],compositions(api,env));console.log('two synthetic compositions / four output files');
