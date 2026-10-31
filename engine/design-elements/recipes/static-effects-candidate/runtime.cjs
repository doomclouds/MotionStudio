'use strict';
const R=require('./resources.cjs');const glitch=require('./src/chromatic-frame.cjs'),liquid=require('./src/soft-orb-frame.cjs');
function loadFonts(recipe){const rows=R.fontFiles(recipe),{GlobalFonts}=R.canvas(),glyphs={};for(const f of rows){if(!GlobalFonts.registerFromPath(f.path,f.alias))throw Error('Font registration failed');if(recipe==='glitch')glyphs[f.alias==='GlitchDisplay'?'display':'mono']=new Set(f.cmap);else for(const[role,value]of Object.entries(liquid.ROLES))if(value.family===f.alias)glyphs[role]=new Set(f.cmap)}return{glyphs}}
function render(recipe,p){if(!['glitch','liquid'].includes(recipe))throw Error('Unknown recipe');const env=loadFonts(recipe),{createCanvas}=R.canvas(),c=createCanvas(1920,1080),geometry=(recipe==='glitch'?glitch:liquid).draw(c.getContext('2d'),p,env);return{png:c.toBuffer('image/png'),geometry}}
module.exports={loadFonts,render};
