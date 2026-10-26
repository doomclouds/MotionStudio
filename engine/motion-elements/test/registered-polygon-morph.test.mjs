import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {compileRegisteredPolygonMorph as compile,sampleRegisteredPolygonMorph as sample,drawRegisteredPolygonMorph as draw,composeTransform,transformBounds,transformPoint} from '../lib/index.mjs';
import {cardInput,arrowInput,galleryProgress} from '../examples/registered-polygon-morph-scene.mjs';
import {loadNativeCanvas} from '../../motion-render-core/lib/native.mjs';
const {api}=loadNativeCanvas(),backend={Path2D:api.Path2D};
const pts=rows=>rows.map(([x,y])=>({x,y}));
const spec=rows=>({vertexIds:rows.map((_,i)=>'v'+i),from:pts(rows),to:pts(rows)});
const square=spec([[-100,-100],[100,-100],[100,100],[-100,100]]);
const xy=s=>s.vertices.map(({x,y})=>({x,y}));
const rgba=c=>Buffer.from(c.getImageData(0,0,400,300).data);
const ctx=()=>api.createCanvas(400,300).getContext('2d');
test('registered polygon endpoint coordinates, identity, fixed normalization and immutability',()=>{
 const input=structuredClone(cardInput),p=compile(input);input.from[0].x=99;
 assert.deepEqual(xy(sample(p,0)),cardInput.from);assert.deepEqual(xy(sample(p,1)),cardInput.to);
 assert.deepEqual(sample(p,.5).vertices.map(v=>v.vertexId),cardInput.vertexIds);
 assert.deepEqual(sample(p,0).bounds,{x:0,y:0,width:240,height:140});
 assert.deepEqual(p.normalization,{origin:{x:125,y:75},scale:250,epsilon:1e-8});
 assert.equal(sample(p,0).winding,'positive');assert.equal(compile({...square,from:[...square.from].reverse(),to:[...square.to].reverse()}).winding,'negative');
 assert.throws(()=>p.from[0].x=8);assert.throws(()=>sample(p,.5).vertices[0].x=8);
 assert.throws(()=>sample(structuredClone(p),.5));assert.throws(()=>draw(ctx(),structuredClone(sample(p,.5)),{fill:'red'},backend));
});
test('two examples, reverse equivalence, arbitrary seeks, grid and 24/30/60fps endpoint neighbors',()=>{
 for(const input of [cardInput,arrowInput]){
  const p=compile(input),samples=Array.from({length:1001},(_,i)=>i/1000),baseline=samples.map(q=>sample(p,q));
  for(let i=samples.length-1;i>=0;i-=7)assert.deepEqual(sample(p,samples[i]),baseline[i]);
  for(const q of [0,.1,.25,.37,.5,.75,.9,1]){const a=sample(p,q,{direction:'reverse'}),b=sample(p,1-q);assert.deepEqual(a.vertices,b.vertices);assert.deepEqual(a.bounds,b.bounds);}
  for(const fps of [24,30,60])for(let f=0;f<=8*fps;f++)sample(p,galleryProgress(f/fps));
 }
 const url=new URL('../lib/registered-polygon-morph.mjs',import.meta.url).href;
 const script=`import {compileRegisteredPolygonMorph as c,sampleRegisteredPolygonMorph as s} from ${JSON.stringify(url)};console.log(JSON.stringify(s(c(${JSON.stringify(arrowInput)}),.37)));`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'});assert.equal(child.status,0,child.stderr);assert.deepEqual(JSON.parse(child.stdout),sample(compile(arrowInput),.37));
});
test('cyclic correspondence and off-grid collapse reject with explicit sample/edge details',()=>{
 const p=compile({...square,to:[...square.to.slice(2),...square.to.slice(0,2)]});
 assert.throws(()=>sample(p,.5),e=>e.code==='INVALID_REGISTERED_POLYGON'&&e.reason==='near-zero-edge'&&e.details.progress===.5&&e.details.edgeIds.length===1);
 const q=.37,k=(1-q)/q,off=compile({...square,to:square.from.map(v=>({x:-k*v.x,y:-k*v.y}))});
 for(const t of [0,.25,.5,.75,1])sample(off,t);
 assert.throws(()=>sample(off,q),e=>e.reason==='near-zero-edge');
});
test('domain and endpoint failures are explicit, including crossing, contact and epsilon policy',()=>{
 const bad=[null,{...cardInput,extra:true},{...cardInput,[Symbol('extra')]:1},{...cardInput,vertexIds:['x','x','y','z']},{...cardInput,vertexIds:['bad id','b','c','d']},{...cardInput,to:[...cardInput.to].reverse()},
 {...cardInput,from:pts([[0,0],[100,100],[0,100],[100,0]])},spec([[0,0],[100,0],[100,100],[50,0],[0,100]]),spec([[0,0],[100,0],[100,100],[0,100],[0,0]]),spec([[0,0],[50,0],[100,0],[100,100],[0,100]]),spec([[0,0],[0,0],[100,100]]),spec([[0,0],[100,0],[100,1e-7],[0,1e-7]])];
 for(const input of bad)assert.throws(()=>compile(input));
 for(const x of [NaN,Infinity,true,10001])assert.throws(()=>compile({...cardInput,from:[{x,y:0},...cardInput.from.slice(1)]}));
 assert.throws(()=>compile({...cardInput,from:[{x:0,y:0,z:1},...cardInput.from.slice(1)]}));
 for(const n of [2,33])assert.throws(()=>compile(spec(Array.from({length:n},(_,i)=>[100*Math.cos(i*2*Math.PI/n),100*Math.sin(i*2*Math.PI/n)]))));
 for(const n of [3,32])compile(spec(Array.from({length:n},(_,i)=>[100*Math.cos(i*2*Math.PI/n),100*Math.sin(i*2*Math.PI/n)])));
 const sparse=structuredClone(cardInput);delete sparse.from[1];assert.throws(()=>compile(sparse));
 const p=compile(cardInput);for(const q of [-1,1.01,NaN,true])assert.throws(()=>sample(p,q));
 for(const o of [{direction:'sideways'},{extra:1},null])assert.throws(()=>sample(p,.5,o));
 // Strong margins either side of the area tolerance; both have non-collinear corners.
 assert.throws(()=>compile(spec([[0,0],[1,0],[1,2e-8],[0,2e-8]])),e=>e.reason==='near-zero-area');
 compile(spec([[0,0],[1,0],[1,1e-5],[0,1e-5]]));
 // A nonadjacent vertex approaches an edge without crossing it.
 assert.throws(()=>compile(spec([[0,0],[100,0],[100,100],[50,1e-7],[0,100]])),e=>e.reason==='nonadjacent-edge-contact');
});
test('Native endpoints exactly match independent paths under parent applied once; AABB conservative',()=>{
 const parent=composeTransform({x:55,y:40,rotation:.12,scaleX:1.08,scaleY:.82});
 for(const input of [cardInput,arrowInput])for(const q of [0,1]){
  const a=ctx(),b=ctx(),state=sample(compile(input),q);a.transform(...parent);b.transform(...parent);
  draw(a,state,{fill:'#aacccc',stroke:'#fff',lineWidth:2},backend);
  const points=q?input.to:input.from,path=new api.Path2D();path.moveTo(points[0].x,points[0].y);for(const v of points.slice(1))path.lineTo(v.x,v.y);path.closePath();b.fillStyle='#aacccc';b.strokeStyle='#fff';b.lineWidth=2;b.fill(path,'nonzero');b.stroke(path);assert.deepEqual(rgba(a),rgba(b));
  const box=transformBounds(parent,state.bounds);for(const v of state.vertices){const w=transformPoint(parent,{x:v.x,y:v.y});assert.ok(w.x>=box.x-1e-8&&w.x<=box.x+box.width+1e-8&&w.y>=box.y-1e-8&&w.y<=box.y+box.height+1e-8);}
 }
});
test('adapter preserves caller path/styles/matrix and restores on draw failure',()=>{
 const c=ctx(),s=sample(compile(cardInput),.5);c.beginPath();c.rect(350,250,10,10);c.fillStyle='blue';c.globalAlpha=.7;c.translate(2,3);const before=c.getTransform(),alpha=c.globalAlpha;
 draw(c,s,{stroke:'red',lineWidth:2},backend);assert.equal(c.fillStyle,'blue');assert.equal(c.globalAlpha,alpha);assert.deepEqual(c.getTransform(),before);
 c.fill();assert.ok(c.getImageData(355,255,1,1).data[3]>0);assert.equal(c.getImageData(300,200,1,1).data[3],0);assert.equal(c.getImageData(100,80,1,1).data[3],0);
 const fill=c.fill;c.fill=()=>{throw Error('expected draw failure');};assert.throws(()=>draw(c,s,{fill:'red'},backend),/expected draw failure/);c.fill=fill;assert.deepEqual(c.getTransform(),before);
 // Native save/restore restores actual styles, but this backend's style getter is stale.
 c.fillRect(320,200,10,10);assert.deepEqual([...c.getImageData(325,205,1,1).data].slice(0,3),[0,0,255]);
 for(const style of [{},{fill:7},{stroke:'red',lineWidth:0},{fill:'red',extra:1}])assert.throws(()=>draw(c,s,style,backend));
 assert.throws(()=>draw(c,s,{fill:'red'},{}));
});

test('valid endpoints can produce a self-intersecting intermediate sample',()=>{
 const input={vertexIds:['v0','v1','v2','v3','v4'],from:pts([[75,0],[17,53],[-38,28],[-51,-37],[13,-41]]),to:pts([[-24,17],[-80,-58],[6,-20],[57,0],[24,73]])};
 const plan=compile(input);sample(plan,0);sample(plan,1);
 assert.throws(()=>sample(plan,.5),e=>e.reason==='nonadjacent-edge-contact'&&e.details.progress===.5&&e.details.edgeIds.length===2);
});

test('rejected sample returns no state and cannot mutate a caller canvas',()=>{
 const c=ctx();c.fillStyle='green';c.fillRect(0,0,400,300);const before=rgba(c);
 const plan=compile({...square,to:[...square.to.slice(2),...square.to.slice(0,2)]});
 assert.throws(()=>draw(c,sample(plan,.5),{fill:'red'},backend));assert.deepEqual(rgba(c),before);
});
