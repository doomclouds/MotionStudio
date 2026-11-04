// Caller-owned installed Native runtime; this rectangle-only family uses no fonts.
import {createRequire} from 'node:module';
import path from 'node:path';
export function loadCanvas(){
 const root=process.env.MOTION_ENGINE_ROOT;
 if(!root||!path.isAbsolute(root))throw Error('MOTION_ENGINE_ROOT must be an absolute installed runtime directory');
 return createRequire(path.join(root,'package.json'))('@napi-rs/canvas');
}
