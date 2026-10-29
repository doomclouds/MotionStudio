// Full-film local mathematical adapters. No published foundation API claim.
// Tessel cue envelopes adapted from Leonxlnx (MIT); damped oscillator solved
// directly from x'' + (damping/mass)x' + (stiffness/mass)(x-1) = 0.
// Standard zero-position/zero-velocity initial state; no duration remapping.
export const SPR={snap:{damping:18,stiffness:260,mass:.7},pop:{damping:11,stiffness:180,mass:.6},soft:{damping:26,stiffness:120,mass:1},heavy:{damping:30,stiffness:90,mass:1.4}};
export function spr(frame,start=0,cfg=SPR.snap,fps=60){
 const t=Math.max(0,frame-start)/fps,m=cfg.mass??1,k=cfg.stiffness??100,c=cfg.damping??10;
 if(![t,m,k,c,fps].every(Number.isFinite)||m<=0||k<=0||c<=0||fps<=0)throw new RangeError('Finite positive spring parameters required');
 const w=Math.sqrt(k/m),a=c/(2*m);let y;
 // Source spring uses the critical solution for ratios >= 1; retain that
 // reference behavior rather than claiming the overdamped physical solution.
 if(a<w){const d=Math.sqrt(w*w-a*a);y=1-Math.exp(-a*t)*(Math.cos(d*t)+a/d*Math.sin(d*t));}
 else y=1-Math.exp(-w*t)*(1+w*t);
 return cfg.overshootClamping?Math.min(1,y):y;
}
export const hitPulse=(t,attack=2,tau=5)=>t<=0||t>attack+6*tau?0:t<attack?Math.sin(t/attack*Math.PI/2):Math.exp(-(t-attack)/tau);
export function measureTracked(ctx,text,size,weight,trackEm=0){ctx.save();ctx.font=`${size}px "TesselStudyGeist${weight}"`;ctx.letterSpacing=`${size*trackEm}px`;const w=ctx.measureText(text).width;ctx.restore();return w;}
// Native full-string shaping/kerning with CSS letter-spacing, as distinct from
// the frozen small-UI per-glyph helper. Baseline can be selected by each act.
export function trackedText(ctx,text,x,y,size,weight=600,trackEm=0,color='#0B0B0C',align='left',baseline='alphabetic'){
 ctx.save();ctx.font=`${size}px "TesselStudyGeist${weight}"`;ctx.letterSpacing=`${size*trackEm}px`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline=baseline;ctx.fillText(text,x,y);ctx.restore();
}
