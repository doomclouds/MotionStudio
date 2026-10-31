import runtime from '../shared/runtime.cjs';
export const config={width:1920,height:1080,fps:1,duration:1};
export const dependencies=runtime.dependencies('bold-signal');
export const usedAssetIds=[];
export function createScene(context){return runtime.createScene('bold-signal','transfer',context)}
