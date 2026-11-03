// Original bounded example, MIT (repository LICENSE). No source images or fonts.
// Not registered in the design dispatcher. The caller authors the direction field.
export function drawDirectionalPaint(ctx, {bounds, palette, seed, count=1200, length=18, width=5, angleAt}) {
  if (!bounds || !['x','y','width','height'].every(k=>Number.isFinite(bounds[k]))) throw new TypeError('finite bounds required');
  const {x,y,width:w,height:h}=bounds;
  if(Math.abs(x)>1e6||Math.abs(y)>1e6||w<16||h<16||w>2048||h>2048) throw new RangeError('bounds outside example budget');
  if(!Array.isArray(palette)||palette.length<2||palette.length>8||!Array.from(palette).every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c))) throw new TypeError('2..8 hex colors required');
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff) throw new RangeError('seed must be uint32');
  if(!Number.isInteger(count)||count<1||count>10000) throw new RangeError('count must be 1..10000');
  if(!Number.isFinite(length)||length<2||length>80||!Number.isFinite(width)||width<1||width>20||width>length) throw new RangeError('stroke size invalid');
  if(typeof angleAt!=='function') throw new TypeError('caller angleAt(u,v) required');
  // Integer PRNG; no clock, global randomness, source pixels or retained caller data.
  let state=seed; const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
  const marks=[];
  for(let i=0;i<count;i++) {
    const u=random(),v=random(),a=angleAt(u,v);
    if(!Number.isFinite(a)||Math.abs(a)>Math.PI*2) throw new RangeError('angleAt must return finite radians within ±2π');
    marks.push({x:x+u*w,y:y+v*h,a,l:length*(.6+.8*random()),b:width*(.7+.6*random()),color:palette[Math.floor(random()*palette.length)]});
  }
  // Validate the complete field before any painting. angleAt is trusted caller code,
  // must be pure, and must not access/mutate this context. No physical paint claim.
  const style={fillStyle:ctx.fillStyle,strokeStyle:ctx.strokeStyle,lineWidth:ctx.lineWidth};
  ctx.save();
  try {
    ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    for(const m of marks) {
      ctx.save();
      try {
        ctx.translate(m.x,m.y);ctx.rotate(m.a);
        ctx.beginPath();ctx.moveTo(-m.l*.5,-m.b*.32);ctx.lineTo(-m.l*.35,-m.b*.5);
        ctx.lineTo(m.l*.4,-m.b*.4);ctx.lineTo(m.l*.52,0);ctx.lineTo(m.l*.38,m.b*.44);ctx.lineTo(-m.l*.45,m.b*.35);ctx.closePath();
        ctx.fillStyle=m.color;ctx.fill();
        ctx.beginPath();ctx.moveTo(-m.l*.35,-m.b*.15);ctx.lineTo(m.l*.3,-m.b*.2);
        ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=Math.max(.5,m.b*.12);ctx.stroke();
      } finally {ctx.restore()}
    }
  } finally {ctx.restore();Object.assign(ctx,style)}
  // Like ordinary Canvas drawing, the current path is replaced, not preserved.
  return {strokeCount:marks.length,bounds:{x,y,width:w,height:h}};
}

// Two independently authored, font-free content shapes. No original emblem,
// arrow, cypress, moon, manga symbol, wall or branded composition is retained.
export function drawPaintExample(ctx, variant, seed=42) {
  if(!['leaf','ribbon'].includes(variant)) throw new RangeError('unknown example');
  ctx.save();
  try {
    ctx.fillStyle='#f4eddf';ctx.fillRect(0,0,640,480);
    ctx.beginPath();
    if(variant==='leaf') {
      ctx.moveTo(110,380);ctx.bezierCurveTo(80,120,290,60,530,80);ctx.bezierCurveTo(510,340,280,420,110,380);
    } else {
      ctx.moveTo(50,140);ctx.bezierCurveTo(200,50,390,300,590,170);ctx.lineTo(590,310);ctx.bezierCurveTo(390,440,200,190,50,280);
    }
    ctx.closePath();ctx.clip();
    ctx.fillStyle=variant==='leaf'?'#233f32':'#60333e';ctx.fillRect(0,0,640,480);
    drawDirectionalPaint(ctx,{bounds:{x:40,y:40,width:560,height:400},seed,count:2300,length:variant==='leaf'?23:34,width:variant==='leaf'?6:8,
      palette:variant==='leaf'?['#30553d','#527947','#9eac63','#c3cb8a']:['#824451','#b76764','#db9274','#f0c4a1'],
      angleAt:variant==='leaf'?(u,v)=>-.58+.7*(v-.5):(u,v)=>.8*Math.cos(u*Math.PI*2)});
  } finally {ctx.restore()}
}
