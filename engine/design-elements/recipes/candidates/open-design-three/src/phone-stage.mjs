/** Isolated presentation recipe, not a phone app or additional surface family. */
import {drawPhoneFrame} from '../snapshots/lull-frame.mjs';
export function drawPhoneStage(ctx,{x,y,width=320,height=690},content,{createCanvas}){
 if(![x,y,width,height].every(Number.isFinite)||Math.abs(x)>16384||Math.abs(y)>16384||width<180||width>720||height<400||height>1400||height/width<1.6||height/width>2.5||typeof content!=='function'||typeof createCanvas!=='function')throw Error('phone-stage contract');
 const pad=70,c=createCanvas(Math.ceil(width+pad*2),Math.ceil(height+pad*2)),g=c.getContext('2d');
 drawPhoneFrame(g,{x:pad,y:pad,width,height},content);
 // Offscreen makes callback errors atomic for caller pixels; no caller beginPath or clip calls.
 ctx.drawImage(c,x-pad,y-pad);return {bounds:{x,y,width,height},contentBounds:{x:x+8,y:y+8,width:width-16,height:height-16},shadowPadding:pad,interaction:false};
}
