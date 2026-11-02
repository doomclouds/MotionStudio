import{assertAssets}from'../runtime.mjs';
import{pathToFileURL}from'node:url';
const root=process.env.MOTION_UI_ASSETS_ROOT;if(!root)throw Error('MOTION_UI_ASSETS_ROOT must point to existing published design-elements');
assertAssets(root);
export const{drawAsset}=await import(pathToFileURL(root+'/index.mjs'));
export function transaction(ctx,env,fn){if(!env?.canvasApi?.createCanvas||!ctx?.drawImage)throw new TypeError('caller canvasApi and target context required');const frame=env.canvasApi.createCanvas(1200,750),c=frame.getContext('2d');const result=fn(c);ctx.drawImage(frame,0,0);return{...result,width:1200,height:750,transactional:true,synthetic:true}}
export function callWithTrace(c,env,calls,id,props){const result=drawAsset(c,{assetId:id,version:1,props},env);calls.push(id);return result}
export function requireBrief(d){if(d?.disclosure!=='synthetic'||!d.theme||typeof d.theme.fontFamily!=='string')throw new TypeError('Explicit synthetic brief and caller font theme required')}
