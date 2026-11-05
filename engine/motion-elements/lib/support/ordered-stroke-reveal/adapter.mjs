import {sampleOrderedStrokeReveal,record,finite} from './index.mjs';
function shape(Path2D,commands){const p=new Path2D();for(const c of commands){const method={M:'moveTo',L:'lineTo',Q:'quadraticCurveTo',C:'bezierCurveTo',Z:'closePath'}[c.op];p[method](...c.values);}return p;}
/** Canvas Path2D is injected: no dependency, SVG parser, current-path mutation or I/O. */
export function drawOrderedStrokeReveal(ctx,plan,time,options){
 record(options,['x','y','scale','yOrigin','color','Path2D'],'options');
 const x=finite(options.x,-1e6,1e6,'x'),y=finite(options.y,-1e6,1e6,'y'),scale=finite(options.scale,1e-6,1e3,'scale'),yOrigin=finite(options.yOrigin,-1e6,1e6,'yOrigin');
 if(typeof options.color!=='string'||!/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(options.color))throw TypeError('color must be #RRGGBB or #RRGGBBAA');
 if(typeof options.Path2D!=='function')throw TypeError('Path2D constructor required');
 const state=sampleOrderedStrokeReveal(plan,time),Path2D=options.Path2D;
 ctx.save();try{
  ctx.translate(x,y);ctx.scale(scale,-scale);ctx.translate(0,-yOrigin);
  ctx.fillStyle=ctx.strokeStyle=options.color;ctx.lineCap=ctx.lineJoin='round';ctx.setLineDash([]);ctx.lineDashOffset=0;ctx.shadowColor='#00000000';ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;
  // Completed strokes use their entire outlines, never a widened-median approximation.
  for(let i=0;i<state.completedCount;i++)ctx.fill(shape(Path2D,plan.strokes[i].outline),'nonzero');
  if(state.active&&!state.active.section.empty){
   const s=plan.strokes[state.active.index];ctx.save();try{
    ctx.clip(shape(Path2D,s.outline),'nonzero');ctx.lineWidth=s.revealWidth;
    const p=new Path2D(),points=state.active.section.vertices.map(v=>v.position);p.moveTo(points[0].x,points[0].y);for(const point of points.slice(1))p.lineTo(point.x,point.y);ctx.stroke(p);
   }finally{ctx.restore();}
  }
 }finally{ctx.restore();}
 return {state,tip:state.tip?{x:x+scale*state.tip.x,y:y+scale*(yOrigin-state.tip.y)}:null};
}
