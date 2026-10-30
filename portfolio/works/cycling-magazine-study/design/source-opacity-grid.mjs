// Case recipe: fixed 7×24 editorial opacity grid, not trip-count normalization.
export function drawSourceOpacityGrid(ctx,{x=630,y=486,width=542,alpha}={}){
 if(![x,y,width].every(Number.isFinite)||width<480||width>600)throw new RangeError('finite x/y and width 480..600 required');
 if(!Array.isArray(alpha)||alpha.length!==168||alpha.some(a=>!Number.isFinite(a)||a<0||a>1))throw new RangeError('168 opacity values in [0,1] required');
 ctx.save();for(const[i,a]of alpha.entries()){ctx.fillStyle=`rgba(255,92,0,${a})`;ctx.fillRect(x+(i%24)*(width/24),y+Math.floor(i/24)*15,width/24-2,13)}ctx.restore();
 return{recipe:'source-opacity-grid',rows:7,columns:24,encoding:'opacity copied from reference; no recovered counts',cells:168};
}
