'use strict';
const path=require('node:path');
function loadNative(){
  const hint=process.env.CANVAS_MODULE;
  if(hint!==undefined&&(typeof hint!=='string'||!path.isAbsolute(hint)))throw Error('CANVAS_MODULE must be absolute');
  const entry=require.resolve(hint||'@napi-rs/canvas'),pkg=require(path.join(path.dirname(entry),'package.json'));
  if(pkg.name!=='@napi-rs/canvas'||pkg.version!=='0.1.100')throw Error('Pinned Canvas 0.1.100 required');
  return require(entry);
}
module.exports={loadNative};
