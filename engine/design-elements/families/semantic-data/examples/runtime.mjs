// Caller-owned installed runtime/fonts. Never installs or downloads resources.
import {createRequire} from 'node:module';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export function loadCanvas(){
 const root=process.env.MOTION_ENGINE_ROOT;
 if(!root||!path.isAbsolute(root))throw Error('MOTION_ENGINE_ROOT must be an absolute installed runtime directory');
 const api=createRequire(path.join(root,'package.json'))('@napi-rs/canvas');
 const dir=process.env.SEMANTIC_DATA_FONT_DIR||process.env.UI_TEST_FONT_DIR;
 if(!dir||!path.isAbsolute(dir))throw Error('SEMANTIC_DATA_FONT_DIR (or UI_TEST_FONT_DIR) must point to an external DejaVu font directory');
 const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSerif.ttf','DejaVuSerif-Bold.ttf'];
 const identities=fonts.map(name=>{const file=path.join(dir,name);const bytes=readFileSync(file);if(!api.GlobalFonts.registerFromPath(file,name.includes('Serif')?'serif':'sans-serif'))throw Error('Font registration failed: '+name);return{name,sha256:createHash('sha256').update(bytes).digest('hex')};});
 return {...api,fontIdentities:identities};
}
