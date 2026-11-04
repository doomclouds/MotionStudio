// Explicit caller-owned native installation and licensed CJK font. No downloads.
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function loadCanvas(){
 const root=process.env.MOTION_ENGINE_ROOT;
 if(!root||!path.isAbsolute(root))throw Error('MOTION_ENGINE_ROOT must be an absolute installed runtime directory');
 const font=process.env.VERTICAL_IMPRINT_FONT_FILE||process.env.UI_B05_FONT_FILE;
 if(!font||!path.isAbsolute(font))throw Error('VERTICAL_IMPRINT_FONT_FILE (or UI_B05_FONT_FILE) must be an absolute licensed standalone CJK font face');
 const check=spawnSync('python3',[fileURLToPath(new URL('../test/verify-font.py',import.meta.url)),font],{encoding:'utf8'});
 if(check.error||check.status!==0)throw Error('CJK coverage/identity check failed: '+(check.error?.message||check.stderr||check.stdout));
 const identity=JSON.parse(check.stdout);
 const api=createRequire(path.join(root,'package.json'))('@napi-rs/canvas');
 if(!api.GlobalFonts.registerFromPath(font,'B05Song'))throw Error('CJK font registration failed');
 return {...api,fontIdentities:[{alias:'B05Song',...identity}]};
}
