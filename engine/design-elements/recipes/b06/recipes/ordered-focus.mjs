import{drawSeasonalStrip}from'../source-recipes/seasonal-strip.mjs';
import{transaction,callWithTrace,requireBrief}from'./common.mjs';
export const id='recipe.ordered-focus.v1';
/** Fixed-size composition recipe; NOT a registered UI family. */
export function draw(ctx,d,env){requireBrief(d);return transaction(ctx,env,c=>{const calls=[],call=(id,p)=>callWithTrace(c,env,calls,id,p);if(!Number.isInteger(d.activeIndex)||d.activeIndex<0||d.activeIndex>=24||!Array.isArray(d.items)||d.items.length!==24)throw new RangeError('exactly 24 authored items and valid selection');const selected=d.items[d.activeIndex];if(!selected||typeof selected.description!=='string'||typeof selected.task!=='string')throw new TypeError('selected content required');c.fillStyle=d.theme.surface;c.fillRect(0,0,1200,750);
 call('design.typographic-focus.v1',{bounds:{x:40,y:35,width:700,height:430},theme:d.theme,data:{kicker:d.kicker,lines:[selected.name+' · '+selected.colorName,d.headline],body:[selected.description,d.disclaimer],titleSize:46,bodySize:19,padding:0}});
 const panel=call('design.material-surfaces.v1',{bounds:{x:790,y:42,width:370,height:400},theme:{...d.theme,edge:d.theme.muted,fontSize:22},data:{variant:'opaque',title:d.panelTitle,subtitle:'內容隨當前選項更新',padding:22,radius:0,elevation:0}});
 call('design.typographic-focus.v1',{bounds:panel.contentBounds,theme:d.theme,data:{kicker:'SELECTED / '+String(d.activeIndex+1).padStart(2,'0')+' OF 24',lines:[selected.name],body:[selected.task,'色塊寬高只強調選中','不編碼時長或資料數量'],titleSize:52,bodySize:17,padding:0}});
 const strip=drawSeasonalStrip(c,{terms:d.items,activeIndex:d.activeIndex,x:0,y:518,headingFont:d.theme.fontFamily,labelFont:d.theme.fontFamily});
 return{id,calls,caseRecipeCalls:['drawSeasonalStrip'],selected:{index:d.activeIndex,name:selected.name},strip};})}
