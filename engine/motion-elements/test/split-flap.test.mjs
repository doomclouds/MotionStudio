import test from 'node:test';import assert from 'node:assert/strict';
import {sampleSplitFlap as sample,drawSplitFlap as draw} from '../lib/support/split-flap.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const spec=(p,from='4',to='6',w=80,h=120)=>({from,to,width:w,height:h,progress:p});
test('identity layers, endpoints, hinge and reduced motion',()=>{
 assert.deepEqual(sample(spec(0)).layers,[{id:'4',half:'full',scaleY:1}]);assert.equal(sample(spec(1)).layers[0].id,'6');
 for(const p of [.1,.25,.49,.51,.75,.9]){const s=sample(spec(p));assert.equal(s.layers[0].id,'6');assert.equal(s.layers[1].id,'4');assert.equal(s.layers[2].id,p<.5?'4':'6');assert(s.layers[2].scaleY>0);assert(Object.isFrozen(s.layers[2]));}
 assert.equal(sample(spec(.5)).layers.length,2);assert.equal(sample(spec(.4,'A','A')).layers.length,1);
 assert.equal(sample({...spec(.49),reducedMotion:true}).displayProgress,0);assert.equal(sample({...spec(.5),reducedMotion:true}).displayProgress,1);
});
test('strict bounded inputs and genuine states',()=>{
 for(const p of [-1,1.001,NaN,Infinity,'0',null])assert.throws(()=>sample(spec(p)));
 for(const patch of [{extra:1},{width:0},{height:1},{width:4097},{width:2048,height:1025},{from:''},{to:'a b'},{reducedMotion:0}])assert.throws(()=>sample({...spec(.3),...patch}));
 const a=spec(.3);Object.defineProperty(a,'from',{get(){throw Error('must not execute')}});assert.throws(()=>sample(a),/Accessor/);
 assert.throws(()=>sample({...spec(.3),[Symbol()]:1}));assert.throws(()=>draw({},JSON.parse(JSON.stringify(sample(spec(.3)))),()=>{}),/genuine/);
});
// Original synthetic seven-segment panels. No fonts, original media or model scores.
const segments={0:'ab cdef'.replaceAll(' ',''),1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
function panel(ctx,id,w,h){ctx.fillStyle='#17202b';ctx.fillRect(-w,-h,3*w,3*h);ctx.fillStyle='#f8d84a';const r={a:[.2,.1,.6,.08],b:[.72,.16,.08,.3],c:[.72,.54,.08,.3],d:[.2,.84,.6,.08],e:[.2,.54,.08,.3],f:[.2,.16,.08,.3],g:[.2,.46,.6,.08]};for(const k of segments[id]){const [x,y,a,b]=r[k];ctx.fillRect(x*w,y*h,a*w,b*h)}}
function image(p,a,b,w=80,h=120){const {api:{createCanvas}}=loadNativeCanvas();const c=createCanvas(w+8,h+8),ctx=c.getContext('2d');ctx.translate(4,4);draw(ctx,sample(spec(p,a,b,w,h)),(x,id)=>panel(x,id,w,h));return {data:ctx.getImageData(0,0,w+8,h+8).data,w:w+8,h:h+8};}
function diff(a,b,rect){let sum=0,n=0;for(let y=rect[1];y<rect[3];y++)for(let x=rect[0];x<rect[2];x++)for(let k=0;k<4;k++){sum+=Math.abs(a.data[(y*a.w+x)*4+k]-b.data[(y*b.w+x)*4+k]);n++}return sum/n}
test('native pixels: multiple digits, shapes, sizes, masks and outside isolation',()=>{
 for(const [a,b] of [['4','6'],['9','2'],['0','8'],['3','7']])for(const [w,h] of [[80,120],[137,91],[32,48]]){
 const old=image(0,a,b,w,h),next=image(1,a,b,w,h),first=image(.25,a,b,w,h),second=image(.75,a,b,w,h);
 assert.equal(diff(old,first,[5,Math.ceil(h/2)+6,w+3,h+3]),0,'old lower must not switch early');
 assert.equal(diff(next,second,[5,5,w+3,Math.floor(h/2)+2]),0,'new upper must not switch back');
 for(const p of [0,.25,.5,.75,1]){const im=image(p,a,b,w,h);for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++)if(x<4||x>=w+4||y<4||y>=h+4)assert.equal(im.data[(y*im.w+x)*4+3],0,'outer clip');else assert.equal(im.data[(y*im.w+x)*4+3],255,'opaque backing includes fractional hinge');}
 }
});
test('native midpoint continuity and counterexamples',()=>{
 for(const [a,b] of [['4','6'],['9','2'],['0','8']]){
 const center=image(.5,a,b),left=image(.5-1e-7,a,b),right=image(.5+1e-7,a,b);
 assert(diff(left,center,[4,4,84,124])<.02);assert(diff(right,center,[4,4,84,124])<.02);
 // Counterexample: swap the whole glyph at midpoint, losing the persistent old lower half.
 assert(diff(center,image(1,a,b),[4,65,84,124])>1);
 // Counterexample: retain old upper after midpoint (wrong face identity).
 assert(diff(image(.75,a,b),image(0,a,b),[4,4,84,63])>1);
 }
});
test('seek order independent and callback exception restores context',()=>{
 const ps=[0,.17,.49,.5,.51,.86,1],states=ps.map(p=>sample(spec(p)));for(const p of [...ps].reverse())assert.deepEqual(sample(spec(p)),states[ps.indexOf(p)]);
 let depth=0;const ctx={save(){depth++},restore(){depth--},beginPath(){},rect(){},clip(){},translate(){},scale(){}};assert.throws(()=>draw(ctx,sample(spec(.2)),()=>{throw Error('stop')}),/stop/);assert.equal(depth,0);
});
