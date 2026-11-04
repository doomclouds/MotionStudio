import*as vertical from'./families/vertical-imprint/index.mjs';
import*as marks from'./families/geometric-marks/index.mjs';
import*as partition from'./families/proportional-partition/index.mjs';
import*as rings from'./families/ratio-rings/index.mjs';
import*as expressive from'./families/expressive-type/index.mjs';
import*as radial from'./families/radial-scale/index.mjs';
import*as diagonal from'./families/diagonal-field/index.mjs';
import*as paths from'./families/authored-paths/index.mjs';
import*as typography from'./families/typographic-focus/index.mjs';
import*as sections from'./color-sections.mjs';
import*as material from'./material-surfaces.mjs';
import*as data from'./families/semantic-data/index.mjs';
import*as controls from'./families/parameter-controls/index.mjs';
export const registry=Object.freeze(Object.fromEntries([typography,sections,material,data,controls,expressive,radial,diagonal,paths,vertical,marks,partition,rings].map(m=>[m.id,Object.freeze({version:1,validate:m.validate,draw:m.draw})])));
export function drawAsset(ctx,{assetId,version,props},env){if(version!==1||!registry[assetId])throw new RangeError('Unknown asset ID/version');return registry[assetId].draw(ctx,props,env)}
