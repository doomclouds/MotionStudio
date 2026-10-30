import*as expressive from'./expressive-type.mjs';
import*as radial from'./radial-scale.mjs';
import*as diagonal from'./diagonal-field.mjs';
import*as paths from'./authored-paths.mjs';
import*as typography from'./typographic-focus.mjs';
import*as sections from'./color-sections.mjs';
import*as material from'./material-surfaces.mjs';
import*as data from'./semantic-data.mjs';
import*as controls from'./parameter-controls.mjs';
export const registry=Object.freeze(Object.fromEntries([typography,sections,material,data,controls,expressive,radial,diagonal,paths].map(m=>[m.id,Object.freeze({version:1,validate:m.validate,draw:m.draw})])));
export function drawAsset(ctx,{assetId,version,props},env){if(version!==1||!registry[assetId])throw new RangeError('Unknown asset ID/version');return registry[assetId].draw(ctx,props,env)}
