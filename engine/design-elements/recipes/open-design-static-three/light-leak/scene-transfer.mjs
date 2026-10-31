import runtime from '../shared/runtime.cjs';
export const config={width:1920,height:1080,fps:1,duration:1};
export const dependencies=runtime.dependencies('light-leak');
export const usedAssetIds=[];
export function createScene(context){return runtime.createScene('light-leak','transfer',context)}
