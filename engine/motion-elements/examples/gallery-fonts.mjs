// Example-only system font discovery. No font downloads or bundled assets.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {basename} from 'node:path';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const candidates=[
 ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
 ['/usr/share/fonts/dejavu/DejaVuSans.ttf','/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'],
 ['/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf'],
 ['/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf','/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'],
];
export function registerGalleryFonts(GlobalFonts=loadNativeCanvas().api.GlobalFonts){
  for(const paths of candidates){
    if(!paths.every(existsSync))continue;
    const files=paths.map(path=>({name:basename(path),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
    const registered=paths.map(path=>GlobalFonts.registerFromPath(path,'Motion Gallery Sans'));
    if(registered.every(Boolean))return {family:'Motion Gallery Sans',status:'registered-system-sans',files};
  }
  console.warn('Gallery: DejaVu Sans/Liberation Sans unavailable; using platform sans-serif fallback. Typography and pixel identity are not guaranteed.');
  return {family:'sans-serif',status:'platform-fallback',files:[]};
}
