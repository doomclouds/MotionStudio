import resources from './resources.cjs';import fs from'node:fs';import{createRequire}from'node:module';import{render,registerFonts,config}from'./design/scene.mjs';
const require=createRequire(import.meta.url),{createCanvas,GlobalFonts,Path2D}=resources.canvas();registerFonts(GlobalFonts);
for(const revision of [false,true]){const c=createCanvas(config.width,config.height);render(c.getContext('2d'),{revision,Path2D});resources.write((revision?'readable-revision':'faithful')+'.png',c.toBuffer('image/png'))}
