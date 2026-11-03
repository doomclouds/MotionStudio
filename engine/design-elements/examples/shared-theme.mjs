// SPDX-License-Identifier: MIT
// Fixed authored composition showing existing assets sharing palette roles.
// Not a theme engine, application shell, interactive control or registered asset.
import {drawAsset} from '../index.mjs';
export const palettes = Object.freeze({
  linen: Object.freeze({background:'#e8e6df',surface:'#faf9f5',inset:'#eeede6',ink:'#293b35',muted:'#5b6b62',accent:'#236651',edge:'#bdc9bf',track:'#bbc9c0'}),
  night: Object.freeze({background:'#131f2c',surface:'#203041',inset:'#192737',ink:'#edf2f5',muted:'#b5c5d3',accent:'#9edcc4',edge:'#506376',track:'#597084'})
});
export const states = ['paused','active'];
export function renderSharedTheme(api, paletteId, state, fontFamily) {
  if(!Object.hasOwn(palettes,paletteId)||!states.includes(state))throw TypeError('unsupported authored palette or state');
  if(typeof fontFamily!=='string'||!api.GlobalFonts.has(fontFamily))throw TypeError('explicit registered font required');
  const p=palettes[paletteId],theme={...p,fontFamily},canvas=api.createCanvas(1440,900),c=canvas.getContext('2d'),calls=[],labels=[];
  const status=state==='active'?'Active / demonstration':'Paused / demonstration';
  const call=(region,id,props)=>{const result=drawAsset(c,{assetId:id,version:1,props},{canvasApi:api});calls.push({region,id,props,result});return result;};
  const surface=(region,bounds,fill,title='',subtitle='')=>call(region,'design.material-surfaces.v1',{bounds,data:{variant:'opaque',padding:24,radius:18,elevation:0,title,subtitle},theme:{...theme,surface:fill,fontSize:20}});
  const label=(text,x,y,size,color,maxWidth)=>{c.font=`400 ${size}px ${fontFamily}`;if(c.measureText(text).width>maxWidth)throw RangeError('authored label overflow');c.fillStyle=color;c.fillText(text,x,y);labels.push({text,x,y,size,color,width:c.measureText(text).width});};
  c.fillStyle=p.background;c.fillRect(0,0,1440,900);c.textBaseline='alphabetic';
  label('ONE WORKSPACE / SHARED COLOUR ROLES',40,55,14,p.accent,1100);
  label(`Palette: ${paletteId}`,1190,55,15,p.ink,210);
  surface('sidebar',{x:40,y:100,width:250,height:730},p.inset,'Field desk','ORIGINAL STATIC EXAMPLE');
  surface('content',{x:320,y:100,width:1080,height:730},p.surface);
  label('01 / CURRENT NOTE',64,235,13,p.accent,202);
  label('Repair afternoon',64,274,19,p.ink,202);
  label('Materials',64,322,17,p.muted,202);
  label('People',64,363,17,p.muted,202);
  label('STATUS',64,682,12,p.muted,202);
  label(status,64,719,13,p.accent,202);
  c.fillStyle=p.accent;c.fillRect(64,745,52,4);
  call('heading','design.typographic-focus.v1',{bounds:{x:350,y:126,width:1010,height:196},theme,data:{kicker:'WORKING NOTE / FICTIONAL CONTENT',lines:['Make room for small repairs.'],body:['A shared bench, a few tools, and time to learn.'],titleSize:38,bodySize:20,padding:0,paintBackground:false}});
  call('parameter','design.parameter-controls.v1',{bounds:{x:350,y:350,width:510,height:220},theme:{...theme,surface:p.inset,fontSize:16},data:{label:'Review pace / synthetic value',value:60,min:0,max:100,unit:'%',ticks:5,disabled:state==='paused'}});
  surface('note',{x:888,y:350,width:472,height:220},p.inset,'Keep the next step visible.','A small plan, not a product claim');
  label('Put the unfinished object beside its note.',912,473,16,p.ink,424);
  label('Return the tools before the final review.',912,510,16,p.muted,424);
  surface('composer',{x:350,y:604,width:1010,height:180},p.inset,'Next note','This is a static field, not an input');
  label(status,374,746,16,p.accent,930);
  label('Same content, same geometry. Only palette roles change between themes.',40,867,15,p.muted,1300);
  return {canvas,plan:{paletteId,state,contentId:'repair-afternoon',status,calls,labels,staticOnly:true}};
}
