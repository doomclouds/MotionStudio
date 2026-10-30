const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const fs=require('fs');const path=require('path');
const W=1440,H=900;
async function render(output){
  if(!output)throw new Error('Explicit external output PNG required');
  const root=fs.realpathSync(__dirname), repo=fs.realpathSync(path.join(root,'../../..')), target=path.resolve(output);
  let ancestor=path.dirname(target);
  while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
  const resolved=path.join(fs.realpathSync(ancestor),path.relative(ancestor,path.dirname(target)));
  let outputLink=false;try{outputLink=fs.lstatSync(target).isSymbolicLink();}catch(e){if(e.code!=='ENOENT')throw e;}
  if(resolved===repo||resolved.startsWith(repo+path.sep)||outputLink)throw new Error('Output must be outside repository and not a symlink');
  if(!process.env.HOKUSAI_RESOURCE_DIR)throw new Error('HOKUSAI_RESOURCE_DIR required');
  const assets=fs.realpathSync(process.env.HOKUSAI_RESOURCE_DIR);
  if(assets===repo||assets.startsWith(repo+path.sep))throw new Error('Resources must be external');
  for(const r of require('./resource-lock.json')){
    const file=path.join(assets,r.local_path), real=fs.realpathSync(file);
    if(path.dirname(real)!==assets)throw new Error('Resource escapes external directory');
    const data=fs.readFileSync(real);
    if(data.length!==r.bytes||require('crypto').createHash('sha256').update(data).digest('hex')!==r.sha256)throw new Error('Resource SHA mismatch: '+r.local_path);
  }

  GlobalFonts.registerFromPath(path.join(assets,'HokusaiSerif900.ttf'),'HokusaiSerif');
  GlobalFonts.registerFromPath(path.join(assets,'HokusaiSans500.ttf'),'HokusaiSans');
  const c=createCanvas(W,H),g=c.getContext('2d');
  const artwork=await loadImage(path.join(assets,'met-jp11.jpg'));
  // Artwork only: never load the reference screenshot. Remove photographed mount.
  g.drawImage(artwork,24,25,1128,770,0,0,W,H);
  const lower=g.createLinearGradient(0,300,0,900);lower.addColorStop(0,'rgba(20,17,13,0)');lower.addColorStop(.45,'rgba(20,17,13,.35)');lower.addColorStop(.76,'rgba(20,17,13,.93)');lower.addColorStop(1,'#14110d');g.fillStyle=lower;g.fillRect(0,0,W,H);
  const top=g.createLinearGradient(0,0,0,140);top.addColorStop(0,'rgba(14,20,23,.46)');top.addColorStop(1,'rgba(14,20,23,0)');g.fillStyle=top;g.fillRect(0,0,W,140);
  function text(s,x,y,size,family='HokusaiSans',color='#eee7d8'){g.fillStyle=color;g.font=`${size}px ${family}`;g.textBaseline='alphabetic';g.fillText(s,x,y);}
  text('富岳三十六景',40,40,20,'HokusaiSerif');text('线上展',165,38,14,'HokusaiSans','#c9c6ba');
  let x=993;for(const [s,gap] of [['导言',58],['三役',58],['蓝',44],['表与里',73],['全四十六幅',105],['关于图像',0]]){text(s,x,38,15,'HokusaiSans','#cbc9be');x+=gap;}
  text('富岳三十六景',38,800,185,'HokusaiSerif');
  text('葛饰北斋',40,850,16);text('约1830—1833年',132,850,16);text('全四十六幅',282,850,16);
  const credit='《山下白雨》 大都会艺术博物馆 JP11';g.font='14px HokusaiSans';const tw=g.measureText(credit).width;text(credit,1400-tw,849,14,'HokusaiSans','#c9c5bc');g.strokeStyle='#999489';g.lineWidth=.65;g.beginPath();g.moveTo(1400-tw,853);g.lineTo(1400,853);g.stroke();
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,c.toBuffer('image/png'));return output;
}
module.exports={render,width:W,height:H};if(require.main===module)render(process.argv[2]).then(console.log);
